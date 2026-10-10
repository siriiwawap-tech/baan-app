/* 🏠 Local data layer (localStorage) – replaces Code.gs / google.script.run */
const LS_KEY='homeManager.v1';
const DEFAULT_LISTS={
  'ที่เก็บ':['ตู้เย็นเทา','ตู้เย็นดำ','ตู้กับข้าว/ของแห้ง','ห้องน้ำ','อุปกรณ์ซักผ้า'],
  'หมวดรายจ่าย':['อาหารสด','ของแห้ง','ของใช้ห้องน้ำ','ซักผ้า','ค่าน้ำดื่ม','ค่าไฟ','ค่าเน็ต','เดินทาง','ชำระหนี้','อื่นๆ'],
  'หมวดรายรับ':['เงินเดือน','รายได้เสริม','โบนัส','ดอกเบี้ย/ปันผล','รายรับอื่นๆ'],
  'วิธีชำระ':['เงินสด','โอน/พร้อมเพย์','บัตรเดบิต','บัตรเครดิต','e-Wallet'],
  'หน่วย':['ชิ้น','แพ็ค','ขวด','กล่อง','ถุง','ฟอง','กก.','ถ้วย','ม้วน'],
  'ประเภทการออม':['เงินออม','เงินสำรองฉุกเฉิน','กองทุนรวม','หุ้น','ทองคำ','คริปโต','ประกันสะสมทรัพย์','อื่นๆ'],
  'ความถี่':['รายวัน','รายสัปดาห์','รายเดือน','ครั้งเดียว'],
  'หมวดงานบ้าน':['ทำความสะอาด','ครัว','ซักรีด','ขยะ','สวน/ต้นไม้','อื่นๆ'],
  'สมาชิกในบ้าน':['ทุกคน','พ่อ','แม่','ลูก'],
  'ประเภทบิล':['ค่าน้ำดื่ม','ค่าไฟ','ค่าเน็ต'],
  'ประเภทหนี้':['บัตรเครดิต','สินเชื่อบุคคล','ผ่อนรถ','ผ่อนบ้าน','ยืมคนรู้จัก','อื่นๆ']
};
const DEFAULT_SETTINGS={budget:[50,30,20],efMonths:6,billDay:15,
  needCats:['อาหารสด','ของแห้ง','ของใช้ห้องน้ำ','ซักผ้า','ค่าน้ำดื่ม','ค่าไฟ','ค่าเน็ต','เดินทาง']};
const LOCATION_TO_CATEGORY={'ตู้เย็นเทา':'อาหารสด','ตู้เย็นดำ':'อาหารสด','ตู้กับข้าว/ของแห้ง':'ของแห้ง','ห้องน้ำ':'ของใช้ห้องน้ำ','อุปกรณ์ซักผ้า':'ซักผ้า'};
const TABLES=['led','inv','menu','todo','shop','util','sav','debt','debtlog'];

function emptyDB(){const d={v:1,seq:1,lists:JSON.parse(JSON.stringify(DEFAULT_LISTS)),settings:JSON.parse(JSON.stringify(DEFAULT_SETTINGS))};TABLES.forEach(t=>d[t]=[]);return d;}
let DB=(()=>{try{const d=JSON.parse(localStorage.getItem(LS_KEY));if(d&&d.v){TABLES.forEach(t=>d[t]=d[t]||[]);d.lists=Object.assign({},DEFAULT_LISTS,d.lists||{});d.settings=Object.assign({},DEFAULT_SETTINGS,d.settings||{});return d;}}catch(e){}return emptyDB();})();
function persist(){try{localStorage.setItem(LS_KEY,JSON.stringify(DB));}catch(e){alert('บันทึกไม่สำเร็จ (พื้นที่เต็ม?) '+e.message);throw e;}}
const newId=()=>DB.seq++;
const num_=v=>{const n=Number(v);return isNaN(n)?0:n;};
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const pd=s=>{const [y,m,d]=String(s).split('-').map(Number);return new Date(y,(m||1)-1,d||1);};
const todayStr_=()=>ymd(new Date());
const dayDiff=(a,b)=>Math.round((pd(a)-pd(b))/864e5);
const find=(t,id)=>DB[t].find(x=>x._row===Number(id));
const clone=o=>JSON.parse(JSON.stringify(o));
function nextDue_(freq,fromStr){const d=pd(fromStr);
  if(freq==='รายวัน')d.setDate(d.getDate()+1);else if(freq==='รายสัปดาห์')d.setDate(d.getDate()+7);
  else if(freq==='รายเดือน')d.setMonth(d.getMonth()+1);else return null;return ymd(d);}
