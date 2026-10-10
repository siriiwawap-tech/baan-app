/* ===== v4: bottom nav, gallery, members, weekly chart, receipt scanner ===== */
S.page='dash';
const NAV_OF={dash:'dash',ledger:'ledger',scan:'scan',members:'members'};
function go(p){S.page=p;const nv=NAV_OF[p]||'all';
  document.querySelectorAll('#tabs .tab').forEach(x=>x.classList.toggle('on',x.dataset.p===nv));
  document.querySelectorAll('.page').forEach(x=>x.classList.toggle('on',x.id==='p-'+p));
  window.scrollTo(0,0);(LOADERS[p]||function(){})();}
$('tabs').addEventListener('click',e=>{const b=e.target.closest('.tab');if(b)go(b.dataset.p);});
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
    return `<rect x="${x+bw*.12}" y="${124-hp}" width="${bw*.42}" height="${hp}" rx="3" fill="url(#hatchB)" stroke="#2A63D4" stroke-width="2"/>
    <rect x="${x+bw*.36}" y="${124-hc}" width="${bw*.5}" height="${hc}" rx="4" fill="url(#hatchR)" stroke="#2B2220" stroke-width="2.4"/>
    <text x="${x+bw/2}" y="143" text-anchor="middle" font-family="Itim" font-size="13" fill="${i===ti?'#E8322B':'#2B2220'}">${lab[i]}</text>`;}).join('');
  const diff=tp?Math.round((tc-tp)/tp*100):null;
  return `<div class="wkchart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="รายจ่ายสัปดาห์นี้"><defs>
  <pattern id="hatchR" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><rect width="6" height="6" fill="#FF8A7E"/><line x1="0" y1="0" x2="0" y2="6" stroke="#E8322B" stroke-width="4"/></pattern>
  <pattern id="hatchB" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="6" height="6" fill="#DCE8FF"/><line x1="0" y1="0" x2="0" y2="6" stroke="#7FA6EE" stroke-width="2.5"/></pattern></defs>
  <g filter="url(#crayon)"><path d="M2 125 Q140 122 278 126" stroke="#2B2220" stroke-width="2.5" fill="none"/>${bars}</g></svg>
  <div class="wkleg"><span><i style="background:#FF8A7E"></i>สัปดาห์นี้ <b class="money">${baht(tc)}</b></span><span><i style="background:#DCE8FF;border-color:#2A63D4"></i>สัปดาห์ก่อน ${baht(tp)}</span>
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
  return `<div class="item">${r['ใบเสร็จ']?`<img class="thumb" src="${r['ใบเสร็จ']}" alt="">`:`<div class="ico" style="background:${inc?'var(--mint)':'var(--pink)'}">${CAT_EMO[r['หมวดหมู่']]||'🏷️'}</div>`}
  <div class="t"><b>${esc(r['รายการ']||r['หมวดหมู่'])}</b><small>${thDate(r['วันที่'])} · ${esc(r['หมวดหมู่'])}${who?' · '+(inc?'จาก ':'ของ ')+esc(who):''}${r['จ่ายโดย']?' · จ่ายโดย '+esc(r['จ่ายโดย']):''}${r['วิธีชำระ']?' · '+esc(r['วิธีชำระ']):''}</small></div>
  ${who?avatar(who,'s'):''}<div class="money ${inc?'in-c':'out-c'}">${inc?'+':'−'}${baht(r['จำนวนเงิน (บาท)'])}</div>
  <button class="btn sm ghost" onclick="delLedger(${r._row})">🗑️</button></div>`;}
loadLedger=function(){api('getLedger',Number($('lLimit').value)||30).then(rows=>{$('lList').innerHTML=rows.length?rows.map(ledRow).join(''):'<div class="empty">ยังไม่มีรายการ</div>';});};

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
  <button class="btn full" onclick="saveMember(${id||0})">💾 บันทึก</button>${id?`<button class="btn full ghost" style="color:#E8322B" onclick="delMember(${id})">🗑️ ลบสมาชิก</button>`:''}
  <button class="btn full ghost" onclick="closeModal()">ยกเลิก</button>`);}
