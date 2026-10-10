/* ===== v4: bottom nav, gallery, members, weekly chart, receipt scanner ===== */
S.page='dash';
const NAV_OF={dash:'dash',ledger:'ledger',scan:'scan',members:'members'};
function go(p){S.page=p;const nv=NAV_OF[p]||'all';
  document.querySelectorAll('#tabs .tab').forEach(x=>x.classList.toggle('on',x.dataset.p===nv));
  document.querySelectorAll('.page').forEach(x=>x.classList.toggle('on',x.id==='p-'+p));
  window.scrollTo(0,0);(LOADERS[p]||function(){})();}
$('tabs').addEventListener('click',e=>{const b=e.target.closest('.tab');if(!b)return;if(b.dataset.p==='scan'){if(S.page!=='scan')go('scan');startScan();return;}go(b.dataset.p);});
const sumAmt=rows=>rows.reduce((s,r)=>s+num_(r['จำนวนเงิน (บาท)']),0);
const MEM=()=>DB.members||[];
const memOf=n=>MEM().find(m=>m.name===n);
function avatar(n,cls){const m=typeof n==='object'?n:memOf(n);if(!m)return `<span class="av ${cls||''}">🏠</span>`;
  return `<span class="av ${cls||''}">${m.photo?`<img src="${m.photo}" alt="">`:esc(m.emoji||'🙂')}</span>`;}

/* ---------- weekly chart ---------- */
function weekChart(){const t=S.today||todayStr_(),mon=mondayOf(t),pm=addDays(mon,-7);const E=DB.led.filter(r=>r['ประเภท']==='รายจ่าย');
  const by={};E.forEach(r=>by[r['วันที่']]=(by[r['วันที่']]||0)+num_(r['จำนวนเงิน (บาท)']));
  const cur=[...Array(7)].map((_,i)=>by[addDays(mon,i)]||0),prev=[...Array(7)].map((_,i)=>by[addDays(pm,i)]||0);
  const tc=cur.reduce((a,b)=>a+b,0),tp=prev.reduce((a,b)=>a+b,0),mx=Math.max(1,...cur,...prev);
  const W=280,H=150,bw=W/7,lab=['จ','อ','พ','พฤ','ศ','ส','อา'],ti=(new Date(pd(t)).getDay()+6)%7;
  const bars=cur.map((v,i)=>{const x=i*bw,hp=prev[i]/mx*108,hc=v/mx*108;
    return `<rect x="${x+bw*.12}" y="${124-hp}" width="${bw*.42}" height="${hp}" rx="3" fill="url(#hatchB)" stroke="#6F8FAF" stroke-width="2"/>
    <rect x="${x+bw*.36}" y="${124-hc}" width="${bw*.5}" height="${hc}" rx="4" fill="url(#hatchR)" stroke="#5A3A26" stroke-width="2.4"/>
    <text x="${x+bw/2}" y="143" text-anchor="middle" font-family="Itim" font-size="13" fill="${i===ti?'#A0522D':'#5A3A26'}">${lab[i]}</text>`;}).join('');
  const diff=tp?Math.round((tc-tp)/tp*100):null;
  return `<div class="wkchart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="รายจ่ายสัปดาห์นี้"><defs>
  <pattern id="hatchR" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><rect width="6" height="6" fill="#E7A4A0"/><line x1="0" y1="0" x2="0" y2="6" stroke="#A0522D" stroke-width="4"/></pattern>
  <pattern id="hatchB" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="6" height="6" fill="#E3ECF2"/><line x1="0" y1="0" x2="0" y2="6" stroke="#A9C1D6" stroke-width="2.5"/></pattern></defs>
  <g filter="url(#crayon)"><path d="M2 125 Q140 122 278 126" stroke="#5A3A26" stroke-width="2.5" fill="none"/>${bars}</g></svg>
  <div class="wkleg"><span><i style="background:#E7A4A0"></i>สัปดาห์นี้ <b class="money">${baht(tc)}</b></span><span><i style="background:#E3ECF2;border-color:#6F8FAF"></i>สัปดาห์ก่อน ${baht(tp)}</span>
  ${diff===null?'':`<span class="${diff>0?'out-c':'in-c'}">${diff>0?'▲':'▼'} ${Math.abs(diff)}%</span>`}</div></div>`;}

/* ---------- member summaries ---------- */
function memTotals(type,key,m){const rows=DB.led.filter(r=>r['ประเภท']===type&&String(r['วันที่']).startsWith(m));const g={};
  rows.forEach(r=>{const k=r[key]||'(ไม่ระบุ)';g[k]=(g[k]||0)+num_(r['จำนวนเงิน (บาท)']);});return Object.entries(g).sort((a,b)=>b[1]-a[1]);}
function memBars(data,cls,emptyTxt){if(!data.length)return emptyMsg('👀',emptyTxt);const mx=Math.max(...data.map(d=>d[1]),1);
  return data.map(d=>`<div class="mbar">${avatar(d[0],'s')}<span style="width:70px;font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(d[0])}</span><div class="bar ${cls}"><i style="width:${d[1]/mx*100}%"></i></div><span class="money">${baht(d[1])}</span></div>`).join('');}
const curMonth=()=>(S.today||todayStr_()).slice(0,7);

const _loadDash=loadDash;
loadDash=function(){_loadDash();$('vWeek').innerHTML=weekChart();
  $('dMem').innerHTML=memBars(memTotals('รายจ่าย','ของใคร/จ่ายให้ใคร',curMonth()),'',"ยังไม่มีรายจ่ายที่ระบุสมาชิก");};

/* ---------- ledger member pickers ---------- */
function memSelect(id,label,sel){return `<label>${label}</label><div class="mpick"><span id="${id}Av">${avatar(sel,'s')}</span><select id="${id}" onchange="$('${id}Av').innerHTML=avatar(this.value,'s')">
  <option value="">— ไม่ระบุ —</option>${MEM().map(m=>`<option value="${esc(m.name)}" ${m.name===sel?'selected':''}>${esc(m.emoji||'')} ${esc(m.name)}</option>`).join('')}</select></div>`;}
function renderMemBox(){const b=$('lMemBox');if(!b)return;
  b.innerHTML=S.type==='รายรับ'?memSelect('lFrom','💰 เงินจากใคร',''):`<div class="row"><div>${memSelect('lFor','🎁 ของใคร/จ่ายให้ใคร','')}</div><div>${memSelect('lPaid','👛 จ่ายโดย','')}</div></div>`;}
const _setType=setType;setType=function(t){_setType(t);renderMemBox();};
saveLedger=function(){const e={date:$('lDate').value,type:S.type,category:S.cat,item:$('lItem').value,amount:$('lAmt').value,method:$('lMethod').value,note:$('lNote').value,
  from:$('lFrom')?$('lFrom').value:'',forWho:$('lFor')?$('lFor').value:'',paidBy:$('lPaid')?$('lPaid').value:''};
  if(!Number(e.amount))return toast('ใส่จำนวนเงินก่อนนะ 💕');
  api('addLedger',e).then(()=>{toast('บันทึกแล้ว ✅ '+baht(e.amount));$('lAmt').value='';$('lItem').value='';$('lNote').value='';renderMemBox();loadLedger();});};
function ledRow(r){const inc=r['ประเภท']==='รายรับ',who=inc?r['เงินจากใคร']:r['ของใคร/จ่ายให้ใคร'];
  return `<div class="item${r._row===HILITE?' hilite':''}" data-row="${r._row}">${r['ใบเสร็จ']?`<img class="thumb" src="${r['ใบเสร็จ']}" alt="">`:`<div class="ico" style="background:${inc?'var(--mint)':'var(--pink)'}">${CAT_EMO[r['หมวดหมู่']]||'🏷️'}</div>`}
  <div class="t"><b>${esc(r['รายการ']||r['หมวดหมู่'])}</b><small>${thDate(r['วันที่'])} · ${esc(r['หมวดหมู่'])}${who?' · '+(inc?'จาก ':'ของ ')+esc(who):''}${r['จ่ายโดย']?' · จ่ายโดย '+esc(r['จ่ายโดย']):''}${r['วิธีชำระ']?' · '+esc(r['วิธีชำระ']):''}</small></div>
  ${who?avatar(who,'s'):''}<div class="money ${inc?'in-c':'out-c'}">${inc?'+':'−'}${baht(r['จำนวนเงิน (บาท)'])}</div>
  <button class="btn sm ghost" onclick="delLedger(${r._row})">🗑️</button></div>`;}
let HILITE=0;
loadLedger=function(){api('getLedger',Number($('lLimit').value)||30).then(rows=>{$('lList').innerHTML=rows.length?rows.map(ledRow).join(''):'<div class="empty">ยังไม่มีรายการ</div>';
  if(HILITE){const el=document.querySelector('#lList .hilite');if(el)setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'center'}),80);setTimeout(()=>{HILITE=0;},4000);}});};

/* ---------- members page ---------- */
function loadMembers(){$('memList').innerHTML=MEM().map(m=>`<div class="mem" onclick="editMember(${m.id})">${avatar(m)}<div>${esc(m.name)}</div><small>${m.kind==='business'?'🏢 กิจการ':'บุคคล'}</small></div>`).join('')||emptyMsg('🏠','ยังไม่มีสมาชิก');
  $('memSpend').innerHTML=memBars(memTotals('รายจ่าย','ของใคร/จ่ายให้ใคร',curMonth()),'',"ยังไม่มีรายจ่ายที่ระบุว่าเป็นของใคร");
  $('memInc').innerHTML=memBars(memTotals('รายรับ','เงินจากใคร',curMonth()),'g',"ยังไม่มีรายรับที่ระบุแหล่งที่มา");}
const EMOJIS=['👨','👩','👦','👧','🧒','👶','👴','👵','🧑','👱','🧔','👸','🐶','🐱','🐰','🐻','🐼','🐥','📚','🏢','🏪','💼','⭐','🌸'];
let MEMPHOTO='',MEMEMO='';
function editMember(id){const m=MEM().find(x=>x.id===id)||{name:'',emoji:'🙂',photo:'',kind:'person'};MEMPHOTO=m.photo||'';MEMEMO=m.emoji||'🙂';
  openModal(`<h3>${id?'✏️ แก้ไขสมาชิก':'👋 เพิ่มสมาชิก'}</h3><div style="text-align:center" id="mPrev">${avatar(m)}</div>
  <label>ชื่อ</label><input id="mName" value="${esc(m.name)}" placeholder="เช่น น้องมิว">
  <label>ประเภท</label><select id="mKind"><option value="person" ${m.kind!=='business'?'selected':''}>บุคคล</option><option value="business" ${m.kind==='business'?'selected':''}>กิจการ/ธุรกิจ</option></select>
  <label>อีโมจิ</label><div class="avpick">${EMOJIS.map(e=>`<button type="button" class="${e===MEMEMO?'on':''}" onclick="pickEmo(this,'${e}')">${e}</button>`).join('')}</div>
  <label>หรือรูปถ่าย</label><div class="row"><button class="btn sm lav" onclick="$('mPhoto').click()">📷 เลือกรูป</button><button class="btn sm ghost" onclick="MEMPHOTO='';prevMem()">ลบรูป</button></div>
  <input type="file" id="mPhoto" accept="image/*" style="display:none" onchange="memPhoto(this)">
  <button class="btn full" onclick="saveMember(${id||0})">💾 บันทึก</button>${id?`<button class="btn full ghost" style="color:#A0522D" onclick="delMember(${id})">🗑️ ลบสมาชิก</button>`:''}
  <button class="btn full ghost" onclick="closeModal()">ยกเลิก</button>`);}