function mondayStr(s){const t=pd(s);t.setDate(t.getDate()-((t.getDay()+6)%7));return ymd(t);}

/* ---------- computed status (formerly sheet formulas) ---------- */
function invStatus(r){const t=todayStr_();const q=num_(r['จำนวน']);
  if(r['วันหมดอายุ']&&r['วันหมดอายุ']<t)return 'หมดอายุ';
  if(r['จำนวน']!==''&&q<=0)return 'หมดสต็อก';
  if(r['วันหมดอายุ']&&dayDiff(r['วันหมดอายุ'],t)<=3)return 'ใกล้หมดอายุ';
  if(r['สต็อกขั้นต่ำ']!==''&&r['สต็อกขั้นต่ำ']!=null&&q<=num_(r['สต็อกขั้นต่ำ']))return 'ใกล้หมด';
  return 'ปกติ';}
function decInv(r){const o=clone(r);o['สถานะ']=invStatus(r);o['เหลือ (วัน)']=r['วันหมดอายุ']?dayDiff(r['วันหมดอายุ'],todayStr_()):'';return o;}
function todoStatus(r){const t=todayStr_();if(r['เสร็จแล้ว'])return 'เสร็จแล้ว';if(!r['กำหนดทำ'])return 'รอทำ';
  return r['กำหนดทำ']<t?'เกินกำหนด':r['กำหนดทำ']===t?'วันนี้':'รอทำ';}
function billStatus(r){const t=todayStr_();if(r['ชำระแล้ว'])return 'ชำระแล้ว';if(!r['วันครบกำหนด'])return 'รอชำระ';
  if(r['วันครบกำหนด']<t)return 'เกินกำหนด';return dayDiff(r['วันครบกำหนด'],t)<=3?'ใกล้ครบกำหนด':'รอชำระ';}
function decShop(r){const o=clone(r);o['รวมประมาณ']=r['ราคาประมาณ/หน่วย']===''||r['ราคาประมาณ/หน่วย']==null?'':num_(r['จำนวน'])*num_(r['ราคาประมาณ/หน่วย']);return o;}
function debtCalc(d){const pays=DB.debtlog.filter(p=>p['เจ้าหนี้ที่จ่าย']===d['เจ้าหนี้']);
  const principalPaid=pays.reduce((s,p)=>s+Math.max(0,num_(p['จำนวนที่จ่าย'])-num_(p['ส่วนดอกเบี้ย'])),0);
  const remain=Math.max(0,num_(d['เงินต้นเริ่มต้น'])-principalPaid);const rate=num_(d['ดอกเบี้ย (%/ปี)'])/100/12;const pay=num_(d['ค่างวด/เดือน']);
  let n='';if(remain<=0)n=0;else if(pay>0){if(rate>0){n=pay<=remain*rate?'∞':Math.ceil(-Math.log(1-remain*rate/pay)/Math.log(1+rate));}else n=Math.ceil(remain/pay);}
  const o=clone(d);Object.assign(o,{'จ่ายแล้วรวม':pays.reduce((s,p)=>s+num_(p['จำนวนที่จ่าย']),0),'เงินต้นที่จ่ายแล้ว':principalPaid,'เงินต้นคงเหลือ':Math.round(remain*100)/100,
    'ดอกเบี้ยเดือนหน้า (ประมาณ)':Math.round(remain*rate*100)/100,'งวดที่เหลือ (ประมาณ)':n,'สถานะ':remain<=0?'ปิดหนี้แล้ว':'กำลังผ่อน'});return o;}
