<?php

declare(strict_types=1);

// Formularziel von kontakt/index.html.

require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(405, ['ok' => false, 'error' => 'Nur POST erlaubt.']);
}

// Unsichtbares Feld gegen einfache Bots (Honeypot): fuellt es jemand aus,
// war es keine Person. Freundliche Antwort statt Fehlermeldung, damit ein
// Bot daraus nichts lernt, was einen zweiten Versuch erfolgreicher machen
// wuerde.
if (Validation::trimmed($_POST, 'website') !== '') {
    json_response(200, ['ok' => true]);
}

try {
    $rateLimiter = new RateLimiter(SECRETS_DIR);
} catch (Throwable $e) {
    error_log('Kontaktformular: Ratenlimit nicht verfuegbar: ' . $e->getMessage());
    json_response(500, ['ok' => false, 'error' => 'Ihre Nachricht konnte gerade nicht verarbeitet werden. Bitte versuchen Sie es später erneut.']);
}

if (!$rateLimiter->allow('contact', client_ip(), RATE_LIMIT_CONTACT)) {
    json_response(429, ['ok' => false, 'error' => 'Zu viele Anfragen von dieser Adresse. Bitte versuchen Sie es später erneut.']);
}

$missing = Validation::missing($_POST, ['name', 'email', 'subject', 'message']);

$name = Validation::trimmed($_POST, 'name');
$email = Validation::trimmed($_POST, 'email');
$phone = Validation::singleLine(Validation::trimmed($_POST, 'phone'));
$subject = Validation::trimmed($_POST, 'subject');
$message = Validation::trimmed($_POST, 'message');

if (!in_array('email', $missing, true) && !Validation::email($email)) {
    $missing[] = 'email';
}

if ($missing) {
    json_response(400, [
        'ok' => false,
        'error' => 'Bitte füllen Sie alle Pflichtfelder korrekt aus.',
        'fields' => $missing,
    ]);
}

if (
    !Validation::withinLength($name, 100)
    || !Validation::withinLength($email, 100)
    || !Validation::withinLength($phone, 20)
    || !Validation::withinLength($subject, 100)
    || !Validation::withinLength($message, 2000)
) {
    json_response(400, ['ok' => false, 'error' => 'Eine Eingabe ist zu lang.']);
}

$body = "Neue Nachricht über das Kontaktformular auf der Website\n\n"
    . "Name: {$name}\n"
    . "E-Mail: {$email}\n"
    . 'Telefon: ' . ($phone !== '' ? $phone : 'keine Angabe') . "\n"
    . "Betreff: {$subject}\n\n"
    . "Nachricht:\n{$message}\n";

try {
    make_mailer()->send(
        GESCHAEFTSSTELLE_EMAIL,
        SMTP_FROM_NAME,
        'Kontaktformular: ' . $subject,
        $body,
        Validation::singleLine($email),
    );
} catch (Throwable $e) {
    error_log('Kontaktformular: Versand fehlgeschlagen: ' . $e->getMessage());
    json_response(502, [
        'ok' => false,
        'error' => 'Ihre Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es später erneut oder schreiben Sie direkt an ' . GESCHAEFTSSTELLE_EMAIL . '.',
    ]);
}

json_response(200, ['ok' => true]);
