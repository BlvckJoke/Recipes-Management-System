// =============================================================
// api.js — talking to api.php, and the initial data load.
// =============================================================

const API_BASE = 'api.php';

async function apiCall(action, {method='GET', id=null, body=null} = {}){
  let url = `${API_BASE}?action=${encodeURIComponent(action)}`;
  if(id !== null) url += `&id=${encodeURIComponent(id)}`;
  const opts = { method };
  if(body !== null){
    opts.headers = { 'Content-Type': 'application/json' };
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  let data = null;
  try{ data = await res.json(); }catch(e){ /* no body */ }
  if(!res.ok) throw new Error((data && data.error) || `Request failed (${res.status})`);
  return data;
}

async function loadData(){
  try{
    recipes = await apiCall('list');
  }catch(e){
    console.error('Could not load recipes', e);
    recipes = [];
    alert('Could not reach the recipe database. Check that api.php is reachable and configured.');
  }
  try{
    const cats = await apiCall('categories_list');
    if(Array.isArray(cats) && cats.length){
      CATEGORIES = cats.map(c => c.name);
      categoryIcons = {};
      cats.forEach(c => { if(c.icon) categoryIcons[c.name] = c.icon; });
    }
  }catch(e){ console.error('Could not load categories', e); }
  try{
    const who = await apiCall('whoami');
    const chip = document.getElementById('userChip');
    if(chip) chip.innerHTML = `${who.username ? escapeHtml(who.username) : ''} <a href="logout.php">Log out</a>`;
  }catch(e){ /* not fatal */ }
  try{
    const s = await apiCall('shopping_get');
    shoppingList = (s.recipeIds || []).map(String);
    shopChecked = s.checked || {};
  }catch(e){
    console.error('Could not load shopping list', e);
    shoppingList = []; shopChecked = {};
  }
  render();
}
