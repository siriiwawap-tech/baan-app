const IS_GAS=false;
function api(fn,...args){return new Promise((res,rej)=>{try{res(LOCAL[fn](...args));}catch(e){toast('😿 '+(e.message||e));rej(e);}});}
const S = {lists:{}, type:'รายจ่าย', cat:'อาหารสด', invLoc:'ทั้งหมด', todoF:'ต้องทำ', weekStart:null, today:null};
const $ = id=>document.getElementById(id);
const esc = s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const baht = n=>Number(n||0).toLocaleString('th-TH',{minimumFractionDigits:0,maximumFractionDigits:2})+' ฿';
const thDate = (s,opt)=>{ if(!s) return ''; const [y,m,d]=String(s).split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString('th-TH',opt||{day:'numeric',month:'short'}); };
const addDays=(s,n)=>{const [y,m,d]=s.split('-').map(Number);const t=new Date(y,m-1,d+n);return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');};
function toast(t){const e=$('toast');e.textContent=t;e.classList.add('show');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('show'),2600);}
function openModal(html){$('sheet').innerHTML=html;$('modal').classList.add('show');}
function closeModal(){$('modal').classList.remove('show');}
const opts=(arr,sel)=>arr.map(v=>`<option ${v===sel?'selected':''}>${esc(v)}</option>`).join('');

const CAT_EMO={'อาหารสด':'🥬','ของแห้ง':'🍚','ของใช้ห้องน้ำ':'🧴','ซักผ้า':'🧺','ค่าน้ำดื่ม':'💧','ค่าไฟ':'💡','ค่าเน็ต':'📶','เดินทาง':'🚗','อื่นๆ':'🎀',
  'เงินเดือน':'💼','รายได้เสริม':'🌟','โบนัส':'🎁','ดอกเบี้ย/ปันผล':'📈','รายรับอื่นๆ':'💝'};
const LOC_EMO={'ตู้เย็นเทา':'🧊','ตู้เย็นดำ':'❄️','ตู้กับข้าว/ของแห้ง':'🥫','ห้องน้ำ':'🛁','อุปกรณ์ซักผ้า':'🧼'};
const SAV_EMO={'เงินออม':'🐷','เงินสำรองฉุกเฉิน':'🛟','กองทุนรวม':'📊','หุ้น':'📈','ทองคำ':'🪙','คริปโต':'🪙','ประกันสะสมทรัพย์':'🛡️','อื่นๆ':'💎'};
const KPI_EMO=['💰','💸','👛','📅','☀️','🐷','🌱','🎯','💳','📆','🧾','💵','🥛','🧹','🛒','🛍️','🛟'];
const badge=s=>{const m={'ปกติ':'b-ok','ใกล้หมด':'b-warn','ใกล้หมดอายุ':'b-orange','หมดอายุ':'b-bad','หมดสต็อก':'b-bad','ชำระแล้ว':'b-ok','รอชำระ':'b-info','ใกล้ครบกำหนด':'b-warn','เกินกำหนด':'b-bad','เสร็จแล้ว':'b-ok','วันนี้':'b-warn','รอทำ':'b-info'};return s?`<span class="badge ${m[s]||'b-info'}">${esc(s)}</span>`:'';};

/* ---------------- Tabs ---------------- */
const LOADERS={dash:loadDash,ledger:loadLedger,inv:loadInv,menu:loadMenu,todo:loadTodo,shop:loadShop,bills:loadBills,money:loadMoney,sum:loadSum,set:loadSet};
$('tabs').addEventListener('click',e=>{const b=e.target.closest('.tab');if(!b)return;
  document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('on',x===b));
  document.querySelectorAll('.page').forEach(p=>p.classList.toggle('on',p.id==='p-'+b.dataset.p));
  LOADERS[b.dataset.p]();});

