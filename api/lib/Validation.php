<?php

declare(strict_types=1);

/**
 * Kleine, gemeinsam genutzte Pruefungen fuer beide Formulare. Bewusst ohne
 * Bibliothek - es sind wenige, einfache Regeln. Die Regeln im Browser
 * (mitglied-werden/index.html) sind dieselben; geprueft wird hier trotzdem
 * noch einmal, weil sich die Pruefung im Browser umgehen laesst.
 */
final class Validation
{
    /** Wohnsitz-PLZ der Landeshauptstadt; Online-Antraege nur von hier. */
    public const SCHWERIN_PLZ = ['19053', '19055', '19057', '19059', '19061', '19063'];

    /** IBAN-Laenge je Land im SEPA-Raum - nur dort ist eine Lastschrift moeglich. */
    private const IBAN_LAENGEN = [
        'AD' => 24, 'AL' => 28, 'AT' => 20, 'BE' => 16, 'BG' => 22, 'CH' => 21,
        'CY' => 28, 'CZ' => 24, 'DE' => 22, 'DK' => 18, 'EE' => 20, 'ES' => 24,
        'FI' => 18, 'FR' => 27, 'GB' => 22, 'GI' => 23, 'GR' => 27, 'HR' => 21,
        'HU' => 28, 'IE' => 22, 'IS' => 26, 'IT' => 27, 'LI' => 21, 'LT' => 20,
        'LU' => 20, 'LV' => 21, 'MC' => 27, 'MD' => 24, 'ME' => 22, 'MK' => 19,
        'MT' => 31, 'NL' => 18, 'NO' => 15, 'PL' => 28, 'PT' => 25, 'RO' => 24,
        'SE' => 24, 'SI' => 19, 'SK' => 24, 'SM' => 27, 'VA' => 22,
    ];

    public static function trimmed(array $data, string $key): string
    {
        return isset($data[$key]) && is_string($data[$key]) ? trim($data[$key]) : '';
    }

    /** Zusaetzlich zu filter_var: die Domain braucht eine Endung wie ".de". */
    public static function email(string $value): bool
    {
        if ($value === '' || filter_var($value, FILTER_VALIDATE_EMAIL) === false) {
            return false;
        }
        $domain = substr((string) strrchr($value, '@'), 1);

        return (bool) preg_match('/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i', $domain);
    }

    /** Ziffern mit den ueblichen Trennzeichen, 6 bis 15 Ziffern (E.164). */
    public static function phone(string $value): bool
    {
        if (!preg_match('/^\+?[0-9\s\/()\-]+$/', $value)) {
            return false;
        }
        $ziffern = strlen((string) preg_replace('/\D/', '', $value));

        return $ziffern >= 6 && $ziffern <= 15;
    }

    /** "12", "12a", "12 a", "12-14", "12/1". */
    public static function houseNumber(string $value): bool
    {
        return (bool) preg_match('/^\d{1,4}\s?[a-z]?(\s?[-–\/]\s?\d{1,4}\s?[a-z]?)?$/iu', $value);
    }

    public static function schwerinPostalCode(string $value): bool
    {
        return in_array($value, self::SCHWERIN_PLZ, true);
    }

    public static function schwerinCity(string $value): bool
    {
        return mb_strtolower(trim($value)) === 'schwerin';
    }

    /** Laenge je Land und Pruefsumme nach ISO 13616 (Modulo 97). */
    public static function iban(string $value): bool
    {
        $iban = strtoupper((string) preg_replace('/\s+/', '', $value));
        if (!preg_match('/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/', $iban)) {
            return false;
        }
        $laenge = self::IBAN_LAENGEN[substr($iban, 0, 2)] ?? null;
        if ($laenge === null || strlen($iban) !== $laenge) {
            return false;
        }

        // Stueckweise rechnen: die Zahl hat bis zu 70 Stellen und passt in
        // keinen Integer.
        $umgestellt = substr($iban, 4) . substr($iban, 0, 4);
        $rest = 0;
        foreach (str_split($umgestellt) as $zeichen) {
            $wert = ctype_alpha($zeichen) ? (string) (ord($zeichen) - 55) : $zeichen;
            foreach (str_split($wert) as $ziffer) {
                $rest = ($rest * 10 + (int) $ziffer) % 97;
            }
        }

        return $rest === 1;
    }

    /** Betrag in Euro mit hoechstens zwei Nachkommastellen, mindestens $min. */
    public static function euroAmount(string $value, float $min): bool
    {
        if (!preg_match('/^\d{1,6}(?:[.,]\d{1,2})?$/', $value)) {
            return false;
        }

        return (float) str_replace(',', '.', $value) >= $min;
    }

    public static function withinLength(string $value, int $max): bool
    {
        return mb_strlen($value) <= $max;
    }

    /**
     * Verhindert, dass aus einer einzeiligen Angabe (etwa fuer Reply-To)
     * durch einen Zeilenumbruch zusaetzliche Mail-Kopfzeilen entstehen.
     */
    public static function singleLine(string $value): string
    {
        return trim(str_replace(["\r", "\n"], ' ', $value));
    }

    /** @param string[] $requiredKeys
     *  @return string[] fehlende Feldnamen */
    public static function missing(array $data, array $requiredKeys): array
    {
        $missing = [];
        foreach ($requiredKeys as $key) {
            if (self::trimmed($data, $key) === '') {
                $missing[] = $key;
            }
        }

        return $missing;
    }
}
