<?php

declare(strict_types=1);

/**
 * Einfache Begrenzung je IP-Adresse und Zeitfenster, dateibasiert - fuer die
 * paar Formulare eines Kreisverbands reicht das, eine Datenbank waere hier
 * zu viel.
 */
final class RateLimiter
{
    private string $dir;

    public function __construct(string $secretsDir)
    {
        $this->dir = rtrim($secretsDir, '/') . '/ratelimit';

        if (!is_dir($this->dir) && !mkdir($this->dir, 0700, true) && !is_dir($this->dir)) {
            throw new RuntimeException('Speicherverzeichnis fuer das Ratenlimit konnte nicht angelegt werden.');
        }
    }

    /**
     * true, wenn im letzten $windowSeconds-Fenster weniger als $limit
     * Versuche gezaehlt wurden - und zaehlt den aktuellen Versuch bei einem
     * "Ja" gleich mit.
     */
    public function allow(string $scope, string $ip, int $limit, int $windowSeconds = 3600): bool
    {
        $this->purgeStale($windowSeconds);
        $path = $this->dir . '/' . hash('sha256', $scope . '|' . $ip) . '.json';

        $handle = fopen($path, 'c+');
        if ($handle === false) {
            // Speicher nicht verfuegbar - das Formular soll trotzdem
            // funktionieren, nur eben ohne Begrenzung fuer diesen Aufruf.
            return true;
        }

        flock($handle, LOCK_EX);
        $raw = stream_get_contents($handle);
        $attempts = $raw ? (json_decode($raw, true) ?: []) : [];
        if (!is_array($attempts)) {
            $attempts = [];
        }

        $cutoff = time() - $windowSeconds;
        $attempts = array_values(array_filter($attempts, static fn ($t) => is_int($t) && $t > $cutoff));

        $allowed = count($attempts) < $limit;
        if ($allowed) {
            $attempts[] = time();
        }

        ftruncate($handle, 0);
        rewind($handle);
        fwrite($handle, json_encode($attempts));
        fflush($handle);
        flock($handle, LOCK_UN);
        fclose($handle);

        return $allowed;
    }

    /**
     * Loescht Zaehler, die laenger als das Zeitfenster unberuehrt liegen.
     * Der Dateiname ist ein Hash der IP-Adresse - bei IPv4 laesst er sich
     * durchprobieren, er gilt also als personenbezogen und darf nicht
     * laenger liegen als noetig (siehe Datenschutzerklaerung: eine Stunde).
     */
    private function purgeStale(int $maxAgeSeconds): void
    {
        $cutoff = time() - $maxAgeSeconds;
        foreach (glob($this->dir . '/*.json') ?: [] as $file) {
            $mtime = @filemtime($file);
            if ($mtime !== false && $mtime < $cutoff) {
                @unlink($file);
            }
        }
    }
}