/* ---------------- Init ---------------- */
function boot(){ api('getInit').then(r=>{
  S.lists=r.lists; S.today=r.today; S.weekStart=mondayOf(r.today);
  $('todayTxt').textContent='สวัสดีค่ะ 🌷 วัน'+thDate(r.today,{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  if(r.sheetUrl) $('sheetLink').href=r.sheetUrl;
  if(!IS_GAS) $('demoNote').innerHTML='<div class="demo">👀 โหมดตัวอย่าง (พรีวิว) – เมื่อ Deploy จริงจะเชื่อมกับชีตของคุณ</div>';
  $('lDate').value=r.today; $('lMethod').innerHTML=opts(S.lists['วิธีชำระ']||[]);
  $('sLoc').innerHTML='<option value="">— ที่เก็บ/หมวด —</option>'+opts(S.lists['ที่เก็บ']||[]);
  $('mType').innerHTML=opts(S.lists['ประเภทการออม']||[]);
  renderCats(); loadDash();
}); }
function mondayOf(s){const [y,m,d]=s.split('-').map(Number);const t=new Date(y,m-1,d);const w=(t.getDay()+6)%7;return addDays(s,-w);}

/* ---------------- Dashboard ---------------- */
function loadDash(){
  api('getDashboard').then(d=>{
    const cls=['c1','c2','c3','c4','c5','c6'];
    $('kpis').innerHTML=d.kpi.map((k,i)=>`<div class="kpi ${cls[i%6]}"><div class="e">${KPI_EMO[i]||'✨'}</div><div class="l">${esc(k[0])}</div><div class="v">${esc(k[1])}</div></div>`).join('');
    const m=d.menu;
    $('dMenu').innerHTML=m&&(m['มื้อเช้า']||m['มื้อกลางวัน']||m['มื้อเย็น'])?
      `<div class="meal"><span>🌅</span><div>${esc(m['มื้อเช้า']||'-')}</div></div><div class="meal"><span>🌞</span><div>${esc(m['มื้อกลางวัน']||'-')}</div></div><div class="meal"><span>🌙</span><div>${esc(m['มื้อเย็น']||'-')}</div></div>`
      :'<div class="empty">ยังไม่ได้วางเมนูวันนี้ 🍙 ไปที่แท็บ เมนู ได้เลย</div>';
    $('dTodo').innerHTML=d.todos.length?d.todos.map(todoRow).join(''):'<div class="empty">เย้! ไม่มีงานค้าง 🎉</div>';
    $('dLow').innerHTML=d.low.length?d.low.map(l=>`<div class="item"><div class="ico">${LOC_EMO[l[2]]||'📦'}</div><div class="t"><b>${esc(l[1])}</b><small>${esc(l[2])} · เหลือ ${esc(l[3])}</small></div>${badge(l[4])}</div>`).join(''):'<div class="empty">ของครบทุกอย่าง 🥰</div>';
    $('dBills').innerHTML=d.bills.length?d.bills.map(billRow).join(''):'<div class="empty">ไม่มีบิลค้าง 🎈</div>';
    const max=Math.max(1,...d.cats.map(c=>c[1]));
    $('dCats').innerHTML=d.cats.filter(c=>c[1]>0).map(c=>`<div style="margin:8px 0"><div class="row" style="justify-content:space-between"><span>${CAT_EMO[c[0]]||'•'} ${esc(c[0])}</span><span class="money" style="flex:0">${baht(c[1])}</span></div><div class="bar"><i style="width:${c[1]/max*100}%"></i></div></div>`).join('')||'<div class="empty">ยังไม่มีรายจ่ายเดือนนี้</div>';
  });
}

/* ---------------- Ledger ---------------- */
function setType(t){S.type=t;$('tOut').className=t==='รายจ่าย'?'on out':'out';$('tIn').className=t==='รายรับ'?'on in':'in';
  S.cat=(t==='รายจ่าย'?S.lists['หมวดรายจ่าย']:S.lists['หมวดรายรับ'])[0];renderCats();}
function renderCats(){const arr=(S.type==='รายจ่าย'?S.lists['หมวดรายจ่าย']:S.lists['หมวดรายรับ'])||[];
  $('lCats').innerHTML=arr.map(c=>`<button class="chip ${c===S.cat?'on':''}" onclick="S.cat='${esc(c)}';renderCats()">${CAT_EMO[c]||'🏷️'} ${esc(c)}</button>`).join('');}
function saveLedger(){
  const e={date:$('lDate').value,type:S.type,category:S.cat,item:$('lItem').value,amount:$('lAmt').value,method:$('lMethod').value,note:$('lNote').value};
  if(!Number(e.amount)) return toast('ใส่จำนวนเงินก่อนนะ 💕');
  api('addLedger',e).then(()=>{toast('บันทึกแล้ว ✅ '+baht(e.amount));$('lAmt').value='';$('lItem').value='';$('lNote').value='';loadLedger();});
}
function loadLedger(){api('getLedger',30).then(rows=>{
  $('lList').innerHTML=rows.length?rows.map(r=>{const inc=r['ประเภท']==='รายรับ';return `<div class="item"><div class="ico" style="background:${inc?'var(--mint)':'var(--pink)'}">${CAT_EMO[r['หมวดหมู่']]||'🏷️'}</div>
    <div class="t"><b>${esc(r['รายการ']||r['หมวดหมู่'])}</b><small>${thDate(r['วันที่'])} · ${esc(r['หมวดหมู่'])}${r['วิธีชำระ']?' · '+esc(r['วิธีชำระ']):''}</small></div>
    <div class="money ${inc?'in-c':'out-c'}">${inc?'+':'−'}${baht(r['จำนวนเงิน (บาท)'])}</div>
    <button class="btn sm ghost" onclick="delLedger(${r._row})">🗑️</button></div>`}).join(''):'<div class="empty">ยังไม่มีรายการ</div>';});}
function delLedger(row){if(confirm('ลบรายการนี้?'))api('deleteLedger',row).then(()=>{toast('ลบแล้ว');loadLedger();});}

/* ---------------- Inventory ---------------- */
let INV=[];
function loadInv(){api('getInventory').then(rows=>{INV=rows;
  const locs=['ทั้งหมด','⚠️ ต้องเติม'].concat(S.lists['ที่เก็บ']||[]);
  $('invFilter').innerHTML=locs.map(l=>`<button class="chip ${l===S.invLoc?'on':''}" onclick="S.invLoc='${esc(l)}';loadInvRender()">${LOC_EMO[l]||''} ${esc(l)}</button>`).join('');
  loadInvRender();});}
function loadInvRender(){
  document.querySelectorAll('#invFilter .chip').forEach(c=>c.classList.toggle('on',c.textContent.trim().endsWith(S.invLoc)));
  const list=INV.filter(r=>S.invLoc==='ทั้งหมด'||(S.invLoc==='⚠️ ต้องเติม'?r['สถานะ']!=='ปกติ':r['ที่เก็บ']===S.invLoc));
  $('invList').innerHTML=list.length?list.map(r=>`<div class="item"><div class="ico" style="background:var(--lav)">${LOC_EMO[r['ที่เก็บ']]||'📦'}</div>
    <div class="t" onclick="editInv(${r._row})"><b>${esc(r['รายการ'])}</b><small>${esc(r['ที่เก็บ'])}${r['วันหมดอายุ']?' · หมดอายุ '+thDate(r['วันหมดอายุ']):''}</small><div>${badge(r['สถานะ'])}</div></div>
    <div class="qty"><button onclick="adj(${r._row},-1)">−</button><span>${esc(r['จำนวน'])} ${esc(r['หน่วย'])}</span><button onclick="adj(${r._row},1)">＋</button></div></div>`).join(''):'<div class="empty">ไม่มีของในหมวดนี้</div>';}
function adj(row,d){const it=INV.find(x=>x._row===row);if(it)it['จำนวน']=Math.max(0,Number(it['จำนวน']||0)+d);loadInvRender();api('adjustInventory',row,d).then(()=>IS_GAS&&loadInv());}
function editInv(row){const r=INV.find(x=>x._row===row)||{};
  openModal(`<h3>${row?'✏️ แก้ไขของ':'🧺 เพิ่มของใหม่'}</h3>
  <label>รายการ</label><input id="iName" value="${esc(r['รายการ'])}">
  <label>ที่เก็บ</label><select id="iLoc">${opts(S.lists['ที่เก็บ']||[],r['ที่เก็บ'])}</select>
  <div class="row"><div><label>จำนวน</label><input id="iQty" type="number" value="${esc(r['จำนวน']??1)}"></div><div><label>หน่วย</label><select id="iUnit">${opts(S.lists['หน่วย']||[],r['หน่วย'])}</select></div></div>
  <div class="row"><div><label>วันที่ซื้อ</label><input id="iBuy" type="date" value="${esc(r['วันที่ซื้อ']||S.today)}"></div><div><label>วันหมดอายุ</label><input id="iExp" type="date" value="${esc(r['วันหมดอายุ']||'')}"></div></div>
  <label>สต็อกขั้นต่ำ (แจ้งเตือนเมื่อเหลือเท่านี้)</label><input id="iMin" type="number" value="${esc(r['สต็อกขั้นต่ำ']??1)}">
  <label>หมายเหตุ</label><input id="iNote" value="${esc(r['หมายเหตุ'])}">
  <button class="btn full" onclick="saveInv(${row||0})">💾 บันทึก</button>
  ${row?`<button class="btn full ghost" onclick="delInv(${row})">🗑️ ลบรายการนี้</button>`:''}`);}
function saveInv(row){const o={_row:row||null,'รายการ':$('iName').value,'ที่เก็บ':$('iLoc').value,'จำนวน':$('iQty').value,'หน่วย':$('iUnit').value,'วันที่ซื้อ':$('iBuy').value,'วันหมดอายุ':$('iExp').value,'สต็อกขั้นต่ำ':$('iMin').value,'หมายเหตุ':$('iNote').value};
  if(!o['รายการ'])return toast('ใส่ชื่อของก่อนนะ');api('saveInventory',o).then(()=>{closeModal();toast('บันทึกแล้ว 🧺');loadInv();});}
function delInv(row){if(confirm('ลบของชิ้นนี้?'))api('deleteInventory',row).then(()=>{closeModal();loadInv();});}

/* ---------------- Menu ---------------- */
let MENU=[];
function shiftWeek(n){S.weekStart=n===0?mondayOf(S.today):addDays(S.weekStart,n);loadMenu();}
function loadMenu(){api('getMenu',S.weekStart,7).then(rows=>{MENU=rows;
  $('menuList').innerHTML=rows.map((r,i)=>`<div class="day ${r['วันที่']===S.today?'today':''}">
    <h3>${r['วันที่']===S.today?'⭐':'📅'} ${thDate(r['วันที่'],{weekday:'long',day:'numeric',month:'short'})}</h3>
    <div class="meal"><span>🌅</span><input id="m${i}a" placeholder="มื้อเช้า" value="${esc(r['มื้อเช้า'])}"></div>
    <div class="meal"><span>🌞</span><input id="m${i}b" placeholder="มื้อกลางวัน" value="${esc(r['มื้อกลางวัน'])}"></div>
    <div class="meal"><span>🌙</span><input id="m${i}c" placeholder="มื้อเย็น" value="${esc(r['มื้อเย็น'])}"></div>
    <div class="meal"><span>🥕</span><input id="m${i}d" placeholder="วัตถุดิบ (คั่นด้วย , )" value="${esc(r['วัตถุดิบที่ต้องใช้'])}"></div>
    <div class="row"><button class="btn sm" onclick="saveMenu(${i})">💾 บันทึก</button><button class="btn sm lav" onclick="menuShop(${i})">🛒 วัตถุดิบลงลิสต์</button></div></div>`).join('');});}
function saveMenu(i){const r=MENU[i];const o={_row:r._row,'วันที่':r['วันที่'],'มื้อเช้า':$('m'+i+'a').value,'มื้อกลางวัน':$('m'+i+'b').value,'มื้อเย็น':$('m'+i+'c').value,'วัตถุดิบที่ต้องใช้':$('m'+i+'d').value,'หมายเหตุ':r['หมายเหตุ']};
  return api('saveMenu',o).then(res=>{r._row=res.row||r._row;toast('บันทึกเมนูแล้ว 🍱');});}
function menuShop(i){saveMenu(i).then(()=>api('menuToShopping',MENU[i]['วันที่'])).then(r=>toast('เพิ่ม '+(r.added||0)+' รายการลงชอปปิ้งลิสต์ 🛒'));}

/* ---------------- Todo ---------------- */
let TODO=[];
function todoRow(t){const done=t['สถานะ']==='เสร็จแล้ว';return `<div class="item ${done?'done':''}"><input type="checkbox" class="chk" ${done?'checked':''} onchange="tickTodo(${t._row},this.checked)">
  <div class="t"><b>${esc(t['งาน'])}</b><small>${esc(t['ผู้รับผิดชอบ']||'')} · ${esc(t['ความถี่']||'')}${t['กำหนดทำ']?' · '+thDate(t['กำหนดทำ']):''}</small></div>${badge(t['สถานะ'])}</div>`;}
function tickTodo(row,v){api('toggleTodo',row,v).then(()=>{toast(v?'เก่งมาก! 🌟':'ยกเลิกแล้ว');const p=document.querySelector('.tab.on').dataset.p;LOADERS[p]();});}
function loadTodo(){api('getTodos').then(rows=>{TODO=rows;
  const fs=['ต้องทำ','รายวัน','รายสัปดาห์','รายเดือน','ทั้งหมด'];
  $('todoFilter').innerHTML=fs.map(f=>`<button class="chip ${f===S.todoF?'on':''}" onclick="S.todoF='${f}';loadTodo()">${esc(f)}</button>`).join('');
  const order={'เกินกำหนด':0,'วันนี้':1,'รอทำ':2,'เสร็จแล้ว':3};
  const list=rows.filter(t=>S.todoF==='ทั้งหมด'||(S.todoF==='ต้องทำ'?t['สถานะ']!=='เสร็จแล้ว':t['ความถี่']===S.todoF))
    .sort((a,b)=>(order[a['สถานะ']]??9)-(order[b['สถานะ']]??9)||String(a['กำหนดทำ']).localeCompare(String(b['กำหนดทำ'])));
  $('todoList').innerHTML=list.length?list.map(todoRow).join(''):'<div class="empty">ไม่มีงาน 🎉</div>';});}
function editTodo(){openModal(`<h3>🧹 เพิ่มงานบ้าน</h3><label>งาน</label><input id="tdName" placeholder="เช่น ล้างแอร์">
  <div class="row"><div><label>หมวด</label><select id="tdCat">${opts(S.lists['หมวดงานบ้าน']||[])}</select></div><div><label>ความถี่</label><select id="tdFreq">${opts(S.lists['ความถี่']||[])}</select></div></div>
  <div class="row"><div><label>ผู้รับผิดชอบ</label><select id="tdWho">${opts(S.lists['สมาชิกในบ้าน']||[])}</select></div><div><label>กำหนดทำ</label><input id="tdDue" type="date" value="${S.today}"></div></div>
  <button class="btn full" onclick="saveTodo()">💾 บันทึก</button>`);}
function saveTodo(){const o={'งาน':$('tdName').value,'หมวด':$('tdCat').value,'ความถี่':$('tdFreq').value,'ผู้รับผิดชอบ':$('tdWho').value,'กำหนดทำ':$('tdDue').value};
  if(!o['งาน'])return toast('ใส่ชื่องานก่อนนะ');api('saveTodo',o).then(()=>{closeModal();toast('เพิ่มงานแล้ว 🧹');loadTodo();});}

/* ---------------- Shopping ---------------- */
let SHOP=[];
function loadShop(){api('getShopping').then(rows=>{SHOP=rows;
  const pend=rows.filter(r=>r['ซื้อแล้ว']!==true), done=rows.filter(r=>r['ซื้อแล้ว']===true);
  $('shopTotal').textContent='≈ '+baht(pend.reduce((s,r)=>s+Number(r['รวมประมาณ']||0),0));
  const row=r=>{const b=r['ซื้อแล้ว']===true;return `<div class="item ${b?'done':''}"><input type="checkbox" class="chk" ${b?'checked':''} onchange="tickShop(${r._row},this.checked)">
    <div class="ico" style="background:var(--peach)">${LOC_EMO[r['ที่เก็บ/หมวด']]||'🛍️'}</div>
    <div class="t"><b>${esc(r['รายการ'])}</b><small>${esc(r['จำนวน'])} ${esc(r['หน่วย'])}${r['ที่เก็บ/หมวด']?' · '+esc(r['ที่เก็บ/หมวด']):''}</small></div>
    <div class="money">${b&&r['ราคาจริง']?baht(r['ราคาจริง']):(r['รวมประมาณ']?'≈'+baht(r['รวมประมาณ']):'')}</div></div>`;};
  $('shopList').innerHTML=(pend.map(row).join('')||'<div class="empty">ลิสต์ว่างแล้ว 🎉</div>')+(done.length?'<div style="margin-top:10px;color:var(--muted);font-size:13px">✅ ซื้อแล้ว</div>'+done.map(row).join(''):'');});}
function addShop(){const o={'รายการ':$('sItem').value,'จำนวน':$('sQty').value||1,'ที่เก็บ/หมวด':$('sLoc').value,'ราคาประมาณ/หน่วย':$('sPrice').value};
  if(!o['รายการ'])return toast('จะซื้ออะไรดีน้า 🛒');api('saveShopping',o).then(()=>{$('sItem').value='';$('sQty').value='';$('sPrice').value='';toast('เพิ่มแล้ว 🛒');loadShop();});}
function tickShop(row,v){if(!v){api('toggleShopping',row,false,{}).then(loadShop);return;}
  const r=SHOP.find(x=>x._row===row)||{};
  openModal(`<h3>🛍️ ซื้อ "${esc(r['รายการ'])}" แล้ว</h3><label>ราคาที่จ่ายจริง (บาท)</label><input id="bPrice" type="number" inputmode="decimal" value="${esc(r['รวมประมาณ']||'')}">
   <label>วิธีชำระ</label><select id="bMethod">${opts(S.lists['วิธีชำระ']||[])}</select>
   <label class="toggle"><input type="checkbox" id="bLed" checked> 💸 บันทึกลงบัญชีรายจ่าย</label>
   <label class="toggle"><input type="checkbox" id="bInv" checked> 🧺 เพิ่มจำนวนในคลังของ</label>
   <button class="btn full" onclick="confirmBought(${row})">✅ ยืนยัน</button><button class="btn full ghost" onclick="closeModal();loadShop()">ยกเลิก</button>`);}
function confirmBought(row){api('toggleShopping',row,true,{price:$('bPrice').value,method:$('bMethod').value,toLedger:$('bLed').checked,toInventory:$('bInv').checked}).then(()=>{closeModal();toast('ซื้อแล้ว เย้! 🎉');loadShop();});}
function clearBought(){api('clearBought').then(r=>{toast('ล้าง '+(r.removed||0)+' รายการ 🧹');loadShop();});}
function lowToShop(){api('lowStockToShopping').then(r=>{toast('เพิ่ม '+(r.added||0)+' รายการลงลิสต์ 🛒');if(document.querySelector('.tab.on').dataset.p==='shop')loadShop();});}

/* ---------------- Bills ---------------- */
function billRow(b){const paid=b['ชำระแล้ว']===true;const ic={'ค่าน้ำดื่ม':'💧','ค่าไฟ':'💡','ค่าเน็ต':'📶'}[b['ประเภทบิล']]||'🧾';
  return `<div class="item ${paid?'done':''}"><input type="checkbox" class="chk" ${paid?'checked':''} onchange="payBill(${b._row},this.checked)">
  <div class="ico" style="background:var(--lemon)">${ic}</div><div class="t" onclick="editBill(${b._row})"><b>${esc(b['ประเภทบิล'])} · ${thDate(b['เดือน'],{month:'short',year:'2-digit'})}</b><small>ครบกำหนด ${thDate(b['วันครบกำหนด'])}${b['ผู้ให้บริการ']?' · '+esc(b['ผู้ให้บริการ']):''}</small></div>
  <div style="text-align:right"><div class="money">${b['จำนวนเงิน (บาท)']?baht(b['จำนวนเงิน (บาท)']):'—'}</div>${badge(b['สถานะ'])}</div></div>`;}
let BILLS=[];
function loadBills(){api('getBills').then(rows=>{BILLS=rows;$('billList').innerHTML=rows.length?rows.map(billRow).join('')+'<div class="foot">แตะที่ชื่อบิลเพื่อใส่ยอดเงิน · ติ๊กเพื่อจ่ายแล้ว</div>':'<div class="empty">ไม่มีบิล</div>';});}
function editBill(row){const b=BILLS.find(x=>x._row===row);if(!b)return;
  openModal(`<h3>🧾 ${esc(b['ประเภทบิล'])}</h3><label>ยอดเงิน (บาท)</label><input id="ebAmt" type="number" inputmode="decimal" value="${esc(b['จำนวนเงิน (บาท)'])}">
  <label>วันครบกำหนด</label><input id="ebDue" type="date" value="${esc(b['วันครบกำหนด'])}"><button class="btn full" onclick="saveBill(${row})">💾 บันทึก</button>`);}
function saveBill(row){api('saveBill',{_row:row,'จำนวนเงิน (บาท)':$('ebAmt').value,'วันครบกำหนด':$('ebDue').value}).then(()=>{closeModal();toast('บันทึกแล้ว');loadBills();});}
function payBill(row,v){const rec=v?confirm('บันทึกเป็นรายจ่ายในบัญชีด้วยไหม?'):false;
  api('payBill',row,v,rec).then(()=>{toast(v?'จ่ายแล้ว 💖':'ยกเลิกแล้ว');const p=document.querySelector('.tab.on').dataset.p;LOADERS[p]();});}

/* ---------------- Money ---------------- */
let DEBTS=[];
function loadMoney(){api('getMoney').then(d=>{
  const tot=d.savings.find(s=>s[0]==='รวมทั้งหมด')||['',0,0];
  $('savSum').innerHTML=`<div class="grid" style="margin-bottom:10px"><div class="kpi c1"><div class="e">🐷</div><div class="l">ยอดสะสมทั้งหมด</div><div class="v">${baht(tot[1])}</div></div><div class="kpi c3"><div class="e">🌱</div><div class="l">เดือนนี้</div><div class="v">${baht(tot[2])}</div></div></div>`+
    d.savings.filter(s=>s[0]!=='รวมทั้งหมด'&&s[1]).map(s=>`<div class="item"><div class="ico" style="background:var(--mint)">${SAV_EMO[s[0]]||'💎'}</div><div class="t"><b>${esc(s[0])}</b><small>เดือนนี้ ${baht(s[2])}</small></div><div class="money">${baht(s[1])}</div></div>`).join('');
  DEBTS=d.debts;
  $('debtList').innerHTML=d.debts.length?d.debts.map((x,i)=>{const p=x['เงินต้นเริ่มต้น']?1-Number(x['เงินต้นคงเหลือ'])/Number(x['เงินต้นเริ่มต้น']):0;
    return `<div class="day"><h3>💳 ${esc(x['เจ้าหนี้'])} <span class="badge b-info" style="margin-left:auto">${esc(x['ประเภทหนี้'])}</span></h3>
    <div class="row"><small>คงเหลือ <b class="money out-c">${baht(x['เงินต้นคงเหลือ'])}</b></small><small style="text-align:right">งวดละ ${baht(x['ค่างวด/เดือน'])} · เหลือ ~${esc(x['งวดที่เหลือ (ประมาณ)'])} งวด</small></div>
    <div class="bar"><i style="width:${Math.max(0,Math.min(100,p*100))}%;background:linear-gradient(90deg,var(--mint-d),var(--sky-d))"></i></div>
    <small style="color:var(--muted)">ปลดหนี้แล้ว ${(p*100).toFixed(0)}% · ดอกเบี้ย ${esc(x['ดอกเบี้ย (%/ปี)'])}%/ปี</small>
    <button class="btn sm mint full" onclick="payDebt(${i})">💵 บันทึกการจ่ายงวดนี้</button></div>`}).join(''):'<div class="empty">ไม่มีหนี้ เยี่ยมมาก! 🥳</div>';});}
function addSaving(){const o={type:$('mType').value,dir:$('mDir').value,amount:$('mAmt').value,detail:$('mDetail').value,date:S.today};
  if(!Number(o.amount))return toast('ใส่จำนวนเงินก่อนนะ');api('addSaving',o).then(()=>{$('mAmt').value='';$('mDetail').value='';toast('ออมเงินแล้ว 🐷💕');loadMoney();});}
function payDebt(i){const x=DEBTS[i];openModal(`<h3>💵 จ่าย ${esc(x['เจ้าหนี้'])}</h3><label>จำนวนที่จ่าย</label><input id="pdAmt" type="number" inputmode="decimal" value="${esc(x['ค่างวด/เดือน'])}">
  <label>ส่วนดอกเบี้ย (เว้นว่าง = คำนวณอัตโนมัติ)</label><input id="pdInt" type="number" inputmode="decimal" placeholder="≈ ${Number(x['ดอกเบี้ยเดือนหน้า (ประมาณ)']||0).toFixed(2)}">
  <label>วันที่จ่าย</label><input id="pdDate" type="date" value="${S.today}">
  <label class="toggle"><input type="checkbox" id="pdLed"> 💸 บันทึกลงบัญชีรายจ่ายด้วย</label>
  <button class="btn full mint" onclick="confirmDebt(${i})">✅ บันทึก</button>`);}
function confirmDebt(i){api('addDebtPayment',{creditor:DEBTS[i]['เจ้าหนี้'],amount:$('pdAmt').value,interest:$('pdInt').value,date:$('pdDate').value,toLedger:$('pdLed').checked}).then(()=>{closeModal();toast('บันทึกการจ่ายหนี้แล้ว 💪');loadMoney();});}

/* ================= Standalone additions / overrides ================= */
function boot(){ api('getInit').then(r=>{
  S.lists=r.lists; S.today=r.today; S.weekStart=mondayOf(r.today); S.cat=(S.lists['หมวดรายจ่าย']||[])[0];
  $('todayTxt').textContent='สวัสดีค่ะ 🌷 วัน'+thDate(r.today,{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  refreshSelects(); renderCats(); loadDash();
  if(!DB.led.length&&!DB.inv.length&&!DB.todo.length) $('demoNote').innerHTML='<div class="demo">🌱 ยังไม่มีข้อมูล เริ่มจดได้เลย หรือดูตัวอย่างที่ ⚙️ ตั้งค่า → ใส่ข้อมูลตัวอย่าง</div>';
  else $('demoNote').innerHTML='';
}); }
function refreshSelects(){$('lDate').value=$('lDate').value||S.today; $('lMethod').innerHTML=opts(S.lists['วิธีชำระ']||[]);
  $('sLoc').innerHTML='<option value="">— ที่เก็บ/หมวด —</option>'+opts(S.lists['ที่เก็บ']||[]);
  $('mType').innerHTML=opts(S.lists['ประเภทการออม']||[]);}
function adj(row,d){const it=INV.find(x=>x._row===row);api('adjustInventory',row,d).then(()=>loadInv());}
function loadLedger(){api('getLedger',Number($('lLimit').value)||30).then(rows=>{
  $('lList').innerHTML=rows.length?rows.map(r=>{const inc=r['ประเภท']==='รายรับ';return `<div class="item"><div class="ico" style="background:${inc?'var(--mint)':'var(--pink)'}">${CAT_EMO[r['หมวดหมู่']]||'🏷️'}</div>
    <div class="t"><b>${esc(r['รายการ']||r['หมวดหมู่'])}</b><small>${thDate(r['วันที่'])} · ${esc(r['หมวดหมู่'])}${r['วิธีชำระ']?' · '+esc(r['วิธีชำระ']):''}${r['หมายเหตุ']?' · '+esc(r['หมายเหตุ']):''}</small></div>
    <div class="money ${inc?'in-c':'out-c'}">${inc?'+':'−'}${baht(r['จำนวนเงิน (บาท)'])}</div>
    <button class="btn sm ghost" onclick="delLedger(${r._row})">🗑️</button></div>`}).join(''):'<div class="empty">ยังไม่มีรายการ</div>';});}
/* todo */
function todoRow(t){const done=t['สถานะ']==='เสร็จแล้ว';return `<div class="item ${done?'done':''}"><input type="checkbox" class="chk" ${done?'checked':''} onchange="tickTodo(${t._row},this.checked)">
  <div class="t" onclick="editTodo(${t._row})"><b>${esc(t['งาน'])}</b><small>${esc(t['ผู้รับผิดชอบ']||'')} · ${esc(t['ความถี่']||'')}${t['กำหนดทำ']?' · '+thDate(t['กำหนดทำ']):''}${t['ทำล่าสุดเมื่อ']?' · ทำล่าสุด '+thDate(t['ทำล่าสุดเมื่อ']):''}</small></div>${badge(t['สถานะ'])}</div>`;}
function editTodo(row){const r=DB.todo.find(x=>x._row===row)||{};openModal(`<h3>${row?'✏️ แก้ไขงาน':'🧹 เพิ่มงานบ้าน'}</h3><label>งาน</label><input id="tdName" placeholder="เช่น ล้างแอร์" value="${esc(r['งาน'])}">
  <div class="row"><div><label>หมวด</label><select id="tdCat">${opts(S.lists['หมวดงานบ้าน']||[],r['หมวด'])}</select></div><div><label>ความถี่</label><select id="tdFreq">${opts(S.lists['ความถี่']||[],r['ความถี่'])}</select></div></div>
  <div class="row"><div><label>ผู้รับผิดชอบ</label><select id="tdWho">${opts(S.lists['สมาชิกในบ้าน']||[],r['ผู้รับผิดชอบ'])}</select></div><div><label>กำหนดทำ</label><input id="tdDue" type="date" value="${esc(r['กำหนดทำ']||S.today)}"></div></div>
  <label>หมายเหตุ</label><input id="tdNote" value="${esc(r['หมายเหตุ'])}">
  <button class="btn full" onclick="saveTodo(${row||0})">💾 บันทึก</button>${row?`<button class="btn full ghost" onclick="delTodo(${row})">🗑️ ลบงานนี้</button>`:''}`);}
function saveTodo(row){const o={_row:row||null,'งาน':$('tdName').value,'หมวด':$('tdCat').value,'ความถี่':$('tdFreq').value,'ผู้รับผิดชอบ':$('tdWho').value,'กำหนดทำ':$('tdDue').value,'หมายเหตุ':$('tdNote').value};
  if(!o['งาน'])return toast('ใส่ชื่องานก่อนนะ');api('saveTodo',o).then(()=>{closeModal();toast('บันทึกงานแล้ว 🧹');loadTodo();});}
function delTodo(row){if(confirm('ลบงานนี้?'))api('deleteTodo',row).then(()=>{closeModal();loadTodo();});}
/* bills */
function editBill(row){const b=BILLS.find(x=>x._row===row)||{};const isNew=!row;
  openModal(`<h3>🧾 ${isNew?'เพิ่มบิล':esc(b['ประเภทบิล'])}</h3>
  <div class="row"><div><label>ประเภทบิล</label><select id="ebType">${opts((S.lists['ประเภทบิล']||[]).concat(['อื่นๆ']),b['ประเภทบิล'])}</select></div><div><label>เดือน</label><input id="ebMon" type="month" value="${esc((b['เดือน']||S.today).slice(0,7))}"></div></div>
  <label>ผู้ให้บริการ</label><input id="ebProv" value="${esc(b['ผู้ให้บริการ'])}" placeholder="เช่น การไฟฟ้า, AIS">
  <label>ยอดเงิน (บาท)</label><input id="ebAmt" type="number" inputmode="decimal" value="${esc(b['จำนวนเงิน (บาท)'])}">
  <label>วันครบกำหนด</label><input id="ebDue" type="date" value="${esc(b['วันครบกำหนด']||S.today)}">
  <button class="btn full" onclick="saveBill(${row||0})">💾 บันทึก</button>${row?`<button class="btn full ghost" onclick="delBill(${row})">🗑️ ลบบิลนี้</button>`:''}`);}
function newBill(){editBill(0);}
function saveBill(row){api('saveBill',{_row:row||null,'ประเภทบิล':$('ebType').value,'เดือน':$('ebMon').value+'-01','ผู้ให้บริการ':$('ebProv').value,'จำนวนเงิน (บาท)':$('ebAmt').value,'วันครบกำหนด':$('ebDue').value}).then(()=>{closeModal();toast('บันทึกแล้ว');loadBills();});}
function delBill(row){if(confirm('ลบบิลนี้?'))api('deleteBill',row).then(()=>{closeModal();loadBills();});}
/* money */
function loadMoney(){api('getMoney').then(d=>{
  const tot=d.savings.find(s=>s[0]==='รวมทั้งหมด')||['',0,0];
  $('savSum').innerHTML=`<div class="grid" style="margin-bottom:10px"><div class="kpi c1"><div class="e">🐷</div><div class="l">ยอดสะสมทั้งหมด</div><div class="v">${baht(tot[1])}</div></div><div class="kpi c3"><div class="e">🌱</div><div class="l">เดือนนี้</div><div class="v">${baht(tot[2])}</div></div></div>`+
    d.savings.filter(s=>s[0]!=='รวมทั้งหมด'&&s[1]).map(s=>`<div class="item"><div class="ico" style="background:var(--mint)">${SAV_EMO[s[0]]||'💎'}</div><div class="t"><b>${esc(s[0])}</b><small>เดือนนี้ ${baht(s[2])}</small></div><div class="money">${baht(s[1])}</div></div>`).join('');
  $('savRecent').innerHTML=d.recentSav.length?'<div style="color:var(--muted);font-size:13px">🕒 ล่าสุด</div>'+d.recentSav.map(s=>`<div class="item"><div class="t"><b>${esc(s['ประเภท'])} · ${esc(s['ฝาก/ถอน'])}</b><small>${thDate(s['วันที่'])}${s['บัญชี/รายละเอียด']?' · '+esc(s['บัญชี/รายละเอียด']):''}</small></div><div class="money ${s['ฝาก/ถอน']==='ถอน'?'out-c':'in-c'}">${s['ฝาก/ถอน']==='ถอน'?'−':'+'}${baht(s['จำนวนเงิน (บาท)'])}</div><button class="btn sm ghost" onclick="delSav(${s._row})">🗑️</button></div>`).join(''):'';
  DEBTS=d.debts;
  $('debtList').innerHTML=(d.debts.length?d.debts.map((x,i)=>{const p=x['เงินต้นเริ่มต้น']?1-Number(x['เงินต้นคงเหลือ'])/Number(x['เงินต้นเริ่มต้น']):0;
    return `<div class="day"><h3 onclick="editDebt(${x._row})">💳 ${esc(x['เจ้าหนี้'])} <span class="badge ${x['เงินต้นคงเหลือ']>0?'b-info':'b-ok'}" style="margin-left:auto">${esc(x['ประเภทหนี้']||x['สถานะ'])}</span></h3>
    <div class="row"><small>คงเหลือ <b class="money out-c">${baht(x['เงินต้นคงเหลือ'])}</b> / ${baht(x['เงินต้นเริ่มต้น'])}</small><small style="text-align:right">งวดละ ${baht(x['ค่างวด/เดือน'])} · เหลือ ~${esc(x['งวดที่เหลือ (ประมาณ)'])} งวด</small></div>
    <div class="bar"><i style="width:${Math.max(0,Math.min(100,p*100))}%;background:linear-gradient(90deg,var(--mint-d),var(--sky-d))"></i></div>
    <small style="color:var(--muted)">ปลดหนี้แล้ว ${(p*100).toFixed(0)}% · ดอกเบี้ย ${esc(x['ดอกเบี้ย (%/ปี)'])}%/ปี · จ่ายแล้วรวม ${baht(x['จ่ายแล้วรวม'])}</small>
    <div class="row"><button class="btn sm mint" onclick="payDebt(${i})">💵 บันทึกการจ่าย</button><button class="btn sm ghost" onclick="editDebt(${x._row})">✏️ แก้ไข</button></div></div>`}).join(''):'<div class="empty">ไม่มีหนี้ เยี่ยมมาก! 🥳</div>')+
    (d.debtLog.length?'<div style="color:var(--muted);font-size:13px;margin-top:8px">🧾 ประวัติการจ่าย</div>'+d.debtLog.map(p=>`<div class="item"><div class="t"><b>${esc(p['เจ้าหนี้ที่จ่าย'])}</b><small>${thDate(p['วันที่จ่าย'])} · ต้น ${baht(p['ส่วนเงินต้น'])} · ดอก ${baht(p['ส่วนดอกเบี้ย'])}</small></div><div class="money">${baht(p['จำนวนที่จ่าย'])}</div><button class="btn sm ghost" onclick="delDebtPay(${p._row})">🗑️</button></div>`).join(''):'');});}
function delSav(row){if(confirm('ลบรายการออมนี้?'))api('deleteSaving',row).then(loadMoney);}
function delDebtPay(row){if(confirm('ลบรายการจ่ายนี้?'))api('deleteDebtPayment',row).then(loadMoney);}
function editDebt(row){const x=DB.debt.find(d=>d._row===row)||{};openModal(`<h3>${row?'✏️ แก้ไขหนี้':'💳 เพิ่มหนี้'}</h3>
  <label>เจ้าหนี้</label><input id="dbName" value="${esc(x['เจ้าหนี้'])}" placeholder="เช่น บัตรเครดิต ธนาคาร A">
  <div class="row"><div><label>ประเภทหนี้</label><select id="dbType">${opts(S.lists['ประเภทหนี้']||[],x['ประเภทหนี้'])}</select></div><div><label>เงินต้นเริ่มต้น</label><input id="dbPrin" type="number" inputmode="decimal" value="${esc(x['เงินต้นเริ่มต้น'])}"></div></div>
  <div class="row"><div><label>ดอกเบี้ย %/ปี</label><input id="dbRate" type="number" inputmode="decimal" value="${esc(x['ดอกเบี้ย (%/ปี)']??0)}"></div><div><label>ค่างวด/เดือน</label><input id="dbPay" type="number" inputmode="decimal" value="${esc(x['ค่างวด/เดือน'])}"></div></div>
  <div class="row"><div><label>วันที่เริ่ม</label><input id="dbStart" type="date" value="${esc(x['วันที่เริ่ม']||S.today)}"></div><div><label>ครบกำหนดทุกวันที่</label><input id="dbDay" type="number" min="1" max="31" value="${esc(x['ครบกำหนดทุกวันที่'])}"></div></div>
  <label>หมายเหตุ</label><input id="dbNote" value="${esc(x['หมายเหตุ'])}">
  <button class="btn full" onclick="saveDebt(${row||0})">💾 บันทึก</button>${row?`<button class="btn full ghost" onclick="delDebt(${row})">🗑️ ลบหนี้นี้ (รวมประวัติจ่าย)</button>`:''}`);}
function saveDebt(row){api('saveDebt',{_row:row||null,'เจ้าหนี้':$('dbName').value.trim(),'ประเภทหนี้':$('dbType').value,'เงินต้นเริ่มต้น':$('dbPrin').value,'ดอกเบี้ย (%/ปี)':$('dbRate').value,'ค่างวด/เดือน':$('dbPay').value,'วันที่เริ่ม':$('dbStart').value,'ครบกำหนดทุกวันที่':$('dbDay').value,'หมายเหตุ':$('dbNote').value}).then(()=>{closeModal();toast('บันทึกหนี้แล้ว');loadMoney();});}
function delDebt(row){if(confirm('ลบหนี้นี้และประวัติการจ่ายทั้งหมด?'))api('deleteDebt',row).then(()=>{closeModal();loadMoney();});}
/* summary + budget */
S.sumMode='week';let SUM=[];
function setSum(m){S.sumMode=m;document.querySelectorAll('#sumSeg button').forEach(b=>b.classList.toggle('on',b.dataset.m===m));loadSum();}
function periodLabel(k){if(S.sumMode==='year')return 'ปี '+(Number(k)+543);if(S.sumMode==='month')return thDate(k+'-01',{month:'short',year:'2-digit'});return thDate(k)+' – '+thDate(addDays(k,6));}
function loadSum(){api('getSummary',S.sumMode).then(rows=>{SUM=rows;
  $('sumTable').innerHTML=`<table class="sum"><tr><th>ช่วง</th><th>รายรับ</th><th>รายจ่าย</th><th>คงเหลือ</th></tr>${rows.map(r=>`<tr><td>${esc(periodLabel(r.k))}</td><td class="in-c">${baht(r.inc)}</td><td class="out-c">${baht(r.exp)}</td><td>${baht(r.inc-r.exp)}</td></tr>`).join('')}</table>`;
  $('sumPeriod').innerHTML=rows.map((r,i)=>`<option value="${i}">${esc(periodLabel(r.k))}</option>`).join('');renderSumCats();});
  api('getBudget').then(b=>{const [pn,pw,ps]=b.pct.map(Number);const base=b.inc;
    const line=(e,l,used,pct)=>{const lim=base*pct/100;const over=lim&&used>lim;return `<div style="margin:10px 0"><div class="row" style="justify-content:space-between"><span>${e} ${l} (${pct}%)</span><span class="money" style="flex:0;white-space:nowrap">${baht(used)} / ${baht(lim)}</span></div><div class="bar"><i style="width:${lim?Math.min(100,used/lim*100):0}%;${over?'background:#E2557F':''}"></i></div>${over?'<small class="out-c">เกินงบแล้วนะ 🥺</small>':''}</div>`;};
    $('budget').innerHTML=(base?'':'<div class="demo">ยังไม่มีรายรับเดือนนี้ – บันทึกรายรับก่อนเพื่อคำนวณงบ</div>')+`<small style="color:var(--muted)">รายรับเดือนนี้ ${baht(base)}</small>`+
      line('🏠','จำเป็น',b.need,pn)+line('🎀','อยากได้',b.want,pw)+line('🐷','ออม/ใช้หนี้',b.save,ps);
    const target=b.avgExp*b.efMonths;const pc=target?Math.min(100,b.efHave/target*100):0;
    $('efund').innerHTML=`<div class="grid"><div class="kpi c6"><div class="e">🛟</div><div class="l">มีแล้ว</div><div class="v">${baht(b.efHave)}</div></div><div class="kpi c4"><div class="e">🎯</div><div class="l">เป้าหมาย (${b.efMonths} เดือน)</div><div class="v">${baht(target)}</div></div></div>
      <div class="bar"><i style="width:${pc}%;background:linear-gradient(90deg,var(--mint-d),var(--sky-d))"></i></div>
      <small style="color:var(--muted)">${pc.toFixed(0)}% · ค่าใช้จ่ายเฉลี่ย ${baht(b.avgExp)}/เดือน (จาก${b.avgBasis}) · ออมเข้า “เงินสำรองฉุกเฉิน” ที่แท็บ ออม/หนี้${target>b.efHave?' · ขาดอีก '+baht(target-b.efHave):' · ครบแล้ว 🎉'}</small>`;});}
function renderSumCats(){const r=SUM[Number($('sumPeriod').value)||0];if(!r){$('sumCats').innerHTML='';return;}const c=Object.entries(r.cats).sort((a,b)=>b[1]-a[1]);const max=Math.max(1,...c.map(x=>x[1]));
  $('sumCats').innerHTML=c.map(x=>`<div style="margin:8px 0"><div class="row" style="justify-content:space-between"><span>${CAT_EMO[x[0]]||'•'} ${esc(x[0])}</span><span class="money" style="flex:0;white-space:nowrap">${baht(x[1])} · ${(x[1]/r.exp*100).toFixed(0)}%</span></div><div class="bar"><i style="width:${x[1]/max*100}%"></i></div></div>`).join('')||'<div class="empty">ไม่มีรายจ่ายช่วงนี้</div>';}
/* settings */
function loadSet(){const s=DB.settings;$('bN').value=s.budget[0];$('bW').value=s.budget[1];$('bS').value=s.budget[2];$('efM').value=s.efMonths;$('billDay').value=s.billDay;$('needCats').value=s.needCats.join(', ');
  $('listEdit').innerHTML=Object.keys(DB.lists).map((k,i)=>`<label>${esc(k)}</label><textarea data-k="${esc(k)}">${esc(DB.lists[k].join(', '))}</textarea>`).join('');
  let n=0;try{n=(localStorage.getItem(LS_KEY)||'').length;}catch(e){}$('storeInfo').textContent='ขนาดข้อมูล ~'+(n/1024).toFixed(1)+' KB · เก็บในเบราว์เซอร์นี้เท่านั้น ควรสำรองไฟล์เป็นระยะ';}
const splitList=v=>v.split(/[,\n]+/).map(x=>x.trim()).filter(Boolean);
function saveSettings(){const s=DB.settings;s.budget=[$('bN').value,$('bW').value,$('bS').value].map(Number);s.efMonths=Number($('efM').value)||6;s.billDay=Math.min(28,Math.max(1,Number($('billDay').value)||15));s.needCats=splitList($('needCats').value);persist();toast('บันทึกการตั้งค่าแล้ว ⚙️');}
function saveLists(){document.querySelectorAll('#listEdit textarea').forEach(t=>DB.lists[t.dataset.k]=splitList(t.value));persist();S.lists=DB.lists;refreshSelects();renderCats();LOCAL.getInit();toast('บันทึกรายการแล้ว 📝');}
function download(name,blob){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);}
const stamp=()=>todayStr_().replace(/-/g,'');
function backupJson(){download('home-backup-'+stamp()+'.json',new Blob([JSON.stringify(DB,null,1)],{type:'application/json'}));toast('ดาวน์โหลดไฟล์สำรองแล้ว 📦');}
function restoreJson(inp){const f=inp.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{try{const d=JSON.parse(rd.result);if(!d||!d.v||!Array.isArray(d.led))throw new Error('ไฟล์ไม่ถูกต้อง');
  if(!confirm('แทนที่ข้อมูลปัจจุบันทั้งหมดด้วยไฟล์นี้?'))return;localStorage.setItem(LS_KEY,JSON.stringify(d));location.reload();}catch(e){toast('😿 '+e.message);}finally{inp.value='';}};rd.readAsText(f);}
function exportXlsx(){if(typeof XLSX==='undefined')return toast('😿 โหลดไลบรารี Excel ไม่สำเร็จ (ต้องต่อเน็ต)');
  const strip=a=>a.map(r=>{const o={};Object.keys(r).forEach(k=>{if(k!=='_row')o[k]=typeof r[k]==='boolean'?(r[k]?'✔':''):r[k];});return o;});
  const wb=XLSX.utils.book_new();const add=(n,rows)=>XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows.length?strip(rows):[{'(ว่าง)':''}]),n);
  const d=LOCAL.getDashboard();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['ภาพรวม',d.today]].concat(d.kpi)),'Dashboard');
  add('บัญชีรับจ่าย',LOCAL.getLedger(1e9));add('คลังของ',LOCAL.getInventory());add('แพลนเมนู',clone(DB.menu).sort((a,b)=>a['วันที่'].localeCompare(b['วันที่'])));
  add('Todo งานบ้าน',LOCAL.getTodos());add('ชอปปิ้งลิสต์',LOCAL.getShopping());add('ค่าสาธารณูปโภค',LOCAL.getBills(true));add('เงินออม-ลงทุน',DB.sav);
  add('หนี้สิน',DB.debt.map(debtCalc));add('บันทึกจ่ายหนี้',DB.debtlog);
  ['week','month','year'].forEach((m,i)=>add(['สรุปรายสัปดาห์','สรุปรายเดือน','สรุปรายปี'][i],LOCAL.getSummary(m).map(r=>Object.assign({'ช่วง':r.k,'รายรับ':r.inc,'รายจ่าย':r.exp,'คงเหลือ':r.inc-r.exp},r.cats))));
  const b=LOCAL.getBudget();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['หมวด','%','งบ','ใช้จริง'],['จำเป็น',b.pct[0],b.inc*b.pct[0]/100,b.need],['อยากได้',b.pct[1],b.inc*b.pct[1]/100,b.want],['ออม/หนี้',b.pct[2],b.inc*b.pct[2]/100,b.save],[],['เงินสำรองฉุกเฉิน มีแล้ว',b.efHave],['เป้าหมาย',b.avgExp*b.efMonths]]),'งบประมาณ-สัดส่วน');
  XLSX.writeFile(wb,'ระบบจัดการบ้าน-'+stamp()+'.xlsx');toast('ส่งออก Excel แล้ว 📗');}
