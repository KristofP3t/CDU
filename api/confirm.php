<?php

declare(strict_types=1);

// Ziel des Bestaetigungslinks aus der Mitgliedsantrag-Mail - Schritt 2 des
// Double-Opt-in: erst hier geht der vollstaendige Antrag (mit Bankdaten) an
// die Geschaeftsstelle. Leitet danach auf die Seite
// mitglied-werden/bestaetigung/ weiter, mit einem Status in der Adresse,
// den die Seite in eine Meldung uebersetzt.

require __DIR__ . '/bootstrap.php';

function redirect_with_status(string $status): never
{
    $target = rtrim(SITE_BASE_URL, '/') . '/mitglied-werden/bestaetigung/?status=' . urlencode($status);
    header('Location: ' . $target, true, 302);
    exit;
}

$token = $_GET['token'] ?? '';
if (!is_string($token) || !preg_match('/^[0-9a-f]{64}$/', $token)) {
    redirect_with_status('invalid');
}

try {
    $rateLimiter = new RateLimiter(SECRETS_DIR);
    $pendingStore = new PendingStore(SECRETS_DIR);
} catch (Throwable $e) {
    error_log('Mitgliedsantrag-Bestaetigung: Speicher nicht verfuegbar: ' . $e->getMessage());
    redirect_with_status('error');
}

// Grosszuegiger als bei den Formularen selbst: ein Token ist 256 Bit
// Zufall, Erraten ist ohnehin aussichtslos - das Limit bremst nur
// automatisierte Wiederholversuche auf denselben Link ab.
if (!$rateLimiter->allow('confirm', client_ip(), 30, 3600)) {
    redirect_with_status('error');
}

$pendingStore->purgeExpired(PENDING_TTL_DAYS);

$fields = $pendingStore->take($token);
if ($fields === null) {
    redirect_with_status('invalid');
}

$firstName = is_string($fields['first-name'] ?? null) ? $fields['first-name'] : '';
$lastName = is_string($fields['last-name'] ?? null) ? $fields['last-name'] : '';
$name = trim("{$firstName} {$lastName}");
$email = is_string($fields['email'] ?? null) ? $fields['email'] : '';

$body = "Über das Online-Formular auf der Website eingegangen und per Double-Opt-in bestätigt.\n\n"
    . MembershipFormatter::toText($fields);

try {
    make_mailer()->send(
        GESCHAEFTSSTELLE_EMAIL,
        SMTP_FROM_NAME,
        'Mitgliedsantrag: ' . ($name !== '' ? $name : 'ohne Namen'),
        $body,
        Validation::singleLine($email),
    );
} catch (Throwable $e) {
    error_log('Mitgliedsantrag-Bestaetigung: Weiterleitung an Geschaeftsstelle fehlgeschlagen: ' . $e->getMessage());
    redirect_with_status('error');
}

redirect_with_status('confirmed');