function savBalances(){const m=todayStr_().slice(0,7);const by={};
  DB.sav.forEach(s=>{const k=s['ประเภท']||'อื่นๆ';by[k]=by[k]||[k,0,0];const v=(s['ฝาก/ถอน']==='ถอน'?-1:1)*num_(s['จำนวนเงิน (บาท)']);by[k][1]+=v;if(String(s['วันที่']).startsWith(m))by[k][2]+=v;});
  const arr=Object.values(by);const tot=['รวมทั้งหมด',arr.reduce((s,a)=>s+a[1],0),arr.reduce((s,a)=>s+a[2],0)];return arr.concat([tot]);}

/* ---------- maintenance ---------- */
function maintenance(){const t=todayStr_();let ch=false;
  DB.todo.forEach(r=>{if(r['เสร็จแล้ว']&&['รายวัน','รายสัปดาห์','รายเดือน'].includes(r['ความถี่'])&&r['กำหนดทำ']&&r['กำหนดทำ']<=t){r['เสร็จแล้ว']=false;ch=true;}});
  // สร้างบิลประจำเดือนนี้ + เดือนหน้าอัตโนมัติ
  const now=new Date();[0,1].forEach(k=>{const mo=ymd(new Date(now.getFullYear(),now.getMonth()+k,1));
    (DB.lists['ประเภทบิล']||[]).forEach(bt=>{if(!DB.util.some(b=>b['เดือน']===mo&&b['ประเภทบิล']===bt)){
      const dd=new Date(now.getFullYear(),now.getMonth()+k,Math.min(28,num_(DB.settings.billDay)||15));
      DB.util.push({_row:newId(),'เดือน':mo,'ประเภทบิล':bt,'ผู้ให้บริการ':'','จำนวนเงิน (บาท)':'','วันครบกำหนด':ymd(dd),'ชำระแล้ว':false,'วันที่ชำระ':'','หมายเหตุ':''});ch=true;}});});
  if(ch)persist();}

