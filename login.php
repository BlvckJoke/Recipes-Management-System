<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

if (is_logged_in()) {
    header('Location: index.php');
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = (string)($_POST['password'] ?? '');

    if ($username === '' || $password === '') {
        $error = 'Please enter both a username and password.';
    } else {
        try {
            $pdo = get_pdo();
            $stmt = $pdo->prepare('SELECT id, password_hash FROM users WHERE username = :u');
            $stmt->execute(['u' => $username]);
            $user = $stmt->fetch();

            if ($user && password_verify($password, $user['password_hash'])) {
                session_regenerate_id(true);
                $_SESSION['user_id']  = (int)$user['id'];
                $_SESSION['username'] = $username;
                header('Location: index.php');
                exit;
            }
            $error = 'Invalid username or password.';
        } catch (PDOException $e) {
            $error = 'Could not reach the database. Please try again shortly.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sign in — The Recipe Box</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700&family=Source+Serif+4:wght@400;500&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root{
    --wood:#3E2C23; --card:#FBF3E3; --ink:#2B2118; --ink-soft:#6B5C4C;
    --cream-text:#F3E9D6; --rust:#C1521F; --rust-dark:#9C4118;
  }
  *{box-sizing:border-box;}
  body{
    margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
    background: var(--wood); font-family:'Source Serif 4', serif;
    background-image: repeating-linear-gradient(90deg, rgba(0,0,0,.05) 0px, rgba(0,0,0,.05) 1px, transparent 1px, transparent 90px);
  }
  .card{
    background: var(--card); color: var(--ink); width:100%; max-width:360px;
    border-radius:4px; padding: 36px 32px; box-shadow: 0 24px 60px rgba(0,0,0,.5);
    position:relative;
  }
  .card .hole{
    position:absolute; top:14px; left:50%; transform:translateX(-50%);
    width:16px; height:16px; border-radius:50%; background:#281C15;
    box-shadow: inset 0 2px 3px rgba(0,0,0,.5);
  }
  h1{ font-family:'Fraunces', serif; font-size:1.4rem; margin: 12px 0 4px; text-align:center; }
  p.sub{ text-align:center; color: var(--ink-soft); font-size:.85rem; margin:0 0 24px; }
  label{
    display:block; font-family:'IBM Plex Mono', monospace; font-size:.64rem; text-transform:uppercase;
    letter-spacing:.08em; color: var(--ink-soft); margin-bottom:5px;
  }
  .field{ margin-bottom:16px; }
  input{
    width:100%; border:1px solid rgba(43,33,24,.22); border-radius:3px;
    padding:10px 12px; font-size:.92rem; font-family:inherit;
  }
  input:focus{ outline:2px solid #C99A3B; outline-offset:0; }
  button{
    width:100%; background: var(--rust); color:#fff; border:none; border-radius:3px;
    padding:11px; font-size:.9rem; font-weight:600; font-family:inherit; cursor:pointer; margin-top:6px;
  }
  button:hover{ background: var(--rust-dark); }
  .error{
    background:#F4DCD2; color:#8C3417; border-radius:3px; padding:9px 12px;
    font-size:.82rem; margin-bottom:16px;
  }
</style>
</head>
<body>
  <form class="card" method="post">
    <div class="hole"></div>
    <h1>The Recipe Box</h1>
    <p class="sub">Sign in to open your kitchen</p>
    <?php if ($error): ?>
      <div class="error"><?= htmlspecialchars($error, ENT_QUOTES) ?></div>
    <?php endif; ?>
    <div class="field">
      <label for="username">Username</label>
      <input id="username" name="username" type="text" autocomplete="username" autofocus>
    </div>
    <div class="field">
      <label for="password">Password</label>
      <input id="password" name="password" type="password" autocomplete="current-password">
    </div>
    <button type="submit">Sign In</button>
  </form>
</body>
</html>
