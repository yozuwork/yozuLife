import { VISIT_KEY, loadVisits, validVisit, splitVisits, taipeiDate, untilNextTaipeiDay } from './medical-data.js';

const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today = taipeiDate;
let stopDateRefresh = () => {};

export function renderMedicalSection(root){
  stopDateRefresh();
  let visits;
  try{ visits=loadVisits(localStorage); }catch{
    root.innerHTML='<section class="medical-panel"><h3>內分泌定期檢查專區</h3><p role="alert">無法讀取看診紀錄，請確認瀏覽器儲存設定後重新開啟。原有資料未被覆寫。</p></section>';
    return;
  }
  let editingId=null;
  root.innerHTML=`<section class="medical-panel" aria-labelledby="medical-title">
    <div class="medical-heading"><div><p class="medical-kicker">定期追蹤</p><h3 id="medical-title">內分泌定期檢查專區</h3></div><i class="bi bi-heart-pulse" aria-hidden="true"></i></div>
    <div class="medical-links"><a href="https://netreg.kln.mohw.gov.tw:8142/" target="_blank" rel="noopener noreferrer"><i class="bi bi-activity" aria-hidden="true"></i>看診進度查詢 ↗</a><a href="https://netreg.kln.mohw.gov.tw/QUERY" target="_blank" rel="noopener noreferrer"><i class="bi bi-calendar-check" aria-hidden="true"></i>掛號查詢 ↗</a></div>
    <p class="medical-caption">查詢將另開醫院網站；此處的看診紀錄由你自行填寫。看診日期過後，紀錄會自動移至歷史（以台灣時間為準）。</p>
    <div id="visit-upcoming"></div>
    <details id="visit-editor"><summary>＋ 新增看診紀錄</summary>
      <form id="visit-form" class="visit-form">
        <label>看診日期<input name="date" type="date" required></label>
        <label>看診時間（選填）<input name="time" type="time"></label>
        <label>看診號碼（選填）<input name="number" inputmode="numeric" pattern="[0-9]{1,6}" maxlength="6" placeholder="例如：61"></label>
        <label>狀態<select name="status"><option value="scheduled">預約／待看診</option><option value="completed">已完成看診</option></select></label>
        <label class="visit-note">備註（選填）<textarea name="note" maxlength="1000" rows="3" placeholder="醫師、診間或其他想記下的事"></textarea></label>
        <div class="visit-form-actions"><button type="button" id="visit-cancel">取消</button><button type="submit" class="tidy">儲存紀錄</button></div>
      </form>
    </details>
    <p id="visit-message" role="status" aria-live="polite"></p>
    <div id="visit-history"></div>
    <p class="medical-caption">紀錄僅儲存於此瀏覽器，尚未同步雲端。</p>
  </section>`;
  const form=root.querySelector('#visit-form'), editor=root.querySelector('#visit-editor'), message=root.querySelector('#visit-message');
  const card = v => `<article class="visit-card"><div><p class="visit-date">${escape(v.date.replaceAll('-',' / '))}${v.time?` <small>${escape(v.time)}</small>`:''}</p><p class="visit-number">${v.number?`看診號碼 <strong>${escape(v.number)}</strong> 號`:'尚未填寫看診號碼'}</p>${v.note?`<p class="visit-notes">${escape(v.note)}</p>`:''}<span class="visit-badge">${v.status==='completed'?'已完成':v.date<today()?'歷史預約':'預約／待看診'}</span></div><div class="visit-actions"><button type="button" data-edit="${v.id}">編輯</button><button type="button" data-remove="${v.id}">刪除</button></div></article>`;
  function render(){
    const {upcoming,history}=splitVisits(visits,today());
    root.querySelector('#visit-upcoming').innerHTML=`<h4>本次與下次看診</h4>${upcoming.length?upcoming.map(card).join(''):'<p class="medical-caption">尚未安排下次看診，可在下方新增紀錄。</p>'}`;
    root.querySelector('#visit-history').innerHTML=`<h4>歷史看診 <small>${history.length} 筆</small></h4>${history.length?history.map(card).join(''):'<p class="medical-caption">看診日期過後會自動歸入歷史；也可手動標記為已完成。</p>'}`;
  }
  function persist(next){
    try{localStorage.setItem(VISIT_KEY,JSON.stringify(next)); visits=next; return true;}
    catch{message.textContent='儲存失敗，請確認瀏覽器儲存空間後重試。';return false;}
  }
  function reset(){form.reset();editingId=null;editor.querySelector('summary').textContent='＋ 新增看診紀錄';editor.open=false;}
  root.querySelector('#visit-cancel').onclick=reset;
  root.onclick=e=>{
    const edit=e.target.closest('[data-edit]'), remove=e.target.closest('[data-remove]');
    if(edit){
      const visit=visits.find(v=>v.id===edit.dataset.edit); if(!visit) return;
      editingId=visit.id;
      for(const key of ['date','time','number','status','note']) form.elements.namedItem(key).value=visit[key];
      editor.querySelector('summary').textContent='編輯看診紀錄';editor.open=true;form.elements.namedItem('date').focus();
    }
    if(remove){
      const visit=visits.find(v=>v.id===remove.dataset.remove);if(!visit || !confirm(`確定刪除 ${visit.date} 的看診紀錄？`))return;
      if(persist(visits.filter(v=>v.id!==visit.id))){if(editingId===visit.id)reset();render();message.textContent='已刪除看診紀錄。';}
    }
  };
  form.onsubmit=e=>{
    e.preventDefault();
    const data=new FormData(form);
    const visit={id:editingId||`visit-${crypto.randomUUID()}`,date:data.get('date'),time:data.get('time'),number:data.get('number').trim(),status:data.get('status'),note:data.get('note').trim()};
    if(!validVisit(visit)){message.textContent='請確認日期、時間與看診號碼格式。';return;}
    const next=editingId?visits.map(v=>v.id===editingId?visit:v):[...visits,visit];
    if(persist(next)){reset();render();message.textContent='看診紀錄已儲存於此瀏覽器。';}
  };
  // Persist the initial visit once, so deleting every record remains an empty list.
  if(localStorage.getItem(VISIT_KEY)===null) persist(visits);
  render();
  let renderedDate=today(), timer;
  function refreshDate(){
    if(document.visibilityState==='hidden') return;
    const date=today();
    if(date!==renderedDate){renderedDate=date;render();}
    clearTimeout(timer);
    timer=setTimeout(refreshDate,untilNextTaipeiDay());
  }
  document.addEventListener('visibilitychange',refreshDate);
  window.addEventListener('focus',refreshDate);
  timer=setTimeout(refreshDate,untilNextTaipeiDay());
  stopDateRefresh=()=>{
    clearTimeout(timer);
    document.removeEventListener('visibilitychange',refreshDate);
    window.removeEventListener('focus',refreshDate);
  };
}