function wipeAll(){if(!confirm('ล้างข้อมูลทั้งหมด? (แนะนำให้สำรองก่อน)'))return;if(!confirm('แน่ใจนะ? กู้คืนไม่ได้'))return;localStorage.removeItem(LS_KEY);location.reload();}
function clearSample(){const T='ตัวอย่าง';let n=0;TABLES.forEach(t=>{const k=t==='debtlog'?'หมายเหตุการจ่าย':'หมายเหตุ';const b=DB[t].length;DB[t]=DB[t].filter(r=>String(r[k]||'').trim()!==T);n+=b-DB[t].length;});persist();toast('ลบตัวอย่าง '+n+' รายการ');boot();}
function loadSample(){if(DB.led.some(r=>r['หมายเหตุ']==='ตัวอย่าง'))return toast('มีข้อมูลตัวอย่างอยู่แล้ว');const T='ตัวอย่าง',t=S.today,d=n=>addDays(t,n);
  [[0,'รายรับ','เงินเดือน','เงินเดือน',30000,'โอน/พร้อมเพย์'],[0,'รายจ่าย','อาหารสด','ผัก หมู ไข่',430,'เงินสด'],[-1,'รายจ่าย','ของแห้ง','ข้าวสาร 5 กก.',220,'เงินสด'],[-3,'รายจ่าย','เดินทาง','น้ำมันรถ',800,'บัตรเดบิต'],[-5,'รายจ่าย','อื่นๆ','ของขวัญวันเกิด',350,'เงินสด'],[-35,'รายจ่าย','อาหารสด','ตลาดนัด',900,'เงินสด']]
    .forEach(x=>LOCAL.addLedger({date:d(x[0]),type:x[1],category:x[2],item:x[3],amount:x[4],method:x[5],note:T}));
  [['นมจืด','ตู้เย็นเทา',2,'กล่อง',d(2),2],['ไข่ไก่','ตู้เย็นเทา',10,'ฟอง','',6],['ข้าวสาร','ตู้กับข้าว/ของแห้ง',1,'ถุง','',1],['ยาสีฟัน','ห้องน้ำ',0,'ชิ้น','',1],['ผงซักฟอก','อุปกรณ์ซักผ้า',3,'ถุง','',1]]
    .forEach(x=>LOCAL.saveInventory({'รายการ':x[0],'ที่เก็บ':x[1],'จำนวน':x[2],'หน่วย':x[3],'วันที่ซื้อ':t,'วันหมดอายุ':x[4],'สต็อกขั้นต่ำ':x[5],'หมายเหตุ':T}));
  LOCAL.saveMenu({'วันที่':t,'มื้อเช้า':'ข้าวต้มหมู','มื้อกลางวัน':'กะเพราไก่ไข่ดาว','มื้อเย็น':'แกงจืดเต้าหู้','วัตถุดิบที่ต้องใช้':'หมูสับ, เต้าหู้, ใบกะเพรา','หมายเหตุ':T});
  [['ล้างจาน/เก็บครัว','ครัว','รายวัน','ทุกคน',t],['ทิ้งขยะ','ขยะ','รายวัน','พ่อ',t],['ซักผ้า','ซักรีด','รายสัปดาห์','แม่',d(2)],['ล้างแอร์','ทำความสะอาด','ครั้งเดียว','พ่อ',d(-2)]]
    .forEach(x=>LOCAL.saveTodo({'งาน':x[0],'หมวด':x[1],'ความถี่':x[2],'ผู้รับผิดชอบ':x[3],'กำหนดทำ':x[4],'หมายเหตุ':T}));
  LOCAL.saveShopping({'รายการ':'น้ำยาล้างจาน','ที่เก็บ/หมวด':'ตู้กับข้าว/ของแห้ง','จำนวน':1,'ราคาประมาณ/หน่วย':45,'หมายเหตุ':T});
  LOCAL.addSaving({date:t,type:'เงินสำรองฉุกเฉิน',dir:'ฝาก',amount:3000,detail:'บัญชีออมทรัพย์',note:T});LOCAL.addSaving({date:t,type:'กองทุนรวม',dir:'ฝาก',amount:2000,detail:'SSF',note:T});
  LOCAL.saveDebt({'เจ้าหนี้':'บัตรเครดิต (ตัวอย่าง)','ประเภทหนี้':'บัตรเครดิต','เงินต้นเริ่มต้น':20000,'ดอกเบี้ย (%/ปี)':16,'ค่างวด/เดือน':2000,'วันที่เริ่ม':d(-60),'หมายเหตุ':T});
  LOCAL.addDebtPayment({creditor:'บัตรเครดิต (ตัวอย่าง)',amount:2000,date:d(-30),note:T});
  toast('ใส่ข้อมูลตัวอย่างแล้ว ✨ (ลบได้ด้วยปุ่ม ลบเฉพาะตัวอย่าง)');boot();}
