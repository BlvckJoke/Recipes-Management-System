// =============================================================
// form.js — the add/edit recipe form.
// =============================================================

const formOverlay = document.getElementById('formOverlay');

function blankRecipe(){
  return { id: null,
    title:'', category:'', time:'', servings:'', ingredients:[{qty:'',unit:'',name:''}],
    instructions:[''], notes:'', favorite:false, images:[], createdAt: Date.now() };
}

function openForm(id){
  editingId = id || null;
  const source = id ? findRecipe(id) : blankRecipe();
  formIngredients = (source.ingredients && source.ingredients.length ? source.ingredients : [{qty:'',unit:'',name:''}]).map(i=>({...i}));
  formSteps = (source.instructions && source.instructions.length ? source.instructions : ['']).slice();
  formImages = (source.images || []).slice();
  formUploading = false;

  // A recipe always needs a real category selected — fall back to the
  // first known category rather than leaving the dropdown unmatched.
  const selectedCategory = source.category || CATEGORIES[0];

  formOverlay.innerHTML = `
    <div class="card-sheet">
      <button class="close-x" id="formClose">&times;</button>
      <div class="section-label" style="margin-bottom:16px;">${id?'Edit Recipe':'New Recipe'}</div>
      <div class="form-grid">
        <div class="field full">
          <label>Title</label>
          <input id="f_title" type="text" placeholder="e.g. Grandma's Sunday Ragu" value="${escapeAttr(source.title)}">
        </div>
        <div class="field">
          <label>Category</label>
          <select id="f_category">
            ${CATEGORIES.map(c=>
              `<option value="${c}" ${selectedCategory===c?'selected':''}>${c}</option>`).join('')}
            <option value="__new__">+ New category…</option>
          </select>
        </div>
        <div class="field">
          <label>Time</label>
          <input id="f_time" type="text" placeholder="e.g. 45 min" value="${escapeAttr(source.time)}">
        </div>
        <div class="field">
          <label>Servings</label>
          <input id="f_servings" type="text" placeholder="e.g. 4" value="${escapeAttr(String(source.servings||''))}">
        </div>
      </div>

      <div class="section-label">Photos</div>
      <div class="img-gallery" id="imgGallery"></div>
      <div class="img-add-row">
        <input id="f_imgUrl" type="text" placeholder="Paste an image URL…">
        <button class="add-row-btn" id="addImgUrlBtn" type="button">+ Add URL</button>
        <label class="file-btn">
          📁 Upload photos (batch)
          <input id="f_imgFiles" type="file" accept="image/*" multiple>
        </label>
      </div>

      <div class="section-label">Ingredients</div>
      <div class="row-list" id="ingRows"></div>
      <button class="add-row-btn" id="addIngBtn" type="button">+ Add ingredient</button>

      <div class="section-label" style="margin-top:20px;">Method</div>
      <div class="row-list" id="stepRows"></div>
      <button class="add-row-btn" id="addStepBtn" type="button">+ Add step</button>

      <div class="field full" style="margin-top:18px;">
        <label>Notes</label>
        <textarea id="f_notes" placeholder="Any tips, substitutions, or memories attached to this one…">${escapeHtml(source.notes||'')}</textarea>
      </div>

      <div class="form-actions">
        <button class="btn btn-ghost" id="cancelFormBtn" type="button">Cancel</button>
        <button class="btn btn-accent" id="saveFormBtn" type="button">Save Recipe</button>
      </div>
    </div>`;
  formOverlay.style.display='flex';
  renderIngRows();
  renderStepRows();
  renderImgGallery();

  document.getElementById('formClose').addEventListener('click', closeForm);
  document.getElementById('cancelFormBtn').addEventListener('click', closeForm);
  document.getElementById('addIngBtn').addEventListener('click', ()=>{ formIngredients.push({qty:'',unit:'',name:''}); renderIngRows(); });
  document.getElementById('addStepBtn').addEventListener('click', ()=>{ formSteps.push(''); renderStepRows(); });
  document.getElementById('saveFormBtn').addEventListener('click', ()=> saveForm(source));

  document.getElementById('f_category').addEventListener('change', (e)=>{
    if(e.target.value !== '__new__') return;
    const select = e.target;
    select.value = selectedCategory; // revert until a name is actually saved
    openCategoryModal((newName)=>{
      let opt = Array.from(select.options).find(o=>o.value===newName);
      if(!opt){
        opt = document.createElement('option');
        opt.value = newName; opt.textContent = newName;
        select.insertBefore(opt, select.lastElementChild);
      }
      select.value = newName;
    });
  });

  document.getElementById('addImgUrlBtn').addEventListener('click', ()=>{
    const input = document.getElementById('f_imgUrl');
    const url = input.value.trim();
    if(!url) return;
    formImages.push(url);
    input.value = '';
    renderImgGallery();
  });

  document.getElementById('f_imgFiles').addEventListener('change', async (e)=>{
    const files = Array.from(e.target.files || []);
    if(!files.length) return;
    const fd = new FormData();
    files.forEach(f => fd.append('images[]', f));
    const label = e.target.closest('.file-btn');
    const originalText = label.firstChild.textContent;
    const saveBtn = document.getElementById('saveFormBtn');
    formUploading = true;
    label.firstChild.textContent = ' Uploading…';
    if(saveBtn){ saveBtn.disabled = true; saveBtn.dataset.origText = saveBtn.textContent; saveBtn.textContent = 'Uploading photos…'; }
    try{
      const res = await fetch('upload.php', {method:'POST', body: fd});
      const data = await res.json();
      if(!res.ok) throw new Error(data.error || 'Upload failed');
      formImages.push(...(data.urls || []));
      if(data.errors && data.errors.length) alert('Some files were skipped:\n' + data.errors.join('\n'));
      renderImgGallery();
    }catch(err){
      console.error(err);
      alert('Could not upload those photos. Check that the "uploads" folder exists and is writable on the server.');
    }finally{
      formUploading = false;
      label.firstChild.textContent = originalText;
      e.target.value = '';
      if(saveBtn){ saveBtn.disabled = false; saveBtn.textContent = saveBtn.dataset.origText || 'Save Recipe'; }
    }
  });
}
function closeForm(){ formOverlay.style.display='none'; formOverlay.innerHTML=''; editingId=null; }

