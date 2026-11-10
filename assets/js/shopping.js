// =============================================================
// shopping.js — the combined shopping-list side panel.
// =============================================================

const shopPanel = document.getElementById('shopPanel');
const shopBackdrop = document.getElementById('shopBackdrop');
const shopBadge = document.getElementById('shopBadge');

function renderShopBadge(){ shopBadge.textContent = shoppingList.length; }

function combinedIngredients(){
  const map = {}; // key -> {qty totals or list, unit, name, count}
  shoppingList.forEach(rid=>{
    const r = findRecipe(rid);
    if(!r) return;
    (r.ingredients||[]).forEach(ing=>{
      const nameKey = ing.name.toLowerCase().trim();
      const unitKey = (ing.unit||'').toLowerCase().trim();
      const key = nameKey+'|'+unitKey;
      const qtyNum = parseFloat((ing.qty||'').replace(',', '.'));
      if(!map[key]) map[key] = { name: ing.name, unit: ing.unit, numeric: 0, hasNumeric:false, extras: [] };
      if(!isNaN(qtyNum) && ing.qty.trim() !== ''){
        map[key].numeric += qtyNum; map[key].hasNumeric = true;
      } else if(ing.qty.trim()){
        map[key].extras.push(ing.qty.trim());
      } else {
        map[key].extras.push('');
      }
    });
  });
  return Object.entries(map).map(([key,v])=>{
    let qtyDisplay = '';
    if(v.hasNumeric) qtyDisplay = (Number.isInteger(v.numeric)?v.numeric:v.numeric.toFixed(2).replace(/\.?0+$/,'')) + (v.unit?(' '+v.unit):'');
    if(v.extras.filter(Boolean).length){
      qtyDisplay = qtyDisplay ? qtyDisplay+' + '+v.extras.filter(Boolean).join(', ') : v.extras.filter(Boolean).join(', ');
    }
    return { key, name: v.name, qty: qtyDisplay || (v.unit||'') };
  }).sort((a,b)=> a.name.localeCompare(b.name));
}

function renderShopPanel(){
  const shopBody = document.getElementById('shopBody');
  if(shoppingList.length===0){
    shopBody.innerHTML = `<div class="shop-empty">Add recipes to build a combined shopping list.</div>`;
    return;
  }
  const chips = shoppingList.map(rid=>{
    const r = findRecipe(rid);
    if(!r) return '';
    return `<div class="shop-chip">${escapeHtml(r.title)}<button data-removeid="${r.id}">&times;</button></div>`;
  }).join('');
  const items = combinedIngredients();
  const itemsHtml = items.map(it=>{
    const checked = !!shopChecked[it.key];
    return `<label class="shop-item ${checked?'checked':''}">
      <input type="checkbox" data-key="${escapeAttr(it.key)}" ${checked?'checked':''}>
      <span class="q">${escapeHtml(it.qty)}</span><span>${escapeHtml(it.name)}</span>
    </label>`;
  }).join('') || `<div class="shop-empty">No ingredients found.</div>`;

  shopBody.innerHTML = `<div class="shop-recipes">${chips}</div><div>${itemsHtml}</div>`;

  shopBody.querySelectorAll('[data-removeid]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const rid = btn.dataset.removeid;
      shoppingList = shoppingList.filter(id=>id!==String(rid));
      renderShopBadge(); renderShopPanel();
      try{ await apiCall('shopping_remove', {method:'POST', id:rid}); }
      catch(err){ console.error(err); alert('Could not remove item from shopping list.'); }
    });
  });
  shopBody.querySelectorAll('[data-key]').forEach(cb=>{
    cb.addEventListener('change', async ()=>{
      const key = cb.dataset.key;
      shopChecked[key] = cb.checked;
      renderShopPanel();
      try{ await apiCall('shopping_check', {method:'POST', body:{key, checked:cb.checked}}); }
      catch(err){ console.error(err); alert('Could not save checklist state.'); }
    });
  });
}

function closeShop(){ shopPanel.classList.remove('open'); shopBackdrop.style.display='none'; }

function initShopping(){
  document.getElementById('shopFab').addEventListener('click', ()=>{
    shopPanel.classList.add('open'); shopBackdrop.style.display='block';
    renderShopPanel();
  });
  document.getElementById('shopClose').addEventListener('click', closeShop);
  shopBackdrop.addEventListener('click', closeShop);
  document.getElementById('clearShopBtn').addEventListener('click', async ()=>{
    if(!confirm('Clear the whole shopping list?')) return;
    const prevList = shoppingList, prevChecked = shopChecked;
    shoppingList = []; shopChecked = {}; renderShopBadge(); renderShopPanel();
    try{ await apiCall('shopping_clear', {method:'POST'}); }
    catch(err){
      console.error(err);
      shoppingList = prevList; shopChecked = prevChecked;
      renderShopBadge(); renderShopPanel();
      alert('Could not clear the shopping list.');
    }
  });
}