function prevMem(){$('mPrev').innerHTML=avatar({emoji:MEMEMO,photo:MEMPHOTO});}
function pickEmo(b,e){MEMEMO=e;document.querySelectorAll('.avpick button').forEach(x=>x.classList.toggle('on',x===b));prevMem();}
async function decodeImg(file){
  if(window.createImageBitmap){try{const bm=await createImageBitmap(file,{imageOrientation:'from-image'});return {src:bm,w:bm.width,h:bm.height};}catch(e){try{const bm=await createImageBitmap(file);return {src:bm,w:bm.width,h:bm.height};}catch(e2){}}}
  return await new Promise((res,rej)=>{const img=new Image(),u=URL.createObjectURL(file);img.onload=()=>{res({src:img,w:img.naturalWidth,h:img.naturalHeight});setTimeout(()=>URL.revokeObjectURL(u),1000);};
    img.onerror=()=>{URL.revokeObjectURL(u);rej(new Error(/heic|heif/i.test(file.type+file.name)?'เปิดรูป HEIC ไม่ได้ในเบราว์เซอร์นี้ ลองตั้งกล้องเป็น “เข้ากันได้มากที่สุด” หรือแคปหน้าจอรูปแทน':'อ่านรูปไม่ได้'));};img.src=u;});}
async function compressImg(file,max,q){const d=await decodeImg(file);const s=Math.min(1,max/Math.max(d.w,d.h));
  const c=document.createElement('canvas');c.width=Math.max(1,Math.round(d.w*s));c.height=Math.max(1,Math.round(d.h*s));const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(d.src,0,0,c.width,c.height);
  if(d.src.close)try{d.src.close();}catch(e){}return {url:c.toDataURL('image/jpeg',q),canvas:c};}
function squareThumb(file,size){return compressImg(file,600,.9).then(({canvas})=>{const c=document.createElement('canvas');c.width=c.height=size;const s=Math.min(canvas.width,canvas.height);
  c.getContext('2d').drawImage(canvas,(canvas.width-s)/2,(canvas.height-s)/2,s,s,0,0,size,size);return c.toDataURL('image/jpeg',.72);});}
function memPhoto(inp){const f=inp.files[0];if(!f)return;squareThumb(f,128).then(u=>{MEMPHOTO=u;prevMem();}).catch(e=>toast('😿 '+e.message));inp.value='';}
function saveMember(id){api('saveMember',{id:id||null,name:$('mName').value,kind:$('mKind').value,emoji:MEMEMO,photo:MEMPHOTO}).then(()=>{closeModal();S.lists=DB.lists;toast('บันทึกสมาชิกแล้ว 💕');loadMembers();renderMemBox();});}
function delMember(id){if(!confirm('ลบสมาชิกนี้? (รายการบัญชีเดิมยังอยู่)'))return;api('deleteMember',id).then(()=>{closeModal();toast('ลบแล้ว');loadMembers();renderMemBox();});}

/* ---------- gallery ---------- */
const SCRIB=c=>`<svg class="scrib" viewBox="0 0 80 80"><path d="M8 60 C20 20,30 70,40 30 S60 60,72 18 M10 72 C30 50,50 76,74 46" stroke="${c}" stroke-width="6" fill="none" stroke-linecap="round"/></svg>`;
function loadAll(){const t=S.today||todayStr_(),m=t.slice(0,7);const inv=LOCAL.getInventory(),low=inv.filter(x=>x['สถานะ']!=='ปกติ').length;
  const mn=LOCAL.getMenu(t,1)[0],todos=LOCAL.getTodos().filter(x=>x['สถานะ']==='วันนี้'||x['สถานะ']==='เกินกำหนด').length;
  const shop=DB.shop.filter(x=>!x['ซื้อแล้ว']).length,bills=LOCAL.getBills().filter(b=>!b['ชำระแล้ว']).length;const sb=savBalances(),sav=sb[sb.length-1][1];
  const exp=sumAmt(DB.led.filter(r=>r['ประเภท']==='รายจ่าย'&&String(r['วันที่']).startsWith(m)));
  const C=[['inv','🧺','คลังของ',`${inv.length} รายการ${low?` · ⚠️ ใกล้หมด ${low}`:''}`,'#F3DDB0','#A0522D'],
   ['menu','🍱','เมนู',mn['มื้อเย็น']?'เย็นนี้: '+esc(mn['มื้อเย็น']):'ยังไม่วางเมนูวันนี้','#F2CDBF','#6F8FAF'],
   ['todo','🧹','งานบ้าน',todos?`ค้างวันนี้ ${todos} งาน`:'วันนี้เคลียร์แล้ว 🎉','#D9E4C8','#C08A4A'],
   ['shop','🛒','ชอปปิ้ง',shop?`ต้องซื้อ ${shop} อย่าง`:'ลิสต์ว่าง','#D6E2EA','#A0522D'],
   ['bills','🧾','บิล',bills?`ค้างจ่าย ${bills} บิล`:'จ่ายครบแล้ว','#EFD3B4','#7FA36B'],
   ['money','🐷','ออม/หนี้','ออมสะสม '+baht(sav),'#F2D0CF','#6F8FAF'],
   ['sum','📊','สรุป/งบ','ใช้ไปเดือนนี้ '+baht(exp),'#E2D6E6','#E3B26B'],
   ['set','⚙️','ตั้งค่า','สำรอง · Excel · ล็อก','#EDE3D3','#A0522D']];
  $('gallery').innerHTML=C.map(c=>`<button class="gcard" style="background:${c[4]}" onclick="go('${c[0]}')"><span class="ge">${c[1]}</span><b>${c[2]}</b><small>${c[3]}</small>${SCRIB(c[5])}</button>`).join('');}
const _loadSet=loadSet;loadSet=function(){_loadSet();showGemKey();};
Object.assign(LOADERS,{set:loadSet,dash:loadDash,ledger:loadLedger,members:loadMembers,all:loadAll,scan:loadScan});

