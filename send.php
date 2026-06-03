<?php
/**
 * ОБРАБОТЧИК ФОРМЫ ЗАЯВКИ — ТД Архипов М.А.
 *
 * Принимает POST с формы, валидирует, отправляет письмо на почту
 * и возвращает JSON-ответ для фронта.
 *
 * Подключение: смотри config.php — там настройки почты и режим (mail() или SMTP).
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// ===== 1. Только POST =====
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Метод не поддерживается']);
    exit;
}

// ===== 2. Грузим конфиг =====
if (!is_file(__DIR__ . '/config.php')) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Конфиг не найден']);
    exit;
}
$config = require __DIR__ . '/config.php';

// ===== 3. Honeypot против ботов =====
// На фронте есть скрытое поле name="website". Боты его заполняют, люди — нет.
if (!empty($_POST['website'])) {
    // Делаем вид что всё ок — пусть бот думает, что отправилось
    echo json_encode(['ok' => true]);
    exit;
}

// ===== 4. Простой rate limit (3 заявки в минуту с одного IP) =====
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateFile = sys_get_temp_dir() . '/rate_' . md5($ip);
$now = time();
$attempts = is_file($rateFile) ? array_filter(explode(',', file_get_contents($rateFile)), fn($t) => (int)$t > $now - 60) : [];
if (count($attempts) >= 3) {
    http_response_code(429);
    echo json_encode(['ok' => false, 'error' => 'Слишком много заявок. Подождите минуту.']);
    exit;
}
$attempts[] = (string)$now;
file_put_contents($rateFile, implode(',', $attempts));

// ===== 5. Считываем и чистим поля =====
function clean(string $s, int $max = 500): string {
    $s = trim($s);
    $s = preg_replace('/\s+/u', ' ', $s);
    return mb_substr($s, 0, $max);
}

$name    = clean($_POST['name']    ?? '');
$phone   = clean($_POST['phone']   ?? '', 50);
$inn     = clean($_POST['inn']     ?? '', 12);
$what    = clean($_POST['what']    ?? '');
$where   = clean($_POST['where']   ?? '');
$message = clean($_POST['message'] ?? '', 2000);
$consent = !empty($_POST['consent']);

// ===== 6. Валидация =====
$errors = [];
if ($name === '' || mb_strlen($name) < 2) {
    $errors[] = 'Укажите имя';
}
if ($phone === '' || !preg_match('/[\d\+\-\(\)\s]{6,}/', $phone)) {
    $errors[] = 'Укажите корректный телефон';
}
if (!preg_match('/^\d{10}$|^\d{12}$/', $inn)) {
    $errors[] = 'ИНН должен содержать 10 или 12 цифр';
}
if (!$consent) {
    $errors[] = 'Необходимо согласие на обработку данных';
}

if ($errors) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => implode('. ', $errors)]);
    exit;
}

// ===== 7. Собираем тело письма =====
$timeMsk = (new DateTime('now', new DateTimeZone('Europe/Moscow')))->format('d.m.Y H:i');
$ua = $_SERVER['HTTP_USER_AGENT'] ?? '—';

// Ссылки для проверки контрагента — по этому ИНН менеджер за один клик
// откроет нужный реестр и увидит актуальные данные из официального источника
$innLinks = [
    ['🔍 ФНС — ЕГРЮЛ/ЕГРИП',         "https://egrul.nalog.ru/index.html?query={$inn}"],
    ['📊 Прозрачный бизнес ФНС',     "https://pb.nalog.ru/search.html?mode=search-all&queryAll={$inn}"],
    ['💰 Финансовая отчётность',     "https://bo.nalog.gov.ru/search?query={$inn}"],
    ['⚖️ Арбитражные дела (kad)',    "https://kad.arbitr.ru/"],
    ['👮 ФССП — долги и приставы',   "https://fssp.gov.ru/iss/ip"],
    ['🎯 Контур.Фокус — общая сводка', "https://focus.kontur.ru/search?query={$inn}"],
];

$linksHtml = '';
foreach ($innLinks as [$label, $url]) {
    $linksHtml .= '<a href="' . htmlspecialchars($url) . '" style="display:inline-block;margin:4px 6px 4px 0;padding:8px 14px;background:#fff;border:1px solid #d4c4b0;border-radius:6px;color:#2A1A14;text-decoration:none;font-size:13px;">' . htmlspecialchars($label) . '</a>';
}

$body = '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f7f1e8;padding:20px;margin:0;">
<div style="max-width:640px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e0d5c2;">

  <div style="background:#2A1A14;color:#fff;padding:24px 28px;">
    <div style="font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#F2A341;margin-bottom:6px;">Новая заявка</div>
    <h2 style="margin:0;font-size:20px;">' . htmlspecialchars($name) . '</h2>
    <div style="font-size:13px;color:#C9B4A6;margin-top:4px;">' . htmlspecialchars($timeMsk) . ' МСК</div>
  </div>

  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    <tr><td style="padding:14px 28px;background:#faf6ee;border-bottom:1px solid #eee;width:130px;color:#666;">Имя</td><td style="padding:14px 28px;border-bottom:1px solid #eee;font-weight:600;">' . htmlspecialchars($name) . '</td></tr>
    <tr><td style="padding:14px 28px;background:#faf6ee;border-bottom:1px solid #eee;color:#666;">Телефон</td><td style="padding:14px 28px;border-bottom:1px solid #eee;"><a href="tel:' . htmlspecialchars($phone) . '" style="color:#C0271C;font-weight:600;text-decoration:none;">' . htmlspecialchars($phone) . '</a></td></tr>
    <tr><td style="padding:14px 28px;background:#faf6ee;border-bottom:1px solid #eee;color:#666;">ИНН</td><td style="padding:14px 28px;border-bottom:1px solid #eee;font-family:monospace;font-size:15px;font-weight:600;">' . htmlspecialchars($inn) . '</td></tr>';

if ($what !== '')  $body .= '<tr><td style="padding:14px 28px;background:#faf6ee;border-bottom:1px solid #eee;color:#666;">Что нужно</td><td style="padding:14px 28px;border-bottom:1px solid #eee;">' . htmlspecialchars($what) . '</td></tr>';
if ($where !== '') $body .= '<tr><td style="padding:14px 28px;background:#faf6ee;border-bottom:1px solid #eee;color:#666;">Куда</td><td style="padding:14px 28px;border-bottom:1px solid #eee;">' . htmlspecialchars($where) . '</td></tr>';
if ($message !== '') $body .= '<tr><td style="padding:14px 28px;background:#faf6ee;border-bottom:1px solid #eee;color:#666;vertical-align:top;">Комментарий</td><td style="padding:14px 28px;border-bottom:1px solid #eee;white-space:pre-wrap;">' . htmlspecialchars($message) . '</td></tr>';

$body .= '</table>

  <div style="padding:20px 28px;background:#faf6ee;border-top:2px solid #F2A341;">
    <div style="font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#666;margin-bottom:10px;">Проверка контрагента по ИНН ' . htmlspecialchars($inn) . '</div>
    <div>' . $linksHtml . '</div>
    <div style="font-size:12px;color:#888;margin-top:12px;line-height:1.5;">Открой нужную ссылку — увидишь актуальные данные из официального реестра: статус, реквизиты, суды, банкротство, долги.</div>
  </div>

  <div style="padding:14px 28px;font-size:11px;color:#aaa;background:#f0eadf;">
    Согласие на обработку ПД получено · IP: ' . htmlspecialchars($ip) . ' · ' . htmlspecialchars(mb_substr($ua, 0, 200)) . '
  </div>
</div></body></html>';

$subject = 'Заявка с сайта — ' . $name . ($where !== '' ? ' (' . $where . ')' : '');

// ===== 8. Отправляем =====
$ok = false;
$sendError = '';

try {
    if (!empty($config['use_smtp'])) {
        // === SMTP через PHPMailer ===
        $autoload = __DIR__ . '/phpmailer/src/PHPMailer.php';
        if (!is_file($autoload)) {
            throw new RuntimeException('PHPMailer не установлен. Распакуй phpmailer/ в корень.');
        }
        require_once __DIR__ . '/phpmailer/src/Exception.php';
        require_once __DIR__ . '/phpmailer/src/PHPMailer.php';
        require_once __DIR__ . '/phpmailer/src/SMTP.php';

        $mail = new PHPMailer\PHPMailer\PHPMailer(true);
        $mail->isSMTP();
        $mail->Host       = $config['smtp_host'];
        $mail->Port       = (int)$config['smtp_port'];
        $mail->SMTPAuth   = true;
        $mail->Username   = $config['smtp_user'];
        $mail->Password   = $config['smtp_pass'];
        $mail->SMTPSecure = $config['smtp_secure']; // 'ssl' для 465, 'tls' для 587
        $mail->CharSet    = 'UTF-8';

        $mail->setFrom($config['from'], $config['from_name']);
        $mail->addAddress($config['to']);
        $mail->addReplyTo($config['from'], $name);

        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $body;
        $mail->AltBody = strip_tags(str_replace(['<br>','</tr>','</p>'], ["\n","\n","\n\n"], $body));

        $mail->send();
        $ok = true;

    } else {
        // === Простая mail() — работает если почта info@tdarhipov.ru на том же хостинге ===
        $headers = [
            'From: ' . sprintf('"%s" <%s>', $config['from_name'], $config['from']),
            'Reply-To: ' . $config['from'],
            'X-Mailer: PHP/' . phpversion(),
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
        ];
        // Тема должна быть в base64 чтобы кириллица не сломалась
        $subjectEncoded = '=?UTF-8?B?' . base64_encode($subject) . '?=';

        $ok = mail($config['to'], $subjectEncoded, $body, implode("\r\n", $headers));
        if (!$ok) {
            $sendError = 'mail() вернула false — почта на хостинге может быть не настроена';
        }
    }

} catch (Throwable $e) {
    $sendError = $e->getMessage();
}

// ===== 9. Лог на всякий случай =====
@file_put_contents(
    __DIR__ . '/form-log.txt',
    sprintf("[%s] %s | %s | %s | inn=%s | ok=%s | %s\n",
        $timeMsk, $name, $phone, $where, $inn, $ok ? 'YES' : 'NO', $sendError
    ),
    FILE_APPEND
);

// ===== 10. Ответ фронту =====
if ($ok) {
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Не удалось отправить письмо. Позвоните +7 (812) 450-00-94.',
        'debug' => $sendError, // в продакшене можно убрать
    ]);
}
