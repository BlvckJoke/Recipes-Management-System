// =============================================================
// state.js — the app's shared, in-memory state.
// =============================================================

let recipes = [];
let shoppingList = []; // array of recipe ids
let shopChecked = {};  // key -> bool
let currentFilter = 'categories'; // 'categories' | 'all' | 'fav' | category name
let searchTerm = '';
let editingId = null;

// Recipe form (add/edit)
let formIngredients = [];
let formSteps = [];
let formImages = [];
let formUploading = false;

// Detail view: which ingredients the cook has checked off (resets each open)
let checkedIngredients = new Set();
