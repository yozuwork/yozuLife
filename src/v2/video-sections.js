import { notify } from './ui.js';
import { storage } from './cloud-storage.js';
﻿const KEY='yozulife:video-sections:v1';
let sections=[];
try{const saved=JSON.parse(storage.getItem(KEY)||'[]');if(Array.isArray(saved))sections=saved.filter(s=>s&&typeof s.id==='string'&&typeof s.name==='string');}catch{}
export const getVideoSections=()=>sections;
export function addVideoSection(name){
 name=name.trim();if(!name)return null;
 const existing=sections.find(s=>s.name===name);if(existing)return existing;
 const section={id:crypto.randomUUID(),name};const next=[...sections,section];
 try{storage.setItem(KEY,JSON.stringify(next));sections=next;return section;}catch{notify('無法儲存分區，請確認同步狀態與瀏覽器空間。',true);return null;}
}