function prevMem(){$('mPrev').innerHTML=avatar({emoji:MEMEMO,photo:MEMPHOTO});}
function pickEmo(b,e){MEMEMO=e;document.querySelectorAll('.avpick button').forEach(x=>x.classList.toggle('on',x===b));prevMem();}
function compressImg(file,max,q){return new Promise((res,rej)=>{const img=new Image(),u=URL.createObjectURL(file);img.onload=()=>{const s=Math.min(1,max/Math.max(img.width,img.height));
  const c=document.createElement('canvas');c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(u);res({url:c.toDataURL('image/jpeg',q),canvas:c,img});};
  img.onerror=()=>rej(new Error('อ่านรูปไม่ได้'));img.src=u;});}
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
  const C=[['inv','🧺','คลังของ',`${inv.length} รายการ${low?` · ⚠️ ใกล้หมด ${low}`:''}`,'#FFE97A','#E8322B'],
   ['menu','🍱','เมนู',mn['มื้อเย็น']?'เย็นนี้: '+esc(mn['มื้อเย็น']):'ยังไม่วางเมนูวันนี้','#FFC9B8','#2A63D4'],
   ['todo','🧹','งานบ้าน',todos?`ค้างวันนี้ ${todos} งาน`:'วันนี้เคลียร์แล้ว 🎉','#BDEBC6','#E0A800'],
   ['shop','🛒','ชอปปิ้ง',shop?`ต้องซื้อ ${shop} อย่าง`:'ลิสต์ว่าง','#BCD7FF','#E8322B'],
   ['bills','🧾','บิล',bills?`ค้างจ่าย ${bills} บิล`:'จ่ายครบแล้ว','#FFD2A8','#2FA84F'],
   ['money','🐷','ออม/หนี้','ออมสะสม '+baht(sav),'#FFC0CB','#2A63D4'],
   ['sum','📊','สรุป/งบ','ใช้ไปเดือนนี้ '+baht(exp),'#D9C8FA','#FFCC10'],
   ['set','⚙️','ตั้งค่า','สำรอง · Excel · ล็อก','#E8E2D0','#E8322B']];
  $('gallery').innerHTML=C.map(c=>`<button class="gcard" style="background:${c[4]}" onclick="go('${c[0]}')"><span class="ge">${c[1]}</span><b>${c[2]}</b><small>${c[3]}</small>${SCRIB(c[5])}</button>`).join('');}
Object.assign(LOADERS,{dash:loadDash,ledger:loadLedger,members:loadMembers,all:loadAll,scan:loadScan});

