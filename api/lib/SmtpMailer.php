<?php

declare(strict_types=1);

final class SmtpMailerException extends RuntimeException
{
}

/**
 * Schlanker SMTP-Client fuer einfache Text-Mails mit Authentifizierung.
 *
 * Bewusst ohne Bibliothek von aussen: der Versand braucht nur EHLO,
 * STARTTLS oder implizites TLS, AUTH LOGIN und DATA - das laesst sich mit
 * PHP-Bordmitteln (fsockopen, stream_socket_enable_crypto) in wenigen
 * Zeilen sauber umsetzen, ohne eine weitere Abhaengigkeit ins Webpaket
 * hochladen zu muessen. Passt zum uebrigen Verzicht auf fremde Skripte
 * (siehe PLAN.md).
 *
 * Wichtig fuer Aufrufer: Fehlermeldungen dieser Klasse enthalten nie den
 * Nachrichtentext - der kann Bankdaten enthalten und darf nicht in Logs
 * landen (siehe TODO.md, Abschnitt 1).
 */
final class SmtpMailer
{
    /** @var resource|null */
    private $socket = null;

    public function __construct(
        private readonly string $host,
        private readonly int $port,
        private readonly string $encryption, // 'tls', 'ssl' oder ''
        private readonly string $username,
        private readonly string $password,
        private readonly string $fromEmail,
        private readonly string $fromName,
        private readonly int $timeoutSeconds = 15,
    ) {
    }

    public function send(string $toEmail, string $toName, string $subject, string $body, ?string $replyTo = null): void
    {
        try {
            $this->connect();
            $this->hello();

            if ($this->encryption === 'tls') {
                $this->startTls();
                $this->hello();
            }

            $this->authenticate();
            $this->mailFrom();
            $this->rcptTo($toEmail);
            $this->data($this->buildMessage($toEmail, $toName, $subject, $body, $replyTo));
            $this->command('QUIT', [221, 250]);
        } finally {
            $this->close();
        }
    }

    private function connect(): void
    {
        $target = $this->encryption === 'ssl' ? 'ssl://' . $this->host : $this->host;

        $socket = @fsockopen($target, $this->port, $errno, $errstr, $this->timeoutSeconds);
        if ($socket === false) {
            throw new SmtpMailerException("Verbindung zum Mailserver fehlgeschlagen: {$errstr}");
        }

        stream_set_timeout($socket, $this->timeoutSeconds);
        $this->socket = $socket;
        $this->readResponse([220]);
    }

    private function hello(): void
    {
        $host = gethostname() ?: 'localhost';
        $this->command('EHLO ' . $host, [250]);
    }

    private function startTls(): void
    {
        $this->command('STARTTLS', [220]);

        $ok = stream_socket_enable_crypto($this->socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
        if ($ok !== true) {
            throw new SmtpMailerException('TLS-Verbindung zum Mailserver fehlgeschlagen.');
        }
    }

    private function authenticate(): void
    {
        $this->command('AUTH LOGIN', [334]);
        $this->command(base64_encode($this->username), [334]);
        $this->command(base64_encode($this->password), [235]);
    }

    private function mailFrom(): void
    {
        $this->command('MAIL FROM:<' . $this->fromEmail . '>', [250]);
    }

    private function rcptTo(string $email): void
    {
        $this->command('RCPT TO:<' . $email . '>', [250, 251]);
    }

    private function data(string $message): void
    {
        $this->command('DATA', [354]);

        // Byte-Stopfung nach RFC 5321: eine Zeile, die mit einem Punkt
        // beginnt, bekommt einen zweiten davor - sonst liest der Server sie
        // als Ende der Nachricht.
        $stuffed = preg_replace('/^\./m', '..', $message);
        $this->write($stuffed . "\r\n.\r\n");
        $this->readResponse([250]);
    }

    private function buildMessage(string $toEmail, string $toName, string $subject, string $body, ?string $replyTo): string
    {
        $headers = [
            'Date: ' . gmdate('D, d M Y H:i:s O'),
            'From: ' . $this->encodeAddress($this->fromName, $this->fromEmail),
            'To: ' . $this->encodeAddress($toName, $toEmail),
        ];

        if ($replyTo !== null && $replyTo !== '') {
            $headers[] = 'Reply-To: <' . $replyTo . '>';
        }

        $headers[] = 'Subject: ' . $this->encodeHeaderText($subject);
        $headers[] = 'Message-ID: <' . bin2hex(random_bytes(16)) . '@' . $this->hostForMessageId() . '>';
        $headers[] = 'MIME-Version: 1.0';
        $headers[] = 'Content-Type: text/plain; charset=UTF-8';
        $headers[] = 'Content-Transfer-Encoding: base64';

        $encodedBody = chunk_split(base64_encode($body));

        return implode("\r\n", $headers) . "\r\n\r\n" . $encodedBody;
    }

    private function hostForMessageId(): string
    {
        $at = strrpos($this->fromEmail, '@');

        return $at !== false ? substr($this->fromEmail, $at + 1) : 'localhost';
    }

    private function encodeAddress(string $name, string $email): string
    {
        return $this->encodeHeaderText($name) . ' <' . $email . '>';
    }

    private function encodeHeaderText(string $text): string
    {
        // Kurze deutsche Betreffzeilen und Namen - eine einzelne
        // encoded-word-Zeile reicht, eine Faltung ueber mehrere Zeilen
        // braucht es fuer diese Laengen nicht.
        return '=?UTF-8?B?' . base64_encode($text) . '?=';
    }

    /** @param int[] $expectedCodes
     *  @return array{0:int,1:string[]} */
    private function command(string $line, array $expectedCodes): array
    {
        $this->write($line . "\r\n");

        return $this->readResponse($expectedCodes);
    }

    private function write(string $data): void
    {
        if ($this->socket === null || @fwrite($this->socket, $data) === false) {
            throw new SmtpMailerException('Verbindung zum Mailserver abgebrochen.');
        }
    }

    /** @param int[] $expectedCodes
     *  @return array{0:int,1:string[]} */
    private function readResponse(array $expectedCodes): array
    {
        if ($this->socket === null) {
            throw new SmtpMailerException('Keine Verbindung zum Mailserver.');
        }

        $code = 0;
        $lines = [];

        do {
            $line = fgets($this->socket, 1024);
            if ($line === false) {
                throw new SmtpMailerException('Keine Antwort vom Mailserver.');
            }

            $lines[] = rtrim($line, "\r\n");
            $code = (int) substr($line, 0, 3);
            $continues = isset($line[3]) && $line[3] === '-';
        } while ($continues);

        if (!in_array($code, $expectedCodes, true)) {
            throw new SmtpMailerException("Unerwartete Antwort vom Mailserver ({$code}).");
        }

        return [$code, $lines];
    }

    private function close(): void
    {
        if ($this->socket !== null) {
            fclose($this->socket);
            $this->socket = null;
        }
    }
}
