<?php

declare(strict_types=1);

/**
 * Speichert und liest die noch nicht bestaetigten Mitgliedsantraege.
 *
 * Jeder Antrag liegt als eine Datei unter SECRETS_DIR/pending/,
 * verschluesselt mit einem Schluessel, der eine Ebene hoeher liegt (also
 * neben "pending/", nicht darin). Der Dateiname ist der SHA-256-Hash des
 * Bestaetigungs-Tokens aus dem Link in der Mail: wer die Datei findet, kommt
 * ohne den Token trotzdem nicht an den Inhalt, und wer den Token hat, findet
 * die Datei ohne Verzeichnis-Auflistung.
 *
 * take() loescht die Datei, sobald sie gelesen wurde - der Bestaetigungslink
 * funktioniert damit nur einmal.
 */
final class PendingStore
{
    private string $dir;
    private string $keyFile;

    public function __construct(string $secretsDir)
    {
        $secretsDir = rtrim($secretsDir, '/');
        $this->dir = $secretsDir . '/pending';
        $this->keyFile = $secretsDir . '/membership.key';

        $this->ensureDir($secretsDir);
        $this->ensureDir($this->dir);
    }

    private function ensureDir(string $path): void
    {
        if (is_dir($path)) {
            return;
        }

        if (!mkdir($path, 0700, true) && !is_dir($path)) {
            throw new RuntimeException('Speicherverzeichnis fuer Mitgliedsantraege konnte nicht angelegt werden.');
        }
    }

    private function key(): string
    {
        if (is_file($this->keyFile)) {
            $key = file_get_contents($this->keyFile);
            if ($key === false || strlen($key) !== SODIUM_CRYPTO_SECRETBOX_KEYBYTES) {
                throw new RuntimeException('Schluesseldatei fuer Mitgliedsantraege ist beschaedigt.');
            }

            return $key;
        }

        $key = sodium_crypto_secretbox_keygen();
        file_put_contents($this->keyFile, $key, LOCK_EX);
        chmod($this->keyFile, 0600);

        return $key;
    }

    private function path(string $token): string
    {
        return $this->dir . '/' . hash('sha256', $token) . '.bin';
    }

    /** @param array<string, mixed> $data */
    public function store(string $token, array $data): void
    {
        $key = $this->key();
        $nonce = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
        $plain = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        $cipher = sodium_crypto_secretbox($plain, $nonce, $key);

        $path = $this->path($token);
        file_put_contents($path, $nonce . $cipher, LOCK_EX);
        chmod($path, 0600);
    }

    /** @return array<string, mixed>|null */
    public function take(string $token): ?array
    {
        $path = $this->path($token);
        if (!is_file($path)) {
            return null;
        }

        $raw = file_get_contents($path);
        // Einmalig: die Datei verschwindet, sobald sie gelesen wurde - egal,
        // ob die Bestaetigung danach noch gelingt.
        unlink($path);

        if ($raw === false || strlen($raw) <= SODIUM_CRYPTO_SECRETBOX_NONCEBYTES) {
            return null;
        }

        $nonce = substr($raw, 0, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
        $cipher = substr($raw, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
        $plain = sodium_crypto_secretbox_open($cipher, $nonce, $this->key());

        if ($plain === false) {
            return null;
        }

        try {
            $data = json_decode($plain, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            return null;
        }

        return is_array($data) ? $data : null;
    }

    /** Loescht Antraege, die laenger als $days Tage unbestaetigt liegen. */
    public function purgeExpired(int $days): void
    {
        $cutoff = time() - $days * 86400;
        foreach (glob($this->dir . '/*.bin') ?: [] as $file) {
            if (filemtime($file) !== false && filemtime($file) < $cutoff) {
                @unlink($file);
            }
        }
    }
}
