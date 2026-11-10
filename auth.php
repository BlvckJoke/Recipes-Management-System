<?php
/**
 * auth.php — shared session helpers.
 * Include this after config.php in any file that needs to check login state.
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function is_logged_in(): bool {
    return !empty($_SESSION['user_id']);
}

/**
 * For JSON API endpoints: stop the request with a 401 JSON error if not logged in.
 */
function require_login_json(): void {
    if (!is_logged_in()) {
        http_response_code(401);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Not logged in.']);
        exit;
    }
}

/**
 * For page requests: redirect to the login page if not logged in.
 */
function require_login_redirect(string $loginUrl = 'login.php'): void {
    if (!is_logged_in()) {
        header('Location: ' . $loginUrl);
        exit;
    }
}
