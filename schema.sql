-- ============================================================
-- Recipe Box — database schema
-- MySQL / MariaDB
-- ============================================================

CREATE DATABASE IF NOT EXISTS recipe_box
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE recipe_box;

-- ---------- Recipes ----------
CREATE TABLE IF NOT EXISTS recipes (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(255)      NOT NULL,
  category    VARCHAR(50)       NOT NULL DEFAULT 'Other',
  time        VARCHAR(50)       DEFAULT NULL,
  servings    VARCHAR(20)       DEFAULT NULL,
  notes       TEXT,
  favorite    TINYINT(1)        NOT NULL DEFAULT 0,
  created_at  DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP
                                 ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_favorite (favorite)
) ENGINE=InnoDB;

-- ---------- Ingredients (one row per ingredient line) ----------
CREATE TABLE IF NOT EXISTS ingredients (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  recipe_id   INT UNSIGNED NOT NULL,
  qty         VARCHAR(50)  DEFAULT '',
  unit        VARCHAR(50)  DEFAULT '',
  name        VARCHAR(255) NOT NULL,
  sort_order  INT UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  INDEX idx_recipe (recipe_id)
) ENGINE=InnoDB;

-- ---------- Instructions (one row per step) ----------
CREATE TABLE IF NOT EXISTS instructions (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  recipe_id   INT UNSIGNED NOT NULL,
  step_text   TEXT NOT NULL,
  sort_order  INT UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  INDEX idx_recipe (recipe_id)
) ENGINE=InnoDB;

-- ---------- Shopping list: which recipes are currently added ----------
CREATE TABLE IF NOT EXISTS shopping_list (
  recipe_id   INT UNSIGNED PRIMARY KEY,
  added_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- Shopping list: checked-off state per combined ingredient ----------
-- item_key mirrors the frontend's "name|unit" combining key
CREATE TABLE IF NOT EXISTS shopping_checked (
  item_key    VARCHAR(255) PRIMARY KEY,
  checked     TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- ---------- Categories (dynamic — users can add their own) ----------
CREATE TABLE IF NOT EXISTS categories (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(50) NOT NULL UNIQUE,
  icon        VARCHAR(100) DEFAULT NULL,   -- Iconify icon id, e.g. "mdi:pizza"; NULL = use built-in icon
  sort_order  INT UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB;

INSERT IGNORE INTO categories (name, sort_order) VALUES
  ('Salads',1),('Soups',2),('Breakfast',3),('Poultry',4),('Fish',5),
  ('Meat',6),('Vegetables',7),('Appetizers',8),('Sauces',9),('Side Dishes',10),
  ('Casseroles',11),('Bakery',12),('Desserts',13),('Cakes',14),('Cookies',15),
  ('Snacks',16),('Drinks',17),('Pasta',18),('Jams',19),('Other',20);

-- ---------- Users (for login) ----------
CREATE TABLE IF NOT EXISTS users (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username       VARCHAR(50)  NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- Recipe photos (URL or uploaded file path), one-to-many ----------
CREATE TABLE IF NOT EXISTS recipe_images (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  recipe_id   INT UNSIGNED NOT NULL,
  url         VARCHAR(500) NOT NULL,
  sort_order  INT UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  INDEX idx_recipe (recipe_id)
) ENGINE=InnoDB;
