// =============================================================
// utils.js — escaping, lookups, and the shared image-box markup.
// =============================================================

function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function escapeAttr(s){ return escapeHtml(s); }

function findRecipe(id){
  return recipes.find(x => String(x.id) === String(id));
}

/**
 * Renders a photo so the whole image is always visible — never
 * cropped. A blurred copy fills the frame as backdrop, and a sharp
 * copy sits on top scaled to fit ("contain").
 */
function imageBoxHtml(url, alt, extraClass=''){
  return `<div class="img-box ${extraClass}" data-url="${escapeAttr(url)}">
    <img class="img-box-bg" src="${escapeAttr(url)}" alt="" aria-hidden="true" loading="lazy">
    <img class="img-box-fg" src="${escapeAttr(url)}" alt="${escapeHtml(alt)}" loading="lazy">
  </div>`;
}