/* ---------------- Dashboard v3 (crayon visuals) ---------------- */
const CRAYON=['#F2789F','#5FA2DD','#5DBB8F','#F59A5B','#9A7FD1','#E8C33A','#E66B6B','#4DB6C8','#C98ED6','#9AAE5A'];
const emptyMsg=(e,t)=>`<div class="empty"><span class="big">${e}</span>${t}</div>`;
function donutSVG(data){const tot=data.reduce((s,d)=>s+d[1],0);const R=58,C=2*Math.PI*R;let off=0;
  const arcs=data.map((d,i)=>{const len=d[1]/tot*C;const a=`<circle r="${R}" cx="85" cy="85" fill="none" stroke="${CRAYON[i%CRAYON.length]}" stroke-width="30" stroke-dasharray="${Math.max(0,len-2)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 85 85)"/>`;off+=len;return a;}).join('');
  return `<svg viewBox="0 0 170 170" role="img" aria-label="สัดส่วนรายจ่าย"><g filter="url(#crayon)">${arcs}<circle r="74" cx="85" cy="85" fill="none" stroke="#6b5546" stroke-width="2" opacity=".5"/><circle r="42" cx="85" cy="85" fill="none" stroke="#6b5546" stroke-width="2" opacity=".5"/></g>
  <text x="85" y="80" text-anchor="middle" font-family="Itim" font-size="12" fill="#8F7F72">รวม</text><text x="85" y="98" text-anchor="middle" font-family="Itim" font-size="15" fill="#4B3B33">${esc(baht(tot).replace(' ฿',''))}฿</text></svg>`;}
