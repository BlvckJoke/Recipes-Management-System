// =============================================================
// render-grid.js — sidebar tabs, category tiles, and the recipe grid.
// =============================================================

const grid = document.getElementById('grid');
const tabsEl = document.getElementById('tabs');
const emptyState = document.getElementById('emptyState');

function categories(){
  const set = new Set();
  recipes.forEach(r => set.add(r.category || 'Other'));
  return Array.from(set).sort();
}

function render(){
  renderTabs();
  if(currentFilter === 'categories'){
    renderCategoriesView();
  } else {
    renderGrid();
  }
  renderShopBadge();
}

function renderTabs(){
  const favCount = recipes.filter(r=>r.favorite).length;
  let html = `
    <button class="tab ${currentFilter==='categories'?'active':''}" data-f="categories">
      <span>Categories</span><span class="count">${categories().length}</span>
    </button>
    <button class="tab ${currentFilter==='all'?'active':''}" data-f="all">
      <span>All Recipes</span><span class="count">${recipes.length}</span>
    </button>
    <button class="tab ${currentFilter==='fav'?'active':''}" data-f="fav">
      <span>★ Favorites</span><span class="count">${favCount}</span>
    </button>`;
  tabsEl.innerHTML = html;
  tabsEl.querySelectorAll('.tab').forEach(btn=>{
    btn.addEventListener('click', ()=>{ currentFilter = btn.dataset.f; render(); });
  });
}

function renderCategoriesView(){
  grid.style.display = 'none';
  emptyState.style.display = 'none';
  let host = document.getElementById('catView');
  if(!host){
    host = document.createElement('div');
    host.id = 'catView';
    grid.parentNode.insertBefore(host, grid);
  }
  host.style.display='block';
  host.innerHTML = `<div class="cat-grid">${CATEGORIES.map(c=>{
    const n = recipes.filter(r=>(r.category||'Other')===c).length;
    return `<button class="cat-tile" data-cat="${escapeAttr(c)}">
      ${iconFor(c)}
      <span class="cat-label">${escapeHtml(c)}</span>
      <span class="cat-count">${n} recipe${n===1?'':'s'}</span>
    </button>`;
  }).join('')}
    <button class="cat-tile add-cat" id="addCategoryTile">
      <span class="plus">+</span>
      <span class="cat-label">New Category</span>
    </button>
  </div>`;
  host.querySelectorAll('.cat-tile[data-cat]').forEach(btn=>{
    btn.addEventListener('click', ()=>{ currentFilter = btn.dataset.cat; render(); });
  });
  document.getElementById('addCategoryTile').addEventListener('click', ()=> openCategoryModal());
}

function filteredRecipes(){
  let list = recipes.slice();
  if(currentFilter==='fav') list = list.filter(r=>r.favorite);
  else if(currentFilter!=='all' && currentFilter!=='categories') list = list.filter(r=>(r.category||'Other')===currentFilter);
  if(searchTerm.trim()){
    const t = searchTerm.trim().toLowerCase();
    list = list.filter(r=>{
      const inTitle = r.title.toLowerCase().includes(t);
      const inIng = (r.ingredients||[]).some(i=> i.name.toLowerCase().includes(t));
      const inNotes = (r.notes||'').toLowerCase().includes(t);
      return inTitle || inIng || inNotes;
    });
  }
  return list.sort((a,b)=> (b.createdAt||0)-(a.createdAt||0));
}

const PLACEHOLDER_THUMB_SVG = `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="14" width="48" height="36" rx="3"/><circle cx="22" cy="26" r="4"/><path d="M8 42l14-12 12 10 8-8 14 12"/></svg>`;