/* ---------- receipt parser ---------- */
const TH_MON={'ม.ค':1,'มกรา':1,'ก.พ':2,'กุมภา':2,'มี.ค':3,'มีนา':3,'เม.ย':4,'เมษา':4,'พ.ค':5,'พฤษภา':5,'มิ.ย':6,'มิถุนา':6,'ก.ค':7,'กรกฎา':7,'ส.ค':8,'สิงหา':8,'ก.ย':9,'กันยา':9,'ต.ค':10,'ตุลา':10,'พ.ย':11,'พฤศจิกา':11,'ธ.ค':12,'ธันวา':12,
  jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
function normYear(y){y=Number(y);if(y<100)y=y>=50?2500+y:2000+y;if(y>2400)y-=543;return y;}
function okDate(y,m,d){if(!(m>=1&&m<=12&&d>=1&&d<=31&&y>=2000&&y<=2100))return '';return y+'-'+pad(m)+'-'+pad(d);}
const STORES=[[/7\s*-?\s*e[l1]e[vu]en|เซเว่น|cp\s*all/i,'7-Eleven'],[/lotus|โลตัส/i,"Lotus's"],[/makro|แม็?คโคร/i,'Makro'],[/big\s*c|บิ๊กซี/i,'Big C'],[/tops|ท็อปส์/i,'Tops'],
  [/family\s*mart|แฟมิลี่/i,'FamilyMart'],[/lawson|ลอว์สัน/i,'Lawson 108'],[/watsons|วัตสัน/i,'Watsons'],[/boots|บู๊ทส์/i,'Boots'],[/ptt|ปตท/i,'PTT Station'],[/bangchak|บางจาก/i,'Bangchak'],
  [/shell|เชลล์/i,'Shell'],[/home\s*pro|โฮมโปร/i,'HomePro'],[/villa|วิลล่า/i,'Villa Market'],[/gourmet/i,'Gourmet Market'],[/cj\s*(more|express)?|ซีเจ/i,'CJ'],[/mr\.?\s*diy/i,'MR. DIY'],[/daiso|ไดโซ/i,'Daiso']];
function knownStore(t){for(const [re,n] of STORES)if(re.test(t))return n;return '';}
function parseReceipt(raw){
  const txt=String(raw||'').replace(/\u0E4D\u0E32/g,'\u0E33').replace(/[๐-๙]/g,c=>'๐๑๒๓๔๕๖๗๘๙'.indexOf(c)).replace(/\r/g,'');
  const lines=txt.split('\n').map(l=>l.replace(/\s+/g,' ').trim()).filter(l=>l.length>1);
  const out={date:'',store:'',total:0,items:[],raw:txt};let dl='';
  // date (first valid; supports BE yyyy, yy, Thai/English month names)
  for(const l of lines){let m=l.match(/\b(20\d{2}|25\d{2})[\/\-.](\d{1,2})[\/\-.](\d{1,2})\b/),r='';
    if(m)r=okDate(normYear(m[1]),+m[2],+m[3]);
    if(!r&&(m=l.match(/(?:^|\D)(\d{1,2})\s?[\/\-.]\s?(\d{1,2})\s?[\/\-.]\s?(\d{4}|\d{2})(?!\d)/)))r=okDate(normYear(m[3]),+m[2],+m[1]);
    if(!r&&(m=l.match(/\b(\d{1,2})\s*([ก-๙]{1,3}\.\s?[ก-๙]\.?|[ก-๙]{4,9}|[A-Za-z]{3,9})\.?\s*(\d{4}|\d{2})\b/))){const key=m[2].replace(/\s/g,'').replace(/\.$/,'').toLowerCase();
      const k=Object.keys(TH_MON).find(x=>key.startsWith(x.toLowerCase())||key.startsWith(x.replace('.','')));if(k)r=okDate(normYear(m[3]),TH_MON[k],+m[1]);}
    if(r){out.date=r;dl=l;break;}}
  const amtRe=/(\d{1,3}(?:,\d{3})+|\d+)\s?[.,]\s?(\d{2})(?!\d)/g;
  const amts=l=>{const a=[];let m;amtRe.lastIndex=0;while((m=amtRe.exec(l)))a.push(Number(m[1].replace(/,/g,'')+'.'+m[2]));
    if(!a.length){const t=l.match(/(?:^|\s)(\d{1,6})\s*(?:บาท|฿|-)?\s*$/);if(t&&!/\d{7,}/.test(l))a.push(Number(t[1]));}return a;};
  const TOT=/(ยอดรวม|รวมทั้งสิ้น|[ยมบ]อดสุทธิ|สุทธิ|รวมเงิน|ยอดชำระ|ทั้งสิ้น|grand\s*total|total|net|amount\s*due|รวม)/i;
  const STRONG=/(สุทธิ|ยอดชำระ|รวมทั้งสิ้น|ทั้งสิ้น|grand\s*total|net\s*total|amount\s*due|total\s*due)/i;
  const NOT=/(ภาษี|vat|ทอน|change|เงินสด|cash|รับเงิน|ส่วนลด|discount|ก่อนภาษี|จำนวนชิ้น|qty|items?\s*:|วอลเล็ท|wallet|true\s*money|ทรู|บัตร|card)/i;
  const SKIP=/(โทร|tel|เลขประจำตัว|tax|เลขที่|no\.|pos|วันที่|date|เวลา|time|ใบเสร็จ|receipt|invoice|ขอบคุณ|thank|สาขา|branch|พนักงาน|cashier|ที่อยู่|www|@\w|id#|#\d|member|สมาชิก|แต้ม|คะแนน|point|stamp|หมดอายุ|counter|service|payat)/i;
  let totIdx=-1,best=0,strong=0,sIdx=-1;
  lines.forEach((l,i)=>{if(TOT.test(l)&&!NOT.test(l)){const a=amts(l).filter(v=>v>0);if(a.length){const v=Math.max(...a);if(STRONG.test(l)&&!strong){strong=v;sIdx=i;}if(v>=best){best=v;if(totIdx<0)totIdx=i;}}}});
  if(strong){best=strong;totIdx=totIdx<0?sIdx:Math.min(totIdx,sIdx);}
  if(!best){const all=lines.filter(l=>!SKIP.test(l)).flatMap(amts);best=all.length?Math.max(...all):0;}
  out.total=best;
  out.store=knownStore(lines.slice(0,6).join(' '));
  if(!out.store)for(const l of lines.slice(0,5)){const letters=(l.match(/[A-Za-zก-๙]/g)||[]).length;if(letters>=3&&!SKIP.test(l)&&!TOT.test(l)&&!/\d{4,}/.test(l)){out.store=l.replace(/[|*=_~]+/g,'').trim();break;}}
  const end=totIdx>=0?totIdx:lines.length;
  lines.slice(0,end).forEach((l,li)=>{if(li<2&&knownStore(l))return;if(l===dl||SKIP.test(l)||TOT.test(l)||NOT.test(l))return;const a=amts(l);if(!a.length)return;
    const price=a[a.length-1];if(!(price>0)||(best&&price>best*1.01))return;
    let qty=1,s=l;const q=s.match(/^([0-9lIi|!]{1,2})\s+(?=\D)/);if(q){const n=Number(q[1].replace(/[lIi|!]/g,'1'));if(n>0&&n<50)qty=n;s=s.slice(q[0].length);}
    let name=s.replace(amtRe,'').replace(/(?:^|\s)\d{1,6}\s*(?:บาท|฿|-)?\s*[NnTtVv]?\s*$/,'').replace(/\b\d+\s*[xX×@]\s*/g,'').replace(/^[@©®"'`.,:;\-\s]+/,'').replace(/[@฿:|*]+/g,' ').replace(/\s+/g,' ').trim();
    const letters=(name.match(/[A-Za-zก-๙]/g)||[]).length;if(letters<2)return;out.items.push({name,qty,price});});
  return out;}
function guessCat(p){const s=(p.store+' '+p.items.map(i=>i.name).join(' ')).toLowerCase();
  const R=[['อาหารสด',/ผัก|หมู|ไก่|ไข่|ปลา|กุ้ง|เนื้อ|ผลไม้|ตลาด|makro|แม็คโคร|นม/],['ของใช้ห้องน้ำ',/สบู่|แชมพู|ยาสีฟัน|ทิชชู|กระดาษชำระ|watsons|boots/],['ซักผ้า',/ผงซักฟอก|น้ำยาปรับผ้า|ซักผ้า/],
   ['ค่าน้ำดื่ม',/น้ำดื่ม|water/],['ค่าไฟ',/การไฟฟ้า|ไฟฟ้า|pea|mea/],['ค่าเน็ต',/true|ais|3bb|dtac|เน็ต|internet/],['เดินทาง',/ปตท|ptt|shell|bangchak|บางจาก|น้ำมัน|esso|caltex/],['ของแห้ง',/ข้าวสาร|บะหมี่|มาม่า|น้ำมันพืช|น้ำปลา|lotus|โลตัส|big ?c|บิ๊กซี|7-?eleven|เซเว่น|tops|ท็อปส์/]];
  const lst=S.lists['หมวดรายจ่าย']||[];for(const [c,re] of R)if(re.test(s)&&lst.includes(c))return c;return lst.includes('อื่นๆ')?'อื่นๆ':lst[0];}

/* ---------- scanner flow ---------- */
function startScan(){openModal(`<h3 style="text-align:center">🧾 สแกนบิล</h3><p class="muted" style="text-align:center">อยากใช้รูปจากไหนดี? 🐣</p>
  <div class="pickgrid"><button class="bigscan" onclick="scanPick('cam')"><span class="cam">📷</span><b>ถ่ายรูป</b></button><button class="bigscan lib" onclick="scanPick('lib')"><span class="cam">🖼️</span><b>เลือกจากคลังรูป</b></button></div>
  <button class="btn full ghost" onclick="closeModal()">ยกเลิก</button>`);}
function scanPick(src){closeModal();const inp=$(src==='lib'?'scanLib':'scanFile');inp.click();if(S.page!=='scan')go('scan');}
function loadScan(){const rows=DB.led.filter(r=>r['ใบเสร็จ']||r['ร้านค้า']||/สแกนบิล|สลิปโอนเงิน/.test(r['หมายเหตุ']||'')).sort((a,b)=>b._row-a._row).slice(0,8);
  $('scanRecent').innerHTML=rows.length?rows.map(ledRow).join(''):emptyMsg('🧾','ยังไม่เคยสแกนบิล ลองถ่ายใบแรกเลย!');}
function loadTesseract(){if(window.Tesseract)return Promise.resolve();return new Promise((res,rej)=>{const s=document.createElement('script');
  s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';s.onload=res;s.onerror=()=>rej(new Error('โหลดตัวอ่านบิลไม่ได้ (ต้องต่อเน็ต)'));document.head.appendChild(s);});}
function prog(label,p){$('scanProg').innerHTML=`<div class="loader"><span class="pencil">🖍️</span><div>${esc(label)}</div><div class="bar b"><i style="width:${Math.round((p||0)*100)}%"></i></div><small>${Math.round((p||0)*100)}%</small></div>`;}
const GKEY='hm_gemini_key',GMODEL='hm_gemini_model',GAPI='https://generativelanguage.googleapis.com/v1beta/';
const GEM_FALLBACK=['gemini-3.8-flash','gemini-2.5-flash','gemini-flash-latest','gemini-2.5-flash-lite'];
const cleanKey=k=>String(k||'').replace(/[\s\u200B-\u200D\uFEFF]+/g,'');
function geminiKey(){try{return cleanKey(localStorage.getItem(GKEY));}catch(e){return '';}}
let GEM_STEP=()=>{};
async function gFetch(url,opt,ms,label){const ac=new AbortController();const t=setTimeout(()=>ac.abort(),ms);
  try{const r=await fetch(url,Object.assign({},opt,{signal:ac.signal}));let txt='';try{txt=await r.text();}catch(e){}
    let j={};try{j=txt?JSON.parse(txt):{};}catch(e){j={_raw:txt};}
    if(!r.ok){const e=new Error(`${label} ผิดพลาด HTTP ${r.status}: ${(j.error&&j.error.message)||String(txt).slice(0,160)||r.statusText}`);e.status=r.status;e.apiMsg=(j.error&&j.error.message)||'';throw e;}
    return j;}
  catch(e){if(e.name==='AbortError'){const x=new Error(`${label} หมดเวลา (เกิน ${Math.round(ms/1000)} วินาที) – เน็ตช้าหรือถูกบล็อก`);x.timeout=true;throw x;}
    if(e.status)throw e;const x=new Error(`${label} เชื่อมต่อไม่ได้: ${e.message||e}`);x.network=true;throw x;}
  finally{clearTimeout(t);}}
const verNum=n=>{const m=n.match(/gemini-(\d+(?:\.\d+)?)/);return m?parseFloat(m[1]):0;};
async function listGeminiModels(key){const all=[];let tok='';
  for(let page=0;page<3;page++){const j=await gFetch(`${GAPI}models?pageSize=1000${tok?'&pageToken='+encodeURIComponent(tok):''}`,{headers:{'x-goog-api-key':key}},10000,'ดึงรายชื่อโมเดล');
    (j.models||[]).forEach(m=>all.push(m));if(!j.nextPageToken||j.nextPageToken===tok)break;tok=j.nextPageToken;}
  const ms=all.filter(m=>(m.supportedGenerationMethods||[]).includes('generateContent')).map(m=>String(m.name).replace(/^models\//,''))
    .filter((n,i,a)=>a.indexOf(n)===i&&/gemini-.*flash/i.test(n)&&!/image|tts|live|embedding|audio|native|thinking/i.test(n));
  const stable=ms.filter(n=>!/preview|exp/i.test(n)),pool=stable.length?stable:ms;
  return pool.sort((a,b)=>verNum(b)-verNum(a)||(/lite/.test(a)-/lite/.test(b))||a.length-b.length);}
const isGone=e=>e.status===404||/no longer available|not found|is not supported|deprecated|unknown model/i.test(e.apiMsg||e.message||'');
const isSchemaErr=e=>e.status===400&&/schema|response_?mime|responseMimeType|generation_?config/i.test(e.apiMsg||'');
const suggested=e=>((e.apiMsg||e.message||'').match(/models\/([a-z0-9][a-z0-9.\-]*[a-z0-9])/gi)||[]).map(s=>s.replace(/^models\//i,''));
const GDBG=[];function gdbg(o){GDBG.push(new Date().toLocaleTimeString('th-TH')+' '+JSON.stringify(o));if(GDBG.length>60)GDBG.shift();const el=$('gemDbg');if(el)el.textContent=GDBG.join('\n');}
const shapeOf=b=>JSON.parse(JSON.stringify(b,(k,v)=>k==='data'&&typeof v==='string'?`<base64 ${v.length} chars>`:(k==='text'&&typeof v==='string'&&v.length>60?v.slice(0,60)+`…(${v.length})`:v)));
function geminiCall(model,key,body,ms,ver){ver=ver||'v1beta';return gFetch(`https://generativelanguage.googleapis.com/${ver}/models/${encodeURIComponent(model)}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify(body)},ms||45000,'Gemini ('+model+')');}
/* progressive simplification levels: 0 full+thinking off, 1 no thinkingConfig, 2 no generationConfig extras, 3 minimal {contents} */
const JSON_HINT='\n\nตอบเป็น JSON ล้วนเท่านั้น ไม่มีข้อความอื่น รูปแบบ {"date":"","store":"","total":0,"items":[{"name":"","qty":1,"price":0}],"category":""}';
function buildBody(base,lvl){const b=JSON.parse(JSON.stringify(base));const gc=b.generationConfig||{};
  if(gc.maxOutputTokens&&gc.maxOutputTokens<64)gc.maxOutputTokens=64;
  if(lvl===0){gc.thinkingConfig={thinkingBudget:0};b.generationConfig=gc;}
  else if(lvl===1){if(Object.keys(gc).length)b.generationConfig=gc;}
  else{const hadSchema=!!gc.responseSchema||gc.responseMimeType==='application/json';
    if(lvl===2){const g2={};if(gc.temperature!=null)g2.temperature=gc.temperature;if(Object.keys(g2).length)b.generationConfig=g2;else delete b.generationConfig;}
    else{Object.keys(b).forEach(k=>{if(k!=='contents')delete b[k];});b.contents=b.contents.map(c=>({parts:c.parts}));}
    if(hadSchema&&b.contents[0].parts[0].text)b.contents[0].parts[0].text+=JSON_HINT;}
  return b;}
const ATTEMPTS=[['v1beta',0],['v1beta',1],['v1beta',2],['v1beta',3],['v1',2],['v1',3]];
const cfgGet=()=>{try{return JSON.parse(localStorage.getItem('hm_gemini_cfg'))||{};}catch(e){return {};}};
const cfgSet=(m,i)=>{const c=cfgGet();c[m]=i;localStorage.setItem('hm_gemini_cfg',JSON.stringify(c));};
async function geminiGenerate(key,body,opt){opt=Object.assign({timeout:45000,maxModels:4,total:120000},opt||{});key=cleanKey(key);if(!key)throw new Error('ยังไม่มี API key');
  const deadline=Date.now()+opt.total,left=()=>deadline-Date.now();
  const queue=[],tried=new Set(),add=(arr,front)=>{arr=arr.filter(n=>n&&!tried.has(n)&&!queue.includes(n));front?queue.unshift(...arr):queue.push(...arr);};
  const cached=localStorage.getItem(GMODEL);if(cached)add([cached]);
  let listed=false;const doList=async()=>{if(listed)return;listed=true;GEM_STEP('🔎 ค้นหาโมเดลที่ใช้ได้…');
    try{const ms=await listGeminiModels(key);const lite=ms.find(n=>/lite/.test(n)),full=ms.filter(n=>!/lite/.test(n));
      GEM_STEP('📋 พบ '+ms.length+' โมเดล: '+(ms[0]||'-'));gdbg({list:ms});
      add([full[0],lite,...['gemini-2.5-flash','gemini-flash-latest'].filter(n=>ms.includes(n)),full[1]].filter(Boolean));}
    catch(e){GEM_STEP('⚠️ '+e.message+' → ลองรายชื่อสำรอง');gdbg({listError:e.message});}
    add(GEM_FALLBACK);};
  if(!queue.length)await doList();
  let lastErr=null,models=0;
  for(let guard=0;guard<10;guard++){if(!queue.length){if(listed)break;await doList();if(!queue.length)break;}
    if(models>=opt.maxModels)break;const model=queue.shift();if(tried.has(model))continue;tried.add(model);models++;
    let ai=Math.min(ATTEMPTS.length-1,Number(cfgGet()[model])||0);
    while(ai<ATTEMPTS.length){if(left()<3000){lastErr=new Error('หมดเวลารวม ('+Math.round(opt.total/1000)+' วินาที)');break;}
      const [ver,lvl]=ATTEMPTS[ai],b=buildBody(body,lvl),ms=Math.min(opt.timeout,left()),t0=Date.now();
      GEM_STEP('🤖 ลอง '+model+(ai?' (แบบง่าย '+ai+')':'')+'…');gdbg({req:{ver,model,lvl,body:shapeOf(b)}});
      try{const j=await geminiCall(model,key,b,ms,ver);cfgSet(model,ai);localStorage.setItem(GMODEL,model);gdbg({ok:model,ver,lvl,sec:(Date.now()-t0)/1000});
        GEM_STEP('⚡ '+model+' ตอบใน '+((Date.now()-t0)/1000).toFixed(1)+' วิ');return {j,model};}
      catch(e){lastErr=e;gdbg({err:model,ver,lvl,status:e.status||null,msg:e.message});GEM_STEP('❌ '+model+': '+e.message);
        if(e.status===400&&!/no longer available|deprecated/i.test(e.apiMsg||"")){ai++;continue;}  // any 400 → simpler body / v1
        break;}}
    if(left()<3000)break;
    if(lastErr&&(lastErr.status===401||lastErr.status===403))throw lastErr;
    if(model===localStorage.getItem(GMODEL))localStorage.removeItem(GMODEL);
    if(lastErr)add(suggested(lastErr),true);if(!listed&&!queue.length)await doList();}
  throw lastErr||new Error('ไม่พบโมเดล Gemini ที่ใช้ได้');}
const parseJsonLoose=t=>{try{return JSON.parse(t);}catch(e){const m=String(t).match(/\{[\s\S]*\}/);if(m){try{return JSON.parse(m[0]);}catch(e2){}}throw new Error('Gemini ตอบกลับไม่ใช่ JSON ที่อ่านได้');}};
function preprocess(canvas){let c=canvas;const mx=Math.max(c.width,c.height);
  if(mx<1200){const k=mx<600?3:2,u=document.createElement('canvas');u.width=c.width*k;u.height=c.height*k;const ux=u.getContext('2d');ux.imageSmoothingQuality='high';ux.drawImage(c,0,0,u.width,u.height);c=u;}
  const x=c.getContext('2d'),d=x.getImageData(0,0,c.width,c.height),p=d.data,h=new Array(256).fill(0),n=p.length/4;
  for(let i=0;i<p.length;i+=4){const g=(.299*p[i]+.587*p[i+1]+.114*p[i+2])|0;p[i]=g;h[g]++;}
  let lo=0,hi=255,acc=0;while(acc<n*.02&&lo<255)acc+=h[lo++];acc=0;while(acc<n*.4&&hi>0)acc+=h[hi--];
  hi=Math.max(hi,lo+40);for(let i=0;i<p.length;i+=4){let g=(p[i]-lo)*255/(hi-lo);g=g<0?0:g>255?255:g;g=255*Math.pow(g/255,1.6);p[i]=p[i+1]=p[i+2]=g;}
  x.putImageData(d,0,0);return c;}
function saveGemKey(){localStorage.removeItem(GMODEL);const v=cleanKey($('gemKey').value);if(v)localStorage.setItem(GKEY,v);else localStorage.removeItem(GKEY);$('gemKey').value='';showGemKey();toast(v?'บันทึก key แล้ว 🔐':'ลบ key แล้ว');}
function showGemKey(){const k=geminiKey(),gm=localStorage.getItem(GMODEL);if($('gemState'))$('gemState').textContent=k?'มี key แล้ว: '+k.slice(0,4)+'•••••••'+k.slice(-4)+(gm?' · โมเดล: '+gm:''):'ยังไม่มี key (จะใช้ตัวอ่านในเครื่อง)';}
async function testGemKey(){const k=cleanKey($('gemKey').value)||geminiKey();if(!k)return toast('ใส่ key ก่อนนะ');const st=$('gemState'),steps=[];
  GEM_STEP=m=>{steps.push(m);st.innerHTML=steps.map(esc).join('<br>');};GEM_STEP('⏳ เริ่มทดสอบ…');
  try{localStorage.removeItem(GMODEL);localStorage.removeItem('hm_gemini_cfg');const {model}=await geminiGenerate(k,{contents:[{parts:[{text:'ตอบว่า ok'}]}],generationConfig:{maxOutputTokens:64,temperature:0}},{timeout:30000,maxModels:4,total:90000});GEM_STEP('✅ ใช้งานได้ · โมเดล: '+model);}
  catch(e){GEM_STEP('❌ ใช้ไม่ได้: '+((e&&e.message)||e));}finally{GEM_STEP=()=>{};}}
/* ---------- Gemini: receipt OR bank slip ---------- */
async function geminiReceipt(b64,key){const cats=S.lists['หมวดรายจ่าย']||[],icats=S.lists['หมวดรายรับ']||[];
  const prompt=`คุณคือผู้ช่วยอ่านเอกสารการเงินภาษาไทย ดูรูปนี้แล้วตอบเป็น JSON ตาม schema เท่านั้น
- docType: "slip" ถ้าเป็นสลิปโอนเงิน/หลักฐานการโอน (เช่น K PLUS/KBank, SCB, Krungthai/เป๋าตัง, Bangkok Bank, Krungsri, TTB, GSB/ออมสิน, PromptPay, TrueMoney) หรือ "receipt" ถ้าเป็นใบเสร็จ/บิลเงินสด (พิมพ์หรือลายมือ)
- date: ISO YYYY-MM-DD แปลงปี พ.ศ. เป็น ค.ศ. (69→2026, 2569→2026) รองรับเดือนไทย เช่น 8 ก.ย. 69; time: HH:MM ถ้ามี
- store: ใบเสร็จ=ชื่อร้านแบบแบรนด์มาตรฐาน (7-Eleven, Lotus's, Makro, Big C, Tops); สลิป=ชื่อผู้รับเงิน
- total: ใบเสร็จใช้ "ยอดสุทธิ"; สลิปใช้จำนวนเงินที่โอน
- items: เฉพาะใบเสร็จ {name, qty, price} แก้ตัวสะกดไทยให้ถูก ข้ามบรรทัด 0.00/แต้ม/สมาชิก/ภาษี/วิธีชำระ; สลิปให้เป็น []
- slip: เฉพาะสลิป {sender, senderBank, receiver, receiverBank, ref (เลขที่รายการ/รหัสอ้างอิง), memo (บันทึกช่วยจำ)}
- category: เลือกจากรายการนี้เท่านั้น: ${cats.join(', ')}`;
  const body={contents:[{parts:[{text:prompt},{inline_data:{mime_type:'image/jpeg',data:b64}}]}],
    generationConfig:{temperature:0.1,responseMimeType:'application/json',responseSchema:{type:'OBJECT',properties:{docType:{type:'STRING',enum:['receipt','slip']},date:{type:'STRING'},time:{type:'STRING'},store:{type:'STRING'},total:{type:'NUMBER'},
      items:{type:'ARRAY',items:{type:'OBJECT',properties:{name:{type:'STRING'},qty:{type:'NUMBER'},price:{type:'NUMBER'}},required:['name','price']}},
      slip:{type:'OBJECT',properties:{sender:{type:'STRING'},senderBank:{type:'STRING'},receiver:{type:'STRING'},receiverBank:{type:'STRING'},ref:{type:'STRING'},memo:{type:'STRING'}}},
      category:{type:'STRING'}},required:['total']}}};
  const {j,model:m}=await geminiGenerate(key,body,{timeout:60000,maxModels:4,total:120000});
  let t='';try{t=j.candidates[0].content.parts.map(p=>p.text||'').join('');}catch(e){throw new Error('Gemini ไม่ส่งผลลัพธ์ ('+((j.promptFeedback&&j.promptFeedback.blockReason)||'ว่าง')+')');}
  const o=parseJsonLoose(t);const d=/^\d{4}-\d{2}-\d{2}$/.test(o.date||'')?o.date:(parseReceipt(o.date||'').date||'');
  const sl=o.slip||{},isSlip=o.docType==='slip';
  return {kind:isSlip?'slip':'receipt',date:d,time:/^\d{1,2}:\d{2}/.test(o.time||'')?o.time.slice(0,5):'',store:o.store||(isSlip?sl.receiver||'':''),total:Number(o.total)||0,
    items:isSlip?[]:(o.items||[]).filter(i=>Number(i.price)>0).map(i=>({name:i.name,qty:Number(i.qty)||1,price:Number(i.price)})),
    slip:isSlip?{sender:sl.sender||'',senderBank:normBank(sl.senderBank||''),receiver:sl.receiver||o.store||'',receiverBank:normBank(sl.receiverBank||''),ref:String(sl.ref||'').replace(/\s/g,''),memo:sl.memo||''}:null,
    category:cats.includes(o.category)?o.category:'',raw:t,engine:'🤖 Gemini ('+m+')'};}
/* ---------- local bank slip parser ---------- */
const BANKS=[[/k\s*plus|kbank|kasikorn|กสิกร/i,'กสิกรไทย'],[/scb|ไทยพาณิชย์|siam commercial/i,'ไทยพาณิชย์'],[/krungthai|ktb|กรุงไทย|เป๋าตัง/i,'กรุงไทย'],[/bangkok\s*bank|bbl|กรุงเทพ|bualuang|บัวหลวง/i,'กรุงเทพ'],
  [/krungsri|กรุงศรี|bay\b|kma/i,'กรุงศรี'],[/ttb|ทีทีบี|ทหารไทย|ธนชาต/i,'ทีทีบี'],[/gsb|ออมสิน|mymo/i,'ออมสิน'],[/promptpay|พร้อมเพย์/i,'พร้อมเพย์'],[/true\s*money|ทรูมันนี่|ทรูวอลเล็ท/i,'TrueMoney'],
  [/uob|ยูโอบี/i,'UOB'],[/cimb|ซีไอเอ็มบี/i,'CIMB'],[/baac|ธ\.?ก\.?ส/i,'ธ.ก.ส.'],[/lh\s*bank|แลนด์/i,'LH Bank']];
function normBank(t){for(const [re,n] of BANKS)if(re.test(t))return n;return String(t||'').trim();}
function isSlipText(t){const s=String(t).replace(/\u0E4D\u0E32/g,'\u0E33');let k=0;[/โอนเงินสำเร็จ|รายการสำเร็จ|ทำรายการสำเร็จ|transfer\s*(successful|completed)|successful/i,/เลขที่รายการ|รหัสอ้างอิง|เลขที่อ้างอิง|ref(erence)?\s*(no|id|\.)/i,/จำนวน(เงิน)?|amount/i,/ค่าธรรมเนียม|fee/i,/(^|\n)\s*(จาก|from)\b|(^|\n)\s*(ไปยัง|ถึง|to)\b/i,/พร้อมเพย์|promptpay|xxx-?x|x{3,}/i]
  .forEach(r=>{if(r.test(s))k++;});return k>=3&&BANKS.some(([re])=>re.test(s))||k>=4;}
function parseSlip(raw){const txt=String(raw||'').replace(/\u0E4D\u0E32/g,'\u0E33').replace(/[๐-๙]/g,c=>'๐๑๒๓๔๕๖๗๘๙'.indexOf(c));const L=txt.split('\n').map(l=>l.replace(/\s+/g,' ').trim()).filter(Boolean);
  const base=parseReceipt(txt);const out={kind:'slip',date:base.date,time:'',store:'',total:0,items:[],slip:{sender:'',senderBank:'',receiver:'',receiverBank:'',ref:'',memo:''},raw:txt};
  const am=l=>{const m=l.match(/(\d{1,3}(?:,\d{3})+|\d+)\.(\d{2})/);return m?Number(m[1].replace(/,/g,'')+'.'+m[2]):0;};
  for(let i=0;i<L.length;i++){if(/จำนวน(เงิน)?|amount/i.test(L[i])&&!/ค่าธรรมเนียม|fee/i.test(L[i])){const v=am(L[i])||(L[i+1]?am(L[i+1]):0);if(v){out.total=v;break;}}}
  if(!out.total){const vs=L.filter(l=>!/ค่าธรรมเนียม|fee|คงเหลือ|balance/i.test(l)).map(am).filter(Boolean);out.total=vs.length?Math.max(...vs):0;}
  const tm=txt.match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)(?::\d{2})?\s*(น\.|น|\b)/);if(tm)out.time=pad(+tm[1])+':'+tm[2];
  for(let i=0;i<L.length;i++){const m=L[i].match(/(เลขที่รายการ|รหัสอ้างอิง|เลขที่อ้างอิง|รหัสรายการ|ref(?:erence)?\.?\s*(?:no|id)?\.?)\s*[:：]?\s*([A-Za-z0-9]{6,})?/i);
    if(m){out.slip.ref=(m[2]||((L[i+1]||'').match(/[A-Za-z0-9]{6,}/)||[''])[0]);if(out.slip.ref)break;}}
  const who=(re)=>{for(let i=0;i<L.length;i++){const m=L[i].match(re);if(m){let n=(m[2]||'').trim();let j=i+1;if(!n||/^[:：]$/.test(n))n=L[j++]||'';
      const bankLine=[L[i],L[j]||'',L[j+1]||''].join(' ');return {name:n.replace(/^[:：]\s*/,'').replace(/\s*(xxx|x{2,}).*$/i,'').trim(),bank:normBank(bankLine)};}}return null;};
  const f=who(/^(จาก|from|ผู้โอน)(?=\s|[:：]|$)\s*[:：]?\s*(.*)$/i),t=who(/^(ไปยัง|ถึง|to|ผู้รับ(?:เงิน)?)(?=\s|[:：]|$)\s*[:：]?\s*(.*)$/i);
  if(f){out.slip.sender=f.name;out.slip.senderBank=BANKS.some(([re])=>re.test(f.bank))?f.bank:'';}
  if(t){out.slip.receiver=t.name;out.slip.receiverBank=BANKS.some(([re])=>re.test(t.bank))?t.bank:'';}
  if(!out.slip.senderBank)out.slip.senderBank=normBank(L.slice(0,4).join(' '))&&BANKS.some(([re])=>re.test(L.slice(0,4).join(' ')))?normBank(L.slice(0,4).join(' ')):'';
  const mm=txt.match(/(บันทึกช่วยจำ|memo|note|หมายเหตุ)\s*[:：]?\s*([^\n]+)/i);if(mm)out.slip.memo=mm[2].trim();
  out.store=out.slip.receiver;return out;}

/* ---------- scan queue + robust inputs ---------- */
let SCAN=null,SCANQ=[],SCANN=0;
window.addEventListener('error',e=>{try{toast('😿 เกิดข้อผิดพลาด: '+(e.message||e.error));}catch(x){}});
window.addEventListener('unhandledrejection',e=>{try{toast('😿 เกิดข้อผิดพลาด: '+((e.reason&&e.reason.message)||e.reason));}catch(x){}});
document.addEventListener('change',e=>{const t=e.target;if(t&&(t.id==='scanFile'||t.id==='scanLib'))onScanFile(t);},true);
async function onScanFile(inp){const files=[...(inp.files||[])];if(!files.length)return;
  // iOS: copy bytes BEFORE resetting the input, so the File isn't invalidated
  const blobs=[];for(const f of files){try{blobs.push(new File([await f.arrayBuffer()],f.name||'scan.jpg',{type:f.type||'image/jpeg'}));}catch(e){toast('😿 อ่านไฟล์ไม่ได้: '+(e.message||e));}}
  try{inp.value='';}catch(e){}
  if(!blobs.length)return;if(S.page!=='scan')go('scan');
  const busy=SCANQ.length||SCAN;SCANQ.push(...blobs);SCANN+=blobs.length;if(!busy)scanNext();else toast('เพิ่มเข้าคิว '+blobs.length+' รูป 🧾');}
function scanNext(){SCAN=null;$('scanForm').innerHTML='';if(!SCANQ.length){SCANN=0;return;}const f=SCANQ.shift();analyzeScan(f);}
async function analyzeScan(f){const pos=SCANN-SCANQ.length;
  try{const key=geminiKey();prog('กำลังเตรียมรูป…',.02);
    const big=await compressImg(f,key?1280:1600,key?.8:.9);const thumb=(await compressImg(f,400,.6)).url;let res=null,why='';
    if(key&&navigator.onLine!==false){try{const g0=Date.now();let gmsg='🤖 Gemini กำลังอ่าน…';const tick=()=>prog(gmsg+' ⏱️ '+Math.round((Date.now()-g0)/1000)+' วิ',Math.min(.95,.1+(Date.now()-g0)/120000));tick();const iv=setInterval(tick,1000);GEM_STEP=m=>{gmsg=m;tick();};
        try{res=await geminiReceipt(big.url.split(',')[1],key);}finally{clearInterval(iv);GEM_STEP=()=>{};}}catch(e){why='Gemini ใช้ไม่ได้ ('+(e.message||e)+') → ใช้ตัวอ่านในเครื่องแทน';}}
    if(!res){const c=preprocess(big.canvas);prog('กำลังโหลดตัวอ่านภาษาไทย…',.05);await loadTesseract();
      const w=await Tesseract.createWorker('tha+eng',1,{logger:m=>{if(m.status==='recognizing text')prog('กำลังอ่าน… ✏️',.3+m.progress*.7);else if(/load/.test(m.status))prog('กำลังโหลดภาษา (ครั้งแรกจะนานหน่อย)…',.05+(m.progress||0)*.25);}});
      try{await w.setParameters({preserve_interword_spaces:'1'});const r=await w.recognize(c);window.LAST_OCR=r.data.text;
        res=isSlipText(r.data.text)?parseSlip(r.data.text):Object.assign(parseReceipt(r.data.text),{kind:'receipt'});}finally{try{await w.terminate();}catch(e){}}
      res.engine='🖍️ Tesseract (ในเครื่อง)'+(key?'':' · ใส่ Gemini key ที่ ⚙️ ตั้งค่า เพื่อให้อ่านแม่นขึ้น');}
    SCAN=Object.assign({kind:'receipt',items:[],slip:null},res,{thumb,why,pos,type:'รายจ่าย'});
  }catch(e){toast('😿 '+(e.message||e));SCAN={kind:'receipt',date:'',store:'',total:0,items:[],thumb:'',raw:'',engine:'✋ กรอกเอง ('+(e.message||e)+')',pos,type:'รายจ่าย'};}
  $('scanProg').innerHTML='';renderScanForm();}
function slipCat(p){const s=((p.slip&&(p.slip.receiver+' '+p.slip.memo))||'').toLowerCase();const lst=S.lists['หมวดรายจ่าย']||[];
  const R=[['ค่าไฟ',/ไฟฟ้า|pea|mea/],['ค่าน้ำดื่ม',/น้ำดื่ม|ประปา/],['ค่าเน็ต',/true|ais|3bb|dtac|เน็ต/],['ชำระหนี้',/บัตรเครดิต|สินเชื่อ|ผ่อน|ชำระหนี้/],['อาหารสด',/ตลาด|ผัก|หมู|ไก่|อาหาร/],['เดินทาง',/grab|bolt|แท็กซี่|น้ำมัน/]];
  for(const [c,re] of R)if(re.test(s)&&lst.includes(c))return c;return p.category||guessCat(p);}
function renderScanForm(){const p=SCAN,t=S.today||todayStr_(),isSlip=p.kind==='slip',inc=p.type==='รายรับ',sl=p.slip||{};
  const cats=(inc?S.lists['หมวดรายรับ']:S.lists['หมวดรายจ่าย'])||[];const cat=inc?cats[0]:(isSlip?slipCat(p):(p.category||guessCat(p)));
  const meth=isSlip?('โอนธนาคาร'+(sl.senderBank&&sl.senderBank!=='พร้อมเพย์'?' '+sl.senderBank:sl.senderBank==='พร้อมเพย์'?' (พร้อมเพย์)':'')):'';
  const ml=(S.lists['วิธีชำระ']||[]).slice();if(meth&&!ml.includes(meth))ml.unshift(meth);
  const remain=SCANQ.length;
  $('scanForm').innerHTML=`${p.thumb?`<img class="rcpt" src="${p.thumb}" alt="">`:''}
  <div class="demo">${isSlip?'<span class="kbadge">🏦 สลิปโอนเงิน</span> ':'<span class="kbadge r">🧾 ใบเสร็จ</span> '}${SCANN>1?`<b>ใบที่ ${p.pos}/${SCANN}</b> · `:''}อ่านโดย: <b>${esc(p.engine||'')}</b>${p.why?`<br><small>${esc(p.why)}</small>`:''}<br>✨ ตรวจ/แก้ข้อมูลให้ถูกก่อนบันทึกนะ</div>
  <div class="seg" style="margin-top:8px"><button class="${inc?'out':'on out'}" onclick="scSetType('รายจ่าย')">💸 รายจ่าย</button><button class="${inc?'on in':'in'}" onclick="scSetType('รายรับ')">💰 รายรับ</button></div>
  <div class="row"><div><label>📅 วันที่</label><input id="scDate" type="date" value="${p.date||t}"></div>${isSlip?`<div style="flex:0 0 96px"><label>⏰ เวลา</label><input id="scTime" type="time" value="${esc(p.time||'')}"></div>`:''}</div>
  <label>💰 ${isSlip?'จำนวนเงินที่โอน':'ยอดรวม'}</label><input id="scTotal" type="number" inputmode="decimal" class="amount" style="font-size:22px" value="${p.total||''}">
  <label>${isSlip?(inc?'👤 ผู้โอน (จาก)':'👤 ผู้รับเงิน (ไปยัง)'):'🏪 ร้านค้า'}</label><input id="scStore" value="${esc(isSlip&&inc?(sl.sender||''):(p.store||''))}" placeholder="${isSlip?'ชื่อ':'ชื่อร้าน'}">
  ${isSlip?`<div class="row"><div><label>🏦 ผู้โอน</label><input id="scSender" value="${esc((sl.sender||'')+(sl.senderBank?' · '+sl.senderBank:''))}"></div><div><label>🏦 ผู้รับ</label><input id="scRecv" value="${esc((sl.receiver||'')+(sl.receiverBank?' · '+sl.receiverBank:''))}"></div></div>
   <div class="row"><div><label>🔖 เลขที่รายการ</label><input id="scRef" value="${esc(sl.ref||'')}"></div><div><label>📝 บันทึกช่วยจำ</label><input id="scMemo" value="${esc(sl.memo||'')}"></div></div>`:
   `<label>🧾 รายการในบิล</label><div id="scItems"></div><button class="btn sm ghost" onclick="scAddItem()">＋ เพิ่มรายการ</button>`}
  <label>🏷️ หมวดหมู่</label><select id="scCat">${opts(cats,cat)}</select>
  ${inc?memSelect('scFrom','💰 เงินจากใคร',''):`<div class="row"><div>${memSelect('scFor','🎁 ของใคร/จ่ายให้ใคร','')}</div><div>${memSelect('scPaid','👛 จ่ายโดย','')}</div></div>`}
  <label>💳 วิธีชำระ</label><select id="scMethod">${opts(ml,meth)}</select>
  <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" class="chk" id="scKeep" ${p.thumb?'checked':''}> เก็บรูปย่อไว้ด้วย</label>
  <button class="btn full" id="scSave" onclick="saveScan()">💾 บันทึกลงบัญชี${remain?' แล้วไปใบถัดไป':''}</button>
  ${remain?`<button class="btn full ghost" onclick="toast('ข้ามแล้ว');scanNext()">⏭️ ข้ามใบนี้ (เหลือ ${remain})</button>`:''}
  <button class="btn full ghost" onclick="SCANQ=[];scanNext()">ยกเลิก${remain?'ทั้งหมด':''}</button>
  ${p.raw?`<details style="margin-top:8px"><summary class="muted">ข้อความที่อ่านได้</summary><pre style="white-space:pre-wrap;font-size:12px">${esc(p.raw)}</pre></details>`:''}`;
  if(!isSlip)renderScItems();setTimeout(()=>{const el=$('scanForm');if(el&&el.scrollIntoView)el.scrollIntoView({behavior:'smooth',block:'start'});},50);}
function scKeepEdits(){const p=SCAN;if(!p)return;const g=id=>$(id)?$(id).value:undefined;p.date=g('scDate')||p.date;p.total=Number(g('scTotal'))||p.total;if(g('scTime')!==undefined)p.time=g('scTime');
  if(p.kind==='slip'){p.slip.ref=g('scRef');p.slip.memo=g('scMemo');}else if($('scStore'))p.store=g('scStore');}
function scSetType(t){scKeepEdits();SCAN.type=t;renderScanForm();}
function renderScItems(){if(!$('scItems'))return;$('scItems').innerHTML=SCAN.items.map((it,i)=>`<div class="itrow"><input value="${esc(it.name)}" oninput="SCAN.items[${i}].name=this.value"><input class="q" type="number" inputmode="numeric" value="${it.qty||1}" oninput="SCAN.items[${i}].qty=Number(this.value)" title="จำนวน"><input class="p" type="number" inputmode="decimal" value="${it.price}" oninput="SCAN.items[${i}].price=Number(this.value)"><button class="btn sm ghost" onclick="SCAN.items.splice(${i},1);renderScItems()">✕</button></div>`).join('')||'<div class="muted">ไม่พบรายการย่อย</div>';}
function scAddItem(){SCAN.items.push({name:'',qty:1,price:0});renderScItems();}
function shrinkDataUrl(u,max,q){return new Promise(res=>{if(!u)return res('');const i=new Image();i.onload=()=>{const s=Math.min(1,max/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=Math.round(i.width*s);c.height=Math.round(i.height*s);c.getContext('2d').drawImage(i,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',q));};i.onerror=()=>res('');i.src=u;});}
async function saveScan(){const btn=$('scSave');try{
  const p=SCAN;if(!p)return;const amt=Number($('scTotal').value);if(!amt)return toast('ใส่จำนวนเงินก่อนนะ 💕');
  const isSlip=p.kind==='slip',inc=p.type==='รายรับ',date=$('scDate').value||todayStr_(),time=$('scTime')?$('scTime').value:'';
  const ref=isSlip?$('scRef').value.trim():'';const who=$('scStore').value.trim();
  if(isSlip){const dup=DB.led.find(r=>(ref&&r['เลขอ้างอิง']===ref)||(!ref&&num_(r['จำนวนเงิน (บาท)'])===amt&&r['วันที่']===date&&time&&r['เวลา']===time));
    if(dup&&!confirm('สลิปนี้ดูเหมือนบันทึกไปแล้ว ('+(dup['รายการ']||'')+' '+baht(dup['จำนวนเงิน (บาท)'])+')\nบันทึกซ้ำไหม?'))return toast('ไม่บันทึกซ้ำ 👍');}
  const its=isSlip?[]:p.items.filter(i=>i.name);
  const item=isSlip?(inc?'รับโอนจาก ':'โอนให้ ')+(who||'-'):(who?who+': ':'')+(its.map(i=>i.name).slice(0,4).join(', ')||'ตามบิล');
  const memo=isSlip?$('scMemo').value.trim():'';
  if(btn){btn.disabled=true;btn.textContent='⏳ กำลังบันทึก…';}
  const row={_row:newId(),'วันที่':date,'ประเภท':inc?'รายรับ':'รายจ่าย','หมวดหมู่':$('scCat').value||'อื่นๆ','รายการ':item,'จำนวนเงิน (บาท)':amt,'วิธีชำระ':$('scMethod').value||'',
    'หมายเหตุ':isSlip?['สลิปโอนเงิน',memo,ref?'Ref '+ref:''].filter(Boolean).join(' · '):'สแกนบิล'};
  if(inc)row['เงินจากใคร']=$('scFrom').value;else{row['ของใคร/จ่ายให้ใคร']=$('scFor').value;row['จ่ายโดย']=$('scPaid').value;}
  if(isSlip){Object.assign(row,{'เวลา':time,'เลขอ้างอิง':ref,'ผู้โอน':$('scSender').value.trim(),'ผู้รับ':$('scRecv').value.trim(),'บันทึกช่วยจำ':memo});}
  else{row['ร้านค้า']=who;row['รายการย่อย']=its.map(i=>i.name+((i.qty||1)>1?' x'+i.qty:'')+' '+i.price).join(' | ');}
  let img=$('scKeep').checked?p.thumb:'';if(img)row['ใบเสร็จ']=img;
  DB.led.push(row);let saved=false,note='';
  for(const step of [0,1,2]){try{localStorage.setItem(LS_KEY,JSON.stringify(DB));saved=true;break;}
    catch(e){if(step===0&&img){img=await shrinkDataUrl(img,240,.5);row['ใบเสร็จ']=img;note=' (ย่อรูปเพิ่ม)';}else{delete row['ใบเสร็จ'];note=' (พื้นที่เต็ม ไม่ได้เก็บรูป)';}}}
  if(!saved){DB.led=DB.led.filter(r=>r!==row);throw new Error('พื้นที่ในเครื่องเต็ม บันทึกไม่ได้ ลองลบรูปบิลเก่าหรือสำรองข้อมูล');}
  try{scheduleSync();}catch(e){}
  toast('บันทึกแล้ว ✅ '+baht(amt)+note);
  if(SCANQ.length){scanNext();return;}
  SCAN=null;SCANN=0;$('scanForm').innerHTML='';loadScan();HILITE=row._row;go('ledger');
}catch(e){toast('😿 บันทึกไม่สำเร็จ: '+(e.message||e));if(btn){btn.disabled=false;btn.textContent='💾 บันทึกลงบัญชี';}}}

/* ---------- export w/ members ---------- */
const _xlsx=exportXlsx;
exportXlsx=function(){if(typeof XLSX==='undefined')return toast('😿 โหลดไลบรารี Excel ไม่สำเร็จ (ต้องต่อเน็ต)');
  const orig=XLSX.writeFile;XLSX.writeFile=function(wb,name){XLSX.writeFile=orig;
    const led=LOCAL.getLedger(1e9).map(r=>{const o={};Object.keys(r).forEach(k=>{if(k!=='_row'&&k!=='ใบเสร็จ')o[k]=r[k];});o['มีรูปบิล']=r['ใบเสร็จ']?'✔':'';return o;});
    wb.Sheets['บัญชีรับจ่าย']=XLSX.utils.json_to_sheet(led.length?led:[{'(ว่าง)':''}]);
    XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(MEM().map(m=>({'ชื่อ':m.name,'ประเภท':m.kind==='business'?'กิจการ':'บุคคล','อีโมจิ':m.emoji,'มีรูป':m.photo?'✔':''}))),'สมาชิก');
    const months=[...new Set(DB.led.map(r=>String(r['วันที่']).slice(0,7)))].sort().reverse(),rows=[];
    months.forEach(mo=>{MEM().map(m=>m.name).concat(['(ไม่ระบุ)']).forEach(n=>{const f=(t,k)=>sumAmt(DB.led.filter(r=>r['ประเภท']===t&&String(r['วันที่']).startsWith(mo)&&(r[k]||'(ไม่ระบุ)')===n));
      const a=f('รายจ่าย','ของใคร/จ่ายให้ใคร'),b=f('รายจ่าย','จ่ายโดย'),c=f('รายรับ','เงินจากใคร');if(a||b||c)rows.push({'เดือน':mo,'สมาชิก':n,'รายจ่ายของ/ให้':a,'เป็นคนจ่าย':b,'รายรับจาก':c});});});
    XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows.length?rows:[{'(ว่าง)':''}]),'สรุปตามสมาชิก');
    return orig.call(XLSX,wb,name);};
  try{_xlsx();}finally{XLSX.writeFile=orig;}};

/* ---------- sample data: tag members ---------- */
const _loadSample=loadSample;
loadSample=function(){const before=DB.led.length;_loadSample();const nm=MEM().map(m=>m.name);if(!nm.length)return;
  DB.led.slice(before).forEach((r,i)=>{if(r['ประเภท']==='รายรับ')r['เงินจากใคร']=nm[i%2];else{r['ของใคร/จ่ายให้ใคร']=nm[(i+2)%nm.length];r['จ่ายโดย']=nm[i%2];}});persist();loadDash();};

/* settings: include members in todo assignee list */
S.lists=DB.lists;renderMemBox();

/* ---------- 🔄 refresh to latest version (never touches localStorage) ---------- */
async function hardRefresh(){const b=$('refBtn');b.classList.add('spin');b.textContent='⏳ กำลังอัปเดต…';
  try{if('serviceWorker' in navigator){const reg=await navigator.serviceWorker.getRegistration();
      if(reg){await reg.update().catch(()=>{});const w=reg.waiting||reg.installing;
        if(w){w.postMessage('SKIP_WAITING');await new Promise(r=>{if(w.state==='activated')return r();w.addEventListener('statechange',()=>{if(w.state==='activated')r();});setTimeout(r,3000);});}}}
    if(window.caches){const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)));}
  }catch(e){}
  sessionStorage.setItem('hm_updated','1');location.reload();}
if(sessionStorage.getItem('hm_updated')){sessionStorage.removeItem('hm_updated');setTimeout(()=>toast('อัปเดตแล้ว ✨'),400);}
loadDash();

/* ---------- 📗 Google Sheet sync (Apps Script web app) ---------- */
const SY={url:'hm_sync_url',code:'hm_sync_code',auto:'hm_sync_auto',last:'hm_sync_last',pend:'hm_sync_pending'};
const syGet=k=>{try{return localStorage.getItem(SY[k])||'';}catch(e){return '';}};
let syTimer=null,syBusy=false,syRetry=null;
function syncSaveCfg(){if(!$('syUrl'))return;localStorage.setItem(SY.url,$('syUrl').value.trim());localStorage.setItem(SY.code,$('syCode').value.trim());localStorage.setItem(SY.auto,$('syAuto').checked?'1':'0');syncShow();}
function syncAutoOn(){return syGet('auto')!=='0';}
function syncShow(m){const el=$('syState');if(!el)return;const l=syGet('last');
  el.textContent=(m?m+' · ':'')+(l?'ซิงค์ล่าสุด '+new Date(l).toLocaleString('th-TH',{dateStyle:'short',timeStyle:'short'}):'ยังไม่เคยซิงค์')+(syGet('pend')==='1'?' · ⏳ รอส่ง':'');}
function syncLoadUI(){if(!$('syUrl'))return;$('syUrl').value=syGet('url');$('syCode').value=syGet('code');$('syAuto').checked=syncAutoOn();syncShow();}
const noImg=o=>{const r={};Object.keys(o).forEach(k=>{if(k==='_row')return;const v=o[k];if(typeof v==='string'&&v.startsWith('data:image/')){r[k==='ใบเสร็จ'?'มีรูปบิล':k==='photo'?'มีรูป':k+' (มีรูป)']='✔';}else r[k]=v;});return r;};
function syncPayload(){const T=a=>(a||[]).map(noImg);
  const sum=LOCAL.getSummary('month').map(r=>Object.assign({'เดือน':r.k,'รายรับ':r.inc,'รายจ่าย':r.exp,'คงเหลือ':r.inc-r.exp},r.cats));
  const mem=(DB.members||[]).map(m=>({'ชื่อ':m.name,'ประเภท':m.kind==='business'?'กิจการ':'บุคคล','อีโมจิ':m.emoji,'มีรูป':m.photo?'✔':''}));
  const backup=JSON.stringify(DB,(k,v)=>typeof v==='string'&&v.startsWith('data:image/')?'':v);
  return {secret:syGet('code'),action:'save',tables:{'บัญชีรับจ่าย':T(LOCAL.getLedger(1e9)),'คลังของ':T(LOCAL.getInventory()),'สมาชิก':mem,'เมนู':T(clone(DB.menu).sort((a,b)=>String(a['วันที่']).localeCompare(String(b['วันที่'])))),
    'งานบ้าน':T(LOCAL.getTodos()),'ชอปปิ้ง':T(LOCAL.getShopping()),'บิล':T(LOCAL.getBills(true)),'ออม':T(DB.sav),'หนี้':T(DB.debt.map(debtCalc)),'ประวัติจ่ายหนี้':T(DB.debtlog),'สรุป':sum},backup};}
async function syncPost(obj,ms){const u=syGet('url');if(!/^https:\/\/.+/.test(u)&&!/^http:\/\/localhost/.test(u))throw new Error('ยังไม่ได้ใส่ Web app URL');if(!syGet('code'))throw new Error('ยังไม่ได้ใส่รหัสซิงค์');
  const ac=new AbortController(),t=setTimeout(()=>ac.abort(),ms||30000);
  try{const r=await fetch(u,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(obj),redirect:'follow',signal:ac.signal});
    const txt=await r.text();let j;try{j=JSON.parse(txt);}catch(e){throw new Error(/<html/i.test(txt)?'ได้หน้าเว็บแทน JSON – ตรวจว่า Deploy เป็น Web app และตั้ง Access: Anyone':'ตอบกลับอ่านไม่ได้ (HTTP '+r.status+')');}
    if(!j.ok)throw new Error(j.error||'ผิดพลาด');return j;}
  catch(e){if(e.name==='AbortError')throw new Error('หมดเวลาเชื่อมต่อ');if(e instanceof TypeError)throw new Error('เชื่อมต่อไม่ได้ (ออฟไลน์หรือ URL ผิด)');throw e;}finally{clearTimeout(t);}}
async function syncTest(){syncShow('⏳ กำลังทดสอบ…');try{const j=await syncPost({secret:syGet('code'),action:'ping'},20000);syncShow('✅ เชื่อมต่อชีต “'+(j.sheet||'')+'” ได้');toast('เชื่อมต่อ Google Sheet ได้ 📗');}catch(e){syncShow('❌ '+e.message);}}
async function syncNow(manual){if(!syGet('url')||!syGet('code')){if(manual)syncShow('❌ ใส่ URL และรหัสก่อนนะ');return;}
  if(syBusy){localStorage.setItem(SY.pend,'1');return;}
  if(navigator.onLine===false){localStorage.setItem(SY.pend,'1');syncShow('📴 ออฟไลน์ – จะส่งเมื่อมีเน็ต');return;}
  syBusy=true;localStorage.setItem(SY.pend,'0');if(manual)syncShow('⏳ กำลังซิงค์…');
  try{const j=await syncPost(syncPayload(),60000);localStorage.setItem(SY.last,j.savedAt||new Date().toISOString());clearTimeout(syRetry);syRetry=null;syncShow('✅ ซิงค์แล้ว');if(manual)toast('บันทึกลงชีตแล้ว 📗');}
  catch(e){localStorage.setItem(SY.pend,'1');syncShow('❌ '+e.message);clearTimeout(syRetry);syRetry=setTimeout(()=>syncNow(false),60000);}
  finally{syBusy=false;if(syGet('pend')==='1'&&!syRetry)scheduleSync();}}
function scheduleSync(){if(!syncAutoOn()||!syGet('url')||!syGet('code'))return;localStorage.setItem(SY.pend,'1');clearTimeout(syTimer);syTimer=setTimeout(()=>{syTimer=null;syncNow(false);},5000);}
async function syncRestore(){syncSaveCfg();if(!confirm('ดึงข้อมูลจาก Google Sheet มาแทนข้อมูลในเครื่องนี้? (ข้อมูลเดิมจะถูกเก็บสำรองไว้ในเครื่อง)'))return;syncShow('⏳ กำลังดึงข้อมูล…');
  try{const j=await syncPost({secret:syGet('code'),action:'get'},60000);const d=j.data;if(!d||!d.v||!Array.isArray(d.led))throw new Error('ในชีตยังไม่มีข้อมูลสำรอง');
    localStorage.setItem(LS_KEY+'.beforeRestore',JSON.stringify(DB));
    const imgs={};DB.led.forEach(r=>{if(r['ใบเสร็จ'])imgs[r._row]=r['ใบเสร็จ'];});const ph={};(DB.members||[]).forEach(m=>{if(m.photo)ph[m.id]=m.photo;});
    d.led.forEach(r=>{if(!r['ใบเสร็จ']&&imgs[r._row])r['ใบเสร็จ']=imgs[r._row];});(d.members||[]).forEach(m=>{if(!m.photo&&ph[m.id])m.photo=ph[m.id];});
    localStorage.setItem(LS_KEY,JSON.stringify(d));toast('ดึงข้อมูลกลับแล้ว ✨');setTimeout(()=>location.reload(),600);}
  catch(e){syncShow('❌ '+e.message);}}
{const _p=persist;persist=function(){_p();scheduleSync();};}
window.addEventListener('online',()=>{if(syGet('pend')==='1')syncNow(false);});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&syncAutoOn()&&syGet('url'))syncNow(false);});
{const _ls=loadSet;loadSet=function(){_ls();syncLoadUI();};LOADERS.set=loadSet;}
if(syncAutoOn()&&syGet('url')&&syGet('code'))setTimeout(()=>syncNow(false),2500);

/* ---------- ✏️ edit saved records ---------- */
function lightbox(src){let d=$('lbox');if(!d){d=document.createElement('div');d.id='lbox';d.onclick=()=>d.classList.remove('show');document.body.appendChild(d);}
  d.innerHTML=`<img src="${src}" alt=""><div class="lbx">✕ แตะเพื่อปิด</div>`;d.classList.add('show');}
let ED=null;
function parseSubItems(s){return String(s||'').split(' | ').filter(Boolean).map(x=>{const m=x.match(/^(.*?)(?:\s+x(\d+))?\s+([\d.]+)$/);return m?{name:m[1],qty:Number(m[2]||1),price:Number(m[3])}:{name:x,qty:1,price:0};});}
function editLedger(row){const r=DB.led.find(x=>x._row===row);if(!r)return toast('ไม่พบรายการ');ED={row,items:parseSubItems(r['รายการย่อย'])};
  const inc=r['ประเภท']==='รายรับ',ml=(S.lists['วิธีชำระ']||[]).slice();if(r['วิธีชำระ']&&!ml.includes(r['วิธีชำระ']))ml.unshift(r['วิธีชำระ']);
  const catOpts=t=>{const l=((t==='รายรับ'?S.lists['หมวดรายรับ']:S.lists['หมวดรายจ่าย'])||[]).slice();if(r['หมวดหมู่']&&!l.includes(r['หมวดหมู่'])&&(t==='รายรับ')===inc)l.unshift(r['หมวดหมู่']);return opts(l,r['หมวดหมู่']);};
  window._edCatOpts=catOpts;
  openModal(`<h3>✏️ แก้ไขรายการ ${r['หมายเหตุ']&&/สลิป/.test(r['หมายเหตุ'])?'<span class="kbadge">🏦 สลิป</span>':''}</h3>
  ${r['ใบเสร็จ']?`<img class="rcpt" src="${r['ใบเสร็จ']}" alt="" onclick="lightbox(this.src)" style="cursor:zoom-in;max-height:130px"><div class="muted" style="text-align:center;font-size:12px">แตะรูปเพื่อขยาย 🔍</div>`:''}
  <label>ประเภท</label><select id="edType" onchange="edTypeChg()"><option ${!inc?'selected':''}>รายจ่าย</option><option ${inc?'selected':''}>รายรับ</option></select>
  <div class="row"><div><label>📅 วันที่</label><input id="edDate" type="date" value="${esc(r['วันที่']||'')}"></div><div style="flex:0 0 100px"><label>⏰ เวลา</label><input id="edTime" type="time" value="${esc(r['เวลา']||'')}"></div></div>
  <label>💰 จำนวนเงิน</label><input id="edAmt" type="number" inputmode="decimal" class="amount" style="font-size:22px" value="${esc(r['จำนวนเงิน (บาท)'])}">
  <label>🏷️ หมวดหมู่</label><select id="edCat">${catOpts(r['ประเภท'])}</select>
  <label>📝 รายการ</label><input id="edItem" value="${esc(r['รายการ']||'')}">
  <label>🏪 ร้านค้า / ผู้รับ</label><input id="edStore" value="${esc(r['ร้านค้า']||r['ผู้รับ']||'')}">
  <label>💳 วิธีชำระ</label><select id="edMeth"><option value="">—</option>${opts(ml,r['วิธีชำระ'])}</select>
  <div id="edOut" style="${inc?'display:none':''}"><div class="row"><div>${memSelect('edFor','🎁 ของใคร',r['ของใคร/จ่ายให้ใคร']||'')}</div><div>${memSelect('edPaid','👛 จ่ายโดย',r['จ่ายโดย']||'')}</div></div></div>
  <div id="edIn" style="${inc?'':'display:none'}">${memSelect('edFrom','💰 เงินจากใคร',r['เงินจากใคร']||'')}</div>
  <div class="row"><div><label>🔖 เลขอ้างอิง</label><input id="edRef" value="${esc(r['เลขอ้างอิง']||'')}"></div><div><label>🗒️ หมายเหตุ</label><input id="edNote" value="${esc(r['หมายเหตุ']||'')}"></div></div>
  <label>🧾 รายการย่อย</label><div id="edItems"></div><button class="btn sm ghost" onclick="ED.items.push({name:'',qty:1,price:0});edItemsR()">＋ เพิ่ม</button>
  ${r['ใบเสร็จ']?`<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" class="chk" id="edDelImg"> ลบรูปบิลนี้</label>`:''}
  <button class="btn full" onclick="saveLedgerEdit()">💾 บันทึกการแก้ไข</button><button class="btn full ghost" onclick="ED=null;closeModal()">ยกเลิก</button>`);edItemsR();}
function edTypeChg(){const t=$('edType').value;$('edCat').innerHTML=window._edCatOpts(t);$('edOut').style.display=t==='รายรับ'?'none':'';$('edIn').style.display=t==='รายรับ'?'':'none';}
function edItemsR(){$('edItems').innerHTML=ED.items.map((it,i)=>`<div class="itrow"><input value="${esc(it.name)}" oninput="ED.items[${i}].name=this.value"><input class="q" type="number" value="${it.qty||1}" oninput="ED.items[${i}].qty=Number(this.value)"><input class="p" type="number" inputmode="decimal" value="${it.price}" oninput="ED.items[${i}].price=Number(this.value)"><button class="btn sm ghost" onclick="ED.items.splice(${i},1);edItemsR()">✕</button></div>`).join('')||'<div class="muted">—</div>';}
function saveLedgerEdit(){try{const r=DB.led.find(x=>x._row===ED.row);if(!r)throw new Error('ไม่พบรายการ');const amt=Number($('edAmt').value);if(!amt)return toast('ใส่จำนวนเงินก่อนนะ 💕');
  const t=$('edType').value,set=(k,v)=>{if(v===''||v==null)delete r[k];else r[k]=v;};
  Object.assign(r,{'ประเภท':t,'วันที่':$('edDate').value||r['วันที่'],'จำนวนเงิน (บาท)':amt,'หมวดหมู่':$('edCat').value||'อื่นๆ','รายการ':$('edItem').value,'วิธีชำระ':$('edMeth').value,'หมายเหตุ':$('edNote').value});
  set('เวลา',$('edTime').value);set('เลขอ้างอิง',$('edRef').value.trim());const st=$('edStore').value.trim();if(r['ผู้รับ']!==undefined&&!r['ร้านค้า'])set('ผู้รับ',st);else set('ร้านค้า',st);
  if(t==='รายรับ'){set('เงินจากใคร',$('edFrom').value);delete r['ของใคร/จ่ายให้ใคร'];delete r['จ่ายโดย'];}else{set('ของใคร/จ่ายให้ใคร',$('edFor').value);set('จ่ายโดย',$('edPaid').value);delete r['เงินจากใคร'];}
  set('รายการย่อย',ED.items.filter(i=>i.name).map(i=>i.name+((i.qty||1)>1?' x'+i.qty:'')+' '+(i.price||0)).join(' | '));
  if($('edDelImg')&&$('edDelImg').checked)delete r['ใบเสร็จ'];
  persist();const id=ED.row;ED=null;closeModal();toast('แก้ไขแล้ว ✅');HILITE=id;(LOADERS[S.page]||loadLedger)();if(S.page!=='ledger')loadLedger();
}catch(e){toast('😿 แก้ไขไม่สำเร็จ: '+(e.message||e));}}
/* ledger row: add edit button + tap thumbnail */
{const _lr=ledRow;ledRow=function(r){return _lr(r).replace(`<button class="btn sm ghost" onclick="delLedger(${r._row})">🗑️</button>`,`<button class="btn sm ghost" onclick="editLedger(${r._row})" aria-label="แก้ไข">✏️</button><button class="btn sm ghost" onclick="delLedger(${r._row})">🗑️</button>`)
  .replace('<img class="thumb" ',`<img class="thumb" onclick="lightbox(this.src)" style="cursor:zoom-in" `);};}
const _delLed=delLedger;delLedger=function(row){if(confirm('ลบรายการนี้?'))api('deleteLedger',row).then(()=>{toast('ลบแล้ว');(LOADERS[S.page]||loadLedger)();});};
/* shopping: edit */
{const _ls=loadShop;loadShop=function(){_ls();setTimeout(()=>{document.querySelectorAll('#shopList .item').forEach((el,i)=>{const cb=el.querySelector('.chk');const m=cb&&cb.getAttribute('onchange').match(/tickShop\((\d+)/);if(m&&!el.querySelector('.edb'))el.insertAdjacentHTML('beforeend',`<button class="btn sm ghost edb" onclick="editShop(${m[1]})">✏️</button>`);});},0);};LOADERS.shop=loadShop;}
function editShop(row){const r=DB.shop.find(x=>x._row===row);if(!r)return;openModal(`<h3>✏️ แก้ไขของที่ต้องซื้อ</h3><label>รายการ</label><input id="esName" value="${esc(r['รายการ'])}">
  <div class="row"><div><label>จำนวน</label><input id="esQty" type="number" value="${esc(r['จำนวน'])}"></div><div><label>หน่วย</label><select id="esUnit"><option value=""></option>${opts(S.lists['หน่วย']||[],r['หน่วย'])}</select></div></div>
  <label>ที่เก็บ/หมวด</label><select id="esLoc"><option value=""></option>${opts(S.lists['ที่เก็บ']||[],r['ที่เก็บ/หมวด'])}</select>
  <div class="row"><div><label>ราคาประมาณ/หน่วย</label><input id="esPrice" type="number" value="${esc(r['ราคาประมาณ/หน่วย'])}"></div><div><label>ราคาจริง</label><input id="esReal" type="number" value="${esc(r['ราคาจริง'])}"></div></div>
  <label>หมายเหตุ</label><input id="esNote" value="${esc(r['หมายเหตุ']||'')}">
  <button class="btn full" onclick="saveShopEdit(${row})">💾 บันทึก</button><button class="btn full ghost" onclick="closeModal()">ยกเลิก</button>`);}
function saveShopEdit(row){const r=DB.shop.find(x=>x._row===row);if(!r)return;if(!$('esName').value.trim())return toast('ใส่ชื่อก่อนนะ');
  Object.assign(r,{'รายการ':$('esName').value.trim(),'จำนวน':num_($('esQty').value||1),'หน่วย':$('esUnit').value,'ที่เก็บ/หมวด':$('esLoc').value,'ราคาประมาณ/หน่วย':$('esPrice').value===''?'':num_($('esPrice').value),'ราคาจริง':$('esReal').value===''?'':num_($('esReal').value),'หมายเหตุ':$('esNote').value});
  persist();closeModal();toast('แก้ไขแล้ว ✅');loadShop();}
/* savings + debt payments: edit */
{const _lm=loadMoney;loadMoney=function(){_lm();setTimeout(()=>{
  document.querySelectorAll('#savRecent button[onclick^="delSav("]').forEach(b=>{const id=b.getAttribute('onclick').match(/\d+/)[0];if(!b.previousElementSibling||!b.previousElementSibling.classList.contains('edb'))b.insertAdjacentHTML('beforebegin',`<button class="btn sm ghost edb" onclick="editSav(${id})">✏️</button>`);});
  document.querySelectorAll('#debtList button[onclick^="delDebtPay("]').forEach(b=>{const id=b.getAttribute('onclick').match(/\d+/)[0];if(!b.previousElementSibling||!b.previousElementSibling.classList.contains('edb'))b.insertAdjacentHTML('beforebegin',`<button class="btn sm ghost edb" onclick="editDebtPay(${id})">✏️</button>`);});},0);};LOADERS.money=loadMoney;}
function editSav(row){const r=DB.sav.find(x=>x._row===row);if(!r)return;openModal(`<h3>✏️ แก้ไขเงินออม</h3>
  <div class="row"><div><label>วันที่</label><input id="evDate" type="date" value="${esc(r['วันที่'])}"></div><div><label>ฝาก/ถอน</label><select id="evDir">${opts(['ฝาก','ถอน'],r['ฝาก/ถอน'])}</select></div></div>
  <label>ประเภท</label><select id="evType">${opts(S.lists['ประเภทการออม']||[],r['ประเภท'])}</select>
  <label>จำนวนเงิน</label><input id="evAmt" type="number" inputmode="decimal" value="${esc(r['จำนวนเงิน (บาท)'])}">
  <label>บัญชี/รายละเอียด</label><input id="evDet" value="${esc(r['บัญชี/รายละเอียด']||'')}"><label>หมายเหตุ</label><input id="evNote" value="${esc(r['หมายเหตุ']||'')}">
  <button class="btn full mint" onclick="saveSavEdit(${row})">💾 บันทึก</button><button class="btn full ghost" onclick="closeModal()">ยกเลิก</button>`);}
function saveSavEdit(row){const r=DB.sav.find(x=>x._row===row);if(!r)return;if(!num_($('evAmt').value))return toast('ใส่จำนวนเงินก่อนนะ');
  Object.assign(r,{'วันที่':$('evDate').value,'ฝาก/ถอน':$('evDir').value,'ประเภท':$('evType').value,'จำนวนเงิน (บาท)':num_($('evAmt').value),'บัญชี/รายละเอียด':$('evDet').value,'หมายเหตุ':$('evNote').value});persist();closeModal();toast('แก้ไขแล้ว ✅');loadMoney();}
function editDebtPay(row){const r=DB.debtlog.find(x=>x._row===row);if(!r)return;openModal(`<h3>✏️ แก้ไขการจ่ายหนี้</h3><label>เจ้าหนี้</label><select id="epCred">${opts(DB.debt.map(d=>d['เจ้าหนี้']),r['เจ้าหนี้ที่จ่าย'])}</select>
  <div class="row"><div><label>วันที่จ่าย</label><input id="epDate" type="date" value="${esc(r['วันที่จ่าย'])}"></div><div><label>จำนวนที่จ่าย</label><input id="epAmt" type="number" value="${esc(r['จำนวนที่จ่าย'])}"></div></div>
  <label>ส่วนดอกเบี้ย</label><input id="epInt" type="number" value="${esc(r['ส่วนดอกเบี้ย'])}">
  <button class="btn full" onclick="saveDebtPayEdit(${row})">💾 บันทึก</button><button class="btn full ghost" onclick="closeModal()">ยกเลิก</button>`);}
function saveDebtPayEdit(row){const r=DB.debtlog.find(x=>x._row===row);if(!r)return;const a=num_($('epAmt').value),i=Math.min(a,num_($('epInt').value));if(!a)return toast('ใส่จำนวนเงินก่อนนะ');
  Object.assign(r,{'เจ้าหนี้ที่จ่าย':$('epCred').value,'วันที่จ่าย':$('epDate').value,'จำนวนที่จ่าย':a,'ส่วนดอกเบี้ย':i});if('ส่วนเงินต้น' in r)r['ส่วนเงินต้น']=a-i;persist();closeModal();toast('แก้ไขแล้ว ✅');loadMoney();}
/* bigger member cards */
{const _lmem=loadMembers;loadMembers=function(){_lmem();$('memList').innerHTML=MEM().map(m=>`<div class="mem big"><div onclick="${m.photo?`lightbox(DB.members.find(x=>x.id===${m.id}).photo)`:`editMember(${m.id})`}" style="cursor:${m.photo?'zoom-in':'pointer'}">${avatar(m,'xl')}</div>
  <div class="mname">${esc(m.name)}</div><small>${m.kind==='business'?'🏢 กิจการ':'บุคคล'}</small><button class="btn sm ghost" onclick="editMember(${m.id})">✏️ แก้ไข</button></div>`).join('')||emptyMsg('🏠','ยังไม่มีสมาชิก');};LOADERS.members=loadMembers;}