function loadDash(){
  api('getDashboard').then(d=>{
    const cls=['c1','c2','c3','c4','c5','c6'];
    $('kpis').innerHTML=d.kpi.map((k,i)=>`<div class="kpi ${cls[i%6]}"><div class="e">${KPI_EMO[i]||'✨'}</div><div class="l">${esc(k[0])}</div><div class="v">${esc(k[1])}</div></div>`).join('');
    // income vs expense
    const m=d.today.slice(0,7);const L=DB.led.filter(r=>String(r['วันที่']).startsWith(m));
    const inc=L.filter(r=>r['ประเภท']==='รายรับ').reduce((s,r)=>s+num_(r['จำนวนเงิน (บาท)']),0),exp=L.filter(r=>r['ประเภท']==='รายจ่าย').reduce((s,r)=>s+num_(r['จำนวนเงิน (บาท)']),0);
    const mx=Math.max(inc,exp,1);
    $('vIncExp').innerHTML=(inc||exp)?`<div class="vs"><div class="vrow"><span class="lbl">💰 รายรับ</span><div class="bar g"><i style="width:${inc/mx*100}%"></i></div><span class="money in-c">${baht(inc)}</span></div>
      <div class="vrow"><span class="lbl">💸 รายจ่าย</span><div class="bar"><i style="width:${exp/mx*100}%"></i></div><span class="money out-c">${baht(exp)}</span></div></div>
      <div class="net">${inc-exp>=0?'เหลือเก็บ '+baht(inc-exp)+' เก่งมาก 🌟':'ใช้เกินไป '+baht(exp-inc)+' ค่อยๆ ประหยัดนะ 🥺'}</div>`
      :emptyMsg('📒','เดือนนี้ยังไม่ได้จดรายรับ-รายจ่ายเลย<br>ลองจดรายการแรกที่แท็บ 💸 ได้นะ');
    // donut
    const cats=d.cats.filter(c=>c[1]>0);let dc=cats.slice(0,6);if(cats.length>6)dc.push(['อื่นๆ (รวม)',cats.slice(6).reduce((s,c)=>s+c[1],0)]);
    const tot=dc.reduce((s,c)=>s+c[1],0);
    $('dCats').innerHTML=dc.length?`<div class="donut-wrap">${donutSVG(dc)}<div class="legend">${dc.map((c,i)=>`<div><i style="background:${CRAYON[i%CRAYON.length]}"></i>${CAT_EMO[c[0]]||'•'} ${esc(c[0])}<span class="money">${Math.round(c[1]/tot*100)}%</span></div>`).join('')}</div></div>`
      :emptyMsg('🍩','ยังไม่มีรายจ่ายเดือนนี้ โดนัทเลยยังว่างอยู่~');
    // goals
    const b=LOCAL.getBudget();const goal=b.avgExp*b.efMonths;const efp=goal>0?Math.min(100,b.efHave/goal*100):0;
    const debts=DB.debt.map(debtCalc);const dStart=debts.reduce((s,x)=>s+num_(x['เงินต้นเริ่มต้น']),0),dRem=debts.reduce((s,x)=>s+x['เงินต้นคงเหลือ'],0);
    const dp=dStart>0?Math.min(100,(dStart-dRem)/dStart*100):0;
    const ef=goal>0?`<div class="statbox"><div class="top"><b>🛟 เงินสำรองฉุกเฉิน</b><span class="money">${Math.round(efp)}%</span></div><div class="bar g"><i style="width:${efp}%"></i></div>
      <small>มีแล้ว ${baht(b.efHave)} จากเป้า ${baht(goal)} (${b.efMonths} เดือน)${efp>=100?' 🎉 ครบแล้ว!':''}</small></div>`
      :`<div class="statbox"><div class="top"><b>🛟 เงินสำรองฉุกเฉิน</b></div><small>จดรายจ่ายสักหน่อยก่อน แล้วจะคำนวณเป้าให้นะ 🐣${b.efHave?' (มีแล้ว '+baht(b.efHave)+')':''}</small></div>`;
    const db=dStart>0?`<div class="statbox"><div class="top"><b>💳 ปลดหนี้ไปแล้ว</b><span class="money">${Math.round(dp)}%</span></div><div class="bar b"><i style="width:${dp}%"></i></div>
      <small>เหลือ ${baht(dRem)} จาก ${baht(dStart)}${dRem<=0?' 🥳 ปลอดหนี้!':' สู้ๆ 💪'}</small></div>`
      :`<div class="statbox"><div class="top"><b>💳 หนี้สิน</b></div><small>ไม่มีหนี้ที่บันทึกไว้ สบายใจ ☁️</small></div>`;
    $('vGoals').innerHTML=ef+db;
    // low stock chips
    $('dLow').innerHTML=d.low.length?`<div class="chips">${d.low.map(l=>`<span class="pchip ${/หมดอายุ|หมดสต็อก/.test(l[4])?'bad':l[4]==='ใกล้หมดอายุ'?'orange':''}">${LOC_EMO[l[2]]||'📦'} ${esc(l[1])} · ${esc(l[4])}</span>`).join('')}</div>`:emptyMsg('🥰','ของในบ้านครบทุกอย่าง');
    const mn=d.menu;
    $('dMenu').innerHTML=mn&&(mn['มื้อเช้า']||mn['มื้อกลางวัน']||mn['มื้อเย็น'])?
      `<div class="meals"><div><span>🌅</span><em>เช้า</em>${esc(mn['มื้อเช้า']||'-')}</div><div><span>🌞</span><em>กลางวัน</em>${esc(mn['มื้อกลางวัน']||'-')}</div><div><span>🌙</span><em>เย็น</em>${esc(mn['มื้อเย็น']||'-')}</div></div>`
      :emptyMsg('🍙','ยังไม่ได้วางเมนูวันนี้ ไปที่แท็บ 🍱 เมนู ได้เลย');
    $('dTodo').innerHTML=d.todos.length?d.todos.map(todoRow).join(''):emptyMsg('🎉','เย้! ไม่มีงานค้างวันนี้');
    $('dBills').innerHTML=d.bills.length?d.bills.map(billRow).join(''):emptyMsg('🎈','ไม่มีบิลค้าง');
  });
}
if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('sw.js').catch(()=>{});
boot();
