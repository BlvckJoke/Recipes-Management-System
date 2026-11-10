<?php
/**
 * create_user.php — run this from the command line to add a login.
 *
 *   php create_user.php <username> <password>
 *
 * This is a CLI-only script on purpose: keeping account creation off the
 * web means there's no public signup page for anyone to find. Delete this
 * file (or move it outside the web root) once your accounts are set up.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    die("This script can only be run from the command line, e.g.:\n  php create_user.php <username> <password>\n");
}

require_once __DIR__ . '/config.php';

if ($argc < 3) {
    fwrite(STDERR, "Usage: php create_user.php <username> <password>\n");
    exit(1);
}

$username = trim($argv[1]);
$password = $argv[2];

if ($username === '' || strlen($password) < 6) {
    fwrite(STDERR, "Username can't be empty and password must be at least 6 characters.\n");
    exit(1);
}

try {
    $pdo = get_pdo();
    $hash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare(
        'INSERT INTO users (username, password_hash) VALUES (:u, :p)
         ON DUPLICATE KEY UPDATE password_hash = :p2'
    );
    $stmt->execute(['u' => $username, 'p' => $hash, 'p2' => $hash]);

    echo "User \"$username\" is ready to sign in.\n";
} catch (PDOException $e) {
    fwrite(STDERR, 'Database error: ' . $e->getMessage() . "\n");
    exit(1);
}