function renderImgGallery(){
  const wrap = document.getElementById('imgGallery');
  if(!wrap) return;
  wrap.innerHTML = formImages.map((url,idx)=>{
    const box = imageBoxHtml(url, '', 'img-thumb');
    // splice in the remove button just before the closing </div>
    return box.replace('</div>', `<button class="img-remove" data-remove-img="${idx}" type="button">&times;</button></div>`);
  }).join('');
  wrap.querySelectorAll('[data-remove-img]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      formImages.splice(+btn.dataset.removeImg, 1);
      renderImgGallery();
    });
  });
}

function renderIngRows(){
  const wrap = document.getElementById('ingRows');
  wrap.innerHTML = formIngredients.map((ing,idx)=>`
    <div class="ing-row" data-idx="${idx}">
      <input class="ing-qty" placeholder="qty" value="${escapeAttr(ing.qty)}">
      <input class="ing-unit" placeholder="unit" value="${escapeAttr(ing.unit)}">
      <input class="ing-name" placeholder="ingredient name" value="${escapeAttr(ing.name)}">
      <button class="row-x" data-remove="${idx}" type="button">&times;</button>
    </div>`).join('');
  wrap.querySelectorAll('.ing-row').forEach(row=>{
    const idx = +row.dataset.idx;
    row.querySelector('.ing-qty').addEventListener('input', e=> formIngredients[idx].qty = e.target.value);
    row.querySelector('.ing-unit').addEventListener('input', e=> formIngredients[idx].unit = e.target.value);
    row.querySelector('.ing-name').addEventListener('input', e=> formIngredients[idx].name = e.target.value);
  });
  wrap.querySelectorAll('[data-remove]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      formIngredients.splice(+btn.dataset.remove,1);
      if(formIngredients.length===0) formIngredients.push({qty:'',unit:'',name:''});
      renderIngRows();
    });
  });
}
function renderStepRows(){
  const wrap = document.getElementById('stepRows');
  wrap.innerHTML = formSteps.map((s,idx)=>`
    <div class="step-row" data-idx="${idx}">
      <span>${idx+1}.</span>
      <textarea placeholder="Describe this step…">${escapeHtml(s)}</textarea>
      <button class="row-x" data-remove="${idx}" type="button">&times;</button>
    </div>`).join('');
  wrap.querySelectorAll('.step-row').forEach(row=>{
    const idx = +row.dataset.idx;
    row.querySelector('textarea').addEventListener('input', e=> formSteps[idx] = e.target.value);
  });
  wrap.querySelectorAll('[data-remove]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      formSteps.splice(+btn.dataset.remove,1);
      if(formSteps.length===0) formSteps.push('');
      renderStepRows();
    });
  });
}

async function saveForm(source){
  if(formUploading){ alert('Still uploading photos — please wait a moment and try Save again.'); return; }
  const title = document.getElementById('f_title').value.trim();
  if(!title){ alert('Please give the recipe a title.'); return; }
  const payload = {
    id: editingId,
    title,
    category: document.getElementById('f_category').value,
    time: document.getElementById('f_time').value.trim(),
    servings: document.getElementById('f_servings').value.trim(),
    ingredients: formIngredients.filter(i=>i.name.trim()).map(i=>({qty:i.qty.trim(),unit:i.unit.trim(),name:i.name.trim()})),
    instructions: formSteps.map(s=>s.trim()).filter(Boolean),
    images: formImages.slice(),
    notes: document.getElementById('f_notes').value.trim(),
    favorite: source.favorite || false
  };

  const saveBtn = document.getElementById('saveFormBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving…';
  try{
    const saved = await apiCall('save', {method:'POST', body: payload});
    if(editingId){
      const i = recipes.findIndex(r=>String(r.id)===String(editingId));
      if(i>-1) recipes[i] = saved; else recipes.push(saved);
    } else {
      recipes.push(saved);
    }
    closeForm();
    render();
  }catch(err){
    console.error(err);
    alert('Could not save this recipe. Please try again.');
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Recipe';
  }
}
