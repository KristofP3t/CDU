<?php

declare(strict_types=1);

// Wird von contact.php, membership.php und confirm.php eingebunden - lib/
// selbst ist ueber api/.htaccess von aussen gesperrt.

error_reporting(E_ALL);
ini_set('display_errors', '0'); // Fehler nie an den Browser, nur ins Server-Log

// config.php liegt bewusst nicht in api/, sondern ausserhalb des
// Web-Verzeichnisses - das SMTP-Passwort soll den Webserver nie erreichen,
// selbst wenn eine .htaccess-Regel einmal nicht greift (falscher Server,
// fehlende AllowOverride-Rechte). dirname(__DIR__, 2) geht von api/ aus
// zwei Ebenen nach oben; siehe api/config.example.php fuer die
// ausfuehrliche Begruendung und wie man das bei Bedarf anpasst.
$configFile = dirname(__DIR__, 2) . '/cdu-secrets/config.php';
if (!is_file($configFile)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode([
        'ok' => false,
        'error' => 'Der Formularversand ist auf dieser Seite noch nicht eingerichtet.',
    ]);
    exit;
}
require $configFile;

require __DIR__ . '/lib/Validation.php';
require __DIR__ . '/lib/RateLimiter.php';
require __DIR__ . '/lib/PendingStore.php';
require __DIR__ . '/lib/SmtpMailer.php';
require __DIR__ . '/lib/MembershipFormatter.php';

function client_ip(): string
{
    // Kein Vertrauen in X-Forwarded-For: leicht zu faelschen und ohne
    // festen, bekannten Reverse-Proxy dieses Webpakets nicht nachpruefbar.
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

/** @param array<string, mixed> $payload */
function json_response(int $status, array $payload): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function make_mailer(): SmtpMailer
{
    return new SmtpMailer(
        SMTP_HOST,
        SMTP_PORT,
        SMTP_ENCRYPTION,
        SMTP_USERNAME,
        SMTP_PASSWORD,
        SMTP_FROM_EMAIL,
        SMTP_FROM_NAME,
    );
}
