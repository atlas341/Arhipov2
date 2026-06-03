<?php
/**
 * НАСТРОЙКИ ОТПРАВКИ ПОЧТЫ
 *
 * Этот файл нужно отредактировать под себя один раз.
 * Файл защищён .htaccess от прямого доступа из браузера.
 */

return [

    // ===== КУДА ПРИХОДЯТ ЗАЯВКИ =====
    'to'        => 'info@tdarhipov.ru',

    // ===== ОТ КОГО (отправитель в письме) =====
    // ВАЖНО: для mail() это должна быть почта на том же домене (tdarhipov.ru),
    // иначе письмо улетит в спам или вернётся.
    'from'      => 'noreply@tdarhipov.ru',
    'from_name' => 'Сайт ТД Архипов',

    // ===== РЕЖИМ ОТПРАВКИ =====
    // false — встроенная функция mail() (если почта домена на том же хостинге Reg.ru)
    // true  — SMTP через PHPMailer (если почта на Яндекс / Mail.ru / Gmail и т.д.)
    'use_smtp'  => false,

    // ===== SMTP НАСТРОЙКИ (нужны только если use_smtp = true) =====
    // Готовые шаблоны:
    //   Яндекс:   host=smtp.yandex.ru   port=465  secure=ssl
    //   Mail.ru:  host=smtp.mail.ru     port=465  secure=ssl
    //   Gmail:    host=smtp.gmail.com   port=587  secure=tls
    'smtp_host'   => 'smtp.yandex.ru',
    'smtp_port'   => 465,
    'smtp_user'   => 'info@tdarhipov.ru',
    'smtp_pass'   => 'ВСТАВЬ_СЮДА_ПАРОЛЬ_ПРИЛОЖЕНИЯ',
    'smtp_secure' => 'ssl',
];