/* ---------- receipt parser ---------- */
const TH_MON={'ม.ค':1,'มกรา':1,'ก.พ':2,'กุมภา':2,'มี.ค':3,'มีนา':3,'เม.ย':4,'เมษา':4,'พ.ค':5,'พฤษภา':5,'มิ.ย':6,'มิถุนา':6,'ก.ค':7,'กรกฎา':7,'ส.ค':8,'สิงหา':8,'ก.ย':9,'กันยา':9,'ต.ค':10,'ตุลา':10,'พ.ย':11,'พฤศจิกา':11,'ธ.ค':12,'ธันวา':12,
  jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
function normYear(y){y=Number(y);if(y<100)y=y>=50?2500+y:2000+y;if(y>2400)y-=543;return y;}
function okDate(y,m,d){if(!(m>=1&&m<=12&&d>=1&&d<=31&&y>=2000&&y<=2100))return '';return y+'-'+pad(m)+'-'+pad(d);}
function parseReceipt(raw){
  const txt=String(raw||'').replace(/[๐-๙]/g,c=>'๐๑๒๓๔๕๖๗๘๙'.indexOf(c)).replace(/\r/g,'');
  const lines=txt.split('\n').map(l=>l.replace(/\s+/g,' ').trim()).filter(l=>l.length>1);
  const out={date:'',store:'',total:0,items:[],raw:txt};
  // date
  for(const l of lines){let m=l.match(/\b(20\d{2}|25\d{2})[\/\-.](\d{1,2})[\/\-.](\d{1,2})\b/);
    if(m){const r=okDate(normYear(m[1]),+m[2],+m[3]);if(r){out.date=r;out._dl=l;break;}}
    m=l.match(/\b(\d{1,2})\s?[\/\-.]\s?(\d{1,2})\s?[\/\-.]\s?(\d{4}|\d{2})\b/);
    if(m){const r=okDate(normYear(m[3]),+m[2],+m[1]);if(r){out.date=r;out._dl=l;break;}}
    m=l.match(/\b(\d{1,2})\s*([ก-๙]{1,3}\.\s?[ก-๙]\.?|[ก-๙]{4,9}|[A-Za-z]{3,9})\.?\s*(\d{4}|\d{2})\b/);
    if(m){const key=m[2].replace(/\s/g,'').replace(/\.$/,'').toLowerCase();const k=Object.keys(TH_MON).find(x=>key.startsWith(x.toLowerCase())||key.startsWith(x.replace('.','')));
      if(k){const r=okDate(normYear(m[3]),TH_MON[k],+m[1]);if(r){out.date=r;out._dl=l;break;}}}}
  // amounts
  const amtRe=/(\d{1,3}(?:,\d{3})+|\d+)\s?[.,]\s?(\d{2})(?!\d)/g;
  const amts=l=>{const a=[];let m;amtRe.lastIndex=0;while((m=amtRe.exec(l)))a.push(Number(m[1].replace(/,/g,'')+'.'+m[2]));
    if(!a.length){const t=l.match(/(?:^|\s)(\d{1,6})\s*(?:บาท|฿|-)?\s*$/);if(t&&!/\d{7,}/.test(l))a.push(Number(t[1]));}return a;};
  const TOT=/(ยอดรวม|รวมทั้งสิ้น|ยอดสุทธิ|สุทธิ|รวมเงิน|ยอดชำระ|ทั้งสิ้น|grand\s*total|total|net|amount\s*due|รวม)/i;
  const NOT=/(ภาษี|vat|ทอน|change|เงินสด|cash|รับเงิน|ส่วนลด|discount|ก่อนภาษี|จำนวนชิ้น|qty|items?\s*:)/i;
  const SKIP=/(โทร|tel|เลขประจำตัว|tax\s*id|เลขที่|no\.|pos|วันที่|date|เวลา|time|ใบเสร็จ|receipt|invoice|ขอบคุณ|thank|สาขา|branch|พนักงาน|cashier|ที่อยู่|www|@)/i;
  let totIdx=-1,best=0;
  const STRONG=/(สุทธิ|ยอดชำระ|รวมทั้งสิ้น|ทั้งสิ้น|grand\s*total|net\s*total|amount\s*due|total\s*due)/i;let strong=0,sIdx=-1;
  lines.forEach((l,i)=>{if(TOT.test(l)&&!NOT.test(l)){const a=amts(l);if(a.length){const v=Math.max(...a);if(STRONG.test(l)){strong=v;sIdx=i;}if(v>=best){best=v;if(totIdx<0)totIdx=i;}}}});
  lines.forEach((l,i)=>{if(TOT.test(l)&&!NOT.test(l)&&amts(l).length&&totIdx<0)totIdx=i;});
  if(strong){best=strong;totIdx=Math.min(totIdx<0?sIdx:totIdx,sIdx);}
  if(!best){const all=lines.filter(l=>!SKIP.test(l)).flatMap(amts);best=all.length?Math.max(...all):0;}
  out.total=best;
  // store
  for(const l of lines.slice(0,5)){const letters=(l.match(/[A-Za-zก-๙]/g)||[]).length;if(letters>=3&&!SKIP.test(l)&&!TOT.test(l)&&!/\d{4,}/.test(l)){out.store=l.replace(/[|*=_~]+/g,'').trim();break;}}
  // items
  const end=totIdx>=0?totIdx:lines.length;
  lines.slice(0,end).forEach(l=>{if(l===out.store||l===out._dl||SKIP.test(l)||TOT.test(l)||NOT.test(l))return;const a=amts(l);if(!a.length)return;
    let name=l.replace(amtRe,'').replace(/(?:^|\s)\d{1,6}\s*(?:บาท|฿|-)?\s*$/,'').replace(/\b\d+\s*[xX×@]\s*/g,'').replace(/[@฿:|*]+/g,' ').replace(/\s+/g,' ').trim();
    const letters=(name.match(/[A-Za-zก-๙]/g)||[]).length;if(letters<2)return;const price=a[a.length-1];if(price<=0||price>=best*1.01&&best)return;
    out.items.push({name,price});});
  delete out._dl;return out;}
function guessCat(p){const s=(p.store+' '+p.items.map(i=>i.name).join(' ')).toLowerCase();
  const R=[['อาหารสด',/ผัก|หมู|ไก่|ไข่|ปลา|กุ้ง|เนื้อ|ผลไม้|ตลาด|makro|แม็คโคร|นม/],['ของใช้ห้องน้ำ',/สบู่|แชมพู|ยาสีฟัน|ทิชชู|กระดาษชำระ|watsons|boots/],['ซักผ้า',/ผงซักฟอก|น้ำยาปรับผ้า|ซักผ้า/],
   ['ค่าน้ำดื่ม',/น้ำดื่ม|water/],['ค่าไฟ',/การไฟฟ้า|ไฟฟ้า|pea|mea/],['ค่าเน็ต',/true|ais|3bb|dtac|เน็ต|internet/],['เดินทาง',/ปตท|ptt|shell|bangchak|บางจาก|น้ำมัน|esso|caltex/],['ของแห้ง',/ข้าวสาร|บะหมี่|มาม่า|น้ำมันพืช|น้ำปลา|lotus|โลตัส|big ?c|บิ๊กซี|7-?eleven|เซเว่น|tops|ท็อปส์/]];
  const lst=S.lists['หมวดรายจ่าย']||[];for(const [c,re] of R)if(re.test(s)&&lst.includes(c))return c;return lst.includes('อื่นๆ')?'อื่นๆ':lst[0];}

/* ---------- scanner flow ---------- */
let SCAN=null;
function startScan(){if(S.page!=='scan')go('scan');$('scanFile').click();}
function loadScan(){const rows=DB.led.filter(r=>r['ใบเสร็จ']||r['ร้านค้า']).sort((a,b)=>b._row-a._row).slice(0,8);
  $('scanRecent').innerHTML=rows.length?rows.map(ledRow).join(''):emptyMsg('🧾','ยังไม่เคยสแกนบิล ลองถ่ายใบแรกเลย!');}
function loadTesseract(){if(window.Tesseract)return Promise.resolve();return new Promise((res,rej)=>{const s=document.createElement('script');
  s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';s.onload=res;s.onerror=()=>rej(new Error('โหลดตัวอ่านบิลไม่ได้ (ต้องต่อเน็ต)'));document.head.appendChild(s);});}
function prog(label,p){$('scanProg').innerHTML=`<div class="loader"><span class="pencil">🖍️</span><div>${esc(label)}</div><div class="bar b"><i style="width:${Math.round((p||0)*100)}%"></i></div><small>${Math.round((p||0)*100)}%</small></div>`;}
async function onScanFile(inp){const f=inp.files[0];inp.value='';if(!f)return;$('scanForm').innerHTML='';
  try{prog('กำลังเตรียมรูป…',.02);
    const big=await compressImg(f,1800,.92);const thumb=(await compressImg(f,320,.6)).url;
    const c=big.canvas,x=c.getContext('2d'),d=x.getImageData(0,0,c.width,c.height),p=d.data;
    for(let i=0;i<p.length;i+=4){let g=.299*p[i]+.587*p[i+1]+.114*p[i+2];g=g>200?255:g<60?0:(g-60)*255/140;p[i]=p[i+1]=p[i+2]=g;}x.putImageData(d,0,0);
    prog('กำลังโหลดตัวอ่านภาษาไทย…',.05);await loadTesseract();
    const w=await Tesseract.createWorker('tha+eng',1,{logger:m=>{if(m.status==='recognizing text')prog('กำลังอ่านบิล… ✏️',.3+m.progress*.7);else if(/load/.test(m.status))prog('กำลังโหลดภาษา (ครั้งแรกจะนานหน่อย)…',.05+(m.progress||0)*.25);}});
    const r=await w.recognize(c);await w.terminate();
    SCAN=Object.assign(parseReceipt(r.data.text),{thumb});window.LAST_OCR=r.data.text;$('scanProg').innerHTML='';renderScanForm();
  }catch(e){$('scanProg').innerHTML='';toast('😿 '+(e.message||e));SCAN={date:'',store:'',total:0,items:[],thumb:'',raw:''};renderScanForm();}}
function renderScanForm(){const p=SCAN,t=S.today||todayStr_();
  $('scanForm').innerHTML=`${p.thumb?`<img class="rcpt" src="${p.thumb}" alt="ใบเสร็จ">`:''}<div class="demo">✨ ตรวจ/แก้ข้อมูลให้ถูกก่อนบันทึกนะ</div>
  <div class="row"><div><label>📅 วันที่</label><input id="scDate" type="date" value="${p.date||t}"></div><div><label>💰 ยอดรวม</label><input id="scTotal" type="number" inputmode="decimal" class="amount" style="font-size:22px" value="${p.total||''}"></div></div>
  <label>🏪 ร้านค้า</label><input id="scStore" value="${esc(p.store)}" placeholder="ชื่อร้าน">
  <label>🧾 รายการในบิล</label><div id="scItems"></div><button class="btn sm ghost" onclick="scAddItem()">＋ เพิ่มรายการ</button>
  <label>🏷️ หมวดหมู่</label><select id="scCat">${opts(S.lists['หมวดรายจ่าย']||[],guessCat(p))}</select>
  <div class="row"><div>${memSelect('scFor','🎁 ของใคร/จ่ายให้ใคร','')}</div><div>${memSelect('scPaid','👛 จ่ายโดย','')}</div></div>
  <label>💳 วิธีชำระ</label><select id="scMethod">${opts(S.lists['วิธีชำระ']||[])}</select>
  <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" class="chk" id="scKeep" ${p.thumb?'checked':''}> เก็บรูปบิลย่อขนาดไว้ด้วย</label>
  <button class="btn full" onclick="saveScan()">💾 บันทึกลงบัญชี</button><button class="btn full ghost" onclick="SCAN=null;$('scanForm').innerHTML=''">ยกเลิก</button>
  ${p.raw?`<details style="margin-top:8px"><summary class="muted">ข้อความที่อ่านได้</summary><pre style="white-space:pre-wrap;font-size:12px">${esc(p.raw)}</pre></details>`:''}`;renderScItems();}
function renderScItems(){$('scItems').innerHTML=SCAN.items.map((it,i)=>`<div class="itrow"><input value="${esc(it.name)}" oninput="SCAN.items[${i}].name=this.value"><input class="p" type="number" inputmode="decimal" value="${it.price}" oninput="SCAN.items[${i}].price=Number(this.value)"><button class="btn sm ghost" onclick="SCAN.items.splice(${i},1);renderScItems()">✕</button></div>`).join('')||'<div class="muted">ไม่พบรายการย่อย</div>';}
function scAddItem(){SCAN.items.push({name:'',price:0});renderScItems();}
function saveScan(){const amt=Number($('scTotal').value);if(!amt)return toast('ใส่ยอดรวมก่อนนะ 💕');const its=SCAN.items.filter(i=>i.name);
  const store=$('scStore').value.trim();const item=(store?store+': ':'')+(its.map(i=>i.name).slice(0,4).join(', ')||'ตามบิล');
  api('addLedger',{date:$('scDate').value,type:'รายจ่าย',category:$('scCat').value,item,amount:amt,method:$('scMethod').value,note:'สแกนบิล',
    forWho:$('scFor').value,paidBy:$('scPaid').value,store,items:its.map(i=>i.name+' '+i.price).join(' | '),receipt:$('scKeep').checked?SCAN.thumb:''})
  .then(()=>{toast('บันทึกบิลแล้ว ✅ '+baht(amt));SCAN=null;$('scanForm').innerHTML='';loadScan();});}

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
