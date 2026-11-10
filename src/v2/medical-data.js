export const VISIT_KEY = 'yozulife:endocrinology:v1';
export const initialVisits = [{id:'visit-20261110',date:'2026-11-10',time:'',number:'61',status:'scheduled',note:''}];
export function taipeiDate(now=new Date()){
  return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
}
export function untilNextTaipeiDay(now=new Date()){
  return Date.parse(taipeiDate(now)+'T00:00:00+08:00')+86400000-now.getTime()+100;
}
export function validVisit(v){
  return v && typeof v.id==='string' && /^[a-zA-Z0-9-]+$/.test(v.id) &&
    typeof v.date==='string' && /^\d{4}-\d{2}-\d{2}$/.test(v.date) &&
    !Number.isNaN(Date.parse(v.date)) && new Date(v.date+'T00:00:00Z').toISOString().slice(0,10)===v.date &&
    typeof v.time==='string' && (!v.time || /^([01]\d|2[0-3]):[0-5]\d$/.test(v.time)) &&
    typeof v.number==='string' && /^\d{0,6}$/.test(v.number) &&
    ['scheduled','completed'].includes(v.status) && typeof v.note==='string';
}
export function loadVisits(storage){
  const raw=storage.getItem(VISIT_KEY);
  if(raw===null) return initialVisits.map(v=>({...v}));
  const visits=JSON.parse(raw);
  if(!Array.isArray(visits) || !visits.every(validVisit)) throw new Error('Invalid visit records');
  return visits;
}
export function splitVisits(visits,today){
  const upcoming=visits.filter(v=>v.status==='scheduled' && v.date>=today).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  const history=visits.filter(v=>v.status==='completed' || v.date<today).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));
  return {upcoming,history};
}
