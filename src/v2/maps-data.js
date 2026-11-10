export const MAPS_KEY='yozulife:maps:v1';
const HOSPITAL_SEED_KEY='yozulife:maps:tsgh-keelung-added';
export const KEELUNG_HOSPITAL={id:'map-tsgh-keelung-zhengrong',type:'place',title:'基隆三軍總醫院',destination:'基隆市中正區正榮街100號',origin:'',category:'醫療',note:'三軍總醫院基隆分院・正榮院區',mode:'driving',pinned:false,website:'https://wwwv.tsgh.ndmutsgh.edu.tw/unit/50000/32353'};
export function validWebsite(value){
  if(value===undefined||value==='')return true;
  if(typeof value!=='string')return false;
  try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)&&!url.username&&!url.password;}catch{return false;}
}
export const MODES={driving:'開車',transit:'大眾運輸',walking:'步行',bicycling:'自行車'};
export function validMap(item){
  return item && typeof item.id==='string' && /^[a-zA-Z0-9-]+$/.test(item.id) &&
    ['place','route'].includes(item.type) && ['title','category','destination','origin','note'].every(k=>typeof item[k]==='string') &&
    !!item.title.trim() && !!item.destination.trim() && (item.type!=='route'||!!item.origin.trim()) && Object.hasOwn(MODES,item.mode) && typeof item.pinned==='boolean' && validWebsite(item.website);
}
export function mapsURL(item){
  const url=new URL(item.type==='route'?'https://www.google.com/maps/dir/':'https://www.google.com/maps/search/');
  url.searchParams.set('api','1');
  if(item.type==='route'){
    url.searchParams.set('origin',item.origin);url.searchParams.set('destination',item.destination);url.searchParams.set('travelmode',item.mode);
  }else url.searchParams.set('query',item.destination);
  return url.href;
}
export function mapPreviewURL(query){
  const url=new URL('https://maps.google.com/maps');
  url.searchParams.set('q',query);url.searchParams.set('output','embed');url.searchParams.set('hl','zh-TW');
  return url.href;
}
export function loadMaps(storage){
  const raw=storage.getItem(MAPS_KEY);if(raw===null)return [];
  const items=JSON.parse(raw);
  if(!Array.isArray(items)||!items.every(validMap))throw new Error('Invalid maps');
  return items;
}
export function filterMaps(items,category,query){
  const q=query.trim().toLowerCase();
  return items.filter(i=>(!category||i.category===category)&&(!q||[i.title,i.category,i.origin,i.destination,i.note].join(' ').toLowerCase().includes(q))).sort((a,b)=>Number(b.pinned)-Number(a.pinned));
}
export function initializeMaps(storage){
  const items=loadMaps(storage);
  if(storage.getItem(HOSPITAL_SEED_KEY)==='1')return items;
  const next=items.some(i=>i.id===KEELUNG_HOSPITAL.id)?items:[...items,{...KEELUNG_HOSPITAL}];
  storage.setItem(MAPS_KEY,JSON.stringify(next));
  storage.setItem(HOSPITAL_SEED_KEY,'1');
  return next;
}
