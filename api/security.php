<?php
// security.php - Shared security utilities for SuperSix API

// ── Session Management ──────────────────────────────────────────────

function startSecureSession(bool $rememberMe = false): void {
    if (session_status() !== PHP_SESSION_NONE) {
        return;
    }

    $lifetime = $rememberMe ? (30 * 24 * 60 * 60) : 0;
    $isHttps  = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';

    if ($rememberMe) {
        ini_set('session.gc_maxlifetime', 30 * 24 * 60 * 60);
    }

    session_set_cookie_params([
        'lifetime' => $lifetime,
        'path'     => '/',
        'domain'   => '',
        'secure'   => $isHttps,
        'httponly'  => true,
        'samesite'  => 'Lax',
    ]);

    session_start();
}

// ── CSRF Protection ─────────────────────────────────────────────────

function generateCsrfToken(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function validateCsrf(): void {
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (empty($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $token)) {
        http_response_code(403);
        echo json_encode(['error' => 'Invalid or missing CSRF token']);
        exit;
    }
}

// ── Rate Limiting (file-based, no Redis required) ───────────────────

function checkRateLimit(string $identifier, int $maxAttempts = 10, int $windowSeconds = 900): void {
    $dir = sys_get_temp_dir() . '/supersix_rl/';
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }

    $key  = preg_replace('/[^a-zA-Z0-9_]/', '_', $identifier);
    $file = $dir . $key . '.json';
    $now  = time();
    $data = ['attempts' => [], 'blocked_until' => 0];

    $fh = @fopen($file, 'c+');
    if (!$fh) return; // fail open

    flock($fh, LOCK_EX);

    $contents = stream_get_contents($fh);
    if ($contents) {
        $decoded = json_decode($contents, true);
        if ($decoded) $data = $decoded;
    }

    // Prune attempts outside the window
    $data['attempts'] = array_values(array_filter(
        $data['attempts'],
        fn($t) => $t > $now - $windowSeconds
    ));

    // Check if currently blocked
    if ($data['blocked_until'] > $now) {
        flock($fh, LOCK_UN);
        fclose($fh);
        http_response_code(429);
        header('Retry-After: ' . ($data['blocked_until'] - $now));
        echo json_encode(['error' => 'Too many attempts. Please try again later.']);
        exit;
    }

    // Record this attempt
    $data['attempts'][] = $now;

    // Block if over limit
    if (count($data['attempts']) > $maxAttempts) {
        $data['blocked_until'] = $now + $windowSeconds;
        $data['attempts'] = [];
    }

    // Write back
    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, json_encode($data));
    flock($fh, LOCK_UN);
    fclose($fh);

    if ($data['blocked_until'] > $now) {
        http_response_code(429);
        header('Retry-After: ' . $windowSeconds);
        echo json_encode(['error' => 'Too many attempts. Please try again later.']);
        exit;
    }
}

// ── Password Validation ─────────────────────────────────────────────

function validatePasswordStrength(string $password): ?string {
    if (strlen($password) < 8) {
        return 'Password must be at least 8 characters long';
    }
    if (!preg_match('/[A-Z]/', $password)) {
        return 'Password must contain at least one uppercase letter';
    }
    if (!preg_match('/[a-z]/', $password)) {
        return 'Password must contain at least one lowercase letter';
    }
    if (!preg_match('/[0-9]/', $password)) {
        return 'Password must contain at least one number';
    }
    return null;
}

// ── Input Length Validation ─────────────────────────────────────────

const MAX_LENGTHS = [
    'name'        => 100,
    'email'       => 254,
    'password'    => 1024,
    'board_name'  => 100,
    'task_title'  => 255,
    'title'       => 255,
    'description' => 5000,
    'color'       => 20,
];

function enforceMaxLengths(array $data, array $fieldLimits): void {
    foreach ($fieldLimits as $field => $max) {
        if (isset($data[$field]) && strlen((string)$data[$field]) > $max) {
            http_response_code(422);
            echo json_encode(['error' => "Field '$field' exceeds maximum length of $max characters"]);
            exit;
        }
    }
}
?>