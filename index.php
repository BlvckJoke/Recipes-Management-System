<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';
require_login_redirect();

header('Content-Type: text/html; charset=utf-8');
readfile(__DIR__ . '/recipe-box.html');
