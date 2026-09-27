<?php

declare(strict_types=1);

// Formularziel von mitglied-werden/index.html - Schritt 1 des echten
// Double-Opt-in (siehe PLAN.md, Phase 1): speichert den Antrag
// verschluesselt und verschickt nur die Bestaetigungsmail an die
// antragstellende Person. Die Geschaeftsstelle bekommt den vollstaendigen
// Antrag erst, wenn der Link darin angeklickt wurde (confirm.php).

require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(405, ['ok' => false, 'error' => 'Nur POST erlaubt.']);
}

if (Validation::trimmed($_POST, 'website') !== '') {
    json_response(200, ['ok' => true]);
}

try {
    $pendingStore = new PendingStore(SECRETS_DIR);
    $rateLimiter = new RateLimiter(SECRETS_DIR);
} catch (Throwable $e) {
    error_log('Mitgliedsantrag: Speicher nicht verfuegbar: ' . $e->getMessage());
    json_response(500, ['ok' => false, 'error' => 'Ihr Antrag konnte gerade nicht verarbeitet werden. Bitte versuchen Sie es später erneut.']);
}

$pendingStore->purgeExpired(PENDING_TTL_DAYS);

// Je Feld eine Meldung, damit das Formular sie direkt am Feld zeigen kann.
// Die Texte bleiben knapper als im Browser - dort greift die Pruefung
// normalerweise schon vorher, hier landet nur, wer sie umgeht.
$fehler = [];

$required = [
    'salutation', 'first-name', 'last-name', 'birthdate', 'birthplace', 'nationality',
    'email', 'phone', 'street', 'house-number', 'postal-code', 'city',
    'monthly-fee', 'payment-frequency', 'iban', 'bank-name',
];
foreach (Validation::missing($_POST, $required) as $key) {
    $fehler[$key] = 'Bitte füllen Sie dieses Feld aus.';
}

$pruefe = static function (string $key, bool $ok, string $meldung) use (&$fehler): void {
    if (!isset($fehler[$key]) && !$ok) {
        $fehler[$key] = $meldung;
    }
};

$wert = static fn (string $key): string => Validation::trimmed($_POST, $key);

$pruefe('email', Validation::email($wert('email')), 'Bitte geben Sie eine gültige E-Mail-Adresse an, zum Beispiel name@beispiel.de.');
$pruefe('phone', Validation::phone($wert('phone')), 'Bitte geben Sie eine gültige Telefonnummer an.');
$pruefe('house-number', Validation::houseNumber($wert('house-number')), 'Bitte geben Sie eine gültige Hausnummer an, zum Beispiel 12 oder 12a.');
$pruefe(
    'postal-code',
    Validation::schwerinPostalCode($wert('postal-code')),
    'Online können wir nur Anträge mit Wohnsitz in Schwerin annehmen (PLZ 19053 bis 19063).'
);
$pruefe('city', Validation::schwerinCity($wert('city')), 'Online können wir nur Anträge mit Wohnsitz in Schwerin annehmen.');
$pruefe('monthly-fee', Validation::euroAmount($wert('monthly-fee'), 8), 'Der Monatsbeitrag beträgt mindestens 8 Euro.');
$pruefe('iban', Validation::iban($wert('iban')), 'Die IBAN ist ungültig. Bitte prüfen Sie sie auf Tippfehler.');
if ($wert('startup-fee') !== '') {
    $pruefe('startup-fee', Validation::euroAmount($wert('startup-fee'), 0), 'Bitte geben Sie einen gültigen Betrag an.');
}

if ($fehler) {
    json_response(400, [
        'ok' => false,
        'error' => 'Bitte prüfen Sie Ihre Eingaben.',
        'errors' => $fehler,
    ]);
}

// Erst nach der Pruefung zaehlen: wer sich vertippt, soll nicht nach fuenf
// Korrekturen ausgesperrt sein. Begrenzt wird, was eine Mail ausloest.
if (!$rateLimiter->allow('membership', client_ip(), RATE_LIMIT_MEMBERSHIP)) {
    json_response(429, [
        'ok' => false,
        'error' => 'Zu viele Anträge von dieser Adresse. Bitte versuchen Sie es später erneut oder schreiben Sie an ' . GESCHAEFTSSTELLE_EMAIL . '.',
    ]);
}

// Alle uebermittelten Felder uebernehmen, nicht nur die Pflichtfelder -
// etwa "religion" oder "functions" sind optional, sollen aber im Antrag
// stehen, wenn sie ausgefuellt wurden. Jede Zeile wird einzeilig gemacht,
// damit spaeter beim Versand keine zusaetzliche Kopfzeile entstehen kann.
$fields = [];
foreach ($_POST as $key => $value) {
    if ($key === 'website') {
        continue;
    }
    if (is_array($value)) {
        $fields[$key] = array_map(static fn ($v) => Validation::singleLine((string) $v), $value);
    } else {
        $fields[$key] = Validation::singleLine((string) $value);
    }
}

$token = bin2hex(random_bytes(32));

try {
    $pendingStore->store($token, $fields);
} catch (Throwable $e) {
    error_log('Mitgliedsantrag: Zwischenspeichern fehlgeschlagen: ' . $e->getMessage());
    json_response(500, ['ok' => false, 'error' => 'Ihr Antrag konnte nicht verarbeitet werden. Bitte versuchen Sie es später erneut.']);
}

$email = $wert('email');
$confirmLink = rtrim(SITE_BASE_URL, '/') . '/api/confirm.php?token=' . urlencode($token);
$firstName = $wert('first-name');

$body = "Hallo {$firstName},\n\n"
    . "vielen Dank für Ihren Mitgliedsantrag beim CDU Kreisverband Landeshauptstadt Schwerin!\n\n"
    . "Bitte bestätigen Sie Ihre E-Mail-Adresse über diesen Link, damit wir Ihren Antrag bearbeiten können:\n"
    . "{$confirmLink}\n\n"
    . 'Der Link ist ' . PENDING_TTL_DAYS . " Tage gültig. Ohne Bestätigung wird Ihr Antrag danach gelöscht\n"
    . "und müsste neu gestellt werden.\n\n"
    . "Mit freundlichen Grüßen\n"
    . SMTP_FROM_NAME . "\n";

try {
    make_mailer()->send($email, $firstName, 'Bitte bestätigen Sie Ihren Mitgliedsantrag', $body);
} catch (Throwable $e) {
    error_log('Mitgliedsantrag: Bestaetigungsmail fehlgeschlagen: ' . $e->getMessage());
    // Der Antrag liegt schon verschluesselt gespeichert; ohne Bestaetigungsmail
    // kommt er aber nie an. Datei wieder entfernen, statt sie sieben Tage
    // lang ohne jede Chance auf Bestaetigung liegen zu lassen.
    $pendingStore->take($token);
    json_response(502, [
        'ok' => false,
        'error' => 'Die Bestätigungsmail konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.',
    ]);
}

json_response(200, ['ok' => true]);
