import { storage } from './cloud-storage.js';
import {MAPS_KEY,MODES,validMap,mapsURL,mapPreviewURL,initializeMaps,filterMaps} from './maps-data.js';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderMapsSection(root){
  let items;
  try{items=initializeMaps(storage);}catch{root.innerHTML='<p role="alert">無法讀取或儲存地圖收藏。請確認瀏覽器儲存設定後再試。</p>';return;}
  let editingId=null,category='',query='';
  root.innerHTML=`<section class="maps-panel">
    <h3>地點與路線</h3>
    <form id="map-form" class="map-form">
      <label class="map-wide">查詢類型<select name="type"><option value="place">地點搜尋</option><option value="route">A 點到 B 點</option></select></label>
      <label id="map-origin-label" hidden>A 點：起點<input name="origin" maxlength="200" placeholder="輸入地名、地址或經緯度"></label>
      <label class="map-wide" id="map-destination-label">地點／地址<input name="destination" required maxlength="200" placeholder="例如：基隆醫院、台北車站"></label>
      <label id="map-mode-label" hidden>交通方式<select name="mode">${Object.entries(MODES).map(([v,n])=>`<option value="${v}">${n}</option>`).join('')}</select></label>
      <div class="map-form-actions map-wide"><button type="submit" class="tidy">查詢</button><a id="map-external" target="_blank" rel="noopener noreferrer" hidden>Google Maps 開啟 ↗</a><button type="button" id="map-swap" hidden>交換 A／B</button></div>
      <details class="map-wide" id="map-save-details"><summary>＋ 新增至我的地圖</summary><div class="map-save-fields">
        <label>收藏名稱<input name="title" maxlength="60" placeholder="可留空，使用地點或路線名稱"></label>
        <label>分類<input name="category" maxlength="30" list="map-categories" placeholder="例如：醫療、工作、美食"><datalist id="map-categories"></datalist></label>
        <label>備註<textarea name="note" rows="2" maxlength="1000"></textarea></label>
        <label>網站連結（選填）<input name="website" type="url" maxlength="2000" placeholder="https://…"></label>
        <label class="map-pin-label"><input name="pinned" type="checkbox">置頂這張地圖</label>
        <div class="map-form-actions"><button type="button" id="map-cancel" hidden>取消編輯</button><button type="submit" name="action" value="save" class="tidy" id="map-save">儲存地圖</button></div>
      </div></details>
    </form>
    <p id="map-message" role="status" aria-live="polite"></p>
    <div id="map-preview" hidden></div>
    <div class="map-collection-heading"><h3>我的地圖</h3><span id="map-total"></span></div>
    <label class="vh" for="map-search">搜尋我的地圖</label><input id="map-search" class="map-search" type="search" placeholder="搜尋收藏的地點、路線或備註">
    <div id="map-filters" class="chips" role="group" aria-label="地圖分類"></div>
    <div id="map-list"></div>
    <p class="medical-caption">地圖預覽由 Google 提供；A 到 B 的路線、時間與導航請開啟 Google Maps。收藏僅儲存於此瀏覽器。</p>
  </section>`;
  const $=s=>root.querySelector(s),form=$('#map-form'),field=n=>form.elements.namedItem(n),message=$('#map-message');
  function typeChanged(){
    const route=field('type').value==='route';
    $('#map-origin-label').hidden=!route;$('#map-mode-label').hidden=!route;$('#map-swap').hidden=!route;
    $('#map-destination-label').classList.toggle('map-wide',!route);field('origin').required=route;
    field('destination').placeholder=route?'B 點：輸入目的地':'例如：基隆醫院、台北車站';
    $('#map-external').hidden=true;
  }
  function read(){
    const type=field('type').value,origin=field('origin').value.trim(),destination=field('destination').value.trim();
    return {id:editingId||`map-${crypto.randomUUID()}`,type,origin:type==='route'?origin:'',destination,mode:field('mode').value,title:field('title').value.trim()||(type==='route'?`${origin} → ${destination}`:destination),category:field('category').value.trim()||'未分類',note:field('note').value.trim(),website:field('website').value.trim(),pinned:field('pinned').checked};
  }
  function preview(item){
    const external=$('#map-external');external.href=mapsURL(item);external.hidden=false;
    const area=$('#map-preview');area.hidden=false;
    area.innerHTML=`<div class="map-preview-heading"><strong>${esc(item.title)}</strong><a href="${esc(mapsURL(item))}" target="_blank" rel="noopener noreferrer">${item.type==='route'?'查看 A → B 完整路線':'Google Maps 開啟'} ↗</a></div>${item.type==='route'?`<p class="medical-caption">${esc(item.origin)} → ${esc(item.destination)} · ${MODES[item.mode]}<br>下方預覽目的地；請點上方連結查詢完整路線與行程時間。</p>`:''}<iframe title="${esc(item.title)} 地圖預覽" src="${esc(mapPreviewURL(item.destination))}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe><p class="medical-caption">預覽若無法載入，可直接開啟 Google Maps。</p>`;
  }
  function persist(next){try{storage.setItem(MAPS_KEY,JSON.stringify(next));items=next;return true;}catch{message.textContent='儲存失敗，請確認瀏覽器儲存空間後重試。';return false;}}
  function render(){
    const categories=[...new Set(items.map(i=>i.category))];
    if(category&&!categories.includes(category))category='';
    $('#map-categories').innerHTML=categories.map(c=>`<option value="${esc(c)}"></option>`).join('');
    $('#map-filters').innerHTML=['',...categories].map(c=>`<button type="button" class="chip" data-map-category="${esc(c)}" aria-pressed="${category===c}">${esc(c||'全部')}<small>${c?items.filter(i=>i.category===c).length:items.length}</small></button>`).join('');
    const visible=filterMaps(items,category,query);$('#map-total').textContent=`${items.length} 筆收藏`;
    $('#map-list').innerHTML=visible.length?visible.map(i=>`<article class="saved-map"><div class="saved-map-heading"><span class="visit-badge">${esc(i.category)} · ${i.type==='route'?'路線':'地點'}</span><button type="button" data-map-pin="${i.id}" aria-pressed="${i.pinned}" aria-label="${i.pinned?'取消置頂':'置頂'} ${esc(i.title)}"><i class="bi bi-pin${i.pinned?'-fill':''}" aria-hidden="true"></i>${i.pinned?' 已置頂':' 置頂'}</button></div><h4>${esc(i.title)}</h4><p>${i.type==='route'?`${esc(i.origin)} → `:''}${esc(i.destination)}${i.type==='route'?` · ${MODES[i.mode]}`:''}</p>${i.note?`<p class="saved-map-note">${esc(i.note)}</p>`:''}<div class="saved-map-actions"><button type="button" data-map-preview="${i.id}">查看地圖</button><a href="${esc(mapsURL(i))}" target="_blank" rel="noopener noreferrer">${i.type==='route'?'Google Maps 路線':'Google Maps'} ↗</a>${i.website?`<a href="${esc(i.website)}" target="_blank" rel="noopener noreferrer">官方網站 ↗</a>`:''}<button type="button" data-map-edit="${i.id}">編輯</button><button type="button" data-map-delete="${i.id}">刪除</button></div></article>`).join(''):`<p class="empty-search">${items.length?'找不到符合條件的地圖。':'還沒有收藏。搜尋地點或路線後，展開「新增至我的地圖」即可儲存。'}</p>`;
  }
  function resetEdit(){editingId=null;form.reset();$('#map-save').textContent='儲存地圖';$('#map-cancel').hidden=true;$('#map-save-details').open=false;typeChanged();}
  field('type').onchange=typeChanged;
  form.addEventListener('input',()=>{$('#map-external').hidden=true;});
  $('#map-swap').onclick=()=>{const start=field('origin').value;field('origin').value=field('destination').value;field('destination').value=start;$('#map-external').hidden=true;};
  $('#map-cancel').onclick=resetEdit;
  form.onsubmit=e=>{
    e.preventDefault();const item=read();
    if(!validMap(item)){message.textContent='請填寫地點；查詢路線時需同時填寫 A 點與 B 點。';return;}
    if(e.submitter?.value==='save'){
      const next=editingId?items.map(i=>i.id===editingId?item:i):[...items,item];
      if(persist(next)){resetEdit();render();message.textContent='地圖已儲存於此瀏覽器。';}
    }else{preview(item);message.textContent=item.type==='route'?'路線已準備好，點「Google Maps 開啟」查詢完整路線。':'已載入地點地圖。';}
  };
  $('#map-search').oninput=e=>{query=e.target.value;render();};
  root.addEventListener('click',e=>{
    const button=e.target.closest('[data-map-category],[data-map-pin],[data-map-preview],[data-map-edit],[data-map-delete]');if(!button)return;
    if(button.hasAttribute('data-map-category')){category=button.dataset.mapCategory;render();return;}
    const id=button.dataset.mapPin||button.dataset.mapPreview||button.dataset.mapEdit||button.dataset.mapDelete;
    const item=items.find(i=>i.id===id);if(!item)return;
    if(button.dataset.mapPin){if(persist(items.map(i=>i.id===id?{...i,pinned:!i.pinned}:i)))render();}
    if(button.dataset.mapPreview){preview(item);$('#map-preview').scrollIntoView({block:'start',behavior:'smooth'});}
    if(button.dataset.mapEdit){
      editingId=id;for(const key of ['type','origin','destination','mode','title','category','note','website'])field(key).value=item[key]||'';field('pinned').checked=item.pinned;
      typeChanged();$('#map-save-details').open=true;$('#map-cancel').hidden=false;$('#map-save').textContent='儲存變更';field('title').focus();
    }
    if(button.dataset.mapDelete&&confirm(`確定刪除「${item.title}」？`)){
      if(persist(items.filter(i=>i.id!==id))){if(editingId===id)resetEdit();render();message.textContent='已刪除地圖。';}
    }
  },{signal:(()=>{root._mapsController?.abort();root._mapsController=new AbortController();return root._mapsController.signal;})()});
  typeChanged();render();
}