function renderGrid(){
  const catHost = document.getElementById('catView');
  if(catHost) catHost.style.display='none';

  let bc = document.getElementById('breadcrumb');
  const isSpecificCategory = currentFilter!=='all' && currentFilter!=='fav' && currentFilter!=='categories';
  if(isSpecificCategory){
    if(!bc){
      bc = document.createElement('button');
      bc.id = 'breadcrumb';
      bc.className = 'breadcrumb';
      grid.parentNode.insertBefore(bc, grid);
      bc.addEventListener('click', ()=>{ currentFilter='categories'; render(); });
    }
    bc.innerHTML = `← All Categories`;
    bc.style.display = 'flex';
  } else if(bc){
    bc.style.display = 'none';
  }

  const list = filteredRecipes();
  if(list.length===0){
    grid.style.display='none';
    emptyState.style.display='block';
    return;
  }
  grid.style.display='grid';
  emptyState.style.display='none';
  grid.innerHTML = list.map(r=>{
    const cat = r.category || 'Other';
    const ingCount = (r.ingredients||[]).length;
    const metaBits = [];
    if(r.time) metaBits.push(r.time);
    if(r.servings) metaBits.push(`serves ${r.servings}`);
    const snippetSrc = (r.ingredients||[]).slice(0,3).map(i=>i.name).join(', ');
    const cover = (r.images && r.images[0]) ? r.images[0] : null;
    const thumbHtml = cover
      ? imageBoxHtml(cover, r.title, 'thumb')
      : `<div class="thumb-placeholder">${PLACEHOLDER_THUMB_SVG}</div>`;
    return `
    <div class="rcard" data-id="${r.id}">
      ${thumbHtml}
      <button class="fav ${r.favorite?'':'off'}" data-fav="${r.id}" title="Toggle favorite">★</button>
      <div class="cat-chip" style="background:${colorFor(cat)}">${escapeHtml(cat)}</div>
      <div class="body">
        <h3>${escapeHtml(r.title)}</h3>
        <div class="meta">${metaBits.join(' · ') || '&nbsp;'}</div>
        <div class="snippet">${ingCount} ingredient${ingCount===1?'':'s'}${snippetSrc? ' — '+escapeHtml(snippetSrc)+(ingCount>3?'…':''):''}</div>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.rcard').forEach(card=>{
    card.addEventListener('click', (e)=>{
      if(e.target.closest('[data-fav]')) return;
      openDetail(card.dataset.id);
    });
  });
  grid.querySelectorAll('[data-fav]').forEach(btn=>{
    btn.addEventListener('click', async (e)=>{
      e.stopPropagation();
      const r = findRecipe(btn.dataset.fav);
      if(!r) return;
      const prev = r.favorite;
      r.favorite = !prev;
      render();
      try{ await apiCall('toggle_favorite', {method:'POST', id:r.id}); }
      catch(err){ console.error(err); r.favorite = prev; render(); alert('Could not update favorite status.'); }
    });
  });
}

// ---------------- Category creation modal (with Iconify icon search) ----------------
let modalSelectedIcon = '';
let iconSearchTimer = null;

function openCategoryModal(onCreated){
  modalSelectedIcon = '';
  const catModalOverlay = document.getElementById('catModalOverlay');
  catModalOverlay.innerHTML = `
    <div class="card-sheet cat-modal">
      <button class="close-x" id="catModalClose">&times;</button>
      <div class="section-label" style="margin-bottom:16px;">New Category</div>
      <div class="field full" style="margin-bottom:16px;">
        <label>Name</label>
        <input id="cm_name" type="text" placeholder="e.g. Grilling, Holiday Baking">
      </div>
      <label style="font-size:.78rem; font-weight:600; color:var(--ink-soft); display:block; margin-bottom:5px;">Icon (optional — searches a free icon library)</label>
      <div class="icon-search-wrap">
        <input id="cm_iconSearch" type="text" placeholder="Search icons… e.g. pizza, grill, cupcake">
      </div>
      <div class="selected-icon-preview" id="cm_preview">
        <span class="none-swatch">?</span>
        <span>No icon selected — a default will be used</span>
      </div>
      <div class="icon-results" id="cm_results">
        <div class="icon-status">Type above to search icons</div>
      </div>
      <div class="form-actions">
        <button class="btn btn-ghost" id="catModalCancel" type="button">Cancel</button>
        <button class="btn btn-accent" id="catModalSave" type="button">Create Category</button>
      </div>
    </div>`;
  catModalOverlay.style.display='flex';

  const close = ()=>{ catModalOverlay.style.display='none'; catModalOverlay.innerHTML=''; };
  document.getElementById('catModalClose').addEventListener('click', close);
  document.getElementById('catModalCancel').addEventListener('click', close);

  document.getElementById('cm_iconSearch').addEventListener('input', (e)=>{
    clearTimeout(iconSearchTimer);
    const q = e.target.value.trim();
    const results = document.getElementById('cm_results');
    if(!q){ results.innerHTML = `<div class="icon-status">Type above to search icons</div>`; return; }
    results.innerHTML = `<div class="icon-status">Searching…</div>`;
    iconSearchTimer = setTimeout(()=> searchIcons(q), 350);
  });

  document.getElementById('catModalSave').addEventListener('click', async ()=>{
    const name = document.getElementById('cm_name').value.trim();
    if(!name){ alert('Please give the category a name.'); return; }
    const saveBtn = document.getElementById('catModalSave');
    saveBtn.disabled = true; saveBtn.textContent = 'Creating…';
    try{
      const updated = await apiCall('category_add', {method:'POST', body:{name, icon: modalSelectedIcon}});
      CATEGORIES = updated.map(c=>c.name);
      categoryIcons = {};
      updated.forEach(c=>{ if(c.icon) categoryIcons[c.name] = c.icon; });
      close();
      if(onCreated) onCreated(name); else { currentFilter = name; render(); }
    }catch(err){
      console.error(err);
      alert('Could not create that category.');
      saveBtn.disabled = false; saveBtn.textContent = 'Create Category';
    }
  });
}

async function searchIcons(query){
  const results = document.getElementById('cm_results');
  if(!results) return;
  try{
    const res = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=48`);
    const data = await res.json();
    const icons = data.icons || [];
    if(!results.isConnected) return; // modal closed while fetching
    if(!icons.length){
      results.innerHTML = `<div class="icon-status">No icons found for "${escapeHtml(query)}"</div>`;
      return;
    }
    results.innerHTML = icons.map(id => `
      <div class="icon-opt ${id===modalSelectedIcon?'selected':''}" data-icon="${escapeAttr(id)}" title="${escapeAttr(id)}">
        <img src="${iconifyUrl(id, '221F1A', 32)}" alt="" loading="lazy">
      </div>`).join('');
    results.querySelectorAll('.icon-opt').forEach(el=>{
      el.addEventListener('click', ()=>{
        modalSelectedIcon = el.dataset.icon;
        results.querySelectorAll('.icon-opt').forEach(o=>o.classList.remove('selected'));
        el.classList.add('selected');
        const preview = document.getElementById('cm_preview');
        preview.innerHTML = `<img src="${iconifyUrl(modalSelectedIcon,'221F1A',32)}" alt=""><span>${escapeHtml(modalSelectedIcon)}</span>`;
      });
    });
  }catch(err){
    console.error(err);
    if(results.isConnected) results.innerHTML = `<div class="icon-status">Could not reach the icon search. Check your connection.</div>`;
  }
}
