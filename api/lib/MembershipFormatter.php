<?php

declare(strict_types=1);

/**
 * Baut den Mitgliedsantrag als lesbaren Text fuer die Mail an die
 * Geschaeftsstelle - dieselbe Gliederung wie zuvor im Formular
 * (mitglied-werden/index.html), nur serverseitig anhand der bekannten
 * Feldnamen statt anhand des DOM.
 */
final class MembershipFormatter
{
    /** @var array<string, array<int, array{0:string,1:string}>> */
    private const SECTIONS = [
        'Persönliche Daten' => [
            ['salutation', 'Anrede'],
            ['first-name', 'Vorname'],
            ['last-name', 'Nachname'],
            ['birthdate', 'Geburtsdatum'],
            ['birthplace', 'Geburtsort'],
            ['nationality', 'Staatsangehörigkeit'],
            ['religion', 'Religion/Konfession'],
        ],
        'Kontaktdaten' => [
            ['email', 'E-Mail'],
            ['phone', 'Telefon/Mobil'],
            ['recruited-by', 'Geworben durch'],
        ],
        'Adresse' => [
            ['street', 'Straße'],
            ['house-number', 'Hausnummer'],
            ['postal-code', 'PLZ'],
            ['city', 'Stadt'],
        ],
        'Beruf & Engagement' => [
            ['profession', 'Beruf'],
            ['functions', 'Funktionen/Ämter'],
        ],
        'Finanzen & Bankverbindung' => [
            ['monthly-fee', 'Monatsbeitrag'],
            ['payment-frequency', 'Zahlweise'],
            ['startup-fee', 'Aufnahmespende'],
            ['iban', 'IBAN'],
            ['bank-name', 'Geldinstitut'],
            ['bic', 'BIC'],
            ['account-holder', 'Kontoinhaber (abw.)'],
        ],
    ];

    /** @param array<string, mixed> $fields */
    public static function toText(array $fields): string
    {
        $lines = [];

        foreach (self::SECTIONS as $title => $rows) {
            $sectionLines = [];

            foreach ($rows as [$key, $label]) {
                $value = $fields[$key] ?? '';
                if (!is_string($value) || $value === '') {
                    continue;
                }

                if ($key === 'birthdate' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
                    $value = implode('.', array_reverse(explode('-', $value)));
                }
                if (in_array($key, ['monthly-fee', 'startup-fee'], true)) {
                    $value .= ' EUR';
                }

                $sectionLines[] = "{$label}: {$value}";
            }

            if ($sectionLines) {
                $lines[] = $title;
                $lines[] = str_repeat('-', 46);
                array_push($lines, ...$sectionLines);
                $lines[] = '';
            }
        }

        $organizations = $fields['organizations'] ?? [];
        if (is_array($organizations) && $organizations) {
            $lines[] = 'Vereinigungen';
            $lines[] = str_repeat('-', 46);
            $lines[] = 'Ausgewählt: ' . implode(', ', $organizations);
            $lines[] = '';
        }

        return implode("\n", $lines);
    }
}
