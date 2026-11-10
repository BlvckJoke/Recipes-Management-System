// =============================================================
// config.js — categories, colors, and icon artwork.
// CATEGORIES is replaced with the server list once it loads.
// =============================================================

let CATEGORIES = ['Salads','Soups','Breakfast','Poultry','Fish','Meat','Vegetables','Appetizers',
  'Sauces','Side Dishes','Casseroles','Bakery','Desserts','Cakes','Cookies','Snacks',
  'Drinks','Pasta','Jams','Other'];

const PALETTE = ['#C1442C','#4B6B4E','#B98A2E','#3E6E8E','#8C4B77','#2F7C6E','#7A6338','#9C5237'];
function colorFor(cat){
  let h = 0;
  for(let i=0;i<cat.length;i++) h = (h*31 + cat.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

const ICON_STROKE = 'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';
const ICONS = {
  'Salads': `<svg viewBox="0 0 64 64" ${ICON_STROKE}><path d="M10 28c0-4 9-8 22-8s22 4 22 8"/><path d="M10 28c0 13 9 22 22 22s22-9 22-22"/><path d="M24 22c-2-6 1-11 6-12"/><path d="M32 21c0-6 3-10 8-11"/></svg>`,
  'Soups': `<svg viewBox="0 0 64 64" ${ICON_STROKE}><circle cx="26" cy="38" r="12"/><path d="M38 32 L52 12"/><path d="M52 12c3-3 8 2 5 5l-9 9"/></svg>`,
  'Breakfast': `<svg viewBox="0 0 64 64" ${ICON_STROKE}><path d="M26 14c-6 0-10 6-10 13 0 6 4 11 10 11s10-5 10-11c0-7-4-13-10-13Z"/><path d="M14 46c0-3 5-5 12-5s12 2 12 5"/><path d="M14 46h24"/></svg>`,
  'Poultry': `<svg viewBox="0 0 64 64" ${ICON_STROKE}><path d="M28 14c8 0 12 8 10 16-1 6-6 8-6 14 0 3 2 5 2 5h-14s2-2 2-5c0-6-6-9-6-16 0-8 4-14 12-14Z"/><ellipse cx="18" cy="50" rx="14" ry="4"/></svg>`,
  'Fish': `<svg viewBox="0 0 64 64" ${ICON_STROKE}><path d="M10 32c8-10 22-14 34-8-4 6-4 10 0 16-12 6-26 2-34-8Z"/><path d="M44 24l8-6v28l-8-6"/><circle cx="20" cy="30" r="1.4" fill="currentColor"/></svg>`,
  'Meat': `<svg viewBox="0 0 64 64" ${ICON_STROKE}><path d="M16 40c-4-8 0-18 10-22 9-3 18 2 20 11 2 8-3 15-11 17-3 8-14 10-19 4-3-3-2-7 0-10Z"/><path d="M22 26c3 0 6 2 8 5"/><path d="M28 20c3 0 6 2 8 5"/></svg>`,
  'Vegetables': `<svg viewBox="0 0 64 64" ${ICON_STROKE}><path d="M32 26c9 0 14 8 12 17-2 8-9 12-14 12s-11-5-12-13c-1-9 5-16 14-16Z"/><path d="M30 26c-2-6 0-11 3-14"/><path d="M34 26c1-5 4-9 8-11"/><path d="M27 24c-3-3-3-7-1-10"/></svg>`,
  'Appetizers': `<svg viewBox="0 0 64 64" ${ICON_STROKE}><path d="M22 10v18c0 4 3 6 3 6v22"/><path d="M18 10v10c0 3 2 5 4 5s4-2 4-5V10"/><path d="M22 10v15"/><path d="M44 10c-6 2-8 8-6 14 1 4 4 6 6 6v26"/><path d="M44 10c4 1 6 6 4 12" fill="none"/></svg>`,
  'Sauces': `<svg viewBox="0 0 64 64" ${ICON_STROKE}><path d="M10 30c6-2 34-2 42 2 2 8-6 16-20 16S9 40 10 30Z"/><path d="M40 26c4-4 10-4 12 0"/></svg>`,
  'Side Dishes': `<svg viewBox="0 0 64 64" ${ICON_STROKE}><path d="M10 32c0 11 10 18 22 18s22-7 22-18"/><path d="M10 32c0-3 2-6 5-7"/><circle cx="24" cy="26" r="3.4"/><circle cx="33" cy="23" r="3.4"/><circle cx="41" cy="27" r="3.4"/></svg>`,
  'Casseroles': `<svg viewBox="0 0 64 64" ${ICON_STROKE}><path d="M12 34h40c0 9-9 14-20 14s-20-5-20-14Z"/><path d="M10 34c0-3 2-5 5-5h34c3 0 5 2 5 5"/><path d="M24 24c2-3 5-4 8-4s6 1 8 4"/><circle cx="32" cy="18" r="2"/></svg>`,
  'Bakery': `<svg viewBox="0 0 64 64" ${ICON_STROKE}><path d="M12 38c0-10 9-18 20-18s20 8 20 18c-6 4-14 6-20 6s-14-2-20-6Z"/><path d="M22 26l4 8"/><path d="M32 23l4 9"/><path d="M42 26l3 8"/></svg>`,
  'Desserts': `<svg viewBox="0 0 64 64" ${ICON_STROKE}><path d="M22 30h20l-3 20a4 4 0 0 1-4 4H29a4 4 0 0 1-4-4l-3-20Z"/><path d="M32 30c0-6-6-6-6-11 0-3 3-5 6-5s6 2 6 5c0 5-6 5-6 11Z"/></svg>`,
  'Cakes': `<svg viewBox="0 0 64 64" ${ICON_STROKE}><rect x="18" y="30" width="28" height="14" rx="1"/><path d="M18 30l4-8h20l4 8"/><path d="M26 22v-6"/><path d="M34 22v-6"/><path d="M12 50c0-3 9-6 20-6s20 3 20 6"/></svg>`,
  'Cookies': `<svg viewBox="0 0 64 64" ${ICON_STROKE}><path d="M32 12c3 4 2 8-1 9 4-1 8 1 8 5 3-2 8 0 8 5 4 1 5 6 2 9 2 4-1 8-5 8 0 4-4 6-8 5-2 3-7 4-9 1-4 2-8 0-8-4-4 0-6-4-4-8-3-2-3-7 1-9-1-4 2-8 6-8 0-4 4-6 8-4 0-4 1-8 2-9Z"/><circle cx="28" cy="34" r="1.4" fill="currentColor"/><circle cx="37" cy="30" r="1.4" fill="currentColor"/><circle cx="36" cy="40" r="1.4" fill="currentColor"/></svg>`,
  'Snacks': `<svg viewBox="0 0 64 64" ${ICON_STROKE}><path d="M16 18l32 28"/><path d="M16 18c8-2 26 14 26 22"/><path d="M16 18l6 26 20 6"/><path d="M22 26l8 4"/><path d="M27 33l8 4"/></svg>`,
  'Drinks': `<svg viewBox="0 0 64 64" ${ICON_STROKE}><path d="M14 14h36l-18 20-18-20Z"/><path d="M32 34v18"/><path d="M22 52h20"/><circle cx="24" cy="18" r="2"/></svg>`,
  'Pasta': `<svg viewBox="0 0 64 64" ${ICON_STROKE}><path d="M32 32c-6-8-16-12-18-6-2 6 6 10 18 6Z"/><path d="M32 32c6-8 16-12 18-6 2 6-6 10-18 6Z"/><path d="M32 32c-6 8-16 12-18 6-2-6 6-10 18-6Z"/><path d="M32 32c6 8 16 12 18 6 2-6-6-10-18-6Z"/><circle cx="32" cy="32" r="2" fill="currentColor"/></svg>`,
  'Jams': `<svg viewBox="0 0 64 64" ${ICON_STROKE}><rect x="18" y="24" width="28" height="26" rx="2"/><rect x="22" y="14" width="20" height="10" rx="2"/><ellipse cx="32" cy="36" rx="7" ry="8"/></svg>`,
  'Other': `<svg viewBox="0 0 64 64" ${ICON_STROKE}><path d="M14 28h36v20a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2V28Z"/><path d="M14 28l4-10h28l4 10"/><path d="M24 18v10"/><path d="M40 18v10"/></svg>`
};
const GENERIC_ICON = `<svg viewBox="0 0 64 64" ${ICON_STROKE}><path d="M12 32 30 14a4 4 0 0 1 5.7 0L50 28.3a4 4 0 0 1 0 5.7L32 52a4 4 0 0 1-5.7 0L12 37.7a4 4 0 0 1 0-5.7Z"/><circle cx="24" cy="24" r="2.6" fill="currentColor"/></svg>`;

let categoryIcons = {}; // category name -> iconify id (only for custom-created categories)

function iconifyUrl(iconId, color='221F1A', size=64){
  return `https://api.iconify.design/${iconId}.svg?color=%23${color}&height=${size}`;
}
function iconFor(cat){
  const custom = categoryIcons[cat];
  if(custom) return `<img src="${iconifyUrl(custom)}" alt="" style="width:40px;height:40px;">`;
  return ICONS[cat] || GENERIC_ICON;
}
