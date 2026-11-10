// =============================================================
// main.js — top-level wiring and startup.
// =============================================================

document.getElementById('newRecipeBtn').addEventListener('click', ()=> openForm(null));
document.getElementById('emptyAddBtn').addEventListener('click', ()=> openForm(null));
document.getElementById('searchInput').addEventListener('input', (e)=>{
  searchTerm = e.target.value;
  if(searchTerm.trim() && currentFilter==='categories') currentFilter = 'all';
  render();
});

initShopping();

document.addEventListener('keydown', (e)=>{
  if(e.key==='Escape'){
    const catModalOverlay = document.getElementById('catModalOverlay');
    if(catModalOverlay.style.display==='flex'){ catModalOverlay.style.display='none'; catModalOverlay.innerHTML=''; }
    else if(formOverlay.style.display==='flex') closeForm();
    else if(detailOverlay.style.display==='flex') closeDetail();
    else if(shopPanel.classList.contains('open')) closeShop();
  }
});

loadData();
