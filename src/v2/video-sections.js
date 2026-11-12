const KEY='yozulife:video-sections:v1';
let sections=[];
try{const saved=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(saved))sections=saved.filter(s=>s&&typeof s.id==='string'&&typeof s.name==='string');}catch{}
export const getVideoSections=()=>sections;
export function addVideoSection(name){
 name=name.trim();if(!name)return null;
 const existing=sections.find(s=>s.name===name);if(existing)return existing;
 const section={id:crypto.randomUUID(),name};const next=[...sections,section];
 try{localStorage.setItem(KEY,JSON.stringify(next));sections=next;return section;}catch{alert('無法儲存分區，請確認瀏覽器儲存空間。');return null;}
}
