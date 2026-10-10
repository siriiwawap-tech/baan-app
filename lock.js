/* PIN lock — เก็บเฉพาะ SHA-256 ของ PIN */
(function(){
const H='56d5f315cf3312f1e33f250993515e272210f45eab5f60d84c892b70abfbfcfd',K='hm_unlocked';
function sha256js(s){const b=new TextEncoder().encode(s),k=[],h=[];let n=2,c=0;const f=x=>(x-(x|0))*4294967296|0;
 while(c<64){let p=1;for(let d=2;d*d<=n;d++)if(n%d==0){p=0;break}if(p){if(c<8)h[c]=f(Math.pow(n,1/2));k[c++]=f(Math.pow(n,1/3))}n++}
 const l=b.length,m=new Uint8Array(((l+9+63)>>6)<<6);m.set(b);m[l]=128;const dv=new DataView(m.buffer);dv.setUint32(m.length-4,l*8);
 const r=(x,y)=>x>>>y|x<<(32-y);for(let o=0;o<m.length;o+=64){const w=[];for(let i=0;i<64;i++){if(i<16)w[i]=dv.getUint32(o+i*4);else{const a=w[i-15],z=w[i-2];w[i]=(w[i-16]+(r(a,7)^r(a,18)^a>>>3)+w[i-7]+(r(z,17)^r(z,19)^z>>>10))|0}}
 let[A,B,C,D,E,F,G,I]=h;for(let i=0;i<64;i++){const t1=(I+(r(E,6)^r(E,11)^r(E,25))+(E&F^~E&G)+k[i]+w[i])|0,t2=((r(A,2)^r(A,13)^r(A,22))+(A&B^A&C^B&C))|0;I=G;G=F;F=E;E=(D+t1)|0;D=C;C=B;B=A;A=(t1+t2)|0}
 [A,B,C,D,E,F,G,I].forEach((v,i)=>h[i]=(h[i]+v)|0)}return h.map(v=>(v>>>0).toString(16).padStart(8,'0')).join('')}
async function sha(s){if(window.crypto&&crypto.subtle){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return[...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('')}return sha256js(s)}
let pin='';const el=document.getElementById('lock'),dots=()=>document.querySelectorAll('#lockDots i'),msg=document.getElementById('lockMsg');
function draw(){dots().forEach((d,i)=>d.classList.toggle('on',i<pin.length))}
async function check(){const ok=(await sha(pin))===H;
 if(ok){sessionStorage.setItem(K,'1');el.classList.add('hide');msg.textContent='';pin='';draw();}
 else{const b=document.getElementById('lockBox');b.classList.remove('shake');void b.offsetWidth;b.classList.add('shake');msg.textContent='รหัสไม่ถูกต้อง ลองใหม่นะ 🥺';if(navigator.vibrate)navigator.vibrate(150);setTimeout(()=>{pin='';draw()},350);}}
function press(k){if(k==='del'){pin=pin.slice(0,-1);draw();return}if(pin.length>=4)return;pin+=k;draw();msg.textContent='';if(pin.length===4)setTimeout(check,120)}
document.getElementById('lockPad').addEventListener('click',e=>{const b=e.target.closest('button[data-k]');if(b)press(b.dataset.k)});
document.addEventListener('keydown',e=>{if(el.classList.contains('hide'))return;if(/^[0-9]$/.test(e.key))press(e.key);else if(e.key==='Backspace')press('del')});
window.lockApp=function(){sessionStorage.removeItem(K);pin='';draw();msg.textContent='';el.classList.remove('hide');};
if(sessionStorage.getItem(K)==='1')el.classList.add('hide');
})();
