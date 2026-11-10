<?php
/**
 * upload.php
 * -------------------------------------------------------------
 * Accepts one or more image files via multipart/form-data (field
 * name "images[]"), saves them into /uploads, and returns the
 * public URLs. The frontend then attaches those URLs to a recipe
 * via api.php?action=save (images: [...]).
 *
 * Usage (from the browser):
 *   const form = new FormData();
 *   for (const file of fileInput.files) form.append('images[]', file);
 *   fetch('upload.php', { method: 'POST', body: form });
 * -------------------------------------------------------------
 */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';
require_login_json();

const UPLOAD_DIR    = __DIR__ . '/uploads';
const UPLOAD_URL    = 'uploads';               // relative URL prefix used in <img src>
const MAX_BYTES      = 8 * 1024 * 1024;         // 8 MB per file
const ALLOWED_TYPES  = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
    'image/gif'  => 'gif',
];

function fail(string $message, int $status = 400): void {
    http_response_code($status);
    echo json_encode(['error' => $message]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail('Only POST is supported.', 405);
}

if (empty($_FILES['images'])) {
    fail('No files were uploaded. Expecting field name "images[]".');
}

if (!is_dir(UPLOAD_DIR)) {
    if (!mkdir(UPLOAD_DIR, 0755, true) && !is_dir(UPLOAD_DIR)) {
        fail('Could not create the uploads directory on the server.', 500);
    }
}

$files = $_FILES['images'];
$count = is_array($files['name']) ? count($files['name']) : 1;
$urls  = [];
$errors = [];

for ($i = 0; $i < $count; $i++) {
    $name     = is_array($files['name']) ? $files['name'][$i] : $files['name'];
    $tmpName  = is_array($files['tmp_name']) ? $files['tmp_name'][$i] : $files['tmp_name'];
    $error    = is_array($files['error']) ? $files['error'][$i] : $files['error'];
    $size     = is_array($files['size']) ? $files['size'][$i] : $files['size'];

    if ($error !== UPLOAD_ERR_OK) {
        $errors[] = "$name: upload error code $error";
        continue;
    }
    if ($size > MAX_BYTES) {
        $errors[] = "$name: file is larger than 8 MB";
        continue;
    }

    $mime = mime_content_type($tmpName);
    if (!isset(ALLOWED_TYPES[$mime])) {
        $errors[] = "$name: unsupported file type ($mime)";
        continue;
    }

    $ext = ALLOWED_TYPES[$mime];
    $filename = bin2hex(random_bytes(8)) . '.' . $ext;
    $dest = UPLOAD_DIR . '/' . $filename;

    if (!move_uploaded_file($tmpName, $dest)) {
        $errors[] = "$name: could not save file on server";
        continue;
    }

    $urls[] = UPLOAD_URL . '/' . $filename;
}

if (empty($urls)) {
    fail('No files could be uploaded. ' . implode('; ', $errors));
}

echo json_encode(['urls' => $urls, 'errors' => $errors]);
