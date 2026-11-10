// =============================================================
// render-detail.js — the recipe detail modal, photo lightbox,
// and printing a single recipe.
// =============================================================

const detailOverlay = document.getElementById('detailOverlay');

function openLightbox(url){
  const lb = document.createElement('div');
  lb.className = 'lightbox-overlay';
  lb.innerHTML = `<img src="${escapeAttr(url)}" alt="Recipe photo">`;
  lb.addEventListener('click', ()=> lb.remove());
  document.body.appendChild(lb);
}

function openDetail(id){
  const r = findRecipe(id);
  if(!r) return;
  checkedIngredients = new Set();
  const cat = r.category || 'Other';

  const stats = [];
  if(r.time) stats.push(`<div class="stat"><b>${escapeHtml(r.time)}</b>&nbsp;time</div>`);
  if(r.servings) stats.push(`<div class="stat"><b>${escapeHtml(String(r.servings))}</b>&nbsp;servings</div>`);
  stats.push(`<div class="stat"><b>${(r.ingredients||[]).length}</b>&nbsp;ingredients</div>`);

  const ingHtml = (r.ingredients||[]).map((i,idx)=>
    `<li data-ing-idx="${idx}"><label>
       <input type="checkbox" data-ing-check="${idx}">
       <span class="q">${escapeHtml([i.qty,i.unit].filter(Boolean).join(' '))}</span><span>${escapeHtml(i.name)}</span>
     </label></li>`
  ).join('') || '<li style="color:var(--ink-soft); padding:8px 0;">No ingredients listed</li>';

  const stepsHtml = (r.instructions||[]).map(s=>`<li>${escapeHtml(s)}</li>`).join('') || '<li style="color:var(--ink-soft)">No steps listed</li>';

  const images = r.images || [];
  const heroHtml = images.length ? `
    ${imageBoxHtml(images[0], r.title, 'detail-hero')}
    ${images.length>1 ? `<div class="img-gallery" style="margin-bottom:18px;">${images.slice(1).map(u=>
      imageBoxHtml(u, '', 'img-thumb')).join('')}</div>` : ''}
  ` : '';

  const today = new Date().toLocaleDateString(undefined, { year:'numeric', month:'long', day:'numeric' });

  detailOverlay.innerHTML = `
    <div class="card-sheet detail">
      <div class="print-heading"><strong>The Recipe Box</strong><span>Printed ${escapeHtml(today)}</span></div>
      <button class="close-x" id="detailClose">&times;</button>
      <span class="detail-tab" style="background:${colorFor(cat)}">${escapeHtml(cat)}</span>
      <h1>${escapeHtml(r.title)}</h1>
      <div class="stat-row">${stats.join('')}</div>
      ${heroHtml}
      <div class="cols">
        <div class="ing-col">
          <div class="section-label">Ingredients</div>
          <ul class="ing-list">${ingHtml}</ul>
        </div>
        <div class="steps-col">
          <div class="section-label">Method</div>
          <ol class="steps-list">${stepsHtml}</ol>
          ${r.notes ? `<div class="notes-box">${escapeHtml(r.notes)}</div>` : ''}
        </div>
      </div>
      <div class="detail-actions">
        <button class="btn btn-herb" id="addToListBtn">+ Add to shopping list</button>
        <button class="btn btn-ghost" id="printBtn">🖨 Print</button>
        <button class="btn btn-ghost" id="editBtn">Edit</button>
        <button class="btn btn-danger" id="deleteBtn">Delete</button>
      </div>
    </div>`;
  detailOverlay.style.display='flex';

  document.getElementById('detailClose').addEventListener('click', closeDetail);
  detailOverlay.addEventListener('click', (e)=>{ if(e.target===detailOverlay) closeDetail(); }, {once:true});

  // Delegate photo clicks (hero + gallery thumbs) to the lightbox
  detailOverlay.querySelectorAll('.img-box[data-url]').forEach(box=>{
    box.addEventListener('click', ()=> openLightbox(box.dataset.url));
  });

  // Ingredient checkboxes — purely visual, resets each time the recipe is opened
  detailOverlay.querySelectorAll('[data-ing-check]').forEach(cb=>{
    cb.addEventListener('change', ()=>{
      const idx = cb.dataset.ingCheck;
      const li = cb.closest('li');
      if(cb.checked){ checkedIngredients.add(idx); li.classList.add('checked'); }
      else{ checkedIngredients.delete(idx); li.classList.remove('checked'); }
    });
  });

  document.getElementById('printBtn').addEventListener('click', ()=> window.print());

  document.getElementById('addToListBtn').addEventListener('click', async ()=>{
    if(shoppingList.includes(String(r.id))) return;
    shoppingList.push(String(r.id));
    renderShopBadge(); if(shopPanel.classList.contains('open')) renderShopPanel();
    try{ await apiCall('shopping_add', {method:'POST', id:r.id}); }
    catch(err){
      console.error(err);
      shoppingList = shoppingList.filter(id=>id!==String(r.id));
      renderShopBadge(); if(shopPanel.classList.contains('open')) renderShopPanel();
      alert('Could not add to shopping list.');
    }
  });
  document.getElementById('editBtn').addEventListener('click', ()=>{ closeDetail(); openForm(r.id); });
  document.getElementById('deleteBtn').addEventListener('click', async ()=>{
    if(!confirm(`Delete "${r.title}"? This can't be undone.`)) return;
    try{
      await apiCall('delete', {method:'POST', id:r.id});
      recipes = recipes.filter(x=>String(x.id)!==String(r.id));
      shoppingList = shoppingList.filter(id=>id!==String(r.id));
      closeDetail(); render(); renderShopBadge();
    }catch(err){
      console.error(err);
      alert('Could not delete this recipe.');
    }
  });
}
function closeDetail(){ detailOverlay.style.display='none'; detailOverlay.innerHTML=''; }
