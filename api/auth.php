<?php
// auth.php - Authentication API (Production Version)
require_once 'config.php';

// Sessions started per-function via startSecureSession()

$database = new Database();
$pdo = $database->connect();
$method = $_SERVER['REQUEST_METHOD'];
$path = $_GET['action'] ?? '';

switch ($method) {
    case 'GET':
        switch ($path) {
            case 'me':
                getCurrentUser($pdo);
                break;
            case 'csrf':
                getCsrfToken();
                break;
            case 'verify':
                verifyEmail($pdo);
                break;
            case 'resend':
                resendVerificationEmail($pdo);
                break;
            default:
                sendResponse(['error' => 'Invalid endpoint'], 404);
        }
        break;
    case 'POST':
        switch ($path) {
            case 'register':
                registerUser($pdo);
                break;
            case 'login':
                loginUser($pdo);
                break;
            case 'logout':
                logoutUser();
                break;
            default:
                sendResponse(['error' => 'Invalid endpoint'], 404);
        }
        break;
    default:
        sendResponse(['error' => 'Method not allowed'], 405);
}

function registerUser($pdo)
{
    checkRateLimit('register_' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 5, 900);

    $data = getJsonInput();
    validateRequired($data, ['name', 'email', 'password']);

    // Input length validation
    enforceMaxLengths($data, [
        'name'     => MAX_LENGTHS['name'],
        'email'    => MAX_LENGTHS['email'],
        'password' => MAX_LENGTHS['password'],
    ]);

    // Validate email format
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        sendResponse(['error' => 'Invalid email format'], 400);
    }

    // Validate password strength
    $passwordError = validatePasswordStrength($data['password']);
    if ($passwordError !== null) {
        sendResponse(['error' => $passwordError], 400);
    }

    try {
        // Check if email already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$data['email']]);
        if ($stmt->fetch()) {
            sendResponse(['error' => 'Email already registered'], 409);
        }

        // Create user
        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
        $verificationToken = bin2hex(random_bytes(32));

        $stmt = $pdo->prepare("
            INSERT INTO users (username, name, email, password, email_verified, verification_token) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");

        // Use email as username for now
        $username = strtolower(trim($data['email']));

        $stmt->execute([
            $username,
            trim($data['name']),
            strtolower(trim($data['email'])),
            $hashedPassword,
            0, // Not verified yet
            $verificationToken
        ]);

        $userId = $pdo->lastInsertId();

        // Create default "Getting Started" board
        createDefaultBoard($pdo, $userId);

        // Send verification email
        sendVerificationEmail($data['email'], $data['name'], $verificationToken);

        // Start secure session and log user in
        $remember = isset($data['remember']) && $data['remember'];
        startSecureSession($remember);
        session_regenerate_id(true);

        $_SESSION['user_id'] = $userId;
        $_SESSION['user_email'] = $data['email'];
        $_SESSION['user_name'] = $data['name'];

        sendResponse([
            'message' => 'Registration successful',
            'user' => [
                'id' => $userId,
                'name' => $data['name'],
                'email' => $data['email'],
                'email_verified' => false
            ]
        ], 201);

    } catch (PDOException $e) {
        error_log("Registration error: " . $e->getMessage());
        sendResponse(['error' => 'Registration failed'], 500);
    }
}