/* ---------- API (same names as Code.gs) ---------- */
const LOCAL={
  getInit(){maintenance();return {lists:DB.lists,today:todayStr_(),settings:DB.settings};},
  getDashboard(){const t=todayStr_(),m=t.slice(0,7),wk=mondayStr(t);const L=DB.led;
    const sum=(f,type)=>L.filter(r=>r['ประเภท']===type&&f(r['วันที่'])).reduce((s,r)=>s+num_(r['จำนวนเงิน (บาท)']),0);
    const inc=sum(d=>d.startsWith(m),'รายรับ'),exp=sum(d=>d.startsWith(m),'รายจ่าย');
    const wexp=sum(d=>d>=wk&&d<=t,'รายจ่าย'),dexp=sum(d=>d===t,'รายจ่าย');
    const sb=savBalances(),tot=sb[sb.length-1];const debts=DB.debt.map(debtCalc);
    const debtRemain=debts.reduce((s,d)=>s+d['เงินต้นคงเหลือ'],0),debtPay=debts.filter(d=>d['เงินต้นคงเหลือ']>0).reduce((s,d)=>s+num_(d['ค่างวด/เดือน']),0);
    const B=x=>Number(x).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2})+' ฿';
    const kpi=[['รายรับเดือนนี้',B(inc)],['รายจ่ายเดือนนี้',B(exp)],['คงเหลือเดือนนี้',B(inc-exp)],['รายจ่ายสัปดาห์นี้',B(wexp)],['รายจ่ายวันนี้',B(dexp)],
      ['เงินออม/ลงทุนสะสม',B(tot[1])],['ออมเดือนนี้',B(tot[2])],['อัตราการออม',inc?(tot[2]/inc*100).toFixed(1)+'%':'-'],['หนี้คงเหลือรวม',B(debtRemain)],['ค่างวดต่อเดือน',B(debtPay)]];
    const low=DB.inv.map(decInv).filter(r=>r['สถานะ']!=='ปกติ').map((r,i)=>[String(i+1),r['รายการ'],r['ที่เก็บ'],(r['จำนวน']??'')+' '+(r['หน่วย']||''),r['สถานะ']]).slice(0,10);
    const cm={};L.filter(r=>r['ประเภท']==='รายจ่าย'&&r['วันที่'].startsWith(m)).forEach(r=>cm[r['หมวดหมู่']]=(cm[r['หมวดหมู่']]||0)+num_(r['จำนวนเงิน (บาท)']));
    const cats=Object.entries(cm).sort((a,b)=>b[1]-a[1]);
    const soon=ymd(new Date(Date.now()+7*864e5));
    const bills=LOCAL.getBills(true).filter(b=>!b['ชำระแล้ว']&&b['วันครบกำหนด']&&b['วันครบกำหนด']<=soon).slice(0,8);
    const todos=LOCAL.getTodos().filter(x=>x['สถานะ']==='วันนี้'||x['สถานะ']==='เกินกำหนด');
    return {kpi,low,cats,bills,todos,menu:LOCAL.getMenu(t,1)[0],today:t};},
  addLedger(e){if(!e||!num_(e.amount))throw new Error('กรุณาใส่จำนวนเงิน');const id=newId();
    DB.led.push({_row:id,'วันที่':e.date||todayStr_(),'ประเภท':e.type||'รายจ่าย','หมวดหมู่':e.category||'อื่นๆ','รายการ':e.item||'','จำนวนเงิน (บาท)':num_(e.amount),'วิธีชำระ':e.method||'','หมายเหตุ':e.note||''});persist();return {ok:true,row:id};},
  getLedger(limit){return clone(DB.led).sort((a,b)=>String(b['วันที่']).localeCompare(String(a['วันที่']))||b._row-a._row).slice(0,limit||30);},
  deleteLedger(row){DB.led=DB.led.filter(x=>x._row!==Number(row));persist();return {ok:true};},
  getInventory(){return DB.inv.map(decInv);},
  saveInventory(o){let r=o._row&&find('inv',o._row);if(!r){r={_row:newId()};DB.inv.push(r);}
    Object.assign(r,{'รายการ':o['รายการ'],'ที่เก็บ':o['ที่เก็บ']||'','จำนวน':o['จำนวน']===''?'':num_(o['จำนวน']),'หน่วย':o['หน่วย']||'','วันที่ซื้อ':o['วันที่ซื้อ']||'','วันหมดอายุ':o['วันหมดอายุ']||'',
      'สต็อกขั้นต่ำ':o['สต็อกขั้นต่ำ']===''||o['สต็อกขั้นต่ำ']==null?'':num_(o['สต็อกขั้นต่ำ']),'หมายเหตุ':o['หมายเหตุ']||''});persist();return {ok:true,row:r._row};},
  adjustInventory(row,delta){const r=find('inv',row);if(!r)return {ok:false};r['จำนวน']=Math.max(0,num_(r['จำนวน'])+num_(delta));persist();return {ok:true,qty:r['จำนวน']};},
  deleteInventory(row){DB.inv=DB.inv.filter(x=>x._row!==Number(row));persist();return {ok:true};},
  getMenu(start,days){start=start||todayStr_();const out=[];const by={};DB.menu.forEach(r=>by[r['วันที่']]=r);
    for(let i=0;i<(days||7);i++){const d=pd(start);d.setDate(d.getDate()+i);const k=ymd(d);
      out.push(by[k]?clone(by[k]):{_row:null,'วันที่':k,'มื้อเช้า':'','มื้อกลางวัน':'','มื้อเย็น':'','วัตถุดิบที่ต้องใช้':'','หมายเหตุ':''});}return out;},
  saveMenu(o){let r=DB.menu.find(x=>x['วันที่']===o['วันที่']);if(!r){r={_row:newId(),'วันที่':o['วันที่']};DB.menu.push(r);}
    ['มื้อเช้า','มื้อกลางวัน','มื้อเย็น','วัตถุดิบที่ต้องใช้','หมายเหตุ'].forEach(k=>r[k]=o[k]||'');persist();return {ok:true,row:r._row};},
  menuToShopping(dateStr){const day=LOCAL.getMenu(dateStr,1)[0];const items=String(day['วัตถุดิบที่ต้องใช้']||'').split(/[,،、\n]+/).map(x=>x.trim()).filter(Boolean);
    const ex=DB.shop.filter(x=>!x['ซื้อแล้ว']).map(x=>x['รายการ']);let added=0;
    items.forEach(it=>{if(!ex.includes(it)){LOCAL.saveShopping({'รายการ':it,'จำนวน':1,'หมายเหตุ':'จากเมนู '+dateStr});ex.push(it);added++;}});return {ok:true,added};},
  getTodos(){return DB.todo.map(r=>Object.assign(clone(r),{'สถานะ':todoStatus(r)}));},
  toggleTodo(row,done){const r=find('todo',row);if(!r)return {ok:false};r['เสร็จแล้ว']=!!done;
    if(done){const t=todayStr_();r['ทำล่าสุดเมื่อ']=t;const nd=nextDue_(r['ความถี่'],t);if(nd)r['กำหนดทำ']=nd;}persist();return {ok:true};},
  saveTodo(o){let r=o._row&&find('todo',o._row);if(!r){r={_row:newId(),'เสร็จแล้ว':false,'ทำล่าสุดเมื่อ':''};DB.todo.push(r);}
    Object.assign(r,{'งาน':o['งาน'],'หมวด':o['หมวด']||'','ความถี่':o['ความถี่']||'ครั้งเดียว','ผู้รับผิดชอบ':o['ผู้รับผิดชอบ']||'','กำหนดทำ':o['กำหนดทำ']||todayStr_(),'หมายเหตุ':o['หมายเหตุ']||''});persist();return {ok:true,row:r._row};},
  deleteTodo(row){DB.todo=DB.todo.filter(x=>x._row!==Number(row));persist();return {ok:true};},
  getShopping(){return DB.shop.map(decShop);},
  saveShopping(o){let r=o._row&&find('shop',o._row);if(!r){r={_row:newId(),'ซื้อแล้ว':false,'ราคาจริง':''};DB.shop.push(r);}
    Object.assign(r,{'รายการ':o['รายการ'],'ที่เก็บ/หมวด':o['ที่เก็บ/หมวด']||'','จำนวน':num_(o['จำนวน']||1),'หน่วย':o['หน่วย']||'',
      'ราคาประมาณ/หน่วย':o['ราคาประมาณ/หน่วย']===''||o['ราคาประมาณ/หน่วย']==null?'':num_(o['ราคาประมาณ/หน่วย']),'หมายเหตุ':o['หมายเหตุ']||''});persist();return {ok:true,row:r._row};},
  toggleShopping(row,bought,opts){opts=opts||{};const r=find('shop',row);if(!r)return {ok:false};r['ซื้อแล้ว']=!!bought;
    if(bought&&opts.price!==undefined&&opts.price!=='')r['ราคาจริง']=num_(opts.price);persist();
    const it=decShop(r);
    if(bought&&opts.toLedger){const amt=num_(r['ราคาจริง'])||num_(it['รวมประมาณ']);if(amt)LOCAL.addLedger({date:todayStr_(),type:'รายจ่าย',category:LOCATION_TO_CATEGORY[r['ที่เก็บ/หมวด']]||'อื่นๆ',item:r['รายการ'],amount:amt,method:opts.method||'',note:'จากชอปปิ้งลิสต์'});}
    if(bought&&opts.toInventory){const inv=DB.inv.find(x=>x['รายการ']===r['รายการ']&&(!r['ที่เก็บ/หมวด']||x['ที่เก็บ']===r['ที่เก็บ/หมวด']));
      if(inv)LOCAL.adjustInventory(inv._row,num_(r['จำนวน'])||1);else LOCAL.saveInventory({'รายการ':r['รายการ'],'ที่เก็บ':r['ที่เก็บ/หมวด'],'จำนวน':num_(r['จำนวน'])||1,'หน่วย':r['หน่วย'],'วันที่ซื้อ':todayStr_()});}
    return {ok:true};},
  clearBought(){const n=DB.shop.filter(x=>x['ซื้อแล้ว']).length;DB.shop=DB.shop.filter(x=>!x['ซื้อแล้ว']);persist();return {ok:true,removed:n};},
  lowStockToShopping(){const want=['ใกล้หมด','หมดสต็อก','หมดอายุ'];const pend=DB.shop.filter(x=>!x['ซื้อแล้ว']).map(x=>x['รายการ']);let added=0;
    LOCAL.getInventory().forEach(it=>{if(want.includes(it['สถานะ'])&&!pend.includes(it['รายการ'])){
      LOCAL.saveShopping({'รายการ':it['รายการ'],'ที่เก็บ/หมวด':it['ที่เก็บ'],'จำนวน':Math.max(1,num_(it['สต็อกขั้นต่ำ'])*2-num_(it['จำนวน'])),'หน่วย':it['หน่วย'],'หมายเหตุ':'เติมสต็อก ('+it['สถานะ']+')'});pend.push(it['รายการ']);added++;}});return {ok:true,added};},
  getBills(all){const t=new Date();const from=ymd(new Date(t.getFullYear(),t.getMonth()-1,1)),to=ymd(new Date(t.getFullYear(),t.getMonth()+2,0));
    return DB.util.filter(b=>all||(b['เดือน']>=from&&b['เดือน']<=to)||(!b['ชำระแล้ว']&&b['เดือน']<from)).map(b=>Object.assign(clone(b),{'สถานะ':billStatus(b)}))
      .sort((a,b)=>String(a['วันครบกำหนด']).localeCompare(String(b['วันครบกำหนด'])));},
  saveBill(o){let r=o._row&&find('util',o._row);if(!r){r={_row:newId(),'ชำระแล้ว':false,'วันที่ชำระ':'','หมายเหตุ':''};DB.util.push(r);}
    ['เดือน','ประเภทบิล','ผู้ให้บริการ','หมายเหตุ'].forEach(k=>{if(o[k]!==undefined)r[k]=o[k];});
    r['จำนวนเงิน (บาท)']=o['จำนวนเงิน (บาท)']===''?'':num_(o['จำนวนเงิน (บาท)']);r['วันครบกำหนด']=o['วันครบกำหนด']||'';persist();return {ok:true};},
  deleteBill(row){DB.util=DB.util.filter(x=>x._row!==Number(row));persist();return {ok:true};},
  payBill(row,paid,toLedger,method){const b=find('util',row);if(!b)return {ok:false};b['ชำระแล้ว']=!!paid;b['วันที่ชำระ']=paid?todayStr_():'';persist();
    if(paid&&toLedger&&num_(b['จำนวนเงิน (บาท)'])){const mm=b['เดือน']?b['เดือน'].slice(5,7)+'/'+b['เดือน'].slice(0,4):'';
      const cat=(DB.lists['หมวดรายจ่าย']||[]).includes(b['ประเภทบิล'])?b['ประเภทบิล']:'อื่นๆ';
      LOCAL.addLedger({date:todayStr_(),type:'รายจ่าย',category:cat,item:b['ประเภทบิล']+' '+mm,amount:b['จำนวนเงิน (บาท)'],method:method||'',note:'จากหน้าบิล'});}return {ok:true};},
  getMoney(){return {savings:savBalances(),debts:DB.debt.map(debtCalc),recentSav:clone(DB.sav).sort((a,b)=>String(b['วันที่']).localeCompare(String(a['วันที่']))||b._row-a._row).slice(0,10),
    debtLog:clone(DB.debtlog).sort((a,b)=>String(b['วันที่จ่าย']).localeCompare(String(a['วันที่จ่าย']))).slice(0,15)};},
  addSaving(o){if(!num_(o.amount))throw new Error('กรุณาใส่จำนวนเงิน');const id=newId();
    DB.sav.push({_row:id,'วันที่':o.date||todayStr_(),'ประเภท':o.type||'เงินออม','บัญชี/รายละเอียด':o.detail||'','ฝาก/ถอน':o.dir||'ฝาก','จำนวนเงิน (บาท)':num_(o.amount),'หมายเหตุ':o.note||''});persist();return {ok:true,row:id};},
  deleteSaving(row){DB.sav=DB.sav.filter(x=>x._row!==Number(row));persist();return {ok:true};},
  saveDebt(o){if(!o['เจ้าหนี้'])throw new Error('กรุณาใส่ชื่อเจ้าหนี้');let r=o._row&&find('debt',o._row);
    if(r&&r['เจ้าหนี้']!==o['เจ้าหนี้'])DB.debtlog.forEach(p=>{if(p['เจ้าหนี้ที่จ่าย']===r['เจ้าหนี้'])p['เจ้าหนี้ที่จ่าย']=o['เจ้าหนี้'];});
    if(!r){r={_row:newId()};DB.debt.push(r);}
    Object.assign(r,{'เจ้าหนี้':o['เจ้าหนี้'],'ประเภทหนี้':o['ประเภทหนี้']||'','เงินต้นเริ่มต้น':num_(o['เงินต้นเริ่มต้น']),'ดอกเบี้ย (%/ปี)':num_(o['ดอกเบี้ย (%/ปี)']),'ค่างวด/เดือน':num_(o['ค่างวด/เดือน']),
      'วันที่เริ่ม':o['วันที่เริ่ม']||'','ครบกำหนดทุกวันที่':o['ครบกำหนดทุกวันที่']||'','หมายเหตุ':o['หมายเหตุ']||''});persist();return {ok:true,row:r._row};},
  deleteDebt(row){const r=find('debt',row);if(r){DB.debt=DB.debt.filter(x=>x!==r);DB.debtlog=DB.debtlog.filter(p=>p['เจ้าหนี้ที่จ่าย']!==r['เจ้าหนี้']);}persist();return {ok:true};},
  addDebtPayment(o){if(!o.creditor||!num_(o.amount))throw new Error('กรุณาเลือกเจ้าหนี้และใส่จำนวนเงิน');let interest=o.interest;
    if(interest===''||interest==null){const d=DB.debt.find(x=>x['เจ้าหนี้']===o.creditor);interest=d?debtCalc(d)['ดอกเบี้ยเดือนหน้า (ประมาณ)']:0;interest=Math.min(interest,num_(o.amount));}
    const id=newId();DB.debtlog.push({_row:id,'วันที่จ่าย':o.date||todayStr_(),'เจ้าหนี้ที่จ่าย':o.creditor,'จำนวนที่จ่าย':num_(o.amount),'ส่วนดอกเบี้ย':num_(interest),'ส่วนเงินต้น':num_(o.amount)-num_(interest),'หมายเหตุการจ่าย':o.note||''});persist();
    if(o.toLedger)LOCAL.addLedger({date:o.date||todayStr_(),type:'รายจ่าย',category:(DB.lists['หมวดรายจ่าย']||[]).includes('ชำระหนี้')?'ชำระหนี้':'อื่นๆ',item:'ชำระหนี้ '+o.creditor,amount:o.amount,note:'จากหน้าหนี้สิน'});
    return {ok:true,row:id,interest};},
  deleteDebtPayment(row){DB.debtlog=DB.debtlog.filter(x=>x._row!==Number(row));persist();return {ok:true};},
  /* summaries */
  getSummary(mode){const L=DB.led;const key=d=>mode==='year'?d.slice(0,4):mode==='month'?d.slice(0,7):mondayStr(d);const g={};
    L.forEach(r=>{if(!r['วันที่'])return;const k=key(r['วันที่']);g[k]=g[k]||{k,inc:0,exp:0,cats:{}};const a=num_(r['จำนวนเงิน (บาท)']);
      if(r['ประเภท']==='รายรับ')g[k].inc+=a;else{g[k].exp+=a;g[k].cats[r['หมวดหมู่']]=(g[k].cats[r['หมวดหมู่']]||0)+a;}});
    const cur=key(todayStr_());if(!g[cur])g[cur]={k:cur,inc:0,exp:0,cats:{}};
    return Object.values(g).sort((a,b)=>b.k.localeCompare(a.k)).slice(0,mode==='week'?12:mode==='month'?24:20);},
  getBudget(){const s=DB.settings,t=todayStr_(),m=t.slice(0,7);const L=DB.led.filter(r=>String(r['วันที่']).startsWith(m));
    const inc=L.filter(r=>r['ประเภท']==='รายรับ').reduce((a,r)=>a+num_(r['จำนวนเงิน (บาท)']),0);
    const exps=L.filter(r=>r['ประเภท']==='รายจ่าย');const need=exps.filter(r=>s.needCats.includes(r['หมวดหมู่'])).reduce((a,r)=>a+num_(r['จำนวนเงิน (บาท)']),0);
    const debtLed=exps.filter(r=>r['หมวดหมู่']==='ชำระหนี้'||r['หมายเหตุ']==='จากหน้าหนี้สิน').reduce((a,r)=>a+num_(r['จำนวนเงิน (บาท)']),0);
    const want=exps.reduce((a,r)=>a+num_(r['จำนวนเงิน (บาท)']),0)-need-debtLed;
    const savM=DB.sav.filter(x=>String(x['วันที่']).startsWith(m)).reduce((a,x)=>a+(x['ฝาก/ถอน']==='ถอน'?-1:1)*num_(x['จำนวนเงิน (บาท)']),0);
    const debtM=DB.debtlog.filter(x=>String(x['วันที่จ่าย']).startsWith(m)).reduce((a,x)=>a+num_(x['จำนวนที่จ่าย']),0);
    // emergency fund
    const months=[];const now=new Date();for(let i=1;i<=3;i++)months.push(ymd(new Date(now.getFullYear(),now.getMonth()-i,1)).slice(0,7));
    const expBy=mm=>DB.led.filter(r=>r['ประเภท']==='รายจ่าย'&&String(r['วันที่']).startsWith(mm)).reduce((a,r)=>a+num_(r['จำนวนเงิน (บาท)']),0);
    const hist=months.map(expBy).filter(v=>v>0);const avg=hist.length?hist.reduce((a,b)=>a+b,0)/hist.length:expBy(m);
    const ef=savBalances().find(x=>x[0]==='เงินสำรองฉุกเฉิน');
    return {inc,need,want,save:Math.max(0,savM)+debtM,pct:s.budget,avgExp:avg,efMonths:num_(s.efMonths)||6,efHave:ef?ef[1]:0,avgBasis:hist.length?hist.length+' เดือนก่อน':'เดือนนี้'};}
};
