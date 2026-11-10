<?php
/**
 * Recipe Box API
 * -------------------------------------------------------------
 * A small JSON REST API over the recipe_box database.
 * Talk to it with ?action=... requests (see list below).
 *
 * Recipes
 *   GET  api.php?action=list                 -> all recipes (with ingredients/instructions/images)
 *   GET  api.php?action=get&id=5              -> one recipe
 *   POST api.php?action=save                  -> create or update a recipe (JSON body, may include images[])
 *   POST api.php?action=delete&id=5            -> delete a recipe
 *   POST api.php?action=toggle_favorite&id=5   -> flip favorite on/off
 *
 * Categories
 *   GET  api.php?action=categories_list        -> ["Salads","Soups",...]
 *   POST api.php?action=category_add           -> JSON body {name} -> adds a new category
 *
 * Images
 *   POST upload.php                            -> multipart file upload (field name images[]), returns {urls:[...]}
 *
 * Shopping list
 *   GET  api.php?action=shopping_get           -> {recipeIds:[...], checked:{...}}
 *   POST api.php?action=shopping_add&id=5      -> add a recipe to the list
 *   POST api.php?action=shopping_remove&id=5   -> remove a recipe from the list
 *   POST api.php?action=shopping_clear         -> empty the list + reset checked state
 *   POST api.php?action=shopping_check         -> JSON body {key, checked}
 *
 * All responses are JSON. On error: {"error": "message"} with a 4xx/5xx status.
 * -------------------------------------------------------------
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

header('Content-Type: application/json; charset=utf-8');
require_login_json();

function respond($data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function fail(string $message, int $status = 400): void {
    respond(['error' => $message], $status);
}

function json_body(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data)) fail('Invalid or missing JSON body.');
    return $data;
}

$action = $_GET['action'] ?? '';

try {
    $pdo = get_pdo();

    switch ($action) {

        // ---------------- Recipes ----------------

        case 'list': {
            $rows = $pdo->query('SELECT * FROM recipes ORDER BY created_at DESC')->fetchAll();
            $recipes = array_map(fn($r) => attach_children($pdo, $r), $rows);
            respond($recipes);
        }

        case 'get': {
            $id = require_int($_GET['id'] ?? null);
            $row = fetch_recipe_row($pdo, $id);
            if (!$row) fail('Recipe not found.', 404);
            respond(attach_children($pdo, $row));
        }

        case 'save': {
            $data = json_body();
            $title = trim($data['title'] ?? '');
            if ($title === '') fail('Title is required.');

            $fields = [
                'title'    => $title,
                'category' => $data['category'] ?? 'Other',
                'time'     => $data['time'] ?? '',
                'servings' => $data['servings'] ?? '',
                'notes'    => $data['notes'] ?? '',
                'favorite' => !empty($data['favorite']) ? 1 : 0,
            ];

            $id = isset($data['id']) ? (int)$data['id'] : 0;

            if ($id > 0 && fetch_recipe_row($pdo, $id)) {
                $stmt = $pdo->prepare(
                    'UPDATE recipes SET title=:title, category=:category, time=:time,
                     servings=:servings, notes=:notes, favorite=:favorite WHERE id=:id'
                );
                $stmt->execute($fields + ['id' => $id]);
            } else {
                $stmt = $pdo->prepare(
                    'INSERT INTO recipes (title, category, time, servings, notes, favorite)
                     VALUES (:title, :category, :time, :servings, :notes, :favorite)'
                );
                $stmt->execute($fields);
                $id = (int)$pdo->lastInsertId();
            }

            replace_ingredients($pdo, $id, $data['ingredients'] ?? []);
            replace_instructions($pdo, $id, $data['instructions'] ?? []);
            replace_images($pdo, $id, $data['images'] ?? []);
            ensure_category($pdo, $fields['category']);

            respond(attach_children($pdo, fetch_recipe_row($pdo, $id)));
        }

        case 'delete': {
            $id = require_int($_GET['id'] ?? null);
            $stmt = $pdo->prepare('DELETE FROM recipes WHERE id = :id');
            $stmt->execute(['id' => $id]);
            respond(['deleted' => $id]);
        }

        case 'toggle_favorite': {
            $id = require_int($_GET['id'] ?? null);
            $row = fetch_recipe_row($pdo, $id);
            if (!$row) fail('Recipe not found.', 404);
            $newVal = $row['favorite'] ? 0 : 1;
            $stmt = $pdo->prepare('UPDATE recipes SET favorite = :f WHERE id = :id');
            $stmt->execute(['f' => $newVal, 'id' => $id]);
            respond(['id' => $id, 'favorite' => (bool)$newVal]);
        }

        // ---------------- Categories ----------------

        case 'categories_list': {
            $rows = $pdo->query('SELECT name, icon FROM categories ORDER BY sort_order, name')->fetchAll();
            respond(array_map(fn($r) => ['name' => $r['name'], 'icon' => $r['icon']], $rows));
        }

        case 'category_add': {
            $data = json_body();
            $name = trim($data['name'] ?? '');
            $icon = trim($data['icon'] ?? '');
            if ($name === '') fail('Category name is required.');
            if (strlen($name) > 50) fail('Category name is too long.');
            ensure_category($pdo, $name, $icon !== '' ? $icon : null);
            $rows = $pdo->query('SELECT name, icon FROM categories ORDER BY sort_order, name')->fetchAll();
            respond(array_map(fn($r) => ['name' => $r['name'], 'icon' => $r['icon']], $rows));
        }

        // ---------------- Auth ----------------

        case 'whoami': {
            respond(['username' => $_SESSION['username'] ?? '']);
        }

        // ---------------- Shopping list ----------------

        case 'shopping_get': {
            $ids = $pdo->query('SELECT recipe_id FROM shopping_list ORDER BY added_at')
                       ->fetchAll(PDO::FETCH_COLUMN);
            $checkedRows = $pdo->query('SELECT item_key, checked FROM shopping_checked')->fetchAll();
            $checked = [];
            foreach ($checkedRows as $r) $checked[$r['item_key']] = (bool)$r['checked'];
            respond(['recipeIds' => array_map('intval', $ids), 'checked' => empty($checked) ? new stdClass() : $checked]);
        }

        case 'shopping_add': {
            $id = require_int($_GET['id'] ?? null);
            if (!fetch_recipe_row($pdo, $id)) fail('Recipe not found.', 404);
            $stmt = $pdo->prepare('INSERT IGNORE INTO shopping_list (recipe_id) VALUES (:id)');
            $stmt->execute(['id' => $id]);
            respond(['added' => $id]);
        }

        case 'shopping_remove': {
            $id = require_int($_GET['id'] ?? null);
            $stmt = $pdo->prepare('DELETE FROM shopping_list WHERE recipe_id = :id');
            $stmt->execute(['id' => $id]);
            respond(['removed' => $id]);
        }

        case 'shopping_clear': {
            $pdo->exec('DELETE FROM shopping_list');
            $pdo->exec('DELETE FROM shopping_checked');
            respond(['cleared' => true]);
        }

        case 'shopping_check': {
            $data = json_body();
            $key = trim($data['key'] ?? '');
            if ($key === '') fail('Missing item key.');
            $checked = !empty($data['checked']) ? 1 : 0;
            $stmt = $pdo->prepare(
                'INSERT INTO shopping_checked (item_key, checked) VALUES (:k, :c)
                 ON DUPLICATE KEY UPDATE checked = :c2'
            );
            $stmt->execute(['k' => $key, 'c' => $checked, 'c2' => $checked]);
            respond(['key' => $key, 'checked' => (bool)$checked]);
        }

        default:
            fail('Unknown action.', 404);
    }
} catch (PDOException $e) {
    fail('Database error: ' . $e->getMessage(), 500);
}

// ---------------- Helpers ----------------

function require_int($value): int {
    if ($value === null || !ctype_digit((string)$value)) fail('A valid numeric id is required.');
    return (int)$value;
}

function fetch_recipe_row(PDO $pdo, int $id): ?array {
    $stmt = $pdo->prepare('SELECT * FROM recipes WHERE id = :id');
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function attach_children(PDO $pdo, array $recipe): array {
    $ingStmt = $pdo->prepare(
        'SELECT qty, unit, name FROM ingredients WHERE recipe_id = :id ORDER BY sort_order'
    );
    $ingStmt->execute(['id' => $recipe['id']]);

    $stepStmt = $pdo->prepare(
        'SELECT step_text FROM instructions WHERE recipe_id = :id ORDER BY sort_order'
    );
    $stepStmt->execute(['id' => $recipe['id']]);

    $imgStmt = $pdo->prepare(
        'SELECT url FROM recipe_images WHERE recipe_id = :id ORDER BY sort_order'
    );
    $imgStmt->execute(['id' => $recipe['id']]);

    return [
        'id'           => (int)$recipe['id'],
        'title'        => $recipe['title'],
        'category'     => $recipe['category'],
        'time'         => $recipe['time'],
        'servings'     => $recipe['servings'],
        'notes'        => $recipe['notes'],
        'favorite'     => (bool)$recipe['favorite'],
        'createdAt'    => strtotime($recipe['created_at']) * 1000,
        'ingredients'  => $ingStmt->fetchAll(),
        'instructions' => array_map(fn($r) => $r['step_text'], $stepStmt->fetchAll()),
        'images'       => array_map(fn($r) => $r['url'], $imgStmt->fetchAll()),
    ];
}

function replace_ingredients(PDO $pdo, int $recipeId, array $ingredients): void {
    $del = $pdo->prepare('DELETE FROM ingredients WHERE recipe_id = :id');
    $del->execute(['id' => $recipeId]);

    $ins = $pdo->prepare(
        'INSERT INTO ingredients (recipe_id, qty, unit, name, sort_order)
         VALUES (:recipe_id, :qty, :unit, :name, :sort_order)'
    );
    $order = 0;
    foreach ($ingredients as $i) {
        $name = trim($i['name'] ?? '');
        if ($name === '') continue;
        $ins->execute([
            'recipe_id'  => $recipeId,
            'qty'        => $i['qty'] ?? '',
            'unit'       => $i['unit'] ?? '',
            'name'       => $name,
            'sort_order' => $order++,
        ]);
    }
}

function replace_instructions(PDO $pdo, int $recipeId, array $steps): void {
    $del = $pdo->prepare('DELETE FROM instructions WHERE recipe_id = :id');
    $del->execute(['id' => $recipeId]);

    $ins = $pdo->prepare(
        'INSERT INTO instructions (recipe_id, step_text, sort_order)
         VALUES (:recipe_id, :step_text, :sort_order)'
    );
    $order = 0;
    foreach ($steps as $s) {
        $text = trim($s ?? '');
        if ($text === '') continue;
        $ins->execute([
            'recipe_id'  => $recipeId,
            'step_text'  => $text,
            'sort_order' => $order++,
        ]);
    }
}

function replace_images(PDO $pdo, int $recipeId, array $images): void {
    $del = $pdo->prepare('DELETE FROM recipe_images WHERE recipe_id = :id');
    $del->execute(['id' => $recipeId]);

    $ins = $pdo->prepare(
        'INSERT INTO recipe_images (recipe_id, url, sort_order) VALUES (:recipe_id, :url, :sort_order)'
    );
    $order = 0;
    foreach ($images as $url) {
        $url = trim($url ?? '');
        if ($url === '') continue;
        $ins->execute([
            'recipe_id'  => $recipeId,
            'url'        => $url,
            'sort_order' => $order++,
        ]);
    }
}

function ensure_category(PDO $pdo, string $name, ?string $icon = null): void {
    $name = trim($name);
    if ($name === '') return;
    $stmt = $pdo->prepare('SELECT id, icon FROM categories WHERE name = :name');
    $stmt->execute(['name' => $name]);
    $existing = $stmt->fetch();

    if ($existing) {
        if ($icon !== null && $icon !== '' && empty($existing['icon'])) {
            $upd = $pdo->prepare('UPDATE categories SET icon = :icon WHERE id = :id');
            $upd->execute(['icon' => $icon, 'id' => $existing['id']]);
        }
        return;
    }

    $maxStmt = $pdo->prepare('SELECT MAX(sort_order) FROM categories');
    $maxStmt->execute();
    $maxOrder = (int)$maxStmt->fetchColumn();
    $ins = $pdo->prepare('INSERT INTO categories (name, icon, sort_order) VALUES (:name, :icon, :order)');
    $ins->execute(['name' => $name, 'icon' => ($icon !== '' ? $icon : null), 'order' => $maxOrder + 1]);
}
