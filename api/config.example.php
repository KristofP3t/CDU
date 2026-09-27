<?php

declare(strict_types=1);

/*
 * Vorlage fuer die Zugangsdaten des Formularversands.
 *
 * WICHTIG: Diese Datei nicht nach api/config.php kopieren, sondern auf den
 * Server ausserhalb des Web-Verzeichnisses, in denselben Ordner wie der
 * Verschluesselungs-Schluessel:
 *
 *   cdu-secrets/config.php
 *
 * cdu-secrets/ liegt dabei eine Ebene ueber dem Web-Verzeichnis (dem
 * Ordner, der index.html usw. enthaelt) - api/bootstrap.php sucht die
 * Datei genau dort. Das SMTP-Passwort soll den Webserver so nie erreichen,
 * selbst wenn eine .htaccess-Regel einmal nicht greift. Passt der Ordner
 * nicht zum tatsaechlichen Webpaket, den Pfad in api/bootstrap.php
 * anpassen.
 *
 * Danach die Platzhalter darunter durch echte Werte ersetzen. Diese Datei
 * wird nicht eingecheckt (siehe .gitignore) und liegt nur auf dem Server.
 *
 * Gebraucht werden dafuer (siehe TODO.md, Abschnitt 1):
 *   - Anbieter und PHP-Version des Webpakets (PHP 8.1 oder neuer, mit der
 *     Erweiterung sodium - die bringen praktisch alle aktuellen Webpakete
 *     schon mit)
 *   - SMTP-Zugang zum Postfach kreisverband@cdu-schwerin.com
 */

// -- SMTP-Zugang zum Postfach des Kreisverbands -----------------------------
define('SMTP_HOST', 'SMTP_HOST_EINFUEGEN');            // z. B. smtp.strato.de
define('SMTP_PORT', 587);                              // 587 = STARTTLS, 465 = implizites TLS
define('SMTP_ENCRYPTION', 'tls');                       // 'tls' (STARTTLS) oder 'ssl' (implizit)
define('SMTP_USERNAME', 'kreisverband@cdu-schwerin.com');
define('SMTP_PASSWORD', 'SMTP_PASSWORT_EINFUEGEN');
define('SMTP_FROM_EMAIL', 'kreisverband@cdu-schwerin.com');
define('SMTP_FROM_NAME', 'CDU Kreisverband Schwerin');

// -- Wohin die Formulare gehen -----------------------------------------------
define('GESCHAEFTSSTELLE_EMAIL', 'kreisverband@cdu-schwerin.com');

// -- Speicherort ausserhalb des Web-Verzeichnisses --------------------------
// Hier liegen zusaetzlich der Verschluesselungs-Schluessel, die noch
// unbestaetigten Mitgliedsantraege und der Zaehler fuer das Ratenlimit -
// __DIR__ ist bereits dieser Ordner, da diese Datei selbst hier liegt
// (cdu-secrets/config.php, siehe Hinweis oben).
define('SECRETS_DIR', __DIR__);

// -- Adresse der spaeteren Seite, fuer den Bestaetigungslink -----------------
// Erst beim Umzug auf https://cdu-schwerin.com/ umstellen (siehe TODO.md,
// Abschnitt 2) - bis dahin zeigt der Link sonst auf eine Adresse, unter der
// die PHP-Formulare noch gar nicht laufen (GitHub Pages liefert kein PHP).
define('SITE_BASE_URL', 'https://cdu-schwerin.com/');

// -- Feineinstellungen --------------------------------------------------
define('PENDING_TTL_DAYS', 7);      // siehe PLAN.md, Phase 1: unbestaetigte Antraege nach so vielen Tagen loeschen
define('RATE_LIMIT_CONTACT', 10);   // Kontaktformular: Anfragen je Stunde und IP-Adresse
define('RATE_LIMIT_MEMBERSHIP', 5); // Mitgliedsantrag: Anfragen je Stunde und IP-Adresse