function loginUser($pdo)
{
    checkRateLimit('login_' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 10, 900);

    $data = getJsonInput();
    validateRequired($data, ['email', 'password']);

    enforceMaxLengths($data, [
        'email'    => MAX_LENGTHS['email'],
        'password' => MAX_LENGTHS['password'],
    ]);

    try {
        $stmt = $pdo->prepare("
            SELECT id, name, email, password, email_verified 
            FROM users 
            WHERE email = ?
        ");
        $stmt->execute([strtolower(trim($data['email']))]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($data['password'], $user['password'])) {
            sendResponse(['error' => 'Invalid email or password'], 401);
        }

        // Start secure session and log user in
        $remember = isset($data['remember']) && $data['remember'];
        startSecureSession($remember);
        session_regenerate_id(true);
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_name'] = $user['name'];

        sendResponse([
            'message' => 'Login successful',
            'user' => [
                'id' => (int) $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'email_verified' => (bool) $user['email_verified']
            ]
        ]);

    } catch (PDOException $e) {
        error_log("Login error: " . $e->getMessage());
        sendResponse(['error' => 'Login failed'], 500);
    }
}

function logoutUser()
{
    startSecureSession();
    validateCsrf();

    session_destroy();

    // Clear session cookie
    if (isset($_COOKIE[session_name()])) {
        setcookie(session_name(), '', time() - 3600, '/');
    }

    sendResponse(['message' => 'Logout successful']);
}

function getCurrentUser($pdo)
{
    startSecureSession();

    if (!isset($_SESSION['user_id'])) {
        sendResponse(['error' => 'Not authenticated'], 401);
    }

    try {
        $stmt = $pdo->prepare("
            SELECT id, name, email, email_verified, dt_created
            FROM users
            WHERE id = ?
        ");
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch();

        if (!$user) {
            // Session is invalid, clear it
            session_destroy();
            sendResponse(['error' => 'Invalid session'], 401);
        }

        sendResponse([
            'user' => [
                'id' => (int) $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'email_verified' => (bool) $user['email_verified'],
                'created_at' => $user['dt_created']
            ]
        ]);

    } catch (PDOException $e) {
        error_log("Get current user error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to get user info'], 500);
    }
}


function getCsrfToken()
{
    startSecureSession();
    sendResponse(['csrf_token' => generateCsrfToken()]);
}

function createDefaultBoard($pdo, $userId)
{
    try {
        // Create "Getting Started" board
        $stmt = $pdo->prepare("
            INSERT INTO boards (user_id, name, color, archived) 
            VALUES (?, ?, ?, ?)
        ");

        $stmt->execute([
            $userId,
            "Getting Started",
            "cyan",
            false
        ]);

        $boardId = $pdo->lastInsertId();

        // Add a welcome task
        $stmt = $pdo->prepare("
            INSERT INTO tasks (board_id, title, description, status, position) 
            VALUES (?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $boardId,
            "Welcome to SuperSix!",
            "This is your first task. Edit it, complete it, or create new ones to get started.",
            "active",
            1
        ]);

    } catch (PDOException $e) {
        error_log("Create default board error: " . $e->getMessage());
        // Don't fail registration if board creation fails
    }
}

function verifyEmail($pdo)
{
    $token = $_GET['token'] ?? null;

    if (!$token) {
        // Redirect to app with error message
        header('Location: /?verification=invalid');
        exit;
    }

    try {
        $stmt = $pdo->prepare("
            SELECT id, email, email_verified 
            FROM users 
            WHERE verification_token = ?
        ");
        $stmt->execute([$token]);
        $user = $stmt->fetch();

        if (!$user) {
            header('Location: /?verification=invalid');
            exit;
        }

        if ($user['email_verified']) {
            header('Location: /?verification=already');
            exit;
        }

        // Mark email as verified
        $stmt = $pdo->prepare("
            UPDATE users 
            SET email_verified = 1, verification_token = NULL 
            WHERE id = ?
        ");
        $stmt->execute([$user['id']]);

        // Redirect to app with success message
        header('Location: /?verification=success');
        exit;

    } catch (PDOException $e) {
        error_log("Email verification error: " . $e->getMessage());
        header('Location: /?verification=error');
        exit;
    }
}

function resendVerificationEmail($pdo)
{
    checkRateLimit('resend_' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 3, 900);

    startSecureSession();

    if (!isset($_SESSION['user_id'])) {
        sendResponse(['error' => 'Authentication required'], 401);
    }

    try {
        $stmt = $pdo->prepare("
            SELECT id, name, email, email_verified, verification_token
            FROM users
            WHERE id = ?
        ");
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch();

        if (!$user) {
            sendResponse(['error' => 'User not found'], 404);
        }

        if ($user['email_verified']) {
            sendResponse(['error' => 'Email already verified'], 400);
        }

        // Generate new token if needed
        if (!$user['verification_token']) {
            $newToken = bin2hex(random_bytes(32));
            $stmt = $pdo->prepare("
                UPDATE users 
                SET verification_token = ? 
                WHERE id = ?
            ");
            $stmt->execute([$newToken, $user['id']]);
            $user['verification_token'] = $newToken;
        }

        // Send verification email
        $emailSent = sendVerificationEmail($user['email'], $user['name'], $user['verification_token']);

        if ($emailSent) {
            sendResponse(['message' => 'Verification email sent successfully']);
        } else {
            sendResponse(['error' => 'Failed to send verification email'], 500);
        }

    } catch (PDOException $e) {
        error_log("Resend verification error: " . $e->getMessage());
        sendResponse(['error' => 'Failed to resend verification email'], 500);
    }
}

function sendVerificationEmail($email, $name, $token)
{
    $verificationUrl = APP_ORIGIN . "/api/auth.php?action=verify&token=" . $token;

    $subject = "Verify Your SuperSix Account";

    $message = "
    <html>
    <head>
        <title>Verify Your SuperSix Account</title>
    </head>
    <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
        <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
            <div style='background: linear-gradient(135deg, #0891b2, #06b6d4); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;'>
                <h1 style='color: white; margin: 0; font-size: 28px;'>SuperSix</h1>
                <p style='color: white; margin: 10px 0 0 0; opacity: 0.9;'>Six meaningful tasks. Daily focus. Relentless progress.</p>
            </div>
            
            <div style='background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0;'>
                <h2 style='color: #1e293b; margin-top: 0;'>Hi " . htmlspecialchars($name) . ",</h2>
                
                <p>Welcome to SuperSix! Please verify your email address to complete your account setup and ensure account security.</p>
                
                <div style='text-align: center; margin: 30px 0;'>
                    <a href='" . $verificationUrl . "' style='background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;'>Verify Email Address</a>
                </div>
                
                <p style='color: #64748b; font-size: 14px;'>If the button doesn't work, copy and paste this link into your browser:</p>
                <p style='background: #e2e8f0; padding: 10px; border-radius: 4px; font-size: 12px; word-break: break-all;'>" . $verificationUrl . "</p>
                
                <p style='color: #64748b; font-size: 14px; margin-top: 30px;'>If you didn't create a SuperSix account, you can safely ignore this email.</p>
            </div>
        </div>
    </body>
    </html>
    ";

    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: SuperSix <noreply@supersix.app>" . "\r\n";

    return mail($email, $subject, $message, $headers);
}

?>