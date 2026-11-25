window.__tt=1;
let initializeApp,getAuth,onAuthStateChanged,GoogleAuthProvider,signInWithPopup,signInWithRedirect,signOut,initializeFirestore,persistentLocalCache,persistentMultipleTabManager,collection,query,where,onSnapshot,doc,setDoc,getDoc,getDocs,updateDoc,deleteDoc,arrayUnion,arrayRemove,deleteField,serverTimestamp,firebaseConfig={},FB_LOAD=false,AI_URL="",AUTHREADY=false;
try{const G="https://www.gstatic.com/firebasejs/10.12.2/",[A,B,C,Dd]=await Promise.all([import(G+"firebase-app.js"),import(G+"firebase-auth.js"),import(G+"firebase-firestore.js"),import("./firebase-config.js")]);
 ({initializeApp}=A);({getAuth,onAuthStateChanged,GoogleAuthProvider,signInWithPopup,signInWithRedirect,signOut}=B);
 ({initializeFirestore,persistentLocalCache,persistentMultipleTabManager,collection,query,where,onSnapshot,doc,setDoc,getDoc,getDocs,updateDoc,deleteDoc,arrayUnion,arrayRemove,deleteField,serverTimestamp}=C);firebaseConfig=Dd.firebaseConfig;AI_URL=Dd.aiEndpoint||"";FB_LOAD=true}
catch(e){console.warn("[offline] Firebase SDK 載入失敗，改用本機快照",e)}
const FB_OK=FB_LOAD&&!!firebaseConfig.apiKey&&!String(firebaseConfig.apiKey).startsWith("YOUR");
let auth,db,me=null,TRIPS=[],TPL=null,unsub=null,SNAP=null,SNAPRAW=null;
if(FB_OK){const app=initializeApp(firebaseConfig);auth=getAuth(app);db=initializeFirestore(app,{localCache:persistentLocalCache({tabManager:persistentMultipleTabManager()})})}
const JF=["alerts","storm","sos"];
const clean=o=>JSON.parse(JSON.stringify(o));
const norm=t=>{JF.forEach(k=>{if(typeof t[k]==="string")try{t[k]=JSON.parse(t[k])}catch(e){delete t[k]}});return t};
const ser=o=>{const r={...o};JF.forEach(k=>{if(r[k]!==undefined&&typeof r[k]!=="string")r[k]=JSON.stringify(r[k])});return clean(r)};
const tdoc=t=>doc(db,"trips",t.id);
const statusOf=t=>{const u=(me&&me.uid)||(SNAP&&SNAP.uid);return(u&&t.st&&t.st[u])||"future"};
const setSt=(t,s)=>updateDoc(tdoc(t),{["st."+me.uid]:s});
const wt=v=>Array.isArray(v)?v.length+v.reduce((n,x)=>n+wt(x&&x.items!==undefined?x.items:0),0):(v&&typeof v==="object"?Object.values(v).reduce((n,x)=>n+wt(x),0):0);
function undoToast(fn){let u=document.getElementById("undo");if(!u){u=document.createElement("div");u.id="undo";document.body.appendChild(u)}u.innerHTML="<span>已刪除</span><button>復原</button>";u.classList.add("on");clearTimeout(u._t);u._t=setTimeout(()=>u.classList.remove("on"),6500);u.querySelector("button").onclick=()=>{u.classList.remove("on");fn()}}
function patch(t,p){if(!me){toast("離線檢視模式無法編輯，請連線並登入後再試");return Promise.resolve()}const _old={};for(const k in p){const base=(k==="lists"&&!t.lists)?plist(t):t[k];if(wt(base)>wt(p[k]))_old[k]=JSON.parse(JSON.stringify(base))}if(Object.keys(_old).length)setTimeout(()=>undoToast(()=>patch(t,_old).then(()=>render())),0);Object.assign(t,p);const o=TRIPS.find(x=>x.id===t.id);if(o)Object.assign(o,p);return updateDoc(tdoc(t),ser(p)).catch(e=>{console.error("[patch] 寫入失敗",e);const u=document.getElementById("undo");if(u)u.classList.remove("on");toast("儲存失敗："+(e.code||e.message))})}
const nameOf=(t,k)=>(t.memberNames&&t.memberNames[k])||k;
const rnd=n=>Array.from(crypto.getRandomValues(new Uint8Array(n)),b=>"ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b%32]).join("");
const $=s=>document.querySelector(s);
const esc=x=>String(x??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const flag=cc=>String.fromCodePoint(...[...cc.toUpperCase()].map(c=>127397+c.charCodeAt()));
const fmt=(n,c)=>`${c} ${Math.round(n).toLocaleString()}`;
let DATA=[],user="shared",unlocked=false,zm=null;const dayI={};let VIEW_ID=null,NOWOPEN=false,RV=null,FUT_OPEN=null;
const store=(k,v)=>{try{v==null?localStorage.getItem(k):localStorage.setItem(k,v)}catch(e){}};
const load=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("on");setTimeout(()=>t.classList.remove("on"),1600)}
function copy(s,msg){(navigator.clipboard?navigator.clipboard.writeText(s):Promise.reject()).then(()=>toast(msg||"已複製"),()=>toast("請手動複製"))}
function modal(h){$("#sheet").innerHTML=h+'<div class="pills"><button class="pill gl" data-a="close">關閉</button></div>';$("#modal").classList.add("on")}
const FL={"日本":"JP","台灣":"TW","韓國":"KR","泰國":"TH","越南":"VN","新加坡":"SG","馬來西亞":"MY","香港":"HK","中國":"CN","美國":"US","加拿大":"CA","英國":"GB","法國":"FR","德國":"DE","義大利":"IT","西班牙":"ES","瑞士":"CH","冰島":"IS","澳洲":"AU","紐西蘭":"NZ","印尼":"ID","菲律賓":"PH","荷蘭":"NL","奧地利":"AT","捷克":"CZ","土耳其":"TR","希臘":"GR","挪威":"NO","芬蘭":"FI","瑞典":"SE"};
const flagOf=t=>{const c=t.countryCode||FL[t.country];return c?flag(c):""};
const getDays=t=>Array.isArray(t.days)?JSON.parse(JSON.stringify(t.days)):(()=>{try{return JSON.parse(localStorage.getItem("tp-days-snap-"+t.id))||[]}catch(e){return[]}})();
const nd=t=>getDays(t).length||t.nDays||1;
const setDays=(t,D)=>{try{localStorage.setItem("tp-days-snap-"+t.id,JSON.stringify(D))}catch(e){}return patch(t,{days:D})};
const isT=s=>/^\d{1,2}:\d{2}$/.test(s||"");
const visible=()=>me?TRIPS.map(t=>({...t,status:statusOf(t),locked:false})):[];

/* accounting */
function settle(c){const m=c.all||c.members,paid={},owed={};m.forEach(x=>{paid[x]=0;owed[x]=0});let total=0;
 c.expenses.forEach(e=>{total+=e.amount;paid[e.paidBy]=(paid[e.paidBy]||0)+e.amount;const sw=e.splitWith?.length?e.splitWith:c.members;sw.forEach(x=>owed[x]=(owed[x]||0)+e.amount/sw.length)});
 const bal=m.map(x=>({m:x,b:paid[x]-owed[x]})),de=bal.filter(x=>x.b<-.5).sort((a,b)=>a.b-b.b),cr=bal.filter(x=>x.b>.5).sort((a,b)=>b.b-a.b),out=[];let i=0,j=0;
 while(i<de.length&&j<cr.length){const a=Math.min(-de[i].b,cr[j].b);out.push([de[i].m,cr[j].m,a]);de[i].b+=a;cr[j].b-=a;if(de[i].b>-.5)i++;if(cr[j].b<.5)j++}
 return{total,paid,out}}
function acct(t,L,r){const c=cfg(t),S=settle({members:c.members,all:[...c.members,...c.orphans],expenses:L}),cur=c.currency,tw=v=>` <small class="meta">≈ NT$ ${Math.round(v*r).toLocaleString()}</small>`;
 return`<p class="meta">參與成員 (${c.members.length}人)：${c.members.map(m=>esc(nameOf(t,m))).join("、")}</p>${c.orphans.length?`<div class="pay">有 ${c.orphans.length} 個名稱不是目前成員（${c.orphans.map(o=>esc(lbl(t,o))).join("、")}）。<button class="cb" data-a="fixold">整理舊帳目</button></div>`:""}
 
 <p style="margin-top:12px" class="meta">總花費</p><p class="sum">${fmt(S.total,cur)}${tw(S.total)}</p>
 <h4 class="meta" style="margin:12px 0 2px">各自墊付</h4>${[...c.members,...c.orphans.filter(o=>S.paid[o])].map(m=>`<div class="row"><span>${esc(lbl(t,m))}</span><b>${fmt(S.paid[m]||0,cur)}</b></div>`).join("")}
 <h4 class="meta" style="margin:12px 0 2px">結算</h4>${S.out.length?S.out.map(o=>`<div class="pay">${esc(lbl(t,o[0]))} → ${esc(lbl(t,o[1]))}　<b>${fmt(o[2],cur)}</b>${tw(o[2])}</div>`).join(""):'<div class="pay">已平衡</div>'}
 <h4 class="meta" style="margin:12px 0 2px">明細</h4>${L.map((e,i)=>`<div class="row"><span>${esc(e.item)}<br><small class="meta">${esc(lbl(t,e.paidBy))} 付</small></span><b>${fmt(e.amount,cur)}</b><button class="x ed" data-a="delex" data-v="${i}" aria-label="刪除"><svg class="ix" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>`).join("")||'<p class="meta">尚無明細</p>'}`}
/* --- Hokkaido sub pages --- */
const T0=()=>visible().find(x=>x.status==="now");
let cur="home";const LB={home:"首頁",more:"更多",pool:"口袋清單",now:"行程總覽",tix:"票券與預約",storm:"備忘錄",yen:"匯率與帳本",pack:"打包清單",map:"全球足跡",past:"歷史旅程",future:"未來清單"};const SUB=["now","pool","tix","storm","yen","pack"];
const RATES={JPY:.21,KRW:.024,THB:.9,USD:32,EUR:35,CHF:36,TWD:1};
/* patch-currency */
const CURCOM=[["TWD","新台幣"],["JPY","日圓"],["KRW","韓元"],["USD","美元"],["EUR","歐元"],["AUD","澳幣"],["GBP","英鎊"],["CAD","加幣"],["NZD","紐幣"],["CHF","瑞士法郎"],["HKD","港幣"],["CNY","人民幣"],["SGD","新加坡幣"],["THB","泰銖"],["MYR","馬來幣"],["VND","越南盾"],["IDR","印尼盾"],["PHP","菲律賓披索"],["CZK","捷克克朗"],["SEK","瑞典克朗"],["NOK","挪威克朗"],["DKK","丹麥克朗"],["ISK","冰島克朗"],["TRY","土耳其里拉"],["ZAR","南非幣"]];
/* 預設匯率為粗估參考（1 外幣＝多少台幣），實際請在帳本頁的匯率欄輸入，會依幣別各自記住；現有七種幣別的預設值不動 */
Object.entries({AUD:22,GBP:43,CAD:23,NZD:19,SGD:24.8,HKD:4.1,CNY:4.7,MYR:7,VND:.0012,IDR:.0018,PHP:.55,CZK:1.5,SEK:3.5,NOK:3.2,DKK:5,ISK:.26,TRY:.72,ZAR:1.95}).forEach(([k,v])=>{if(RATES[k]==null)RATES[k]=v});
function curFieldHTML(cur){const com=CURCOM.map(x=>x[0]);let all=[],dn=null;try{all=Intl.supportedValuesOf("currency")}catch(e){}try{dn=new Intl.DisplayNames(["zh-TW"],{type:"currency"})}catch(e){}
 const nm=c=>{try{return dn?dn.of(c):""}catch(e){return ""}},op=(c,n)=>`<option value="${esc(c)}"${c===cur?" selected":""}>${esc(c)}${n&&n!==c?" "+esc(n):""}</option>`;
 const other=all.filter(c=>!com.includes(c)).map(c=>op(c,nm(c))).join(""),extra=com.includes(cur)||all.includes(cur)?"":op(cur,"");
 return`<label>幣別（記帳用）<select id="f-cur"><optgroup label="常用">${CURCOM.map(x=>op(x[0],x[1])).join("")}</optgroup>${other?`<optgroup label="其他（匯率需自行輸入）">${other}</optgroup>`:""}${extra}</select><span class="meta">改國家會自動帶入幣別，也可手動選</span></label>`}
const curOf=()=>{const t=T0();return t?cfg(t).currency:"JPY"};
const rate=()=>parseFloat(load("tp-rate-"+curOf()))||RATES[curOf()]||1;
const exList=t=>[...(t.expenses||[])];
const saveEx=(t,l)=>patch(t,{expenses:l});
const plist=t=>t.lists?JSON.parse(JSON.stringify(t.lists)):{pack:(t.pack||DEFPACK).map(x=>({t:x,d:0})),gift:(t.gift||[]).map(x=>({t:x,d:0}))};
const savePl=(t,l)=>patch(t,{lists:l});
const tixHTML=t=>{const L=bkList(t);return`<div class="glass blk"><p class="meta vw">需要新增、修改項目或雲端連結（booking PDF），請按右上「編輯模式」。</p><p class="meta ed">貼上雲端分享連結（Google 雲端硬碟／iCloud／Dropbox，權限設為「知道連結者可檢視」）。這裡的項目會同步出現在首頁的 Booking。</p></div>
${L.map((b,i)=>`<div class="glass blk"><div class="vw"><b>${esc(b.n)}</b><div class="meta">${esc(b.c||"尚未填寫編號")}</div><div class="pills">${b.c?`<button class="pill gl" data-a="cp" data-v="${esc(b.c)}">複製編號</button>`:""}${okUrl(b.u)?`<a class="pill gl" href="${esc(b.u)}" target="_blank" rel="noopener">開啟 PDF</a>`:""}</div></div><div class="ed"><input class="fi" data-b="n" data-i="${i}" value="${esc(b.n)}" placeholder="項目名稱（例：住宿、機票）"><input class="fi" data-b="c" data-i="${i}" value="${esc(b.c)}" placeholder="booking 編號"><input class="fi" data-b="u" data-i="${i}" type="url" value="${esc(b.u)}" placeholder="雲端連結 https://…"><div class="pills"><button class="pill gl" data-a="cpi" data-v="${i}">複製編號</button><button class="pill gl" data-a="openu" data-v="${i}">開啟 PDF</button><button class="pill gl" data-a="delbk" data-v="${i}"><svg class="ix" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg> 刪除</button></div></div></div>`).join("")||'<p class="empty">還沒有項目</p>'}
<div class="add ed"><input class="fi" id="in-bk" placeholder="新增項目名稱…"><button class="pill" data-a="addbk">＋ 新增</button></div>
`};
const GST={links:[["","JR 運行","https://www.jrhokkaido.co.jp/travel/unkou/"],["","道路情報","https://www.jartic.or.jp/"],["","天氣警報","https://www.jma.go.jp/bosai/forecast/"],["","航班狀況","https://www.new-chitose-airport.jp/ja/flight/"]],risks:[],crisis:[]};
const DEFPACK=["護照／簽證","行動電源與充電線","常備藥品","信用卡與現金","網卡／漫遊"];
const cfg=t=>{const ex=t.expenses||[],mem=[...new Set(t.members||[])],ks=new Set();ex.forEach(e=>{ks.add(e.paidBy);(e.splitWith||[]).forEach(k=>ks.add(k))});return{currency:t.currency||"JPY",members:mem,orphans:[...ks].filter(k=>k&&!mem.includes(k)),expenses:ex}};
const lbl=(t,k)=>(t.members||[]).includes(k)?nameOf(t,k):(t.memberNames&&t.memberNames[k]?t.memberNames[k]+"（已離開）":k+"（舊紀錄）");
const memoOf=t=>{
  if(!t.memo){
    return {risks:((t.storm&&t.storm.risks)||[]).map(r=>({d:r[0],w:r[1],p:r[2],c:r[3]?1:0})),steps:((t.storm&&t.storm.crisis)||GST.crisis).map(c=>({t:c[0],d:c[1]})),note:""};
  }
  const m=JSON.parse(JSON.stringify(t.memo));
  if(m.risks===undefined)m.risks=((t.storm&&t.storm.risks)||[]).map(r=>({d:r[0],w:r[1],p:r[2],c:r[3]?1:0}));
  if(m.steps===undefined)m.steps=((t.storm&&t.storm.crisis)||GST.crisis).map(c=>({t:c[0],d:c[1]}));
  if(m.note===undefined)m.note="";
  return m;
};
const saveMemo=(t,m)=>patch(t,{memo:m});
const eb=(k,i)=>`<span class="ed mb"><button class="x" data-a="memoedit" data-v="${k}:${i}" aria-label="編輯"><i class=i-edit></i></button><button class="x" data-a="memodel" data-v="${k}:${i}" aria-label="刪除"><svg class="ix" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></span>`;
const meb=id=>`<span class="ed mb"><button class="x" data-a="meedit" data-v="${esc(id)}" aria-label="編輯"><i class=i-edit></i></button><button class="x" data-a="medel" data-v="${esc(id)}" aria-label="刪除"><svg class="ix" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></span>`;
let stormTab="memo";
function groupEntriesByDate(entries){
  const list=(entries||[]).slice().reverse();
  const map=new Map();
  list.forEach(e=>{const k=e.date||"";if(!map.has(k))map.set(k,[]);map.get(k).push(e)});
  const keys=[...map.keys()].filter(k=>k).sort().reverse();
  const out=keys.map(k=>({label:k,items:map.get(k)}));
  if(map.has(""))out.push({label:"未標日期",items:map.get("")});
  return out;
}
const stormMemoHTML=t=>{
  const M=memoOf(t);
  const entries0=(t.memo&&t.memo.entries)||[];
  const note=typeof M.note==="string"?M.note:"";
  const entries=note.trim()?[{id:"legacy-note",text:note,date:"",legacy:true},...entries0]:entries0;
  const groups=groupEntriesByDate(entries);
  const can=!!(window.QA_API&&window.QA_API.canEdit&&window.QA_API.canEdit(t));
  const entriesHTML=groups.length
    ?groups.map(g=>`<div class="me-day">${esc(g.label)}</div>`+g.items.map(e=>`<div class="me-entry"><div class="me-body"><div class="me-text" style="min-width:0${e.legacy?";white-space:pre-wrap":""}">${esc(e.text)}</div>${e.legacy?'<span class="meta">舊備忘</span>':""}</div>${e.id?meb(e.id):""}</div>`).join("")).join("")
    :`<p class="meta" style="margin:4px">還沒有備忘。</p>${can?`<div class="pills"><button class="pill" data-a="memonew">記一筆</button></div>`:""}`;
  return `<h2 class="sec">備忘錄</h2><div class="glass blk">${entriesHTML}</div><p class="foot-note">備忘內容同行程成員都看得到，請勿記密碼等敏感資料。</p>`;
};
const stormUrgentHTML=t=>{
  const M=memoOf(t);
  const risks=M.risks||[];
  const steps=M.steps||[];
  const risksHTML=risks.map((r,i)=>`<div class="rw ${r.c?"crit":""}"><b>${esc(r.d)}</b><span>${esc(r.w)}</span><em>${esc(r.p)}</em>${eb("risks",i)}</div>`).join("")||'<p class="meta" style="margin:4px">還沒有備案。</p>';
  const stepsInner=`<h2 class="sec">緊急處理步驟</h2><ol class="cr">${steps.map((s,i)=>`<li><div><b>${esc(s.t)}</b><span>${esc(s.d)}</span></div>${eb("steps",i)}</li>`).join("")}</ol><div class="pills ed"><button class="pill" data-a="memoadd" data-v="steps">＋ 新增步驟</button></div>`;
  return `<div class="pills"><a class="pill urgent" href="tel:119">撥打 119</a></div><h2 class="sec">備案提醒</h2>${risksHTML}<div class="pills ed"><button class="pill" data-a="memoadd" data-v="risks">＋ 新增備案</button></div>${steps.length?stepsInner:`<div class="ed">${stepsInner}</div>`}`;
};
const stormHTML=t=>{
  const seg=`<div class="seg"><button data-a="stormtab" data-v="memo" class="${stormTab==="memo"?"on":""}" aria-pressed="${stormTab==="memo"}">備忘</button><button data-a="stormtab" data-v="urgent" class="${stormTab==="urgent"?"on":""}" aria-pressed="${stormTab==="urgent"}">緊急</button></div>`;
  return seg+(stormTab==="urgent"?stormUrgentHTML(t):stormMemoHTML(t));
};
function memoForm(k,i){const t=T0(),M=memoOf(t),x=i!=null?M[k][i]:{};
 modal(k==="risks"?`<h3>${i!=null?"編輯":"新增"}備案</h3><div class="fm" data-k="risks" data-i="${i??""}"><label>天數／標題<input id="mm-a" value="${esc(x.d)}" placeholder="例如 D3"></label><label>可能的狀況<input id="mm-b" value="${esc(x.w)}"></label><label>備案對策<input id="mm-c" value="${esc(x.p)}"></label><label class="chk"><input type="checkbox" id="mm-x" ${x.c?"checked":""}> 標為重要（紅色）</label><div class="pills"><button class="pill" data-a="memosave">儲存</button></div></div>`
 :`<h3>${i!=null?"編輯":"新增"}步驟</h3><div class="fm" data-k="steps" data-i="${i??""}"><label>步驟標題<input id="mm-a" value="${esc(x.t)}"></label><label>說明<input id="mm-b" value="${esc(x.d)}"></label><div class="pills"><button class="pill" data-a="memosave">儲存</button></div></div>`)}
function setEdit(on){document.body.classList.toggle("editing",on);document.querySelectorAll(".edt").forEach(x=>{x.classList.toggle("on",on);const l=x.querySelector(".edt-l");if(l)l.textContent=on?"結束並儲存":"編輯模式"})}
function bar0(arch){const on=document.body.classList.contains("editing");return`<div class="pills topact"><button class="pill mini edt ${on?"on":""}" data-a="edtoggle"><i class="i-edit"></i><span class="edt-l">${on?"結束並儲存":"編輯模式"}</span></button>${arch?'<button class="pill mini" data-a="archive">結束並歸檔</button>':""}${(()=>{const tt=T0();return arch&&tt&&TPL&&tt.templateId===TPL.id?'<button class="pill mini ed" data-a="tplreset">重設為範例</button>':""})()}</div>`}
function yenHTML(t){const c=cfg(t),r=rate(),L=exList(t);
 return`<div class="glass blk"><p class="meta">${c.currency} 換台幣</p><div class="bigres" id="twd">NT$ 0</div>
 <label class="fl">${c.currency} 金額<input class="fi" id="jpy" type="number" inputmode="numeric" placeholder="例如 11370"></label>
 <label class="fl">匯率（1 ${c.currency} = ? NT$）<input class="fi" id="rate" type="number" step="0.001" value="${r}"></label><div class="qk" id="qk"></div></div>
 <h2 class="sec">記一筆</h2><div class="glass blk"><input class="fi" id="memo" placeholder="項目（例：午餐湯咖哩）"><select class="fi" id="payer" aria-label="付款人">${c.members.map(m=>`<option value="${esc(m)}" ${m===me?.uid?"selected":""}>付款人：${esc(nameOf(t,m))}</option>`).join("")}</select><div class="splits"><small class="meta">分攤對象</small>${c.members.map(m=>`<label class="chk"><input type="checkbox" class="sp" value="${esc(m)}" checked> ${esc(nameOf(t,m))}</label>`).join("")}</div>
 <div class="pills"><button class="pill" data-a="addex">＋ 記入帳本</button></div></div>
 <h2 class="sec">帳本與結算</h2><div class="glass blk">${acct(t,L,r)}</div>`}
function packHTML(t){const P=plist(t),sec=(k,ti)=>`<h2 class="sec">${ti}</h2><div class="glass blk">${P[k].map((x,i)=>`<div class="ck ${x.d?"done":""}"><label class="cklab"><input type="checkbox" data-k="${k}" data-i="${i}" ${x.d?"checked":""}><span>${esc(x.t)}</span></label><button class="x ed" data-a="deli" data-k="${k}" data-i="${i}" aria-label="刪除"><svg class="ix" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>`).join("")}<div class="add ed"><input class="fi" id="in-${k}" placeholder="新增項目…"><button class="pill" data-a="addi" data-v="${k}">＋</button></div></div>`;
 return sec("pack","冬季裝備")+sec("gift","伴手禮／想買")}
function calc(){const v=parseFloat($("#jpy")?.value)||0,r=parseFloat($("#rate")?.value)||0;if(!$("#twd"))return;if(r)store("tp-rate-"+curOf(),r);$("#twd").textContent="NT$ "+Math.round(v*r).toLocaleString();
 $("#qk").innerHTML=[1000,5000,10000,20000].map(x=>`<button data-a="q" data-v="${x}"><small>${x.toLocaleString()}</small>NT$${Math.round(x*r).toLocaleString()}</button>`).join("")}
function renderNow(t){const ids=["now","pool","tix","storm","yen","pack"],emp=emptyNow(),vt=viewTrip();
 const f={tix:t=>bar()+tixHTML(t),storm:t=>bar()+stormHTML(t),yen:t=>bar()+yenHTML(t),pack:t=>bar()+packHTML(t)};
 ids.forEach(i=>{$("#t-"+i).innerHTML=i==="now"?(vt?bar(1,vt)+nowCard(vt):nowEmpty()):i==="pool"?(vt?bar()+poolHTML(vt):emp):(t?f[i](t):emp)});
 calc();if(vt){MiniMap.render("nowmap",ptsOf(vt),pickPt);try{PoolMap.render(vt)}catch(e){}}if(t){try{buildFood(t)}catch(e){}}}

/* 當前行程：旅行當下專用頁 */
function realPos(t){
  const D=getDays(t);if(!D.length)return null;
  let d,i,off=false,before=false;
  const mi=dayIdxByDate(t),k=mi>=0?mi:Math.floor((Date.now()-new Date((t.startDate||"")+"T00:00"))/864e5);
  if(isNaN(k)||k<0){d=0;i=-1;off=true;before=true;}
  else if(k>=D.length){d=D.length-1;i=D[d].items.length-1;off=true;}
  else{d=k;const n=new Date(),cur=n.getHours()*60+n.getMinutes();i=-1;D[d].items.forEach((x,j)=>{if(isT(x.t)){const[h,m]=x.t.split(":");if(+h*60+ +m<=cur)i=j;}});}
  return{d,i,off,before};
}
function realIdx(t){
  const D=getDays(t);if(!D.length)return 0;
  const total=D.reduce((s,dd)=>s+((dd.items||[]).length),0);if(!total)return 0;
  const r=realPos(t);if(!r)return 0;
  const pre=[];let acc=0;D.forEach(dd=>{pre.push(acc);acc+=(dd.items||[]).length;});
  const its=D[r.d].items||[];
  if(r.i>=0&&r.i<its.length)return pre[r.d]+r.i;
  if(r.i+1<its.length)return pre[r.d]+r.i+1;
  if(r.before)return 0;
  return Math.max(0,total-1);
}
function scrollToCard(cont,i,instant){
  const card=cont.children[i];if(!card)return;
  const left=card.offsetLeft-(cont.clientWidth-card.offsetWidth)/2;
  if(instant)cont.scrollLeft=left;
  else if(cont.scrollTo)cont.scrollTo({left,behavior:"smooth"});
  else cont.scrollLeft=left;
}
function curStep(a){
  const cont=document.querySelector(".panel.on .trip-carousel");if(!cont)return;
  const n=cont.children.length;if(!n)return;
  if(a==="creset"){const t=T0();const target=t?realIdx(t):0;scrollToCard(cont,Math.max(0,Math.min(target,n-1)),false);return;}
  const mid=cont.scrollLeft+cont.clientWidth/2;let best=0,bd=1e9;
  for(let i=0;i<n;i++){const c=cont.children[i];const d=Math.abs((c.offsetLeft+c.offsetWidth/2)-mid);if(d<bd){bd=d;best=i}}
  let i=best;
  if(a==="cnext")i=Math.min(i+1,n-1);else i=Math.max(i-1,0);
  scrollToCard(cont,i,false);
}

/* 全域函數：頂部導覽互動 */
window.toggleMenu=function(){document.body.classList.toggle("dr")};
window.goToCurrentTrip=function(){go("home")};

/* now view */
const bkList=t=>[...(t.booking||[])];
const saveBk=(t,l)=>patch(t,{booking:l});
const okUrl=u=>/^https?:\/\//i.test(u||"");
const bookHTML=t=>{const L=bkList(t);return`<h3>Booking</h3>${L.length?L.map(b=>`<div class="row"><span>${esc(b.n)}<br><small class="meta">${esc(b.c||"尚未填寫")}</small></span><span>${b.c?`<button class="cb" data-a="cp" data-v="${esc(b.c)}">複製</button>`:""}${okUrl(b.u)?`<a class="cb" href="${esc(b.u)}" target="_blank" rel="noopener">PDF</a>`:""}</span></div>`).join(""):'<p class="meta">還沒有項目，請到「票券與預約」新增。</p>'}`};
const dietHTML=t=>`<h3>飲食溝通日文卡</h3><div class="jp" id="jp">${esc(t.diet)}</div><div class="pills"><button class="pill" data-a="cp" data-v="${esc(t.diet)}">複製日文</button></div>`;
const DEFSOS=[["日本急救／火警","119","tel:119"],["日本警察","110","tel:110"],["駐日代表處","",""],["海外旅平險卡號","",""]];
const sosList=t=>Array.isArray(t.sos)&&t.sos.length?t.sos:DEFSOS;
const sosRow=x=>`<div class="sosr"><input class="fi sosl" value="${esc(x[0])}" placeholder="名稱"><input class="fi sosv" value="${esc(x[1])}" placeholder="電話／卡號"><button class="x" data-a="sosdel" aria-label="刪除"><svg class="ix" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>`;
const sosHTML=t=>{const ed=document.body.classList.contains("editing")&&!!me,L=sosList(t);
 if(ed)return`<h3>緊急聯絡／保險</h3><div id="sosrows">${L.map(sosRow).join("")}</div><div class="pills"><button class="pill gl" data-a="sosadd">＋ 新增一列</button><button class="pill" data-a="savesos">儲存</button></div><p class="meta" style="margin-top:8px">電話請填數字，會自動變成可撥打連結。</p>`;
 return`<h3>緊急聯絡／保險</h3>${L.map(x=>`<div class="row"><span>${esc(x[0])}</span>${x[1]?(x[2]?`<a class="cb" href="${esc(x[2])}">${esc(x[1])}</a>`:`<b>${esc(x[1])}</b>`):'<span class="meta">尚未填寫</span>'}</div>`).join("")}<p class="meta" style="margin-top:8px">開啟編輯模式後再打開此視窗，即可修改。</p>`};
const itm=(x,di,ii)=>`<div class="it ${x.type||""}"><div class="tm">${esc(x.t)}</div><div class="bd">${dietWarn(x,TV())}<b>${esc(x.h)}</b>${x.type==="crit"?'<em class="tag">重要班次</em>':x.type==="stay"?'<em class="tag stay">住宿</em>':""}${x.d?`<p>${esc(x.d)}</p>`:""}${dietTags(x)}${x.q&&x.lat==null?`<a class="cb" href="https://maps.google.com/?q=${encodeURIComponent(x.q)}" target="_blank" rel="noopener">開啟地圖</a>`:""}${x.more?`<details><summary>備案／說明</summary><p>${esc(x.more)}</p></details>`:""}</div><div class="act ed"><button class="cb" data-a="edititem" data-v="${di}:${ii}" aria-label="編輯"><i class=i-edit></i></button><button class="cb" data-a="delitem" data-v="${di}:${ii}" aria-label="刪除"><svg class="ix" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div></div>`;
const tabsHTML=(t,di)=>getDays(t).map((d,i)=>`<button class="${i===di?"on":""}" data-a="day" data-v="${i}">${esc(d.k)}</button>`).join("")+'<button class="plus ed" data-a="addday" aria-label="新增一天">＋</button>';
const dayHTML=(t,i)=>{const d=getDays(t)[i];if(!d)return'<div class="glass blk"><p class="meta">還沒有每日行程。開啟「編輯模式」後，按上方「＋」新增第一天。</p></div>';
 return`<div class="dh"><h3>${esc(d.city||d.k)}</h3><p>${d.city?esc(d.k)+"・":""}${esc(d.date||"")}${d.wx||d.tp?` <span class="wxchip">${esc(d.wx||"")} ${esc(d.tp||"")}</span>`:""}</p>${d.pos?`<p class="dpos">${esc(d.pos)}</p>`:""}</div>${d.items.map((x,j)=>itm(x,i,j)).join("")||'<p class="meta" style="margin:8px 4px">這天還沒有行程項目。</p>'}${dayMore(d,i)}<div class="pills ed"><button class="pill" data-a="additem" data-v="${i}">＋ 新增景點／行程</button><button class="pill gl" data-a="editday" data-v="${i}">編輯本日</button><button class="pill gl" data-a="delday" data-v="${i}">刪除本日</button></div>`};
function dayIdxByDate(t){try{const D=Array.isArray(t.days)?t.days:[];if(!D.some(d=>d&&d.date))return-1;return D.map(d=>getDayDateStr(t,d)).indexOf(getLocalDateStr())}catch(e){return-1}}
function todayIdx(t){const mi=dayIdxByDate(t);if(mi>=0)return mi;const n=new Date(),s=new Date((t.startDate||"")+"T00:00"),k=Math.floor((n-s)/864e5);return k>=0&&k<getDays(t).length?k:0}
let dailyMapOpen=false;
function nowCard(t){const D=getDays(t),di=Math.min(dayI[t.id]??todayIdx(t),Math.max(0,D.length-1)),n=nd(t);dayI[t.id]=di;RV=t;
 try{return`<div class="nowrow"><article class="nowcard glass${NOWOPEN?" is-open":""}" id="nowcard" data-tid="${esc(t.id)}"><span class="nc-rip" aria-hidden="true"></span>
 <div id="live" class="nc-top" data-a="nowopen">${liveHTML(t)}</div>
 <div class="nc-more" id="ncmore"${NOWOPEN?"":" inert"}><div class="nc-in"><div class="nc-pad">
 <div class="nc-id"><small>${flagOf(t)}${t.country?" "+esc(t.country):""}</small><h2>${esc(t.title)}</h2><p>${esc(t.startDate||"日期未定")}${t.endDate?" – "+esc(t.endDate.slice(5)):""}・${n} 天${(t.members||[]).length>1?`・${t.members.length} 人共編`:""}</p>${t.notes?`<p>${esc(t.notes)}</p>`:""}<div class="cdp" id="cd"></div></div>
 <div class="pt-daily${dailyMapOpen?" dmap-on":""}" id="ptdaily"><div class="days" id="dtabs">${tabsHTML(t,di)}</div><div id="dayblk">${daysAcc(t,di)}</div>
 <div class="dtools"><button class="pill gl mini2" data-a="dmaptoggle" id="dmapbtn">${dailyMapOpen?"收合地圖":"顯示地圖"}</button><div class="locbar" id="locbar">${locBarHTML(t)}</div></div><div class="glass mapbox dmapbox"><div id="nowmap" class="nowmap" role="application" aria-label="行程地圖"></div></div>${dailyMissingHTML(t)}</div>
 </div></div></div><button type="button" class="page-btn pg-auto nc-sw" data-a="swapnext" aria-label="換下一站景點"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h15M15 4l4 4-4 4"/><path d="M20 16H5M9 12l-4 4 4 4"/></svg></button></article></div>`}finally{RV=null}}
function ptsOf(t){const P=[];getDays(t).forEach((d,i)=>d.items.forEach(x=>{if(x.lat!=null)P.push({lat:x.lat,lng:x.lng,day:i,dayLabel:`${d.k} ${d.date||""}`.trim(),time:x.t||"",title:x.h,place:x.q||"",note:x.d||""})}));if(!P.length)(t.spots||[]).forEach(s=>P.push({lat:s.lat,lng:s.lng,day:(s.day||1)-1,dayLabel:s.day?"D"+s.day:"",time:"",title:s.name,place:"",note:s.note||""}));return P}
function refreshDays(t){if(cur==="future"){renderFuture();return}const D=getDays(t),di=Math.min(dayI[t.id]??0,Math.max(0,D.length-1));dayI[t.id]=di;$("#dtabs").innerHTML=tabsHTML(t,di);$("#dayblk").innerHTML=daysAcc(t,di);MiniMap.render("nowmap",ptsOf(t),pickPt)}
async function saveItem(){const t=TV(),f=document.querySelector(".fm"),di=+f.dataset.di,ii=f.dataset.ii===""?null:+f.dataset.ii,v=i=>$("#fi-"+i).value.trim(),h=v("h");if(!h)return toast("請填寫標題");
 const D=getDays(t),day=D[di],old=ii!=null?day.items[ii]:{},x={...old,t:v("t"),h,d:v("d"),q:v("q"),more:v("m")};{const ty=v("type");if(ty)x.type=ty;else delete x.type}{const dg=[...document.querySelectorAll(".rtg:checked")].map(e=>e.value);if(dg.length)x.diet=dg;else delete x.diet}
 if(x.q&&(x.q!==old.q||x.lat==null)){toast("查詢座標中…");const g=await geo(x.q+(t.country?" "+t.country:""));if(g){x.lat=g[0];x.lng=g[1]}else{delete x.lat;delete x.lng;toast("找不到座標，地圖不會標記")}}
 if(!x.q){delete x.lat;delete x.lng}
 if(ii!=null)day.items[ii]=x;else{let k=day.items.length;if(isT(x.t)){const n=day.items.findIndex(y=>isT(y.t)&&y.t.padStart(5,"0")>x.t.padStart(5,"0"));if(n>=0)k=n}day.items.splice(k,0,x)}
 setDays(t,D);$("#modal").classList.remove("on");refreshDays(t)}
function itemForm(di,ii){const t=TV(),x=ii!=null?getDays(t)[di].items[ii]:{};
 modal(`<h3>${ii!=null?"編輯項目":"新增景點／行程"}</h3><div class="fm" data-di="${di}" data-ii="${ii??""}"><label>時間<input id="fi-t" value="${esc(x.t)}" placeholder="例如 09:30（可留空或寫「下午」）"></label><label>標題<input id="fi-h" value="${esc(x.h)}" placeholder="例如 美瑛青池"></label><label>類型<select id="fi-type"><option value="">一般</option><option value="stay" ${x.type==="stay"?"selected":""}>住宿</option><option value="crit" ${x.type==="crit"?"selected":""}>重要班次</option>${x.type&&x.type!=="stay"&&x.type!=="crit"?`<option value="${esc(x.type)}" selected>${esc(x.type)}</option>`:""}</select></label><label>備註<textarea id="fi-d" rows="3">${esc(x.d)}</textarea></label><label>備案／說明（點開行程卡片才會看到）<textarea id="fi-m" rows="3">${esc(x.more)}</textarea></label><label>地點（地圖標記與導航用，可留空）<input id="fi-q" value="${esc(x.q)}" placeholder="例如 青池 美瑛"></label><div class="splits dietrow"><small class="meta">餐廳飲食屬性（選填；也會自動從名稱與備註推測）</small>${RT.map(([c,n])=>`<label class="chk"><input type="checkbox" class="rtg" value="${c}" ${(x.diet||[]).includes(c)?"checked":""}> ${n}</label>`).join("")}</div><div class="pills"><button class="pill" data-a="saveitem">儲存</button></div></div>`)}
function dayForm(i){const t=TV(),d=i!=null?getDays(t)[i]:{};
 modal(`<h3>${i!=null?"編輯本日":"新增一天"}</h3><div class="fm" data-i="${i??""}"><label>城市／主題<input id="fd-c" value="${esc(d.city)}" placeholder="例如 皇后鎮"></label><label>日期（留空會依出發日自動帶入）<input id="fd-date" value="${esc(d.date)}" placeholder="例如 3/12（四）"></label><label>當天重點<input id="fd-p" value="${esc(d.pos)}"></label><label>當日備案／說明<textarea id="fd-m" rows="3">${esc(d.more)}</textarea></label><div class="pills"><button class="pill" data-a="saveday">儲存</button></div></div>`)}
function saveDay(){const t=TV(),f=document.querySelector(".fm"),i=f.dataset.i===""?null:+f.dataset.i,D=getDays(t),c=$("#fd-c").value.trim(),p=$("#fd-p").value.trim();let date=$("#fd-date").value.trim();
 if(i!=null){D[i].city=c;D[i].pos=p;D[i].more=$("#fd-m").value.trim();D[i].date=date}
 else{const n=D.length;if(!date&&/^\d{4}-\d{2}-\d{2}/.test(t.startDate||"")){const x=new Date(t.startDate+"T00:00");x.setDate(x.getDate()+n);date=`${x.getMonth()+1}/${x.getDate()}（${"日一二三四五六"[x.getDay()]}）`}D.push({k:"D"+(n+1),date,city:c,wx:"",tp:"",pos:p,more:$("#fd-m").value.trim(),items:[]});dayI[t.id]=n}
 setDays(t,D);$("#modal").classList.remove("on");refreshDays(t)}

function mapZoom(t,k){const mz=$("#mz");if(zm===k){zm=null;mz.style.transform="";document.querySelectorAll(".hs").forEach(b=>b.classList.remove("act"));$("#mi").innerHTML="點地圖上的地點，會放大並顯示當天資訊";return}
 zm=k;const h=t.hotspots[k],S=2.4,px=h.x/t.mapSize[0]*100,py=h.y/t.mapSize[1]*100,cl=v=>Math.min(0,Math.max(100-100*S,v));
 mz.style.transform=`translate(${cl(50-px*S)}%,${cl(50-py*S)}%) scale(${S})`;document.querySelectorAll(".hs").forEach((b,i)=>b.classList.toggle("act",i===k));
 const d=getDays(t)[h.day]||{};$("#mi").innerHTML=`<b>${esc(h.name)}</b><span class="chip">${esc(d.k)}</span><p>${esc(h.note)}</p><p>${esc(d.date)} ${esc(d.city)}・${esc(d.tp)}</p><div class="pills"><button class="pill" data-a="day" data-v="${h.day}" data-go="1">看 ${esc(d.k)} 行程</button><a class="pill gl" href="https://maps.google.com/?q=${encodeURIComponent(h.name+" 北海道")}" target="_blank" rel="noopener">地圖</a></div>`}

/* cards */
/* ===== 未來清單：可展開行程卡（收合＝標題＋國家・日期・天數；展開＝按鈕＋每日行程，可編輯） ===== */
function futTrip(){return FUT_OPEN?visible().find(x=>x.id===FUT_OPEN&&x.status==="future")||null:null}
function fcard(t){const open=FUT_OPEN===t.id,id=esc(t.id),n=nd(t),D=getDays(t),di=Math.min(dayI[t.id]??0,Math.max(0,D.length-1)),ed=document.body.classList.contains("editing");dayI[t.id]=di;RV=t;
 try{const place=[flagOf(t),t.country?esc(t.country):""].filter(Boolean).join(" "),meta=[place,(t.startDate?esc(t.startDate):"日期未定")+(t.endDate?" – "+esc(t.endDate.slice(5)):""),n+" 天"].filter(Boolean).join("・");
 return`<article class="glass fc${open?" is-open":""}" data-tid="${id}"><button type="button" class="fc-hd" data-a="futopen" data-v="${id}" aria-expanded="${open}" aria-controls="fcm-${id}"><span class="fc-tt"><b>${esc(t.title)}</b><small>${meta}</small></span><i class="chev" aria-hidden="true"></i></button>
<div class="fc-more" id="fcm-${id}"${open?"":" inert"}><div class="fc-in"><div class="fc-pad">${t.notes?`<p class="fc-note">${esc(t.notes)}</p>`:""}
<div class="fc-act"><button class="pill" data-a="setcur" data-v="${id}">設為當前行程</button>${me?`<button class="pill gl" data-a="edit" data-v="${id}"><i class=i-edit></i> 編輯</button>`:""}${t.owner===me?.uid?`<button class="pill gl" data-a="del" data-v="${id}"><svg class="ix" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg> 刪除</button>`:""}</div>
${me?`<div class="pills topact"><button class="pill mini edt${ed?" on":""}" data-a="edtoggle"><i class="i-edit"></i><span class="edt-l">${ed?"結束並儲存":"編輯模式"}</span></button></div>`:""}
<div class="days">${tabsHTML(t,di)}</div><div class="fc-day">${dayHTML(t,di)}</div></div></div></div></article>`}finally{RV=null}}
function renderFuture(){const el=$("#l-future");if(!el)return;
 try{const L=visible().filter(t=>t.status==="future").sort((a,b)=>(a.startDate?0:1)-(b.startDate?0:1)||String(a.startDate||"").localeCompare(String(b.startDate||"")));
  if(FUT_OPEN&&!L.some(t=>t.id===FUT_OPEN))FUT_OPEN=null;
  el.innerHTML=L.map(x=>fcard(x)).join("")||'<p class="empty">還沒有未來的旅程，點上方「＋ 新增旅程」開始規劃</p>'}catch(e){console.error("[renderFuture]",e)}}
function futToggle(id){const was=FUT_OPEN===id;if(FUT_OPEN)setEdit(false);FUT_OPEN=was?null:id;
 document.querySelectorAll("#l-future .fc").forEach(c=>{const on=c.dataset.tid===FUT_OPEN,m=c.querySelector(".fc-more"),h=c.querySelector(".fc-hd");c.classList.toggle("is-open",on);if(m){if(on)m.removeAttribute("inert");else m.setAttribute("inert","")}if(h)h.setAttribute("aria-expanded",String(on))});
 const c=FUT_OPEN&&document.querySelector("#l-future .fc.is-open");if(c){bounce(c);setTimeout(()=>{try{c.scrollIntoView({behavior:"smooth",block:"nearest"})}catch(e){}},420)}}
function tcard(t){if(t.status==="past")return pcard(t);const fut=t.status==="future",mine=String(t.id).startsWith("u-");
 return`<article class="glass tc ${fut?"fut":""}"><div class="ph">${(t.image||photoOf(t.id))?`<img src="${esc(t.image||photoOf(t.id))}" alt="${esc(t.title)}" loading="lazy" onerror="this.remove()">`:""}<span>${flagOf(t)}</span></div><div class="in"><h3>${esc(t.title)}</h3><p class="meta">${esc(t.country)}・${esc(t.startDate||"日期未定")}${t.endDate?" – "+esc(t.endDate.slice(5)):""}・${nd(t)} 天</p>${t.notes?`<p style="margin-top:8px;font-size:.9rem">${esc(t.notes)}</p>`:""}
 <div class="pills" style="margin-top:10px">${t.spots?.length?`<a class="pill gl" href="https://maps.google.com/?q=${t.spots[0].lat},${t.spots[0].lng}" target="_blank" rel="noopener">地圖</a>`:""}${t.status==="past"?`<button class="pill" data-a="setcur" data-v="${esc(t.id)}">重新設為當前行程</button>`:""}${fut?`<button class="pill" data-a="setcur" data-v="${esc(t.id)}">設為當前行程</button>`:""}${me?`<button class="pill gl" data-a="edit" data-v="${esc(t.id)}"><i class=i-edit></i> 編輯</button>`:""}${t.owner===me?.uid?`<button class="pill gl" data-a="del" data-v="${esc(t.id)}"><svg class="ix" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg> 刪除</button>`:""}</div></div></article>`}

/* ===== 行程照片：每張卡片 1 張。上傳優先寫入 Firestore（image 欄位，雲端持久保存，清除瀏覽資料也不會消失）；雲端失敗才退回本機 localStorage。前台只顯示 1 張，更新即覆蓋，看不見的自動清理 ===== */
const PH_KEY=id=>"tp-photo-"+id,PH_OLD=id=>"tp-photos-"+id;
function photoOf(id){try{const v=localStorage.getItem(PH_KEY(id));return typeof v==="string"&&v.indexOf("data:image")===0?v:""}catch(e){return""}}
function setPhoto(id,data){try{if(data)localStorage.setItem(PH_KEY(id),data);else localStorage.removeItem(PH_KEY(id));localStorage.removeItem(PH_OLD(id));return true}
 catch(e){console.warn("[photo] 本機儲存失敗",e);toast("照片存不下：這台裝置的本機空間不足");return false}}
/* 自動清理：舊版多張格式只保留第 1 張、其餘直接刪除；行程已用照片（雲端 image 或網址）→ 清掉重複的本機備援；行程已刪除 → 清掉本機照片 */
function photoGC(){try{const v=visible(),ids=new Set(v.map(t=>t.id));
 Object.keys(localStorage).forEach(k=>{
  if(k.indexOf("tp-photos-")===0){ /* 舊版陣列：只留第 1 張，整個舊 key 刪除 */
   const id=k.slice(10);let first="";try{const a=JSON.parse(localStorage.getItem(k));if(Array.isArray(a))first=a.find(x=>typeof x==="string"&&x.indexOf("data:image")===0)||""}catch(e){}
   const t=v.find(x=>x.id===id);
   if(first&&!(t&&t.image)&&!photoOf(id))localStorage.setItem(PH_KEY(id),first);
   localStorage.removeItem(k)}
  else if(k.indexOf("tp-photo-")===0){const id=k.slice(9),t=v.find(x=>x.id===id);
   if(!ids.has(id)||(t&&t.image))localStorage.removeItem(k)}})}catch(e){}}
/* ===== 圖片自動壓縮：FileReader → <canvas> 等比例縮放，由高畫質逐步降級直到 Base64 ≤500KB（JPEG 約 375KB），兼顧畫質與容量 ===== */
const PH_SAFE_LEN=500000; /* Base64 上限 ≈500KB 字元 */
function shrinkImg(f){return new Promise(res=>{const fr=new FileReader();
 fr.onerror=()=>res(null);
 fr.onload=()=>{const im=new Image(),raw=String(fr.result||"");
  im.onerror=()=>res(raw.indexOf("data:image")===0&&raw.length<=PH_SAFE_LEN?raw:null); /* 解碼失敗：僅在檔案夠小時才保留 */
  im.onload=()=>{try{
    /* 由高畫質（1280px/0.82）起逐步縮小，第一個 ≤500KB 的結果即採用，避免過度犧牲畫質 */
    const steps=[[1280,.82],[1100,.8],[960,.78],[850,.75],[760,.72],[640,.68],[512,.6],[400,.55],[320,.5]];
    for(let i=0;i<steps.length;i++){const[lim,q]=steps[i],last=i===steps.length-1;
      const s=Math.min(1,lim/Math.max(im.width,im.height)),c=document.createElement("canvas");
      c.width=Math.max(1,Math.round(im.width*s));c.height=Math.max(1,Math.round(im.height*s));
      const g=c.getContext("2d");g.fillStyle="#fff";g.fillRect(0,0,c.width,c.height);g.drawImage(im,0,0,c.width,c.height);
      const out=c.toDataURL("image/jpeg",q);
      if(out.length<=PH_SAFE_LEN||last){res(out);return}
    }
    res(null)}catch(e){res(raw.indexOf("data:image")===0&&raw.length<=PH_SAFE_LEN?raw:null)}};
  im.src=raw};
 fr.readAsDataURL(f)})}
/* 上傳：單張取代。優先寫 Firestore 雲端（持久保存）；失敗才退回本機。舊照片在覆蓋瞬間即被取代（無張數上限） */
async function addPhotos(id,files){const f=[...(files||[])].find(x=>x&&/^image\//.test(x.type));
 if(!f)return toast("請選擇圖片檔");
 toast("上傳中…");
 const d=await shrinkImg(f);
 if(!d)return toast("上傳失敗，請換一張圖片試試");
 const t=TRIPS.find(y=>y.id===id);
 if(t&&db&&me){ /* 雲端為主：寫入行程文件 image 欄位，換瀏覽器／清瀏覽資料都不會消失 */
  const ok=await updateDoc(tdoc(t),ser({image:d})).then(()=>true).catch(e=>{console.error("[photo] 雲端寫入失敗",e);return false});
  if(ok){t.image=d;setPhoto(id,"");render();toast("照片已更新");return} /* 同步本地物件，讓前台立即顯示 */
  toast("雲端同步失敗，先存到本機，連線後再試一次");
 }
 if(setPhoto(id,d)){render();toast("照片已更新")}}

/* ===== IG Story：復古信封拼貼 9:16 分享圖（歷史旅程） ===== */
/* 狀態僅暫存於當前視窗記憶體（Blob URL），關閉彈窗即撤銷釋放，絕不寫入 localStorage */
const STORY = { trip: null, bg: null, polis: [], revokes: [] };

/* 分享圖示 SVG：與「漢堡選單 -> 資料與備份」的 .ic-up 圖示 100% 一致 */
function storySvg(){
  return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>`;
}

/* 前端 Canvas 壓縮：限制寬度 1000px 以內，品質自動遞減直至圖片 ≤ 500KB，輸出 Blob URL，僅記憶體暫存 */
async function compressToBlob(file, maxWidth = 1000, maxSizeKB = 500){
  const arrayBuffer = await new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = () => rej(new Error("read failed"));
    fr.readAsArrayBuffer(file);
  });

  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error("img load failed"));
    i.src = URL.createObjectURL(new Blob([arrayBuffer]));
  });

  let w = img.width, h = img.height;
  if (w > maxWidth){ h = Math.round(h * maxWidth / w); w = maxWidth; }

  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d");
  g.drawImage(img, 0, 0, w, h);

  let quality = 0.92;
  let blob = null;
  while (quality > 0.35) {
    blob = await new Promise(res => c.toBlob(res, "image/jpeg", quality));
    if (blob.size <= maxSizeKB * 1024) break;
    quality -= 0.08;
  }
  if (!blob) blob = await new Promise(res => c.toBlob(res, "image/jpeg", quality));
  return URL.createObjectURL(blob);
}

function storyClear(){
  STORY.revokes.forEach(u => { try { URL.revokeObjectURL(u); } catch(e){} });
  STORY.revokes = [];
  STORY.bg = null; STORY.polis = []; STORY.trip = null;
}

/* 等比例縮放 9:16 畫布以符合螢幕，不拉長壓扁 */
function storyFit(){
  const wrap = $("#story-wrap"), stage = $(".story-stage");
  if (!wrap) return;
  const s = Math.min(1, document.documentElement.clientWidth / 750, document.documentElement.clientHeight / 1334);
  wrap.style.setProperty("--s", s);
  if (stage) stage.style.height = (1334 * s) + "px";
}

/* 開啟 9:16 分享編輯彈窗 */
function openStory(t){
  STORY.trip = t;
  const from = (t.spots && t.spots[0] && t.spots[0].city) || "出發地";
  const to = t.country || "未知國";
  const date = `${t.startDate || ""}${t.endDate ? " \u2212 " + t.endDate.slice(5) : ""}`;
  const members = t.members || [];
  const passenger = members.length ? (t.memberNames && t.memberNames[members[0]]) || members[0] : "旅客";

  modal(`<div class="story-modal">
    <div class="story-head"><h3>限時動態分享圖</h3><p class="story-meta">${esc(t.title)}</p></div>
    <div class="story-stage">
      <div class="story-wrap" id="story-wrap">
        <!-- Bottom Layer：背景大圖 -->
        <div class="story-bg" id="story-bg"></div>

        <!-- Middle Layer 1：拍立得照片層 -->
        <div class="story-polis" id="story-polis"></div>

        <!-- Middle Layer 3：機票層（air tickets.png + 百分比定位動態文字） -->
        <div class="story-ticket" id="story-ticket">
          <div class="tk-field tk-from" style="left:20%;top:34%;">${esc(from)}</div>
          <div class="tk-field tk-dest" style="left:50%;top:34%;">${esc(to)}</div>
          <div class="tk-field tk-date" style="left:20%;top:52%;">${esc(date)}</div>
          <div class="tk-field tk-pass" style="left:50%;top:52%;">${esc(passenger)}</div>
        </div>

        <!-- Top Layer：去背信封圖 envelope.png（z-index 最高） -->
        <div class="story-envelope" id="story-envelope"></div>

        <!-- 郵票裝飾（最上方，z-index 15） -->
        <div class="story-stamps" id="story-stamps">
          <div class="story-stamp" style="left:26px;top:30px;transform:rotate(-6deg)">POSTED</div>
          <div class="story-stamp" style="right:26px;top:160px;transform:rotate(8deg)">AIR MAIL</div>
        </div>
      </div>
    </div>

    <!-- 上傳區塊：明確分為背景與拍立得兩區 -->
    <div class="story-upload">
      <div class="story-upload-section">
        <div class="story-upload-section-title">【背景大圖上傳區】</div>
        <div class="story-upload-row">
          <label class="story-up">選擇 1 張背景大圖<input type="file" accept="image/*" class="story-file" data-st="bg"></label>
        </div>
        <div class="story-upload-hint">建議：風景、建築或紀念照，填滿 9:16 畫布</div>
      </div>
      <div class="story-upload-section">
        <div class="story-upload-section-title">【拍立得小圖上傳區】</div>
        <div class="story-upload-row">
          <label class="story-up">選擇 1~5 張拍立得照片<input type="file" accept="image/*" class="story-file" data-st="pol" multiple></label>
        </div>
        <div class="story-upload-hint">最多 5 張，自動壓縮 ≤500KB 並塞進拍立得相紙</div>
      </div>
    </div>

    <div class="story-foot">
      <button class="pill gl" data-a="storydl" id="storydl">下載分享圖</button>
    </div>
  </div>`);
  setupStoryInputs();
  renderStory();
  storyFit();
}

/* 視窗大小變更時重新等比例縮放 */
addEventListener("resize", storyFit);

/* 綁定檔案上傳輸入（背景 1 張、拍立得 1~5 張） */
function setupStoryInputs(){
  const wrap = $("#story-wrap");
  if (!wrap) return;
  wrap.querySelectorAll(".story-file").forEach(inp => {
    // 移除舊的監聽器避免重複綁定
    const newInp = inp.cloneNode(true);
    inp.parentNode.replaceChild(newInp, inp);
    newInp.onchange = async e => {
      const st = newInp.dataset.st;
      const files = [...(newInp.files || [])];
      if (st === "bg") {
        if (files.length) {
          // 立即用原始檔案建立預覽網址，讓畫面馬上有回饋
          const immediateUrl = URL.createObjectURL(files[0]);
          STORY.bg = immediateUrl;
          STORY.revokes.push(immediateUrl);
          // 同時壓縮為 ≤500KB 用於最終輸出
          const compressed = await compressToBlob(files[0]);
          if (compressed) {
            // 將舊的即時網址替換為壓縮後的
            const idx = STORY.revokes.indexOf(immediateUrl);
            if (idx >= 0) STORY.revokes[idx] = compressed;
            STORY.bg = compressed;
          }
        }
      } else if (st === "pol") {
        const urls = [];
        for (const f of files.slice(0, 5)) {
          // 立即用原始檔案建立預覽網址
          const immediateUrl = URL.createObjectURL(f);
          urls.push(immediateUrl);
          STORY.revokes.push(immediateUrl);
          // 同時壓縮為 ≤500KB 用於最終輸出
          const compressed = await compressToBlob(f);
          if (compressed) {
            const idx = urls.indexOf(immediateUrl);
            if (idx >= 0) urls[idx] = compressed;
          }
        }
        STORY.polis = urls;
      }
      newInp.value = "";
      renderStory();
    };
  });
}

function storyRandRot(){ return (Math.random() * 16 - 8).toFixed(2) + "deg"; }

/* 重繪預覽拼貼；等待圖片載入後才產生動畫，避免截圖空白 */
function renderStory(){
  const bg = $("#story-bg"), polis = $("#story-polis");
  if (!bg) return;
  if (STORY.bg) { bg.style.backgroundImage = `url(${STORY.bg})`; bg.dataset.loaded = "1"; bg.className = "story-bg"; }
  else { bg.style.backgroundImage = "none"; bg.className = "story-bg story-empty"; bg.dataset.loaded = "1"; }

  const n = STORY.polis.length;
  if (n === 0) { polis.innerHTML = ""; return; }

  // 扇形散開參數：照片 340×530，中心約 x=375，信封開口約 y=505
  // 照片下半部落在信封內，上半部露出，形成扇形錯落
  const centerX = 375;
  const photoW = 340;
  const photoH = 530;
  const baseTop = 220;              // 照片頂部基準位置（跨越信封開口）
  const baseLeft = centerX - photoW / 2;   // 置中基準
  const spreadX = 90;               // 左右散開幅度
  const spreadTop = 30;             // 上下散開幅度
  const maxRot = 10;                // 最大旋轉角度

  let html = "";
  STORY.polis.forEach((u, i) => {
    // 計算扇形位置：兩端向外擴散，中間靠近中心
    const t = n === 1 ? 0 : i / (n - 1);           // 0~1
    const offsetX = (t - 0.5) * spreadX * 2;       // -spreadX ~ +spreadX
    const rot = (t - 0.5) * maxRot * 2;            // -maxRot ~ +maxRot
    const left = baseLeft + offsetX;
    const top = baseTop + (Math.abs(t - 0.5) * spreadTop);  // 兩端稍低，中間稍高
    const delay = (i * 0.08).toFixed(2) + "s";

    html += `<div class="story-p" style="left:${left}px;top:${top}px;z-index:${11 + i};--r:${rot}deg">
      <div class="story-pinner story-panim" style="animation-delay:${delay}">
        <div class="story-pframe">
          <img src="${u}" class="story-pimg" loading="eager" onload="this.closest('.story-pframe')?.classList.add('p-loaded')">
          <!-- 去背拍立得相紙框 Polaroid.png，與照片同尺寸完美覆蓋，中心挖空讓底層照片露出 -->
          <img src="Polaroid.png" class="story-polaroid-frame" loading="eager">
        </div>
      </div>
    </div>`;
  });
  polis.innerHTML = html;
}

/* 一鍵下載 / 分享：確認圖片皆載入後截圖，支援下載與原生分享 */
async function downloadStory(){
  const wrap = $("#story-wrap");
  const btn = $("#storydl");
  if (!wrap || !btn) return;
  // 非同步載入防護：確認背景與所有拍立得圖片已完全載入
  const imgs = [...wrap.querySelectorAll("img")];
  await Promise.all(imgs.map(img => {
    if (img.complete && img.naturalWidth) return Promise.resolve();
    return new Promise(res => { img.onload = res; img.onerror = res; });
  }));
  if (typeof htmltoimage === "undefined") return toast("截圖套件尚未載入，請稍後再試");
  // 載入狀態：轉圈與提示文字
  const orig = btn.innerHTML;
  btn.classList.add("story-loading");
  btn.disabled = true;
  btn.innerHTML = "產生中…";
  try {
    const dataUrl = await htmltoimage.toPng(wrap, { quality: 1, cacheBusting: true, pixelRatio: 1 });
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], `TripTick_${esc(STORY.trip.title || "trip")}.png`, { type: "image/png" });
    // 下載至手機相簿（稍後釋放 Blob URL，避免下載尚未開始即被撤銷）
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = file.name; a.style.display = "none";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 200);
    // 原生分享（僅在支援檔案分享時）
    if (navigator.share && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: STORY.trip.title, text: "我的 TripTick 旅行回憶" }); }
      catch (e) { /* 使用者取消分享，靜默忽略 */ }
    }
    toast("分享圖已下載");
  } catch (e) {
    console.error("[storydl]", e);
    toast("截圖失敗，請確認圖片已上傳並重新嘗試");
  } finally {
    btn.classList.remove("story-loading");
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}
/* ===== 歷史明信片：上方 3:4 照片 + 下方純白文字區（橫向滑動列表卡片） ===== */
function pcMeta(t){const dateTxt=`${t.startDate||"日期未定"}${t.endDate?" – "+t.endDate.slice(5):""}`;
 const mates=[...new Set(t.members||[])].map(u=>nameOf(t,u)).map(n=>/^[0-9a-zA-Z]{20,}$/.test(n)?"旅客":n);
 return{dateTxt,mateTxt:mates.length?mates.join("、"):"自行出發"}}
/* 城市：一趟出國可能去多個城市，取每日行程 city 去重串接 */
function pcCities(t){const set=[];getDays(t).forEach(d=>{const c=(d.city||"").trim();if(c&&!set.includes(c))set.push(c)});return set.join("、")}
function pcard(t){const{dateTxt,mateTxt}=pcMeta(t),cities=pcCities(t),img=t.image||photoOf(t.id)||"";
 return`<article class="pc-item" data-pid="${esc(t.id)}">
  <div class="pc-photo">${img?`<img src="${esc(img)}" alt="${esc(t.title)} 照片" loading="lazy" onerror="this.style.display='none'">`:""}<div class="pc-shade"></div></div>
  <div class="pc-body">
   <button class="pc-grab" type="button" data-a="pcexp"><span class="g-open">▲ 展開</span><span class="g-close">▼ 收合</span></button>
   <div class="pc-scroll">
    <p class="pc-title">${esc(t.title)}</p>
    <h3 class="pc-country">${esc(t.country)||"未知國家"}</h3>
    <p class="pc-meta">${flagOf(t)} ${esc(dateTxt)}<br>${nd(t)} 天<br>旅客：${esc(mateTxt)}</p>
    <div class="pc-note-row"><div class="pc-note"><em>心情札記</em><p>${t.notes?esc(t.notes):"還沒有寫下這趟旅程的心情札記…"}</p></div>${cities?`<span class="pc-cities" title="${esc(cities)}">${esc(cities)}</span>`:""}</div>
   </div>
<div class="pills pc-act">${me ? `<button class="pill" data-a="edit" data-v="${esc(t.id)}"><i class=i-edit></i> 編輯</button>` : ""}${t.status==="past"?`<button class="pill gl" data-a="setcur" data-v="${esc(t.id)}">設為當前行程</button>`:""}${t.status==="past"?`<button class="pill gl story-share" data-a="ss-open" data-v="${esc(t.id)}" aria-label="產生這趟旅程的 IG 限時動態分享圖"><svg viewBox="0 0 24 24" width="19" height="19" fill="none"stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/></svg></button>`:""}${t.owner===me?.uid?`<button class="pill gl" data-a="del" data-v="${esc(t.id)}"><svg class="ix" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg> 刪除</button>`:""}</div>
  </div>
   </article>`}

/* ===== 排序：預設依出發日期由左至右；長按拖曳可自訂順序（存 localStorage） ===== */
const PORD_KEY="tp-past-order";
function pastOrder(list){const byDate=(a,b)=>String(a.startDate||"9999-99-99").localeCompare(String(b.startDate||"9999-99-99"));
 let ord=[];try{ord=JSON.parse(localStorage.getItem(PORD_KEY))||[]}catch(e){ord=[]}
 const map=new Map(list.map(t=>[t.id,t])),out=[];
 ord.forEach(id=>{const t=map.get(id);if(t){out.push(t);map.delete(id)}}); /* 自訂順序優先 */
 [...map.values()].sort(byDate).forEach(t=>out.push(t));                  /* 其餘依日期補在後面 */
 return out}
function savePastOrder(box){const ids=[...box.querySelectorAll(".pc-item")].map(el=>el.dataset.pid);
 try{localStorage.setItem(PORD_KEY,JSON.stringify(ids))}catch(e){}}
/* 編輯彈窗用：目前顯示順序中的位置（1 起算）；寫入後立即生效並持久化 */
function pastPosOf(id){const ids=pastOrder(visible().filter(t=>t.status==="past")).map(t=>t.id);return ids.indexOf(id)+1}
function setPastPos(id,pos){const ids=pastOrder(visible().filter(t=>t.status==="past")).map(t=>t.id).filter(x=>x!==id);
 const p=Math.max(1,Math.min(ids.length+1,pos||ids.length+1));
 ids.splice(p-1,0,id);
 try{localStorage.setItem(PORD_KEY,JSON.stringify(ids))}catch(e){}}

/* ===== 橫向滑動列表互動：左右滑由容器原生處理；卡片上垂直滑動或點把手 → 展開／收合滿版心情札記；長按 0.5 秒 → 拖曳排序 ===== */
function pastInit(){const box=$("#l-past");if(!box)return;
 [...box.querySelectorAll(".pc-item")].forEach(bindSwipe)}
function bindSwipe(el){if(el._sc)return;el._sc=1;
 const box=$("#l-past");
 let x0=0,y0=0,armed=false,lp=null,drag=false;
 const clearLP=()=>{if(lp){clearTimeout(lp);lp=null}};
 const endDrag=()=>{if(!drag)return;drag=false;
  el.classList.remove("pc-dragging");el.style.transform="";
  if(box){box.classList.remove("pc-reordering");savePastOrder(box);toast("已更新排列順序")}};
 el.addEventListener("pointerdown",e=>{if(e.button)return;
  if(e.target.closest("button,a,input,label,select,textarea"))return;
  armed=true;drag=false;x0=e.clientX;y0=e.clientY;
  clearLP();
  lp=setTimeout(()=>{lp=null;drag=true;armed=false;      /* 長按 0.5s → 進入拖曳排序 */
   el.classList.add("pc-dragging");if(box)box.classList.add("pc-reordering");
   try{el.setPointerCapture(e.pointerId)}catch(_){}
   if(navigator.vibrate)try{navigator.vibrate(12)}catch(_){}
  },480)});
 el.addEventListener("touchmove",e=>{if(drag)e.preventDefault()},{passive:false}); /* 拖曳中關閉容器原生捲動 */
 el.addEventListener("pointermove",e=>{if(drag){
   el.style.transform=`translate3d(${e.clientX-x0}px,0,0)`;
   /* 滑過相鄰卡片中線即交換位置 */
   const er=el.getBoundingClientRect(),em=er.left+er.width/2;
   for(const s of[...box.querySelectorAll(".pc-item")].filter(c=>c!==el)){
    const r=s.getBoundingClientRect(),mid=r.left+r.width/2;
    if(em>mid&&(s.compareDocumentPosition(el)&Node.DOCUMENT_POSITION_FOLLOWING)){box.insertBefore(el,s);x0=e.clientX;el.style.transform="";break}
    if(em<mid&&(el.compareDocumentPosition(s)&Node.DOCUMENT_POSITION_FOLLOWING)){box.insertBefore(s,el);x0=e.clientX;el.style.transform="";break}
   }
   return}
  if(armed&&Math.hypot(e.clientX-x0,e.clientY-y0)>10)clearLP(); /* 未長按就移動 → 取消，交給原生捲動 */
 });
 el.addEventListener("pointerup",e=>{clearLP();
  if(drag){endDrag();return}                                 /* 拖曳結束：存順序 */
  if(!armed)return;armed=false;
  const dx=e.clientX==null?0:e.clientX-x0,dy=e.clientY==null?0:e.clientY-y0;
  if(Math.abs(dy)<32||Math.abs(dy)<Math.abs(dx))return;      /* 以垂直滑動為準，水平滑動交給容器 */
  pcToggle(el,dy<0)});                                        /* 上滑展開、下滑收合 */
 el.addEventListener("pointercancel",()=>{clearLP();if(drag)endDrag();armed=false})}
function pcToggle(el,open){el.classList.toggle("open",open)}
/* 把手按鈕：點擊展開／收合 */
function pcExpToggle(b){const el=b.closest(".pc-item");if(el)pcToggle(el,!el.classList.contains("open"))}

/* add / edit */
function form(st,id){const t0=TRIPS.find(x=>x.id===id),t=t0?{...t0,status:statusOf(t0)}:{status:st,spots:[]},sp=t.spots?.[0]||{};
 modal(`<h3>${id?"編輯旅程":"新增旅程"}</h3><div class="fm" data-id="${esc(id||"")}">
 <label>地點<input id="f-place" value="${esc(t.title)}" placeholder="例如：清邁" required></label>
 <label>國家<input id="f-country" list="cl" value="${esc(t.country)}" placeholder="例如：泰國" required></label>${curFieldHTML(id?(t.currency||"JPY"):(CUR[t.country]||"TWD"))}
 <label>定位城市（選填）<input id="f-geocity" value="${esc(t.geoCity||"")}" placeholder="例如：台中（口袋名單定位用）" maxlength="20"></label><datalist id="cl">${Object.keys(FL).map(k=>`<option value="${k}">`).join("")}</datalist>
 <div class="two"><label>出發日<input id="f-s" type="date" value="${esc(t.startDate)}"></label><label>回程日<input id="f-e" type="date" value="${esc(t.endDate)}"></label></div>
 <label>類型<select id="f-st"><option value="now" ${t.status==="now"?"selected":""}>當前旅程</option><option value="past" ${t.status==="past"?"selected":""}>歷史旅程</option><option value="future" ${t.status==="future"?"selected":""}>未來清單</option></select></label>
 ${id&&t.status==="past"?`<label>排列順序（歷史列表由左至右）<input id="f-pos" type="number" inputmode="numeric" min="1" step="1" value="${pastPosOf(id)}"><span class="meta">1 = 最左邊。也可在列表長按卡片 0.5 秒直接拖曳排序。</span></label>`:""}
 ${id?`<label>照片（上傳新照片將自動取代舊照片）<span class="pc-up">從相簿選擇<input class="pc-file" type="file" accept="image/*" data-ph="${esc(id)}"></span></label>`:`<label>照片<span class="meta">先按「儲存」建立行程，再到歷史明信片上傳照片。</span></label>`}
 <label>備註<textarea id="f-note" rows="3">${esc(t.notes)}</textarea></label>
 <label>照片網址<input id="f-image" type="text" value="${esc(/^https?:\/\//.test(t.image||"")?t.image:"")}" placeholder="貼上圖片網址；留空則保留已上傳的照片"></label>
 <details><summary>進階：座標（留空會自動查詢）</summary><div class="two"><label>緯度<input id="f-lat" type="number" step="any" value="${sp.lat??""}"></label><label>經度<input id="f-lng" type="number" step="any" value="${sp.lng??""}"></label></div></details>
 <div class="pills"><button class="pill" data-a="save">儲存</button></div></div>`)}
async function geo(q){const one=async s=>{try{const r=await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&q="+encodeURIComponent(s));const j=await r.json();return j[0]?[+j[0].lat,+j[0].lon]:null}catch(e){return null}};const base=String(q),mm=base.match(/[（(]([^）)]*)[）)]/),v=[],add=s=>{s=String(s||"").replace(/\s+/g," ").trim();if(s&&!v.includes(s))v.push(s)};add(base);if(mm){add(base.replace(mm[0]," "));add(mm[1]+" "+base.slice(mm.index+mm[0].length))}[...v].forEach(s=>add(s.replace(/台/g,"臺")));const tries=v.slice(0,5);for(let i=0;i<tries.length;i++){const g=await one(tries[i]);if(g)return g;if(i<tries.length-1)await new Promise(r=>setTimeout(r,1100))}return null}
const CUR={日本:"JPY",台灣:"TWD",韓國:"KRW",南韓:"KRW",泰國:"THB",美國:"USD",瑞士:"CHF",法國:"EUR",德國:"EUR",義大利:"EUR",西班牙:"EUR",荷蘭:"EUR",奧地利:"EUR",希臘:"EUR",芬蘭:"EUR",葡萄牙:"EUR",比利時:"EUR",愛爾蘭:"EUR",克羅埃西亞:"EUR",歐洲:"EUR",越南:"VND",新加坡:"SGD",馬來西亞:"MYR",香港:"HKD",中國:"CNY",加拿大:"CAD",英國:"GBP",冰島:"ISK",澳洲:"AUD",紐西蘭:"NZD",印尼:"IDR",菲律賓:"PHP",捷克:"CZK",土耳其:"TRY",挪威:"NOK",瑞典:"SEK",丹麥:"DKK"};
const archiveNow=ex=>Promise.all(visible().filter(x=>x.status==="now"&&x.id!==ex).map(x=>setSt(x,"past")));
async function saveForm(){if(!me)return toast("請先登入");
 const v=i=>$("#f-"+i).value.trim(),id=document.querySelector(".fm").dataset.id,place=v("place"),country=v("country");
 if(!place||!country)return toast("請填寫地點與國家");
 /* 照片改由「本機相簿檔案選擇器」上傳（FileReader → localStorage），不再使用網址輸入 */
 const old=id?TRIPS.find(x=>x.id===id):null,spots=old?[...(old.spots||[])]:[];let lat=parseFloat(v("lat")),lng=parseFloat(v("lng"));
 if(!isNaN(lat)&&!isNaN(lng)){if(spots.length&&spots[0].lat===lat&&spots[0].lng===lng){}else if(spots.length)spots[0]={...spots[0],lat,lng};else spots.push({name:place,lat,lng,day:1})}
 else if(!spots.length){toast("查詢座標中…");const g=await geo(place+", "+country);if(g)spots.push({name:place,lat:g[0],lng:g[1],day:1});else toast("找不到座標，可稍後編輯")}
 const s=v("e")&&v("s")?v("s"):v("s"),e=v("e"),nDays=s&&e?Math.max(1,Math.round((new Date(e)-new Date(s))/864e5)+1):(old?.nDays||1);
 const base={title:place,country,geoCity:v("geocity").slice(0,20),currency:v("cur")||old?.currency||CUR[country]||"TWD",countryCode:FL[country]||"",startDate:s,endDate:e,image:v("image")||old?.image||"",notes:v("note"),nDays,spots},st=v("st"); /* 網址留空 → 保留已上傳的照片，避免被覆蓋成空白 */
 if(old&&(old.expenses||[]).length&&(old.currency||"JPY")!==base.currency&&!confirm("這趟行程已有 "+old.expenses.length+" 筆花費。改幣別不會換算舊金額，數字會直接當成新幣別。確定要改嗎？"))return;
 try{if(old){await patch(old,base);if(st==="now")await archiveNow(old.id);await setSt(old,st)}
 else{if(st==="now")await archiveNow("");const ref=doc(collection(db,"trips"));await setDoc(ref,{...clean({...base,days:[],booking:[],expenses:[],diets:{},ext:EXT0,owner:me.uid,members:[me.uid],memberNames:{[me.uid]:me.displayName||"我"},st:{[me.uid]:st}}),createdAt:serverTimestamp()})}
 /* 排列順序：編輯彈窗的數字欄位（僅歷史旅程），寫入 localStorage 並立即重排 */
 const posEl=$("#f-pos");if(old&&posEl&&st==="past"){const p=parseInt(posEl.value,10);if(!isNaN(p)&&p>0){setPastPos(old.id,p);render()}}
 $("#modal").classList.remove("on");toast("已儲存");if(cur==="home"&&!old)go("now")}catch(err){toast("儲存失敗："+(err.code||err.message))}}

function render(){const v=visible(),by=s=>v.filter(t=>t.status===s);zm=null;
 renderNow(by("now")[0]);
  
  if(cur==="home")renderHome();
 const real=v.filter(t=>t.status!=="future");
 $("#stats").innerHTML=`<div class="glass stat"><b>${new Set(real.map(t=>t.countryCode||t.country)).size}</b><small>造訪國家</small></div><div class="glass stat"><b>${cityCount(real)}</b><small>造訪城市</small></div><div class="glass stat"><b>${real.reduce((s,t)=>s+nd(t),0)}</b><small>總天數</small></div><div class="glass stat"><b>${real.length}</b><small>趟旅行</small></div>`;
 MapView.render(v);if(cur==="map")MapView.refresh();
 const emp='<p class="empty">還沒有旅程，點上方「＋ 新增旅程」開始記錄</p>';
 $("#l-past").innerHTML=pastOrder(by("past")).map(tcard).join("")||emp;renderFuture();photoGC();pastInit();renderDrawer();updBar();tick();syncLoc()}
function tick(){const el=$("#cd"),t=viewTrip();if(!el||!t||!t.startDate)return;const now=new Date(),st=new Date(t.startDate+"T00:00");
 const al=t.alerts||[];if(now>=st&&!al.length){const dd=Math.floor((now-st)/864e5)+1;el.textContent=dd<=nd(t)?`旅程第 ${dd} 天`:"旅程結束";return}
 if(now<st){el.textContent=`出發倒數 ${Math.ceil((st-now)/864e5)} 天`;return}
 const nx=al.find(a=>new Date(a[0])>now);if(!nx){el.textContent="旅程結束";return}
 const ms=new Date(nx[0])-now,d=Math.floor(ms/864e5),h=Math.floor(ms%864e5/36e5),m=Math.floor(ms%36e5/6e4);el.textContent=`${nx[1]}・${d?d+"天":""}${h}時${m}分`}

/* events */
document.addEventListener("change",e=>{const f=e.target;if(!f||f.tagName!=="INPUT"||f.type!=="file"||!f.files||!f.files.length)return;const id=f.dataset.ph;if(id)addPhotos(id,f.files);f.value=""});

document.addEventListener("click",e=>{const b=e.target.closest("[data-a],[data-t]");if(!b)return;
 const t=TV(),a=b.dataset.a,v=b.dataset.v;
 if(b.dataset.t){go(b.dataset.t);return}
if(b.closest("#drawer")&&a&&a!=="menu")document.body.classList.remove("dr");
 if(a==="menu"){document.body.classList.toggle("dr");return}
 if(a==="add"){if(!me)return toast("請先登入 Google 帳戶");form(v);return}
 if(a==="edit"){form(null,v);return}
 if(a==="pcexp"){pcExpToggle(b);return}
 if(a==="save"){saveForm();return}
 if(a==="del"){const x=TRIPS.find(y=>y.id===v);if(x&&x.owner===me?.uid&&confirm("刪除這趟旅程？所有共編成員都會失去這份行程。"))deleteDoc(tdoc(x)).then(()=>{setPhoto(x.id,"");toast("已刪除")});return}
 if(a==="phdel"){const t=TRIPS.find(y=>y.id===v);if(t&&t.image&&db&&me)updateDoc(tdoc(t),ser({image:""})).catch(()=>{});if(t)t.image="";if(setPhoto(v,"")){render();toast("已移除照片")}return}
 if(a==="auth"){if(!FB_OK)return toast("尚未設定 Firebase，請先填 firebase-config.js");if(me){if(confirm("要登出嗎？登出會清除這台裝置上的離線快照。"))signOut(auth).then(()=>{purgeLocal();TRIPS=[];SNAP=null;render()})}else login();return}
 if(a==="join"){if(!me)return toast("請先登入 Google 帳戶");modal('<h3>輸入邀請碼</h3><div class="fm"><label>邀請碼<input id="f-code" maxlength="8" placeholder="例如 K7M2QX" style="text-transform:uppercase"></label><div class="pills"><button class="pill" data-a="dojoin">加入行程</button></div></div>');return}
 if(a==="dojoin"){joinTrip($("#f-code").value).then(ok=>{if(ok)$("#modal").classList.remove("on")}).catch(er=>{console.error("[dojoin]",er);toast("加入失敗："+(er.code==="permission-denied"?"權限被拒":(er.code||er.message)))});return}
 if(a==="tpl"){importTpl();return}
 if(a==="invite"&&t){ensureInvite(t).then(c=>c?copy(c,"已複製邀請碼"):toast("產生邀請碼失敗"));return}

 if(a==="q"){$("#jpy").value=v;calc();return}
 if(a==="addex"&&t){const y=parseFloat($("#jpy").value)||0;if(!y)return toast("請先輸入金額");const L=exList(t),sp=[...document.querySelectorAll(".sp:checked")].map(x=>x.value);L.push({item:$("#memo").value.trim()||"花費",amount:y,paidBy:$("#payer").value,splitWith:sp.length?sp:cfg(t).members});saveEx(t,L);$("#t-yen").innerHTML=bar()+yenHTML(t);calc();toast("已記帳");return}
 if(a==="delex"&&t){const L=exList(t);L.splice(+v,1);saveEx(t,L);$("#t-yen").innerHTML=bar()+yenHTML(t);calc();return}
 if(a==="addi"&&t){const i=$("#in-"+v),x=i.value.trim();if(!x)return;const P=plist(t);P[v].push({t:x,d:0});savePl(t,P);$("#t-pack").innerHTML=bar()+packHTML(t);return}
 if(a==="deli"&&t){e.preventDefault();const P=plist(t);if(!P[b.dataset.k]||!P[b.dataset.k][+b.dataset.i])return;P[b.dataset.k].splice(+b.dataset.i,1);savePl(t,P);$("#t-pack").innerHTML=bar()+packHTML(t);return}

 if(a==="home"){e.preventDefault();go("home");return}
 if(a==="gotnow"){e.preventDefault();go("now");return}
 if(a==="archive"&&t){if(confirm(`將「${t.title}」結束並歸檔到歷史旅程？`)){setSt(t,"past").then(()=>{VIEW_ID=null;go("past");toast("已歸檔")})}return}
 if(a==="setcur"){const n=visible().find(x=>x.id===v),o=visible().filter(x=>x.status==="now"&&x.id!==v);if(n&&confirm(`將「${n.title}」${n.status==="past"?"重新":""}設為當前行程？${o.length?"\n原本的當前旅程會自動歸檔到歷史旅程。":""}`)){Promise.all([...o.map(x=>setSt(x,"past")),setSt(n,"now")]).then(()=>{VIEW_ID=null;go("now");toast("已設為當前行程")})}return}
 if(a==="addbk"&&t){const i=$("#in-bk"),x=i.value.trim();if(!x)return;const L=bkList(t);L.push({n:x,c:"",u:""});saveBk(t,L);$("#t-tix").innerHTML=bar()+tixHTML(t);return}
 if(a==="delbk"&&t){const L=bkList(t);L.splice(+v,1);saveBk(t,L);$("#t-tix").innerHTML=bar()+tixHTML(t);return}
 if(a==="cpi"){const c=document.querySelector(`[data-b="c"][data-i="${v}"]`).value;c?copy(c):toast("尚未填寫編號");return}
 if(a==="openu"){const u=document.querySelector(`[data-b="u"][data-i="${v}"]`).value.trim();okUrl(u)?window.open(u,"_blank","noopener"):toast("請先貼上 https:// 開頭的雲端連結");return}

 if(a==="addday"&&t){dayForm(null);return}
 if(a==="editday"&&t){dayForm(+v);return}
 if(a==="delday"&&t){const D=getDays(t);D.splice(+v,1);D.forEach((d,j)=>{if(/^D\d+$/.test(d.k))d.k="D"+(j+1)});setDays(t,D);dayI[t.id]=Math.max(0,+v-1);refreshDays(t);return}
 if(a==="additem"&&t){itemForm(+v,null);return}
 if(a==="edititem"&&t){const[p,q]=v.split(":");itemForm(+p,+q);return}
 if(a==="delitem"&&t){const[p,q]=v.split(":"),D=getDays(t);D[+p].items.splice(+q,1);setDays(t,D);refreshDays(t);return}
 if(a==="saveitem"&&t){saveItem();return}
 if(a==="saveday"&&t){saveDay();return}

 if(a==="edtoggle"){const was=document.body.classList.contains("editing");setEdit(!was);if(!was&&cur==="now"&&$("#nowcard")&&$("#live")&&!NOWOPEN)nowToggle();return}
 if(a==="memoadd"&&t){memoForm(v,null);return}
 if(a==="memoedit"&&t){const[k,i]=v.split(":");memoForm(k,+i);return}
 if(a==="memodel"&&t){const[k,i]=v.split(":"),M=memoOf(t);M[k].splice(+i,1);saveMemo(t,M);$("#t-storm").innerHTML=bar()+stormHTML(t);return}
 if(a==="memonew"){window.openQuickAdd?.({type:"note"});return}
  if(a==="poolnew"){window.openQuickAdd?.({type:"place"});return}
  if(a==="poolplan"&&t){poolPlanForm(t,v);return}
  if(a==="poolplanok"&&t){poolPlanSave(t);return}
  if(a==="todaygo"&&t){const i=todayDayIdx(t,window.__TODAY||getLocalDateStr());if(i>=0)dayI[t.id]=i;poolPlanForm(t,v);return}
  if(a==="pooldel"&&t){QA_API.deletePoolPlace(t,v);return}
  if(a==="pooledit"&&t){const p=poolOf(t).find(x=>x&&x.id===v);if(!p){toast("找不到這筆");return}window.openQuickAdd?.({mode:"edit-place",id:p.id,name:p.name,area:p.area||"",note:p.note||"",addr:p.addr||"",must:!!p.must});return}
 if(a==="stormtab"){stormTab=v;$("#t-storm").innerHTML=bar()+stormHTML(T0());return}

if(a==="meedit"&&t){if(v==="legacy-note"){openQuickAdd({mode:"edit-note",id:v,text:memoOf(t).note||""});return}const entries=t.memo&&t.memo.entries;const e=entries?entries.find(x=>x.id===v):null;if(!e){toast("找不到這筆備忘");return}openQuickAdd({mode:"edit-note",id:v,text:e.text});return}
if(a==="medel"&&t){QA_API.deleteMemoEntry(t,v);return}
 if(a==="memosave"&&t){const f=document.querySelector(".fm"),k=f.dataset.k,i=f.dataset.i===""?null:+f.dataset.i,M=memoOf(t),A=$("#mm-a").value.trim(),B=$("#mm-b").value.trim();if(!A&&!B)return toast("請填寫內容");
  const it=k==="risks"?{d:A,w:B,p:$("#mm-c").value.trim(),c:$("#mm-x").checked?1:0}:{t:A,d:B};if(i!=null)M[k][i]=it;else M[k].push(it);saveMemo(t,M);$("#modal").classList.remove("on");$("#t-storm").innerHTML=bar()+stormHTML(t);return}
 if(a==="members"&&t){membersModal(t);return}
 if(a==="kick"&&t){if(!confirm(`將「${nameOf(t,v)}」移出這趟行程？`))return;updateDoc(tdoc(t),{members:arrayRemove(v),["st."+v]:deleteField()}).then(()=>{$("#modal").classList.remove("on");toast("已移除成員")}).catch(er=>toast("移除失敗："+(er.code||er.message)));return}
 if(a==="leave"&&t){if(!confirm("確定離開這趟行程？你將無法再查看。"))return;updateDoc(tdoc(t),{members:arrayRemove(me.uid),["st."+me.uid]:deleteField()}).then(()=>{$("#modal").classList.remove("on");go("now");toast("已離開行程")}).catch(er=>toast("失敗："+(er.code||er.message)));return}
 if(a==="resetinv"&&t){if(confirm("重設後舊邀請碼立刻失效（已在行程裡的人不受影響）。要重設嗎？"))resetInvite(t).then(ok=>{if(ok)membersModal(t)});return}
 if(a==="cpinv"){copy(v,"已複製邀請碼");return}
 if(a==="tplreset"&&t&&TPL&&t.templateId===TPL.id){if(confirm("將每日行程與地圖標點重設為最新範例？你在每日行程上的修改會被覆蓋。"))patch(t,{days:TPL.days,spots:TPL.spots}).then(()=>{refreshDays(TV());toast("已重設為最新範例")});return}
 if(a==="fixold"&&t){const c=cfg(t);modal(`<h3>整理舊帳目</h3><p class="meta">這些名稱不是目前的成員。請選擇每個名稱要歸給哪位成員，套用後帳本與結算會自動更新。</p><div class="fm">${c.orphans.map(o=>`<label>${esc(lbl(t,o))}<select class="fi" data-orph="${esc(o)}"><option value="">（暫不處理）</option>${c.members.map(m=>`<option value="${esc(m)}">${esc(nameOf(t,m))}</option>`).join("")}</select></label>`).join("")}<div class="pills"><button class="pill" data-a="fixapply">套用</button></div></div>`);return}
 if(a==="fixapply"&&t){const map={};document.querySelectorAll("[data-orph]").forEach(x=>{if(x.value)map[x.dataset.orph]=x.value});const L=exList(t).map(e=>({...e,paidBy:map[e.paidBy]||e.paidBy,splitWith:[...new Set((e.splitWith||[]).map(k=>map[k]||k))]}));saveEx(t,L);$("#modal").classList.remove("on");$("#t-yen").innerHTML=bar()+yenHTML(t);calc();toast("已整理舊帳目");return}
 if(a==="nav"){return}
 if(a==="m"&&v==="diet"){openFood(T0());return}
 if(a==="flang"){FLANG=v;store("tp-flang",v);renderFood();return}
 if(a==="cpfood"){const X=((FOOD&&FOOD.cards[FLANG])||[]).map(l=>l.p).join("\n");X?copy(X,"已複製文案"):toast("沒有可複製的文案");return}
 if(a==="focus"){focusCard();return}
 if(a==="fclang"){FLANG=v;store("tp-flang",v);focusCard();return}
 if(a==="fclose"){closeFoodCard();return}
 if(a==="editdiet"&&t){dietForm(v);return}
 if(a==="savediet"&&t){saveDiet(t);return}
 if(a==="goyen"){go("yen");return}
 if(a==="accday"){const sec=document.getElementById("dacc-"+v);if(sec){const o=sec.classList.toggle("open");b.setAttribute("aria-expanded",o)}return}
 if(a==="print"){document.body.classList.remove("dr");go("now");{const t0=TV();if(t0&&$("#dayblk"))$("#dayblk").innerHTML=getDays(t0).map((_,n)=>dayHTML(t0,n)).join("")}setTimeout(()=>{try{MiniMap.refresh()}catch(e){}setTimeout(()=>window.print(),350)},150);return}
 if(a==="cprev"||a==="cnext"||a==="creset"){curStep(a);return}
 if(a==="futopen"){futToggle(v);return}
 if(a==="nowopen"){if(b.id==="live"&&e.target.closest("a"))return;nowToggle();return}
  if(a==="swapnext"){swapNextOpen();return}if(a==="swappick"){swapNextDo(v);return}
  if(a==="lvnext"||a==="lvprev"||a==="lvauto"){liveStep(a);return}
 if(a==="sosadd"){$("#sosrows").insertAdjacentHTML("beforeend",sosRow(["","",""]));return}
 if(a==="sosdel"){b.closest(".sosr").remove();return}
 if(a==="savesos"&&t){const arr=[...document.querySelectorAll(".sosr")].map(r=>{const l=r.querySelector(".sosl").value.trim(),x=r.querySelector(".sosv").value.trim();return[l,x,/^\+?[\d\s\-()]{3,}$/.test(x)?"tel:"+x.replace(/[^\d+]/g,""):""]}).filter(r=>r[0]||r[1]);patch(t,{sos:arr}).then(()=>{modal(sosHTML(t));toast("已儲存")});return}
 if(a==="export"){exportBackup();return}
 if(a==="import"){const inp=document.createElement("input");inp.type="file";inp.accept="application/json,.json";inp.onchange=()=>importBackup(inp.files[0]);inp.click();return}
 if(a==="ss-open"){const t=visible().find(x=>String(x.id)===String(v));if(t){const mm=t.members||[];window.ssOpen(v,{name:(t.memberNames&&t.memberNames[mm[0]])||"",from:"",to:t.country||"",date:(t.startDate||"")+(t.endDate?" – "+t.endDate.slice(5):""),title:t.title||""})}else{window.ssOpen(v)}return}
 if(a==="storydl"){downloadStory();return}
 if(a==="close"){storyClear();$("#modal").classList.remove("on");}
 else if(a==="cp")copy(v);
 else if(a==="m"&&t)modal({book:bookHTML,diet:dietHTML,sos:sosHTML}[v](t));
 else if(a==="hs"&&t)mapZoom(t,+v);
 else if(a==="day"&&t){focusDay(t,+v,!!b.dataset.go)}});
$("#modal").addEventListener("click",e=>{if(e.target.id==="modal"){storyClear();$("#modal").classList.remove("on")}});
(async()=>{MapView.init();if(!FB_OK)AUTHREADY=true;
 try{const r=JSON.parse(localStorage.getItem("tp-snap")||"null");if(r&&Array.isArray(r.trips))SNAPRAW=r}catch(e){}
 window.addEventListener("online",updBar);window.addEventListener("offline",updBar);
 try{TPL=(await (await fetch("trips.json")).json()).trips[0]}catch(e){}
 if(FB_OK){loadFeatured();handleParams()}
 if(FB_OK)onAuthStateChanged(auth,u=>{me=u;AUTHREADY=true;$("#bnav").hidden=!u;if(!u){TRIPS=[];SNAP=null;if(navigator.onLine)purgeLocal();$("#modal").classList.remove("on");document.body.classList.remove("dr")}if(unsub){unsub();unsub=null}
  if(u){if(SNAPRAW&&SNAPRAW.uid===u.uid){if(!TRIPS.length){TRIPS=SNAPRAW.trips;SNAP={uid:SNAPRAW.uid,name:SNAPRAW.name,ts:SNAPRAW.ts}}}else if(SNAPRAW){try{localStorage.removeItem("tp-snap")}catch(e){}SNAPRAW=null}}else{TRIPS=[];SNAP=null}
  $("#who").textContent=u?(u.displayName||"我").slice(0,1):"登入";
  if(u){let first=true;unsub=onSnapshot(query(collection(db,"trips"),where("members","array-contains",u.uid)),s=>{TRIPS=s.docs.map(d=>norm({id:d.id,...d.data()}));saveSnap(u);render();if(first){first=false;if(navigator.onLine)migrate();runPending()}},er=>{console.error("[snapshot]",er)})}
  else render()});
 render();setInterval(()=>{tick();refreshLive()},60000);
 if("serviceWorker" in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("sw.js").then(r=>{try{r.update()}catch(e){}}).catch(()=>{});(()=>{if(!navigator.serviceWorker)return;const had=!!navigator.serviceWorker.controller;navigator.serviceWorker.addEventListener("controllerchange",()=>{if(had)showUpd()})})()})();

document.addEventListener("input",e=>{if(e.target.id==="jpy"||e.target.id==="rate")calc()});
document.addEventListener("change",e=>{const c=e.target.closest("input[data-k]"),t=T0();if(!c||!t)return;const P=plist(t);P[c.dataset.k][+c.dataset.i].d=c.checked?1:0;savePl(t,P);c.closest(".ck").classList.toggle("done",c.checked)});

document.addEventListener("change",e=>{const i=e.target.closest("input[data-b]"),t=T0();if(!i||!t)return;const L=bkList(t);L[+i.dataset.i][i.dataset.b]=i.value.trim();saveBk(t,L)});
function go(id){try{closeMapSheet()}catch(e){}setEdit(false);cur=id;document.body.dataset.pg=id;document.body.classList.remove("dr");document.querySelectorAll(".panel").forEach(p=>p.classList.toggle("on",p.id==="t-"+id));renderDrawer();window.scrollTo({top:0});if(id==="map")MapView.refresh();if(id==="now")MiniMap.refresh();if(id==="pool"){try{PoolMap.refresh()}catch(e){}}if(id==="home")renderHome();homeVid(true);updateBnav()}
const ICN={now:"cal",pool:"pin",tix:"card",storm:"note",yen:"yen",pack:"chk",map:"globe",past:"clock",future:"compass"};
function renderDrawer(){const t=T0(),nm=t?(t.short||t.title):"",b=(id,c)=>`<button class="${c} ${cur===id?"on":""}" data-t="${id}"><i class="ic ic-${ICN[id]}"></i>${LB[id]}</button>`;
 $("#drawer").innerHTML=`<p class="eyebrow brand" data-a="home">TripTick</p><h2 class="brand" data-a="home">歷歷</h2><button data-t="home" class="${cur==="home"?"on":""}"><i class="ic ic-nav"></i>首頁</button><p class="grp"><i class="ic ic-pin"></i>當前旅程　${t?esc(nm):"（目前沒有）"}</p>${t?SUB.map(i=>b(i,"sub")).join(""):""}<p class="grp">其他旅程</p>${["map","past","future"].map(i=>b(i,"")).join("")}${drawerExtra()}<p class="meta" style="margin-top:auto">資料儲存在你的 Google 帳戶。</p>`;
 $("#crumb").textContent=(SUB.includes(cur)?`${t?nm:"當前旅程"} › ${LB[cur]}`:LB[cur])}

/* ===== 行程內底部導覽（5 格）===== */
const BN_PAGES=["now","tix","storm","yen","pack","pool","more"];
const BN_GROUP={tix:"more",storm:"more",yen:"more",pack:"more",pool:"more"};
function updateBnav(){
  document.body.classList.toggle("has-bnav",BN_PAGES.includes(cur));
  const g=BN_GROUP[cur]||cur;
  document.querySelectorAll("#bnav [data-bn]").forEach(b=>b.classList.toggle("on",b.dataset.bn===g));
}
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-bn]");if(!b)return;
  const k=b.dataset.bn;
  if(k==="add"){window.openQuickAdd?.();return}
  go(k);
});
/* ===== 首頁（批次 3）===== */
function renderHome(){const el=$("#home-act");if(!el)return;const has=tripList().length>0;
  el.innerHTML=has?'<button type="button" class="home-btn" data-a="gotnow">進入行程</button>':'<button type="button" class="home-btn breath" data-a="add" data-v="now">來趟旅行吧！</button>'}
/* 背景影片：減少動態、省流量、或播放被擋（iOS 低耗電模式會擋）時，改顯示 home-poster.jpg */
function stillBg(b){document.documentElement.classList.toggle("bg-still",b)}
function homeVid(on){const v=$("#home-vid");if(!v)return;const sd=!!(navigator.connection&&navigator.connection.saveData);
  if(!on||reducedMotion()||sd){try{v.pause()}catch(e){}if(on)stillBg(true);return}
  try{const p=v.play();if(p&&p.catch)p.catch(()=>stillBg(true));clearTimeout(homeVid.t);homeVid.t=setTimeout(()=>{if(v.paused)stillBg(true)},2500)}catch(e){stillBg(true)}}
{const hv=$("#home-vid");if(hv)hv.addEventListener("playing",()=>stillBg(false))}
document.body.dataset.pg=cur;updateBnav();homeVid(true);renderHome();
// 導覽下滑收起：向下捲超過 40px 給 body 加 bnav-hide 讓導覽 translateY 滑出畫面；
// 向上捲或回到頂部移除，過場 200ms；passive scroll 監聽，位移小於 8px 不觸發；
// 彈層（modal / 抽屜 dr）開啟時不受此邏輯影響。
(function(){
  let lastY=0;
  function popupOpen(){return $("#modal").classList.contains("on")||document.body.classList.contains("dr")||document.body.classList.contains("qa-open");}
  addEventListener("scroll",()=>{
    if(popupOpen())return;
    const y=scrollY;
    if(Math.abs(y-lastY)<8)return;
    if(y>40&&y>lastY)document.body.classList.add("bnav-hide");
    else if(y<=0||y<lastY)document.body.classList.remove("bnav-hide");
    lastY=y;
  },{passive:true});
})();
/* ---- auth / invite / template / migration ---- */
const emptyNow0=()=>!FB_OK?`<div class="glass blk"><p>${FB_LOAD?"尚未設定 Firebase。請依說明填入 firebase-config.js 後重新整理。":"目前離線，且這台裝置還沒有行程快照。請連線並登入一次，之後就能離線查看。"}</p></div>`:me?'<div class="glass blk"><p>無當前行程，請新增行程或輸入邀請碼</p><div class="pills"><button class="pill" data-a="add" data-v="now"><span class="dot">＋</span>新增行程</button><button class="pill gl" data-a="join">輸入邀請碼</button><button class="pill gl" data-a="tpl">匯入範例：北海道</button></div></div>':'<div class="glass blk"><p>無當前行程，請登入後新增行程或輸入邀請碼</p><div class="pills"><button class="pill" data-a="auth">Google 一鍵登入</button></div></div>';
const guide=()=>me&&!TRIPS.length?'<div class="glass blk guide"><b>快速開始</b><ol><li>新增行程，或向朋友索取邀請碼加入。</li><li>在行程裡新增每日景點，並填寫「地點」，地圖就會自動標出位置。</li><li>出發前在有網路時登入並載入一次，之後離線也能查看。</li></ol></div>':"";
const emptyNow=()=>emptyNow0()+guide();
async function login(){const p=new GoogleAuthProvider();p.setCustomParameters({prompt:"select_account"});
 try{await signInWithPopup(auth,p);return true}
 catch(e){const c=(e&&e.code)||"";
  if(c==="auth/popup-closed-by-user"||c==="auth/cancelled-popup-request"){}
  else if(c==="auth/popup-blocked")toast("瀏覽器擋住了登入視窗，請允許彈出視窗後再按一次");
  else if(c==="auth/operation-not-supported-in-this-environment"||c==="auth/web-storage-unsupported")toast("此環境（例如無痕模式）無法登入，請改用一般分頁");
  else if(c==="auth/network-request-failed")toast("網路不穩，請稍後再試");
  else toast("登入失敗："+c);
  return false}}
async function ensureInvite(t){if(t.inviteCode)return t.inviteCode;for(let i=0;i<3;i++){const c=rnd(6);try{await setDoc(doc(db,"invites",c),{tripId:t.id,owner:me.uid});await updateDoc(tdoc(t),{inviteCode:c});t.inviteCode=c;return c}catch(e){}}return null}
async function joinTrip(code){code=code.trim().toUpperCase();if(!code){toast("請輸入邀請碼");return false}
 const iv=await getDoc(doc(db,"invites",code));if(!iv.exists()){toast("找不到這個邀請碼");return false}
 const id=iv.data().tripId;if(TRIPS.some(x=>x.id===id)){toast("你已經在這趟行程裡了");return true}
 const has=visible().some(x=>x.status==="now");
 try{await updateDoc(doc(db,"trips",id),{lastJoinCode:code,members:arrayUnion(me.uid),["memberNames."+me.uid]:me.displayName||"成員",["st."+me.uid]:has?"future":"now"})}catch(e){console.error("[joinTrip] 寫入 trips/"+id+" 失敗",{code:e.code,message:e.message,uid:me.uid,inviteCode:code},e);throw e}toast("已加入行程");go(has?"future":"now");return true}
async function createFromTpl(extra){const {id,expensesConfig,owner,status,...rest}=TPL;await archiveNow("");
 const ref=doc(collection(db,"trips"));
 await setDoc(ref,{...ser({...rest,booking:[],expenses:[],currency:expensesConfig.currency,templateId:id,diets:{},ext:EXT0,owner:me.uid,members:[me.uid],memberNames:{[me.uid]:me.displayName||"我"},st:{[me.uid]:"now"},...extra}),createdAt:serverTimestamp()})}
async function importTpl(){if(!TPL)return toast("範例資料載入失敗");if(TRIPS.some(x=>x.templateId===TPL.id)&&!confirm("你已經匯入過北海道範例，要再匯入一份嗎？"))return;
 try{await createFromTpl({});go("now");toast("已匯入北海道範例")}catch(e){toast("匯入失敗："+(e.code||e.message))}}
async function migrate(){if(!me||!TPL||sessionStorage.getItem("tp-mig"))return;const P="hokkaido-2027",J=k=>{try{return JSON.parse(load(k))}catch(e){return null}};
 if(load("tp-bk-"+P)!=null||load("tp-ex-"+P)!=null){sessionStorage.setItem("tp-mig","1");
  if(confirm("檢測到本機有舊行程（北海道冬日雪國雙人自由行），是否上傳備份至你的 Firebase 雲端帳號？")){
   try{const x={booking:J("tp-bk-"+P)||[],expenses:J("tp-ex-"+P)||[]};if(J("tp-days-"+P))x.days=J("tp-days-"+P);if(J("tp-lists-"+P))x.lists=J("tp-lists-"+P);
   await createFromTpl(x);["tp-bk-","tp-ex-","tp-days-","tp-lists-"].forEach(k=>localStorage.removeItem(k+P));toast("已上傳備份")}catch(e){toast("上傳失敗："+(e.code||e.message))}}}
 const ut=J("tp-trips");if(Array.isArray(ut)&&ut.length&&confirm(`本機還有 ${ut.length} 筆自行新增的旅程，是否一併上傳？`)){
  try{for(const u of ut){const {id,status,days,...r}=u;await setDoc(doc(collection(db,"trips")),{...clean({...r,nDays:days||1,days:[],booking:[],expenses:[],currency:CUR[u.country]||"TWD",lightSplitUrl:"",owner:me.uid,members:[me.uid],memberNames:{[me.uid]:me.displayName||"我"},st:{[me.uid]:status||"past"}}),createdAt:serverTimestamp()})}
  localStorage.removeItem("tp-trips");toast("已上傳本機旅程")}catch(e){toast("上傳失敗："+(e.code||e.message))}}}

async function membersModal(t){const code=await ensureInvite(t),mine=me.uid===t.owner;
 modal(`<h3>成員<span class="mcount">${t.members.length}</span></h3>${t.members.map(u=>`<div class="row"><span>${esc(nameOf(t,u))}${u===t.owner?' <small class="meta">建立者</small>':""}${u===me.uid?' <small class="meta">你</small>':""}</span>${mine&&u!==t.owner?`<button class="cb" data-a="kick" data-v="${esc(u)}">踢出</button>`:""}</div>`).join("")}
 <h4 class="meta" style="margin:16px 0 4px">邀請朋友加入</h4><div class="jp codebox"><span>${esc(code||"—")}</span><button class="pill" data-a="cpinv" data-v="${esc(code||"")}">複製</button></div>
 <p class="meta">把邀請碼傳給親友，他們登入後從選單「輸入邀請碼」輸入就能加入。</p><div class="pills">${mine?'<button class="pill gl" data-a="resetinv">重設邀請碼</button>':'<button class="pill gl" data-a="leave">離開此行程</button>'}</div>`)}
async function resetInvite(t){for(let i=0;i<3;i++){const c=rnd(6);try{await setDoc(doc(db,"invites",c),{tripId:t.id,owner:me.uid});await updateDoc(tdoc(t),{inviteCode:c});t.inviteCode=c;toast("已重設，舊邀請碼失效");return true}catch(e){}}toast("重設失敗");return false}
function pickPt(p){const t=TV();if(!t)return null;const d=getDays(t)[p.day]||{},k=d.k||"",hot=(t.hotspots||[]).find(h=>h.name===p.title),tag=(hot&&hot.note)||p.note||"",meta=[d.date,d.city].filter(Boolean).join(" ")+((d.wx||d.tp)?"・"+[d.wx,d.tp].filter(Boolean).join(" "):"");
 const el=document.createElement("div");el.className="pp";const other=p.day!==(dayI[t.id]??0);
 el.innerHTML=`<div class="mit"><b>${esc(p.title)}</b>${k&&other?`<span class="chip">${esc(k)}</span>`:""}</div>${tag?`<p class="ptag">${esc(tag)}</p>`:""}${p.time?`<p>${esc(p.time)}</p>`:""}${meta&&other?`<p class="mis">${esc(meta)}</p>`:""}<div class="pills">${k&&other?`<button class="pill gl" data-ppday="${p.day}">看 ${esc(k)} 行程</button>`:""}<a class="pill gl" href="https://maps.google.com/?q=${p.lat},${p.lng}" target="_blank" rel="noopener">地圖</a></div>`;
 const b=el.querySelector("[data-ppday]");if(b)b.addEventListener("click",()=>focusDay(t,p.day,true));
 return el}
window.__tp=true;

/* ===== P0：飲食安全卡 Food Safety Guard =====
   資料：trip.diets = { [uid]: { tags:[], note:"", flex:bool } }
   預留（P1/P2）：trip.ext = { liveEvents:[], mealLedger:{}, offlinePack:{}, phrasebook:{} }，詳見 SCHEMA.md */
const EXT0={liveEvents:[],mealLedger:{},offlinePack:{},phrasebook:{}};
const DTAGS=[["ovo","蛋奶素"],["wuxin","五辛素"],["vegan","全素"],["nobeef","不吃牛肉"],["nopork","不吃豬肉"],["noseafood","不吃海鮮"],["nutallergy","堅果過敏"]];
const TAGX={ovo:["meat","sea","dashi","mext"],wuxin:["meat","sea","dashi","mext","wux"],vegan:["meat","sea","dashi","mext","egg","dairy"],nobeef:["beef"],nopork:["pork"],noseafood:["sea","dashi"],nutallergy:["nut"]};
const TERM={meat:["肉類","肉類","meat"],sea:["魚介類","魚介類","fish and seafood"],dashi:["柴魚高湯","鰹節（出汁）","bonito flakes and dashi stock"],mext:["肉類萃取物","肉エキス","meat extract"],beef:["牛肉","牛肉・牛エキス","beef and beef extract"],pork:["豬肉","豚肉・ラード","pork and lard"],wux:["五辛（蔥蒜韭等）","ネギ・ニンニク・ニラ・玉ねぎ","onion, garlic and leek"],egg:["蛋","卵","eggs"],dairy:["乳製品","乳製品","dairy"],nut:["堅果類","ナッツ類","nuts"]};
const ORDER=["meat","sea","dashi","mext","beef","pork","wux","egg","dairy","nut"];
const LANGS=[["zh","繁體中文"],["ja","日本語"],["en","English"]];
const FLEXRE=/鍋邊素|彈性|可接受|接受|方便|不給.{0,4}麻煩|不影響/;
const isFlex=d=>!!(d&&(d.flex||FLEXRE.test(d.note||"")));
let FLANG=load("tp-flang")||"zh",FOOD=null;
function foodModel(diets,members,names){const strict=new Set,soft=new Set,allergy=new Set;let veg=false;
 const rows=members.map(u=>{const d=diets[u]||{},tags=d.tags||[];tags.forEach(tg=>{if(["ovo","wuxin","vegan"].includes(tg))veg=true;(TAGX[tg]||[]).forEach(k=>{if(k==="nut")allergy.add(k);else(isFlex(d)?soft:strict).add(k)})});return{u,name:names[u]||u,tags,note:d.note||"",flex:isFlex(d)}});
 strict.forEach(k=>soft.delete(k));const o=ks=>ORDER.filter(k=>ks.has(k));
 return{rows,strict:o(strict),soft:o(soft),allergy:o(allergy),ok:veg&&!strict.has("egg")&&!strict.has("dairy")?["egg","dairy"]:[]}}
function foodLines(m,L){const sep=L===2?", ":"・",nm=ks=>ks.map(k=>TERM[k][L]);
 const mk=(ks,fn)=>{const a=nm(ks);return{h:fn(a.map(x=>`<b class="hl">${esc(x)}</b>`).join(sep)),p:fn("【"+a.join(sep)+"】")}},out=[];
 if(m.strict.length){const ok=m.ok.length?nm(m.ok).join(sep):"";out.push(mk(m.strict,X=>[`我們團隊有人不能吃${X}。${ok?ok+"可以。":""}請問有可以提供的餐點嗎？`,`すみません、私たちのグループには${X}が食べられない人がいます。${ok?ok+"は大丈夫です。":""}対応可能なメニューはありますか？`,`Excuse me, some people in our group cannot eat ${X}. ${ok?ok+" are OK. ":""}Do you have any suitable dishes?`][L]))}
 if(m.soft.length)out.push(mk(m.soft,X=>[`${m.strict.length?"另外，":""}也有人希望盡量避開${X}，只要稍微避開湯底或配料就可以，不需要特別為我們麻煩，謝謝。`,`${m.strict.length?"また、":"すみません、"}できれば${X}を避けたい人もいます。スープや具材を少し避ければ対応可能であれば助かります。無理のない範囲で結構です。`,`${m.strict.length?"Also, s":"Excuse me, s"}ome of us would prefer to avoid ${X}. If you can simply leave out the broth or ingredients, that would help — please don't go out of your way.`][L]));
 if(m.allergy.length)out.push(mk(m.allergy,X=>[`有人對${X}過敏，即使少量也不能吃，請特別留意。`,`${X}のアレルギーがある人がいます。少量でも食べられませんので、ご確認をお願いします。`,`Someone in our group has an allergy to ${X}. Even a small amount is not safe — please check carefully.`][L]));
 return out}
function buildFood(t){const m=foodModel(t.diets||{},t.members||[],t.memberNames||{}),cards={};LANGS.forEach(([c],i)=>cards[c]=foodLines(m,i));
 const f={id:t.id,title:t.title,ts:Date.now(),rows:m.rows,cards,legacy:t.diet||"",live:true};
 try{localStorage.setItem("tp-food-"+t.id,JSON.stringify({...f,live:false}));localStorage.setItem("tp-food-last",t.id)}catch(e){}return f}
function foodSnap(){try{const id=load("tp-food-last");return id?JSON.parse(load("tp-food-"+id)):null}catch(e){return null}}
function openFood(t){FOOD=t?buildFood(t):foodSnap();if(!FOOD)return toast("目前沒有飲食卡資料");renderFood()}
function renderFood(){const f=FOOD,k=LANGS.some(x=>x[0]===FLANG)?FLANG:"zh",ls=f.cards[k]||[],tg=x=>(DTAGS.find(d=>d[0]===x)||[0,x])[1];
 const rows=f.rows.map(r=>`<div class="frow"><div><b>${esc(r.name)}</b> ${r.tags.length?r.tags.map(x=>`<span class="ftag">${esc(tg(x))}</span>`).join(""):'<span class="meta">未設定</span>'}${r.flex?'<span class="ftag soft">可彈性</span>':""}${r.note?`<p class="meta">${esc(r.note)}</p>`:""}</div>${f.live?`<button class="cb ed" data-a="editdiet" data-v="${esc(r.u)}" aria-label="編輯飲食"><i class=i-edit></i></button>`:""}</div>`).join("");
 modal(`<h3>飲食溝通卡</h3><div class="lang">${LANGS.map(([c,n])=>`<button class="${c===k?"on":""}" data-a="flang" data-v="${c}">${n}</button>`).join("")}</div>
 <h4 class="meta" style="margin:14px 0 4px">團隊成員飲食${f.live?"（編輯模式下可修改）":"（離線快照）"}</h4>${rows}
 <h4 class="meta" style="margin:14px 0 6px">溝通文案</h4><div class="foodcard">${ls.length?ls.map(l=>`<p>${l.h}</p>`).join(""):(k==="ja"&&f.legacy?`<p>${esc(f.legacy)}</p>`:'<p class="meta">尚未設定任何成員的飲食偏好。開啟編輯模式後，可為每位成員設定。</p>')}</div>
 <div class="pills"><button class="pill" data-a="cpfood">複製文案</button><button class="pill" data-a="focus">現場大字卡</button></div>`)}
function focusCard(){const k=FLANG==="zh"?"ja":FLANG;let el=$("#focus");if(!el){el=document.createElement("div");el.id="focus";document.body.appendChild(el)}
 const ls=(FOOD&&FOOD.cards[k])||[];FLANG=k;
 el.innerHTML=`<div class="fbar"><div class="lang">${[["ja","日本語"],["en","English"]].map(([c,n])=>`<button class="${c===k?"on":""}" data-a="fclang" data-v="${c}">${n}</button>`).join("")}</div><button class="fclose" data-a="fclose"><svg class="ix" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg><span>結束</span></button></div><div class="fbody">${ls.map(l=>`<p>${l.h}</p>`).join("")||"<p>（尚未設定飲食偏好）</p>"}</div>`;
 el.classList.add("on");try{document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen().catch(()=>{})}catch(e){}}
function closeFoodCard(){const el=$("#focus");if(el)el.classList.remove("on");try{document.fullscreenElement&&document.exitFullscreen()}catch(e){}}
function dietForm(u){const t=T0(),d=(t.diets&&t.diets[u])||{};modal(`<h3>編輯飲食：${esc(nameOf(t,u))}</h3><div class="fm" data-u="${esc(u)}"><div class="splits">${DTAGS.map(([c,n])=>`<label class="chk"><input type="checkbox" class="dtg" value="${c}" ${(d.tags||[]).includes(c)?"checked":""}> ${n}</label>`).join("")}</div><label class="chk"><input type="checkbox" id="df-flex" ${d.flex?"checked":""}> 可彈性處理（接受鍋邊素、不想給店家添麻煩）</label><label>彈性與極限備註<textarea id="df-note" rows="3" placeholder="例如：接受鍋邊素／香料味不重可接受／主要求方便、不給店家添麻煩">${esc(d.note)}</textarea></label><div class="pills"><button class="pill" data-a="savediet">儲存</button></div></div>`)}
async function saveDiet(t){const u=document.querySelector(".fm").dataset.u,diets={...(t.diets||{}),[u]:{tags:[...document.querySelectorAll(".dtg:checked")].map(x=>x.value),note:$("#df-note").value.trim(),flex:$("#df-flex").checked}};
 await patch(t,{diets});openFood(t);toast("已儲存飲食設定")}
/* 餐廳 × 成員忌口 自動比對 */
const RT=[["has_vegetarian","有素食餐點"],["contains_dashi","含柴魚高湯"],["no_vegetarian","幾乎無素食"],["beef_only","牛肉為主"],["seafood_focus","海鮮為主"]];
const RESTRE=/餐|食|咖哩|拉麵|ラーメン|壽司|寿司|燒肉|焼肉|丼|料理|食堂|レストラン|カフェ|cafe|restaurant|ramen|居酒屋|蕎麥|そば|うどん|烏龍/i;
function inferRT(x){const s=[x.h,x.d,x.more].join(" "),r=new Set(x.diet||[]);
 if(/素食|ベジ|vegan|vegetarian/i.test(s))r.add("has_vegetarian");
 if(/拉麵|ラーメン|蕎麥|そば|うどん|烏龍|柴魚|鰹|出汁|關東煮|おでん/i.test(s))r.add("contains_dashi");
 if(/燒肉|焼肉|牛排|ステーキ|烤肉|成吉思汗|ジンギスカン|豚骨|牛舌/i.test(s)){r.add("no_vegetarian");if(/牛/.test(s))r.add("beef_only")}
 if(/壽司|寿司|海鮮|刺身|螃蟹|蟹/i.test(s))r.add("seafood_focus");
 if(r.has("has_vegetarian"))r.delete("no_vegetarian");return r}
const RTL={has_vegetarian:"有素食餐點",contains_dashi:"含柴魚高湯",no_vegetarian:"幾乎無素食",beef_only:"牛肉為主",seafood_focus:"海鮮為主"};
const isRest=x=>!!((x.diet&&x.diet.length)||RESTRE.test((x.h||"")+" "+(x.d||"")));
function dietTags(x){const ex=new Set(x.diet||[]),all=isRest(x)?inferRT(x):ex;if(!all.size)return"";return`<div class="rtags">${[...all].map(k=>`<span class="rtag ${ex.has(k)?"":"inf"}">${RTL[k]||esc(k)}</span>`).join("")}</div>`}
function dietWarn(x,t){if(!t||!t.diets||!Object.keys(t.diets).length||!isRest(x))return"";
 const tg=inferRT(x),W=[],nm=us=>us.map(u=>nameOf(t,u)).join("、"),who=f=>(t.members||[]).filter(u=>{const d=t.diets[u];return d&&!isFlex(d)&&f(d.tags||[])});
 const veg=who(a=>a.some(z=>["ovo","wuxin","vegan"].includes(z)));if(veg.length&&(tg.has("no_vegetarian")||tg.has("beef_only")||tg.has("seafood_focus")))W.push(`${nm(veg)} 嚴格素食，此餐廳缺乏素食可食餐點`);
 const ds=who(a=>a.some(z=>(TAGX[z]||[]).includes("dashi")));if(ds.length&&tg.has("contains_dashi")&&!(x.diet||[]).includes("has_vegetarian"))W.push(`${nm(ds)} 不能吃柴魚高湯，此餐廳含柴魚（出汁）`);
 const nb=who(a=>a.includes("nobeef"));if(nb.length&&tg.has("beef_only"))W.push(`${nm(nb)} 不吃牛肉，此餐廳以牛肉為主`);
 const ns=who(a=>a.includes("noseafood"));if(ns.length&&tg.has("seafood_focus"))W.push(`${nm(ns)} 不吃海鮮，此餐廳以海鮮為主`);
 return W.map(w=>`<div class="dwarn">${esc(w)}</div>`).join("")}

/* 每日結尾「備案／說明」：檢視模式顯示摺疊，編輯模式為可編輯 Textarea（離開輸入框自動儲存） */
const dayMore=(d,i)=>`${d.more?`<details class="vw daymorev"><summary>當日備案／說明</summary><p>${esc(d.more)}</p></details>`:""}<div class="ed daymoree"><small class="meta">當日備案／說明（離開輸入框自動儲存）</small><textarea class="fi daymore" data-di="${i}" rows="3" placeholder="例如：下雨時改去室內景點…">${esc(d.more||"")}</textarea></div>`;
document.addEventListener("change",e=>{const el=e.target.closest(".daymore");if(!el)return;const t=TV();if(!t)return;const D=getDays(t),di=+el.dataset.di;if(!D[di])return;D[di].more=el.value.trim();setDays(t,D);toast("已儲存當日說明")});

/* ===== 離線優先：本機快照 ===== */
function saveSnap(u){SNAP={uid:u.uid,name:u.displayName,ts:Date.now()};try{localStorage.setItem("tp-snap",JSON.stringify({...SNAP,trips:TRIPS}))}catch(e){console.warn("[offline] 快照寫入失敗（儲存空間不足？）",e)}}
function updBar(){let b=$("#offbar");if(!b){b=document.createElement("div");b.id="offbar";b.setAttribute("role","status");document.body.prepend(b)}
 b.textContent="目前為離線檢視模式";b.style.display=!navigator.onLine?"block":"none";document.body.classList.toggle("ro",!me)}

/* ===== 現場即時模式：現在 / 下一步 ===== */
let LIVE={sim:false,d:0,i:-1};
function liveCalc(t){const D=getDays(t);if(!D.length)return null;let d,i,off=false,before=false,left=0;
 if(LIVE.sim){d=Math.min(LIVE.d,D.length-1);i=LIVE.i}
 else{const mi=dayIdxByDate(t),k=mi>=0?mi:Math.floor((Date.now()-new Date((t.startDate||"")+"T00:00"))/864e5);
  if(isNaN(k)||k<0){d=0;i=-1;off=true;before=true;left=isNaN(k)?0:-k}
  else if(k>=D.length){d=D.length-1;i=D[d].items.length-1;off=true}
  else{d=k;const n=new Date(),cur=n.getHours()*60+n.getMinutes();i=-1;D[d].items.forEach((x,j)=>{if(isT(x.t)){const[h,m]=x.t.split(":");if(+h*60+ +m<=cur)i=j}})}}
 const its=D[d].items;return{D,d,i,off,before,left,day:D[d],now:its[i]||null,next:its[i+1]||null}}
const mins=x=>{const[h,m]=x.t.split(":");return+h*60+ +m};
function liveHTML(t){const c=liveCalc(t),hd=(dot,ttl,meta,r)=>`<button type="button" class="nc-hd" data-a="nowopen" aria-expanded="${NOWOPEN}" aria-controls="ncmore"><span class="ldot ${dot}" aria-hidden="true"></span><b class="nc-t${r?" r":""}">${ttl}</b>${meta?`<span class="nc-d">${meta}</span>`:""}</button>`;
 if(!c)return hd("","現在 / 下一步","")+'<p class="nc-note">新增每日行程後，這裡會顯示現在與下一步。</p>';
 if(c.off){const go='<div class="nc-ctl"><button type="button" class="nc-btn" data-a="lvnext">預覽行程</button></div>';
  if(c.before)return hd("","尚未開始",t.startDate?esc(t.startDate.slice(5).replace("-","/"))+" 出發":"")+(c.left?`<div class="lvrow"><small>出發倒數</small><b class="nc-big">${c.left} 天</b></div>`:'<p class="nc-note">出發日期未定。旅行期間會依手機時間自動標示現在與下一步。</p>')+go;
  return hd("","非行程時段","",true)+'<p class="nc-note">旅程已結束。旅行期間會依手機時間自動標示現在與下一步。</p>'+go}
 const {now,next,day}=c,stay=now&&next&&isT(now.t)&&isT(next.t)&&mins(next)>mins(now)?mins(next)-mins(now):0,
 st=stay?`預估停留 ${stay>=60?Math.floor(stay/60)+" 小時 ":""}${stay%60?stay%60+" 分":""}`:"",
 dest=next?(next.lat!=null?`${next.lat},${next.lng}`:encodeURIComponent((next.q||next.h)+(t.country?" "+t.country:""))):"";
 return hd(LIVE.sim?"sim":"on",LIVE.sim?"預覽模式":"現在 / 下一步",`${esc(day.k)}${day.date?" "+esc(day.date):""}`)+`
 <div class="lvrow"><small>現在</small><b>${now?esc((now.t?now.t+"　":"")+now.h):"尚未開始"}</b></div>
 <div class="lvrow nx"><small>下一步</small><b>${next?esc((next.t?next.t+"　":"")+next.h):"結束當天行程"}</b>${st?`<span class="lvst">${st}</span>`:""}</div>
 ${next?`<a class="pill lvnav" href="https://www.google.com/maps/dir/?api=1&destination=${dest}" target="_blank" rel="noopener"><i class="ic ic-nav"></i>導航至下一站</a>`:""}
 <div class="nc-ctl"><button type="button" class="nc-btn" data-a="lvprev">上一個</button><button type="button" class="nc-btn" data-a="lvnext">下一個</button><button type="button" class="nc-btn" data-a="lvauto" ${LIVE.sim?"":"disabled"}>回到即時</button></div>`}
/* ===== 換下一站景點：從口袋名單選一個，換掉「下一步」，原景點放回口袋名單 ===== */
let SWAP=null;
function swapNextOpen(){const t=viewTrip();if(!t||!_poolGuard(t))return;
  const c=liveCalc(t);if(!c||c.off||!c.next){toast("目前沒有下一站可以換");return}
  const placed=poolPlaced(t),L=poolOf(t).filter(p=>p&&!placed[p.id]);
  SWAP={tid:t.id,d:c.d,i:c.i+1,h:c.next.h};
  const rows=L.map(p=>`<div class="pt-row"><div class="pt-main"><div class="pt-name"><span>${esc(p.name)}</span></div>${p.note?`<p class="pt-note">${esc(p.note)}</p>`:""}${p.area?`<span class="pt-tag">${esc(p.area)}</span>`:""}</div><button class="cb" data-a="swappick" data-v="${esc(p.id)}">換成這個</button></div>`).join("");
  modal(`<h3>換下一站</h3><p class="meta">把「${esc(c.next.h)}」換成口袋名單的地點，原本的會放回口袋名單。</p>${L.length?`<div class="pt-pool">${rows}</div>`:`<p>口袋名單沒有可換的地點。到「更多 › 口袋清單」新增，或先把已排入的地點移除。</p>`}`)}
function swapNextDo(id){const t=viewTrip();if(!t||!SWAP||SWAP.tid!==t.id||!_poolGuard(t))return;
  const D=getDays(t),day=D[SWAP.d],old=day&&day.items&&day.items[SWAP.i],p=poolOf(t).find(x=>x&&x.id===id);
  if(!old||old.h!==SWAP.h){toast("行程已變動，請重新操作");return}
  if(!p){toast("找不到這筆，可能已被刪除");return}
  const x={t:old.t||"",h:p.name,d:p.note||"",q:p.q||p.name,more:"",pid:p.id};
  if(p.lat!=null){x.lat=p.lat;x.lng=p.lng}
  day.items[SWAP.i]=x;
  let list=poolOf(t),added=false;
  const had=old.pid&&list.some(y=>y&&y.id===old.pid);
  if(!had&&old.h&&!list.some(y=>y&&_poolKey(y.name)===_poolKey(old.h))&&list.length<200){
    const r={id:_poolId(),name:String(old.h).slice(0,60),q:old.q||old.h,ts:Date.now(),date:getLocalDateStr(),by:me.uid};
    if(old.lat!=null){r.lat=old.lat;r.lng=old.lng}
    if(old.d)r.note=String(old.d).slice(0,200);
    list=[...list,r];added=true}
  setDays(t,D);if(added)patch(t,{pool:list});
  SWAP=null;$("#modal").classList.remove("on");render();
  toast("已換成 "+p.name+"，原景點放回口袋名單")}
function refreshLive(){const el=$("#live"),t=viewTrip(),card=$("#nowcard");if(card&&t&&card.dataset.tid!==String(t.id)){renderNow(T0());return}if(el&&t)el.innerHTML=liveHTML(t)}
function liveStep(a){const t=viewTrip();if(!t)return;if(a==="lvauto"){LIVE={sim:false,d:0,i:-1};refreshLive();return}
 const c=liveCalc(t);if(!c)return;let{d,i}=c;const D=c.D;
 if(a==="lvnext"){if(i<D[d].items.length-1)i++;else if(d<D.length-1){d++;i=-1}}else{if(i>-1)i--;else if(d>0){d--;i=D[d].items.length-1}}
 LIVE={sim:true,d,i};refreshLive();jellyAfter(a)}

/* ===== 行程頁水卡：顯示用行程（只決定顯示哪一趟，不改資料；T0() 不動）===== */
function tripSpan(t){const s=t.startDate?new Date(t.startDate+"T00:00"):null;if(!s||isNaN(s))return null;const n=Array.isArray(t.days)&&t.days.length?t.days.length:(+t.nDays||1);let e=t.endDate?new Date(t.endDate+"T23:59:59"):null;if(!e||isNaN(e)||e<s)e=new Date(s.getTime()+n*864e5-1);return[s.getTime(),e.getTime()]}
function tripList(){const L=visible().filter(t=>t.status!=="past").map(t=>({t,sp:tripSpan(t)}));L.sort((a,b)=>a.sp&&b.sp?(a.sp[0]-b.sp[0]||a.sp[1]-b.sp[1]):a.sp?-1:b.sp?1:0);return L.map(x=>x.t)}
function pickTrip(L){L=L||tripList();if(!L.length)return null;const now=Date.now(),on=[],near=[];for(const t of L){const sp=tripSpan(t);if(!sp)continue;if(now>=sp[0]&&now<=sp[1]){on.push(t);continue}near.push({t,d:now<sp[0]?sp[0]-now:now-sp[1]})}
 if(on.length)return on.find(x=>x.status==="now")||on[0];
 const cur0=L.find(x=>x.status==="now");if(cur0)return cur0;
 near.sort((a,b)=>a.d-b.d);const live=near.find(x=>x.t.status!=="past");return(live||near[0]||{}).t||L.find(x=>x.status!=="past")||L[0]}
function viewTrip(){const L=tripList();if(VIEW_ID){const f=L.find(x=>x.id===VIEW_ID);if(f)return f;VIEW_ID=null}return pickTrip(L)}
function TV(){return RV||((cur==="now"||cur==="pool")&&viewTrip())||(cur==="future"&&futTrip())||T0()}
function LT(){return viewTrip()||T0()}
function reducedMotion(){try{return matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){return false}}
function bounce(el){if(!el||reducedMotion())return;el.classList.remove("jelly");void el.offsetWidth;el.classList.add("jelly");setTimeout(()=>el.classList.remove("jelly"),460)}
function jellyAfter(a){const b=document.querySelector('#live [data-a="'+a+'"]:not(:disabled)');if(b)bounce(b)}
function rippleAt(card,e){if(reducedMotion())return;const Ly=card.querySelector(".nc-rip");if(!Ly)return;const r=Ly.getBoundingClientRect();let x=e.clientX-r.left,y=e.clientY-r.top;if(!e.detail||!e.clientX){x=r.width/2;y=r.height/2}const s=Math.hypot(Math.max(x,r.width-x),Math.max(y,r.height-y))*2,i=document.createElement("i");i.className="ripple";i.style.cssText=`width:${s}px;height:${s}px;left:${x-s/2}px;top:${y-s/2}px`;Ly.appendChild(i);setTimeout(()=>i.remove(),700)}
document.addEventListener("click",e=>{const card=e.target.closest("#nowcard");if(!card)return;if(e.target.closest(".nc-top"))rippleAt(card,e);const bt=e.target.closest(".nc-btn,.lvnav");if(bt&&(bt.matches(".lvnav")||!bt.closest("#live")))bounce(bt)});
function nowToggle(){NOWOPEN=!NOWOPEN;const c=$("#nowcard"),m=$("#ncmore");if(!c)return;c.classList.toggle("is-open",NOWOPEN);if(m){if(NOWOPEN)m.removeAttribute("inert");else m.setAttribute("inert","")}document.querySelectorAll("#live .nc-hd").forEach(x=>x.setAttribute("aria-expanded",String(NOWOPEN)));if(NOWOPEN){bounce(c);setTimeout(()=>{try{MiniMap.refresh()}catch(e){}},400)}}
function nowEmpty(){if(!FB_OK||!me)return emptyNow();
 return`<div class="nowrow"><article class="nowcard glass is-empty" id="nowcard"><span class="nc-rip" aria-hidden="true"></span><div class="nc-top"><div class="nc-hd static"><span class="ldot" aria-hidden="true"></span><b class="nc-t">還沒有行程</b></div><p class="nc-note">新增第一趟旅行後，這裡會顯示現在與下一步。</p><div class="nc-ctl"><button type="button" class="nc-btn" data-a="add" data-v="now">來趟旅行吧！</button></div><div class="nc-ctl"><button type="button" class="nc-btn sub" data-a="join">輸入邀請碼</button><button type="button" class="nc-btn sub" data-a="tpl">匯入範例：北海道</button></div></div></article></div>`+guide()+(foodSnap()?'<div class="pills" style="margin-top:10px"><button class="pill gl" data-a="m" data-v="diet">飲食卡（離線快照）</button></div>':"")}
/* ===== 每日行程：純 Tab View（一次只顯示一天） ===== */
const daysAcc=(t,di)=>dayHTML(t,di);
function focusDay(t,i,go){dayI[t.id]=i;if(cur==="future"){renderFuture();return}const b=$("#dayblk");if(b)b.innerHTML=dayHTML(t,i);document.querySelectorAll("#dtabs button").forEach((x,n)=>x.classList.toggle("on",n===i));if(go){const d=$("#dtabs");if(d)d.scrollIntoView({behavior:"smooth",block:"start"})}}
window.addEventListener("afterprint",()=>{const t=TV(),b=$("#dayblk");if(t&&b)b.innerHTML=dayHTML(t,dayI[t.id]||0)});
window.addEventListener("resize",()=>{try{MapView.refresh();MiniMap.refresh()}catch(e){}});

/* ===== 備份：匯出 / 匯入 JSON ===== */
function exportBackup(){if(!me)return toast("請先登入");if(!TRIPS.length)return toast("目前沒有可匯出的行程");const data={app:"TripTick",version:1,exported:new Date().toISOString(),trips:clean(TRIPS)};
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,1)],{type:"application/json"}));a.download="triptych-backup-"+new Date().toISOString().slice(0,10)+".json";document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},800);toast("已匯出備份")}
async function importBackup(f){if(!f)return;if(!me)return toast("請先登入再匯入");let d;try{d=JSON.parse(await f.text())}catch(e){return toast("檔案格式不正確")}
 const L=Array.isArray(d)?d:d.trips;if(!Array.isArray(L)||!L.length)return toast("檔案裡沒有行程");
 if(!confirm(`將匯入 ${L.length} 趟行程。會建立為新的行程，不會覆蓋現有資料。要繼續嗎？`))return;
 const hasNow=visible().some(x=>x.status==="now");let ok=0;
 for(const x of L){try{const {id,owner,members,memberNames,st,inviteCode,lastJoinCode,createdAt,status,...r}=x;let s0=(st&&Object.values(st)[0])||status||"past";if(s0==="now"&&hasNow)s0="past";
  await setDoc(doc(collection(db,"trips")),{...ser({...r,owner:me.uid,members:[me.uid],memberNames:{[me.uid]:me.displayName||"我"},st:{[me.uid]:s0},importedFrom:id||""}),createdAt:serverTimestamp()});ok++}catch(e){console.error("[import]",e)}}
 toast(`已匯入 ${ok}/${L.length} 趟行程`);if(ok)go("now")}
/* ===== 新版本提示 ===== */
function showUpd(){let b=document.getElementById("updbar");if(!b){b=document.createElement("button");b.id="updbar";b.textContent="有新版本，點此更新";b.onclick=()=>location.reload();document.body.appendChild(b)}b.classList.add("on")}

function bar(arch,t0){let h=bar0(arch);if(arch){const t=t0||T0();if(t){const R='<button class="pill mini ed" data-a="tplreset">重設為範例</button>';h=h.split(R).join("");h=h.replace(/<\/div>$/,`${TPL&&t.templateId===TPL.id?R:""}<button class="pill mini ed" data-a="edit" data-v="${esc(t.id)}">編輯行程資訊</button><button class="pill mini ed" data-a="ai">AI 小精靈</button></div>`)}}return h}
function drawerExtra(){const I=n=>`<i class="ic ic-${n}"></i>`;
 return me?`<p class="grp">${I("user")}${esc(me.displayName||me.email||"我")}</p><button data-a="add" data-v="now">${I("plus")}新增行程</button><button data-a="ai">${I("spark")}AI 小精靈</button><button data-a="disc">${I("compass")}探索與範例</button><button data-a="datam">${I("up")}資料與備份</button><button data-a="auth">${I("out")}登出</button>`
 :`<p class="grp">帳戶</p><button class="login" data-a="auth">Google 一鍵登入</button>`}

/* ===== 1. 就緒旗標（歡迎頁由 auth.js 的 #welcome 全權負責） ===== */
let FEAT=[],PEND=null,AIPLAN=null,REC=null;
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;

/* ===== 2. 公開範本 ===== */
const tplLink=c=>location.origin+location.pathname+"?t="+c;
async function loadFeatured(){try{const q=query(collection(db,"templates"),where("featured","==",true)),sn=await getDocs(q);FEAT=sn.docs.map(d=>({id:d.id,...norm(d.data())}))}catch(e){console.warn("[templates] 精選範本讀取失敗",e)}}
function handleParams(){const q=new URLSearchParams(location.search).get("t");if(q){try{history.replaceState(null,"",location.pathname)}catch(e){}previewTpl("T:"+q.trim().toUpperCase())}}
async function getTplSrc(id){if(id==="builtin")return TPL?{...TPL,_src:"builtin"}:null;const code=id.replace(/^T:/,"").toUpperCase(),f=FEAT.find(x=>x.id===code);if(f)return{...f,_src:code};const d=await getDoc(doc(db,"templates",code));return d.exists()?{...norm(d.data()),_src:code}:null}
async function previewTpl(id){let src;try{src=await getTplSrc(id)}catch(e){console.error("[tpl]",e);return toast("讀取範本失敗："+(e.code||e.message))}if(!src)return toast("找不到這個範本");
 const D=src.days||[];modal(`<h3>${esc(src.title||"範本")}</h3><p class="meta">${esc(src.country||"")} · ${D.length||src.nDays||"?"} 天${src.ownerName?" · 由 "+esc(src.ownerName)+" 分享":""}</p>${src.notes?`<p>${esc(src.notes)}</p>`:""}<div class="tpv">${D.map(d=>`<div class="tpd"><b>${esc(d.k||"")}${d.city?" · "+esc(d.city):""}</b><p>${(d.items||[]).slice(0,6).map(x=>esc((x.t?x.t+" ":"")+x.h)).join("　")}${(d.items||[]).length>6?"…":""}</p></div>`).join("")||'<p class="meta">這個範本沒有每日行程。</p>'}</div><div class="pills"><button class="pill" data-a="tplimport" data-v="${esc(id)}">${me?"匯入到我的帳號":"登入並匯入"}</button></div>`)}
async function importSrc(id){if(!me){PEND=id;try{localStorage.setItem("tp-pend",id)}catch(e){}$("#modal").classList.remove("on");login();return}
 if(id==="builtin"){$("#modal").classList.remove("on");return importTpl()}
 let src;try{src=await getTplSrc(id)}catch(e){return toast("讀取範本失敗："+(e.code||e.message))}if(!src)return toast("找不到這個範本");
 const {_src,id:_i,owner,ownerName,featured,createdAt,publishedAt,expensesConfig,status,alerts,startDate,endDate,...rest}=src;
 try{await archiveNow("");await setDoc(doc(collection(db,"trips")),{...ser({...rest,startDate:"",endDate:"",days:(rest.days||[]).map(d=>({...d,date:""})),booking:[],expenses:[],diets:{},ext:EXT0,currency:rest.currency||"TWD",importedFrom:_src,owner:me.uid,members:[me.uid],memberNames:{[me.uid]:me.displayName||"我"},st:{[me.uid]:"now"}}),createdAt:serverTimestamp()});$("#modal").classList.remove("on");go("now");toast("已匯入，開啟編輯模式即可修改")}catch(e){console.error("[import tpl]",e);toast("匯入失敗："+(e.code||e.message))}}
function runPending(){let id=PEND;try{id=id||localStorage.getItem("tp-pend")}catch(e){}if(id&&me){PEND=null;try{localStorage.removeItem("tp-pend")}catch(e){}importSrc(id)}}
const TPL_KEEP=["title","short","country","countryCode","cities","nDays","notes","spots","pack","gift","storm","currency","image"];
function tplPayload(t){const o={};TPL_KEEP.forEach(k=>{if(t[k]!==undefined)o[k]=t[k]});o.days=getDays(t).map(d=>({k:d.k,city:d.city||"",pos:d.pos||"",wx:d.wx||"",tp:d.tp||"",more:d.more||"",items:d.items.map(x=>({t:x.t||"",h:x.h||"",d:x.d||"",q:x.q||"",type:x.type||"",more:x.more||"",...(x.lat!=null?{lat:x.lat,lng:x.lng}:{}),...(x.diet?{diet:x.diet}:{})}))}));return o}
async function publishTpl(t){if(!me)return null;if(!await askPublish())return null;
 const p=ser(tplPayload(t));for(let i=0;i<3;i++){const code=t.publicCode||rnd(6),body={...p,owner:me.uid,ownerName:me.displayName||"",publishedAt:serverTimestamp()};if(!t.publicCode)body.featured=false;
  try{await setDoc(doc(db,"templates",code),body,{merge:true});if(t.publicCode!==code)await patch(t,{publicCode:code});toast("已發布公開範本");return code}catch(e){console.error("[publish]",e);if(t.publicCode){toast("發布失敗："+(e.code||e.message));return null}}}
 toast("發布失敗，請再試一次");return null}
async function unpublishTpl(t){try{await deleteDoc(doc(db,"templates",t.publicCode));await updateDoc(tdoc(t),{publicCode:deleteField()});t.publicCode=null;const o=TRIPS.find(x=>x.id===t.id);if(o)o.publicCode=null;toast("已取消公開")}catch(e){console.error("[unpublish]",e);toast("失敗："+(e.code||e.message))}}
function discoverHTML(){const t=T0(),feat=[{id:"builtin",title:TPL?TPL.title:"北海道範例"},...FEAT.map(f=>({id:"T:"+f.id,title:f.title}))];
 return`<h3>探索與範例</h3><h4 class="meta">精選範本</h4>${feat.map(f=>`<div class="row"><span>${esc(f.title)}</span><button class="cb" data-a="tplprev" data-v="${esc(f.id)}">預覽</button></div>`).join("")}
 <h4 class="meta" style="margin:14px 0 4px">輸入範本代碼</h4><div class="add"><input class="fi" id="lt-code" placeholder="例如 K7M2QX" maxlength="8"><button class="pill" data-a="tplcode">預覽</button></div>
 <h4 class="meta" style="margin:14px 0 4px">加入朋友的行程（邀請碼）</h4><div class="add"><input class="fi" id="f-code" placeholder="邀請碼" maxlength="8" style="text-transform:uppercase"><button class="pill" data-a="dojoin">加入</button></div>
 ${t?`<h4 class="meta" style="margin:14px 0 4px">分享我的行程</h4>${t.publicCode?`<div class="jp codebox"><span>${esc(t.publicCode)}</span><button class="pill" data-a="cpcode" data-v="${esc(t.publicCode)}">複製代碼</button></div><div class="pills"><button class="pill gl" data-a="cplink" data-v="${esc(t.publicCode)}">複製連結</button><button class="pill gl" data-a="publish">更新內容</button><button class="pill gl" data-a="unpublish">取消公開</button></div>`:`<p class="meta">把「${esc(t.title)}」發布成公開範本，朋友輸入代碼或開啟連結，就能匯入並自己修改。</p><div class="pills"><button class="pill" data-a="publish">發布為公開範本</button></div>`}`:""}`}

/* ===== 6. AI 小精靈 ===== */
const AI_SCHEMA='{"title":"行程標題","days":[{"city":"當天城市或主題","pos":"當天重點","items":[{"t":"09:00","h":"景點或活動名稱","d":"簡短說明","q":"可在地圖搜尋的地點全名"}]}]}';
function cleanPlan(p){if(typeof p==="string"){const m=p.match(/\{[\s\S]*\}|\[[\s\S]*\]/);if(!m)return null;try{p=JSON.parse(m[0])}catch(e){return null}}
 if(Array.isArray(p))p={days:p};if(!p||!Array.isArray(p.days))return null;const S=(v,n)=>String(v==null?"":v).replace(/[<>]/g,"").slice(0,n).trim();
 const days=p.days.slice(0,14).map(d=>({city:S(d&&d.city,40),pos:S(d&&d.pos,80),items:(Array.isArray(d&&d.items)?d.items:[]).slice(0,15).map(x=>({t:S(x.t,12),h:S(x.h,60),d:S(x.d,300),q:S(x.q,80)})).filter(x=>x.h)}));
 return days.length?{title:S(p.title,60),days}:null}
function showPlan(p){AIPLAN=cleanPlan(p);const o=$("#ai-out");if(!o)return;
 if(!AIPLAN){o.innerHTML='<div class="ai-err">無法解析行程，請再試一次。</div>';return toast("無法解析行程")}
 const n=AIPLAN.days.reduce((s,d)=>s+d.items.length,0);
 o.innerHTML=`<div class="ai-res"><div class="ai-sum"><b>${esc(AIPLAN.title||"AI 行程")}</b><span>${AIPLAN.days.length} 天・${n} 個項目</span></div>${AIPLAN.days.map((d,i)=>`<details class="ai-day" ${i===0?"open":""}><summary><b>D${i+1}</b>${d.city?" "+esc(d.city):""}<small>${d.items.length} 項</small></summary><ul>${d.items.map(x=>`<li><time>${esc(x.t)}</time><span>${esc(x.h)}</span></li>`).join("")}</ul></details>`).join("")}<div class="pills"><button class="pill" data-a="aiapply">填入行程</button>${AI_AUTO?'<button class="pill gl" data-a="aiauto">重新生成</button>':""}</div></div>`;
 o.scrollIntoView({behavior:"smooth",block:"nearest"})}
function aiMic(){if(!SR)return;const b=$("#ai-mic");if(REC){REC.stop();return}REC=new SR();REC.lang="zh-TW";REC.interimResults=false;
 REC.onresult=ev=>{const tx=[...ev.results].map(r=>r[0].transcript).join(""),el=$("#ai-q");el.value=(el.value?el.value+" ":"")+tx};REC.onend=()=>{REC=null;micState(false)};REC.onerror=()=>{REC=null;micState(false)};micState(true);REC.start()}
function micState(on){const b=$("#ai-mic");if(!b)return;b.classList.toggle("on",!!on);b.setAttribute("aria-label",on?"停止語音輸入":"語音輸入");b.title=on?"聆聽中":"語音輸入"}
async function aiApply(){const plan=AIPLAN;if(!plan||!me)return;const mode=$("#ai-mode").value,t=TV();
 const mk=(d,i,t0)=>{let date="";if(t0&&/^\d{4}-\d{2}-\d{2}/.test(t0.startDate||"")){const x=new Date(t0.startDate+"T00:00");x.setDate(x.getDate()+i);date=`${x.getMonth()+1}/${x.getDate()}（${"日一二三四五六"[x.getDay()]}）`}return{k:"D"+(i+1),date,city:d.city,wx:"",tp:"",pos:d.pos,more:"",items:d.items.map(x=>({...x,type:"",more:""}))}};
 try{let tid;
  if(mode==="new"||!t){await archiveNow("");const ref=doc(collection(db,"trips"));tid=ref.id;await setDoc(ref,{...clean({title:plan.title||"AI 行程",country:"",countryCode:"",startDate:"",endDate:"",image:"",notes:"由 AI 小精靈生成",nDays:plan.days.length,spots:[],days:plan.days.map((d,i)=>mk(d,i,null)),booking:[],expenses:[],currency:"TWD",diets:{},ext:EXT0,owner:me.uid,members:[me.uid],memberNames:{[me.uid]:me.displayName||"我"},st:{[me.uid]:"now"}}),createdAt:serverTimestamp()})}
  else{tid=t.id;const D=getDays(t);await setDays(t,mode==="replace"?plan.days.map((d,i)=>mk(d,i,t)):D.concat(plan.days.map((d,i)=>mk(d,D.length+i,t))))}
  $("#modal").classList.remove("on");go("now");toast("已填入行程，正在補查地圖座標…");setTimeout(()=>geocodeAI(tid),1500)}catch(e){console.error("[aiApply]",e);toast("填入失敗："+(e.code||e.message))}}
async function geocodeAI(tid){const get=()=>TRIPS.find(x=>x.id===tid);let t=get();if(!t)return;const got={};let tot=0,n=0;
 getDays(t).forEach((d,di)=>d.items.forEach((x,ii)=>{if(x.q&&x.lat==null&&tot<30)tot++}));
 for(const[di,d]of getDays(t).entries())for(const[ii,x]of d.items.entries()){if(!(x.q&&x.lat==null)||n>=tot)continue;const g=await geo(x.q+(t.country?" "+t.country:""));n++;if(g)got[di+":"+ii+":"+x.h]=g;toast(`查詢座標 ${n}/${tot}`);await new Promise(r=>setTimeout(r,1100))}
 t=get();if(!t)return;const F=getDays(t);let c=0;F.forEach((d,di)=>d.items.forEach((x,ii)=>{const g=got[di+":"+ii+":"+x.h];if(g&&x.lat==null){x.lat=g[0];x.lng=g[1];c++}}));if(c){await setDays(t,F);toast(`已標出 ${c} 個地點`)}}

/* ===== 新增動作（獨立監聽，不動原本的大型 handler） ===== */
document.addEventListener("click",e=>{const b=e.target.closest("[data-a]");if(!b)return;const a=b.dataset.a,v=b.dataset.v;
 if(b.closest("#drawer")&&["disc","datam","ai"].includes(a))document.body.classList.remove("dr");
 switch(a){
   case"tplprev":previewTpl(v);break;
  case"tplcode":{const c=(($("#lt-code")||{}).value||"").trim();c?previewTpl("T:"+c.toUpperCase()):toast("請輸入範本代碼");break}
  case"tplimport":importSrc(v);break;
  case"disc":modal(discoverHTML());break;
  case"datam":modal(dataHTML());break;
  case"ai":if(!me)return toast("請先登入");modal(aiHTML());break;
  case"publish":{const t=T0();if(t)publishTpl(t).then(c=>{if(c)modal(discoverHTML())});break}
  case"unpublish":{const t=T0();if(t&&confirm("取消公開後，這個代碼與連結就失效了。要取消嗎？"))unpublishTpl(t).then(()=>modal(discoverHTML()));break}
  case"cpcode":copy(v,"已複製範本代碼");break;
  case"cplink":copy(tplLink(v),"已複製分享連結");break;
  case"aicopy":copy(aiPrompt(),"已複製提示詞");break;
  case"aigen":aiGen();break;
  case"aipaste":showPlan($("#ai-json").value);break;
  case"aiapply":aiApply();break;
  case"aimic":aiMic();break;
 }});

/* 登出／未登入時清掉這台裝置上的行程快照（含成員姓名），避免被別人看到。舊版本機遷移用的 tp-bk-/tp-ex- 等不動。 */
function purgeLocal(){try{Object.keys(localStorage).filter(k=>/^(tp-snap|tp-food-|tp-days-snap-)/.test(k)).forEach(k=>localStorage.removeItem(k))}catch(e){}}

/* ===================== v20 ===================== */
/* ---- 5. 資料與備份：匯入排第一 ---- */
const dataHTML=()=>`<h3>資料與備份</h3><div class="row"><span>匯入備份（JSON）<br><small class="meta">建立為新行程，不覆蓋現有資料</small></span><button class="cb" data-a="import">匯入</button></div><div class="row"><span>匯出備份（JSON）<br><small class="meta">下載你所有的行程</small></span><button class="cb" data-a="export">匯出</button></div><div class="row"><span>匯出行程懶人包（PDF）<br><small class="meta">列印或另存為 PDF</small></span><button class="cb" data-a="print">列印</button></div>`;

/* ---- 6. 發布提醒 ---- */
let PUBRES=null;
function askPublish(){return new Promise(res=>{PUBRES=res;modal('<h3>【發布為公開範本】</h3><p>發布後將公開：行程標題、每日行程、景點與備註。</p><p><b>不會公開</b>：成員名單、預訂資料 (Booking)、帳本、緊急聯絡、飲食設定與備忘錄。</p><p class="meta" style="margin-top:8px">請確認行程中無個人隱私資訊。確定要發布嗎？</p><div class="pills"><button class="pill" data-a="pubok">確定發布</button></div>')})}

/* ---- 4. AI 小精靈 v2：Provider 架構（免費優先；日後要開放大眾，只需新增 provider） ----
   流程固定：buildPrompt → provider.run → cleanPlan（驗證/淨化）→ 預覽 → aiApply。
   provider.mode="auto" 為網頁內一鍵；"manual" 為複製提示詞／貼回。新增 provider 只要 push 進 AI_PROVIDERS。 */
const AI_LIMITS={maxPrompt:800,cooldownMs:8000};let AI_LAST=0,AI_AUTO=null;
const LM=window.LanguageModel||(window.ai&&window.ai.languageModel)||null;
const AI_LINKS=[["ChatGPT",q=>"https://chatgpt.com/?q="+encodeURIComponent(q)],["Claude",q=>"https://claude.ai/new?q="+encodeURIComponent(q)],["Gemini",()=>"https://gemini.google.com/app"]];
const AI_PROVIDERS=[
 {id:"device",label:"裝置內建 AI・免費",mode:"auto",
  async available(){try{if(!LM)return false;if(LM.availability)return(await LM.availability())!=="unavailable";if(LM.capabilities)return(await LM.capabilities()).available!=="no"}catch(e){}return false},
  async run(prompt){let ses;try{ses=await LM.create()}catch(e){ses=await LM.create({expectedInputs:[{type:"text",languages:["en"]}],expectedOutputs:[{type:"text",languages:["en"]}]})}try{return await ses.prompt(prompt)}finally{ses.destroy&&ses.destroy()}}},
 {id:"endpoint",label:"雲端 AI",mode:"auto",available:async()=>!!AI_URL,
  async run(prompt){const ac=new AbortController(),to=setTimeout(()=>ac.abort(),60000);try{const tok=await auth.currentUser.getIdToken(),r=await fetch(AI_URL,{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+tok},body:JSON.stringify({prompt}),signal:ac.signal}),j=await r.json();if(!r.ok)throw new Error(j.error||r.status);return j.plan||j}finally{clearTimeout(to)}}},
 {id:"manual",label:"手動模式（免費）",mode:"manual",available:async()=>true}];
const AI_CHIPS=["5 天輕鬆行程，多留點咖啡廳時間","親子友善、少走路","美食為主，不吃生食","雨天備案：全室內景點"];
const buildPrompt=(q,x="")=>{q=String(q||"").replace(/[\u0000-\u001f\u007f]/g," ").trim().slice(0,AI_LIMITS.maxPrompt);return`你是旅遊行程規劃師。請依下列需求，用繁體中文規劃行程，並「只輸出 JSON」（不要任何說明、不要 Markdown 程式碼框），格式如下：\n${AI_SCHEMA}\n規則：每天 3～8 個項目；t 用 24 小時制 HH:MM；q 填可在地圖搜尋的地點全名（含城市）；最多 14 天。\n需求：${q||"（請填寫需求）"}${x?"\n補充條件："+x:""}`};
function aiCtx(){const t=TV();let s="";if(!t)return s;const mode=($("#ai-mode")||{}).value;
 if(mode&&mode!=="new")s+=`目前行程：${t.title}${t.country?"（"+t.country+"）":""}${t.startDate?"，"+t.startDate+" 出發":""}。`;
 if($("#ai-diet")&&$("#ai-diet").checked){const m=foodModel(t.diets||{},t.members||[],t.memberNames||{}),a=[...m.strict,...m.soft].map(k=>TERM[k][0]),al=m.allergy.map(k=>TERM[k][0]);if(a.length)s+=`團隊飲食：避開${a.join("、")}，餐廳請優先安排有對應餐點的店。`;if(al.length)s+=`過敏：${al.join("、")}。`}
 return s}
const aiPrompt=()=>buildPrompt(($("#ai-q")||{}).value,aiCtx());
const aiManualHTML=()=>`<ol class="ai-steps"><li><b>複製提示詞，到任一 AI 貼上</b><div class="pills">${AI_LINKS.map((l,i)=>`<button class="pill ${i?"gl":""}" data-a="aiopen" data-v="${i}">${l[0]}</button>`).join("")}</div></li><li><b>把回覆貼回來</b><div class="pills"><button class="pill" data-a="aipasteclip">貼上並預覽</button></div><details><summary class="meta">手動貼上</summary><textarea class="fi" id="ai-json" rows="4" placeholder="貼上 AI 回覆的 JSON"></textarea><div class="pills"><button class="pill gl" data-a="aipaste">解析並預覽</button></div></details></li></ol>`;
function aiHTML(){const t=TV(),hasDiet=!!(t&&t.diets&&Object.keys(t.diets).length);
 return`<div class="ai"><div class="ai-h"><span class="ai-ic"><i class="ic ic-spark"></i></span><div><h3>AI 小精靈</h3><p class="meta">一句話，排出每日行程。</p></div></div>
 <div class="ai-box"><textarea class="fi" id="ai-q" rows="3" maxlength="${AI_LIMITS.maxPrompt}" placeholder="例如：北海道 5 天，不吃肉，喜歡溫泉與雪景"></textarea>${SR?'<button class="ai-mic" data-a="aimic" id="ai-mic" aria-label="語音輸入"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v4"/></svg></button>':""}</div>
 <div class="ai-chips">${AI_CHIPS.map(c=>`<button class="ai-chip" data-a="aichip" data-v="${esc(c)}">${esc(c)}</button>`).join("")}</div>
 <p class="ai-l">套用方式</p><div class="ai-seg">${t?'<button class="on" data-a="aimodeset" data-v="append">附加到目前行程</button><button data-a="aimodeset" data-v="replace">取代每日行程</button>':""}<button class="${t?"":"on"}" data-a="aimodeset" data-v="new">建立新行程</button></div><input type="hidden" id="ai-mode" value="${t?"append":"new"}">
 ${hasDiet?'<label class="chk ai-diet"><input type="checkbox" id="ai-diet" checked> 帶入飲食限制</label>':""}
 <div id="ai-act"><p class="meta">檢查可用的 AI…</p></div><div id="ai-out"></div></div>`}
async function aiInit(){const el=$("#ai-act");if(!el)return;let auto=null;for(const p of AI_PROVIDERS){if(p.mode==="auto"){let ok=false;try{ok=await p.available()}catch(e){}if(ok){auto=p;break}}}
 AI_AUTO=auto;if(!$("#ai-act"))return;$("#ai-act").innerHTML=auto?`<button class="pill ai-go" data-a="aiauto"><span class="spin"></span><span class="lbl">一鍵生成</span></button><p class="ai-by">使用：${esc(auto.label)}</p><details class="ai-man"><summary>手動貼上</summary>${aiManualHTML()}</details>`:`<p class="ai-by">請用手動模式：</p>${aiManualHTML()}`}
async function aiAuto(){const q=(($("#ai-q")||{}).value||"").trim();if(!q)return toast("請先描述需求");if(!AI_AUTO)return;if(Date.now()-AI_LAST<AI_LIMITS.cooldownMs)return toast("請稍等幾秒再試");AI_LAST=Date.now();
 const out=$("#ai-out"),p=AI_AUTO,btn=document.querySelector(".ai-go");if(btn){btn.classList.add("busy");btn.querySelector(".lbl").textContent="規劃中…"}
 out.innerHTML='<div class="ai-sk"><i></i><i></i><i></i></div>';
 try{showPlan(await p.run(buildPrompt(q,aiCtx())))}catch(e){console.error("[ai]",p.id,e);out.innerHTML=`<div class="ai-err">生成失敗：${esc(e.message||e)}</div>`}
 finally{const b=document.querySelector(".ai-go");if(b){b.classList.remove("busy");b.querySelector(".lbl").textContent="一鍵生成"}}}
function aiGen(){return aiAuto()}

/* ---- 1. 團隊成員實時定位（螢光綠） ----
   trips/{id}/live/{uid} = {lat,lng,acc,ts,name}；只有行程成員讀得到、只能寫自己的。僅在 App 開啟時更新。 */
let LOCSUB=null,LOCTRIP=null,LOCS={},LOCWATCH=null,LOCLAST={t:0,lat:0,lng:0};
const LOCMAX=12*3600e3,locKey=id=>"tp-loc-"+id,isIOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
const locOn=id=>{try{const v=+localStorage.getItem(locKey(id));return v&&Date.now()-v<LOCMAX}catch(e){return false}};
function locBarHTML(t){const on=locOn(t.id),n=Object.keys(LOCS).length;return`<span class="meta">${on?(n?`分享中・${n} 人`:"分享中"):"未分享"}</span><button class="pill mini2 ${on?"":"gl"}" data-a="locshare">${on?"停止":"分享位置"}</button><button class="pill mini2 gl" data-a="people">同行位置</button>`}
function updLocBar(){const t=LT(),el=document.getElementById("locbar");if(el&&t)el.innerHTML=locBarHTML(t)}
const locDoc=(tid,uid)=>doc(db,"trips",tid,"live",uid);
function startShare(t){if(!me||!navigator.geolocation)return toast("這個瀏覽器無法取得定位");if(LOCWATCH!=null)return;
 try{localStorage.setItem(locKey(t.id),String(Date.now()))}catch(e){}
 LOCWATCH=navigator.geolocation.watchPosition(p=>{const c=p.coords,now=Date.now(),mv=Math.hypot((c.latitude-LOCLAST.lat)*111e3,(c.longitude-LOCLAST.lng)*111e3*Math.cos(c.latitude*Math.PI/180));
  if(now-LOCLAST.t<20000&&mv<20)return;LOCLAST={t:now,lat:c.latitude,lng:c.longitude};
  setDoc(locDoc(t.id,me.uid),{lat:c.latitude,lng:c.longitude,acc:Math.round(c.accuracy||0),ts:now,name:me.displayName||"成員",kind:"live"}).catch(e=>console.error("[loc]",e))},
  err=>{console.warn("[loc]",err);toast(err.code===1?"沒有定位權限，請到瀏覽器設定允許":"暫時無法取得定位");stopShare(t,true)},{enableHighAccuracy:true,maximumAge:10000,timeout:25000});
 updLocBar()}
function stopShare(t,del){if(LOCWATCH!=null){try{navigator.geolocation.clearWatch(LOCWATCH)}catch(e){}LOCWATCH=null}try{localStorage.removeItem(locKey(t.id))}catch(e){}
 if(del&&me&&db)deleteDoc(locDoc(t.id,me.uid)).catch(()=>{}).then(()=>{if(safeOn(t.id))writeLast(t,"last")});updLocBar()}
function syncLoc(){const t=LT();syncReq();
 if(!me||!t||!FB_OK){if(LOCSUB){LOCSUB();LOCSUB=null}LOCTRIP=null;LOCS={};if(LOCWATCH!=null){try{navigator.geolocation.clearWatch(LOCWATCH)}catch(e){}LOCWATCH=null}return}
 if(LOCTRIP!==t.id){if(LOCSUB){LOCSUB();LOCSUB=null}LOCTRIP=t.id;LOCS={};if(LOCWATCH!=null){try{navigator.geolocation.clearWatch(LOCWATCH)}catch(e){}LOCWATCH=null}
  LOCSUB=onSnapshot(collection(db,"trips",t.id,"live"),sn=>{LOCS={};sn.docs.forEach(d=>LOCS[d.id]=d.data());drawMembers();updLocBar()},er=>console.warn("[loc] 讀取失敗",er.code||er))}
 if(locOn(t.id)&&LOCWATCH==null)startShare(t);else if(!locOn(t.id)&&LOCWATCH!=null)stopShare(t,true)}
function drawMembers(){const t=LT();if(!t||typeof MiniMap==="undefined")return;const now=Date.now();
 const list=Object.entries(LOCS).filter(([u,d])=>d&&typeof d.lat==="number"&&now-(d.ts||0)<((d.kind||"live")==="live"?3600e3:864e5)).map(([u,d])=>({uid:u,name:u===(me&&me.uid)?"我":(nameOf(t,u)!==u?nameOf(t,u):d.name||"成員"),lat:d.lat,lng:d.lng,acc:d.acc||0,ts:d.ts||0,kind:d.kind||"live",me:u===(me&&me.uid)}));
 MiniMap.setMembers(list,memberPopup)}
const KL={live:"即時",last:"最後已知",checkin:"報平安"};
const navLinks=(lat,lng)=>{const g=`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`,a=`https://maps.apple.com/?daddr=${lat},${lng}&dirflg=w`;return isIOS?[["Apple 地圖",a],["Google 地圖",g]]:[["Google 地圖",g],["Apple 地圖",a]]};
function memberPopup(p){const el=document.createElement("div");el.className="pp";const min=Math.max(0,Math.round((Date.now()-p.ts)/60000)),nl=navLinks(p.lat,p.lng);
 el.innerHTML=`<div class="mit"><b>${esc(p.name)}</b><span class="chip live">${p.me?"我":KL[p.kind]||"位置"}</span></div><p class="mis">${ago(min)}更新${p.acc?`・±${p.acc} 公尺`:""}</p>${p.me?"":`<div class="pills"><a class="pill" href="${nl[0][1]}" target="_blank" rel="noopener">導航</a><button class="pill gl" data-a="askloc" data-v="${esc(p.uid)}">請求即時</button></div><p class="meta mis-l"><a href="${nl[1][1]}" target="_blank" rel="noopener">改用 ${nl[1][0]}</a></p>`}`;return el}

/* ---- 找人：自動更新 / 請求位置 / 報平安 ---- */
const SAFE_MAX=14*864e5,safeKey=id=>"tp-safe-"+id;
const safeOn=id=>{try{const v=+localStorage.getItem(safeKey(id));return!!v&&Date.now()-v<SAFE_MAX}catch(e){return false}};
const ago=m=>m==null?"":m<1?"剛剛":m<60?m+" 分鐘前":m<1440?Math.round(m/60)+" 小時前":Math.round(m/1440)+" 天前";
let SAFE_T=0;
function writeLast(t,kind,force){return new Promise(res=>{if(!me||!db||!navigator.geolocation||(LOCWATCH!=null&&!force))return res(false);
 navigator.geolocation.getCurrentPosition(p=>{const c=p.coords;setDoc(locDoc(t.id,me.uid),{lat:c.latitude,lng:c.longitude,acc:Math.round(c.accuracy||0),ts:Date.now(),name:me.displayName||"成員",kind:kind||"last"}).then(()=>res(true)).catch(e=>{console.warn("[safe]",e);res(false)})},()=>res(false),{enableHighAccuracy:false,maximumAge:300000,timeout:15000})})}
function safeTick(){const t=T0();if(!t||!me||document.hidden)return;
 if(LOCWATCH!=null&&!locOn(t.id))stopShare(t,true);
 if(!safeOn(t.id)||Date.now()-SAFE_T<10*60e3)return;
 if(t.endDate&&Date.now()>new Date(t.endDate+"T23:59:00").getTime()+2*864e5){try{localStorage.removeItem(safeKey(t.id))}catch(e){}return}
 SAFE_T=Date.now();writeLast(t,"last")}
document.addEventListener("visibilitychange",()=>{if(!document.hidden)safeTick()});setInterval(safeTick,60000);

const reqDoc=(tid,uid)=>doc(db,"trips",tid,"locreq",uid);
let REQSUB=null,REQTRIP=null;
function syncReq(){const t=T0();if(!me||!t||!FB_OK){if(REQSUB){REQSUB();REQSUB=null}REQTRIP=null;return}if(REQTRIP===t.id)return;if(REQSUB)REQSUB();REQTRIP=t.id;
 REQSUB=onSnapshot(reqDoc(t.id,me.uid),s=>showReq(s.exists()?s.data():null),er=>console.warn("[req]",er.code||er))}
function showReq(d){let b=document.getElementById("reqbar");if(!d||Date.now()-(d.ts||0)>864e5){if(b)b.remove();return}
 if(!b){b=document.createElement("div");b.id="reqbar";b.setAttribute("role","alert");document.body.appendChild(b)}
 b.innerHTML=`<span><b>${esc(d.fromName||"成員")}</b> 想知道你的位置</span><button data-a="reqshare">分享 1 小時</button><button class="gl" data-a="reqskip">略過</button>`}
function askLoc(t,uid){setDoc(reqDoc(t.id,uid),{from:me.uid,fromName:me.displayName||"成員",ts:Date.now()}).then(()=>toast("已通知對方")).catch(e=>toast("失敗："+(e.code||e.message)))}
function peopleHTML(t){const now=Date.now(),sf=safeOn(t.id);
 return`<h3>成員位置</h3>${t.members.map(u=>{const d=LOCS[u],age=d?Math.round((now-(d.ts||0))/60000):null,k=d&&(d.kind||"live"),nl=d?navLinks(d.lat,d.lng)[0]:null;
  const st=!d?'<small class="meta">尚未分享位置</small>':`<span class="pst ${k}">${k==="live"&&age<30?"即時":k==="checkin"?"自動更新":"最後已知"}</span> <small class="meta">${ago(age)}</small>`;
  return`<div class="row"><span><b>${esc(nameOf(t,u))}</b>${u===me.uid?' <small class="meta">你</small>':""}<br>${st}</span><span>${d&&u!==me.uid?`<a class="cb" href="${nl[1]}" target="_blank" rel="noopener">導航</a>`:""}${u!==me.uid?`<button class="cb" data-a="askloc" data-v="${esc(u)}">請求位置</button>`:""}</span></div>`}).join("")}
 <h4 class="meta">自動更新</h4>
 <p class="meta">開啟後，每次打開 App 會自動更新你的最後已知位置給同行成員。</p>
 <div class="pills"><button class="pill ${sf?"gl":""}" data-a="safetoggle">${sf?"關閉":"開啟"}</button><button class="pill gl" data-a="checkin">報平安</button></div>`}

/* ---- v20 新增動作（獨立監聽） ---- */
document.addEventListener("click",e=>{const b=e.target.closest("[data-a]");if(!b)return;const a=b.dataset.a,v=b.dataset.v;
 switch(a){
  case"aichip":{const q=$("#ai-q");if(q){q.value=(q.value?q.value.replace(/\s+$/,"")+"，":"")+v;q.focus()}break}
  case"aimodeset":{const h=$("#ai-mode");if(h)h.value=v;b.parentNode.querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===b));break}
  case"people":{const t=LT();if(t&&me)modal(peopleHTML(t));break}
  case"askloc":{const t=LT();if(t&&me)askLoc(t,v);break}
  case"safetoggle":{const t=T0();if(!t||!me)break;if(safeOn(t.id)){try{localStorage.removeItem(safeKey(t.id))}catch(e){}if(LOCWATCH==null&&db)deleteDoc(locDoc(t.id,me.uid)).catch(()=>{});toast("已關閉自動更新");modal(peopleHTML(t));updLocBar()}
   else if(confirm("開啟後，每次打開 App 都會更新你的最後已知位置給這趟行程的成員。要開啟嗎？")){try{localStorage.setItem(safeKey(t.id),String(Date.now()))}catch(e){}SAFE_T=Date.now();writeLast(t,"last").then(ok=>{toast(ok?"自動更新已開啟":"沒有定位權限，請在瀏覽器設定允許");modal(peopleHTML(t));updLocBar()})}break}
  case"checkin":{const t=T0();if(!t||!me)break;toast("取得位置中…");writeLast(t,"checkin",true).then(ok=>toast(ok?"已向成員報平安":"取得位置失敗，請確認定位權限"));break}
  case"reqshare":{const t=T0();if(!t||!me)break;startShare(t);try{localStorage.setItem(locKey(t.id),String(Date.now()-LOCMAX+3600e3))}catch(e){}deleteDoc(reqDoc(t.id,me.uid)).catch(()=>{});toast("已開始分享，1 小時後自動停止");break}
  case"reqskip":{const t=T0();if(t&&me)deleteDoc(reqDoc(t.id,me.uid)).catch(()=>{});break}
  case"pubok":if(PUBRES){const r=PUBRES;PUBRES=null;r(true)}break;
  case"ai":setTimeout(aiInit,0);break;
  case"aiauto":aiAuto();break;
  case"aiopen":{const l=AI_LINKS[+v];if(!l)break;const q=aiPrompt();copy(q,"已複製提示詞，貼上送出即可");window.open(l[1](q),"_blank","noopener");break}
  case"aipasteclip":{if(navigator.clipboard&&navigator.clipboard.readText){navigator.clipboard.readText().then(tx=>{if(!tx||!tx.trim())return toast("剪貼簿是空的，請先複製 AI 的回覆");const j=$("#ai-json");if(j)j.value=tx;showPlan(tx)}).catch(()=>{toast("無法讀取剪貼簿，請在「手動貼上」貼入");const d=document.querySelector("#ai-act details");if(d)d.open=true})}else{toast("請在「手動貼上」貼入回覆");const d=document.querySelector("#ai-act details");if(d)d.open=true}break}
  case"locshare":{const t=LT();if(!t)break;if(!me)return toast("請先登入");if(locOn(t.id)){stopShare(t,true);toast("已停止分享位置")}else if(confirm("開啟後，你的即時位置會顯示給這趟行程的所有成員。要開啟嗎？"))startShare(t);break}
 }});
// === 以下是步驟 1 的工具函式 ===

function getLocalDateStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseYMD(str) {
  if (!str || typeof str !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
  if (!m) return null;
  const y = parseInt(m[1], 10), mo = parseInt(m[2], 10) - 1, d = parseInt(m[3], 10);
  const t = Date.UTC(y, mo, d);
  const dt = new Date(t);
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo || dt.getUTCDate() !== d) return null;
  return Math.round(t / DAY_MS);
}

const DAY_MS = 86400000;

function getTripStatus(trip, todayStr) {
  const s = parseYMD(trip && trip.startDate);
  const e = parseYMD(trip && trip.endDate);
  const t = parseYMD(todayStr);
  if (s === null || e === null || t === null) return 'planning';
  if (e < s) return 'planning';
  if (t >= s && t <= e) return 'ongoing';
  if (t > e) return 'ended';
  return (s - t) <= 30 ? 'upcoming' : 'planning'; // parseYMD 已回傳天數，此時 s - t ≥ 1
}

function getDayDateStr(trip, day) {
  if (!day || typeof day.date !== 'string') return null;
  const iso = /^(\d{4}-\d{2}-\d{2})/.exec(day.date);
  if (iso) return iso[1];
  const m = /^\s*(\d{1,2})\/(\d{1,2})/.exec(day.date);
  if (!m) return null;
  const s = parseYMD(trip.startDate), e = parseYMD(trip.endDate);
  if (s === null || e === null) return null;
  const pad = n => String(n).padStart(2, '0');
  const y0 = new Date(s * DAY_MS).getUTCFullYear();
  const y1 = new Date(e * DAY_MS).getUTCFullYear();
  for (let y = y0; y <= y1; y++) {
    const str = `${y}-${pad(m[1])}-${pad(m[2])}`;
    const target = parseYMD(str);
    if (target !== null && target >= s && target <= e) return str;
  }
  return null;
}

function getTodayItems(trip, todayStr) {
  if (!trip || !Array.isArray(trip.days)) return [];
  if (getTripStatus(trip, todayStr) !== 'ongoing') return [];
  const dates = trip.days.map(d => getDayDateStr(trip, d));
  let day;
  if (dates.some(Boolean)) {
    day = trip.days[dates.indexOf(todayStr)];
  } else {
    day = trip.days[parseYMD(todayStr) - parseYMD(trip.startDate)];
  }
  return day && Array.isArray(day.items) ? day.items : [];
}

// === 以下是測試函式 (runTripLogicTests) ===

function runTripLogicTests() {
  let fail = 0;
  let cases = [];
  
  // 測試 getTripStatus
  const testStatus = (name, trip, today, expect) => {
    const got = getTripStatus(trip, today);
    if (got !== expect) { fail++; console.error(`✗ ${name}: 期望 ${expect}，得到 ${got}`); }
  };
  
  const sample = { startDate: '2026-11-01', endDate: '2026-11-05' };
  testStatus('進行中', sample, '2026-11-03', 'ongoing');
  testStatus('已結束', sample, '2026-11-10', 'ended');
  testStatus('30天內即將出發', sample, '2026-10-25', 'upcoming');

  let extra = 0;
  const eq = (name, got, want) => {
    extra++;
    if (JSON.stringify(got) !== JSON.stringify(want)) { fail++; console.error(`✗ ${name}: 期望 ${JSON.stringify(want)}，得到 ${JSON.stringify(got)}`); }
  };

  const real = { startDate: '2027-01-15', endDate: '2027-01-17', days: [
    { date: '1/15（五）', items: ['A'] }, { date: '1/16（六）', items: ['B'] }, { date: '1/17（日）', items: [] }] };
  const cross = { startDate: '2026-12-30', endDate: '2027-01-02', days: [
    { date: '12/30（三）', items: ['A'] }, { date: '12/31（四）', items: ['B'] },
    { date: '1/1（五）', items: ['C'] }, { date: '1/2（六）', items: ['D'] }] };
  const iso = { startDate: '2026-10-28', endDate: '2026-10-30', days: [
    { date: '2026-10-28', items: ['A'] }, { date: '2026-10-29', items: ['B'] }] };
  const noDate = { startDate: '2026-10-28', endDate: '2026-10-30', days: [
    { items: ['A'] }, { items: ['B'] }, { items: ['C'] }] };

  eq('M/D 第一天', getTodayItems(real, '2027-01-15'), ['A']);
  eq('M/D 中間天', getTodayItems(real, '2027-01-16'), ['B']);
  eq('當天沒排景點', getTodayItems(real, '2027-01-17'), []);
  eq('出發前回空', getTodayItems(real, '2027-01-10'), []);
  eq('跨年 12/31', getTodayItems(cross, '2026-12-31'), ['B']);
  eq('跨年 1/1', getTodayItems(cross, '2027-01-01'), ['C']);
  eq('ISO 日期', getTodayItems(iso, '2026-10-29'), ['B']);
  eq('ISO 當天沒排', getTodayItems(iso, '2026-10-30'), []);
  eq('無日期依序對應', getTodayItems(noDate, '2026-10-29'), ['B']);

    console.log(fail ? `❌ ${fail} 項失敗` : `✅ 全部通過（${cases.length + extra} 項）`);
}

// 供 Console 測試用（module 內的函式不會自動進全域）
window.getTripStatus = getTripStatus;
window.getTodayItems = getTodayItems;
window.runTripLogicTests = runTripLogicTests;
window.getLocalDateStr = getLocalDateStr;
window.getDayDateStr = getDayDateStr;
window.parseYMD = parseYMD;
function addExpense(t,{item,amount,date}){
  if(!t)return false;
  if(!me){toast("離線檢視模式無法編輯，請連線並登入後再試");return false}
  const id=(typeof crypto!=="undefined"&&typeof crypto.randomUUID==="function")?crypto.randomUUID():rnd(8);
  const rec={id,item,amount,paidBy:me.uid,splitWith:cfg(t).members,date};
  saveEx(t,[...(t.expenses||[]),rec]);
  render();
  return true
}
function addMemoEntry(t,{text,date}){
  if(!t){toast("請先建立行程");return false}
  if(!me){toast("離線檢視模式無法編輯，請連線並登入後再試");return false}
  if(!(t.members||[]).includes(me.uid)){toast("無法編輯此行程");return false}
  const id=(typeof crypto!=="undefined"&&typeof crypto.randomUUID==="function")?crypto.randomUUID():rnd(8);
  const entry={id,text:String(text||"").trim(),ts:Date.now(),date};
  const memo=t.memo?{...t.memo,entries:[...((t.memo.entries)||[]),entry]}:{entries:[entry]};
  patch(t,{memo:memo});
  render();
  return true
}

function _memoEntryIndex(t,id){if(!t.memo||!Array.isArray(t.memo.entries))return-2;return t.memo.entries.findIndex(e=>e.id===id);}

function editMemoEntry(t,id,text){
  if(!t){toast("請先建立行程");return false}
  if(!me){toast("離線檢視模式無法編輯，請連線並登入後再試");return false}
  if(!(t.members||[]).includes(me.uid)){toast("無法編輯此行程");return false}
  if(id==="legacy-note"){
    const nt=String(text||"").trim();
    if(nt==="")return false;
    if((t.memo&&t.memo.note)===nt)return true;
    patch(t,{memo:{...(t.memo||{}),note:nt}});
    render();
    return true
  }
  const idx=_memoEntryIndex(t,id);
  if(idx===-2){console.warn("[editMemoEntry] memo.entries 不存在",id);toast("找不到這筆備忘，可能已被刪除");return false}
  if(idx===-1){console.warn("[editMemoEntry] 找不到 id",id);toast("找不到這筆備忘，可能已被刪除");return false}
  const newText=String(text||"").trim();
  if(newText===""){console.warn("[editMemoEntry] 文字空白",id);return false}
  const entries=t.memo.entries;
  if(entries[idx].text===newText)return true;
  const newEntries=entries.map((e,i)=>i===idx?{...e,text:newText,editedAt:Date.now()}:e);
  patch(t,{memo:{...t.memo,entries:newEntries}});
  render();
  return true
}

function deleteMemoEntry(t,id){
  if(!t){toast("請先建立行程");return false}
  if(!me){toast("離線檢視模式無法編輯，請連線並登入後再試");return false}
  if(!(t.members||[]).includes(me.uid)){toast("無法編輯此行程");return false}
  if(id==="legacy-note"){
    const oldNote=t.memo&&typeof t.memo.note==="string"?t.memo.note:"";
    if(!oldNote.trim()){toast("找不到這筆備忘，可能已被刪除");return false}
    patch(t,{memo:{...t.memo,note:""}});
    setTimeout(()=>undoToast(()=>{const c=T0();if(!c)return;return patch(c,{memo:{...(c.memo||{}),note:oldNote}}).then(()=>render())}),0);
    render();
    return true
  }
  const idx=_memoEntryIndex(t,id);
  if(idx===-2){console.warn("[deleteMemoEntry] memo.entries 不存在",id);toast("找不到這筆備忘，可能已被刪除");return false}
  if(idx===-1){console.warn("[deleteMemoEntry] 找不到 id",id);toast("找不到這筆備忘，可能已被刪除");return false}
  const entries=t.memo.entries;
  const newEntries=entries.filter((e,i)=>i!==idx);
  patch(t,{memo:{...t.memo,entries:newEntries}});
  render();
  return true
}

// ===== 口袋名單 (pool)：trip.pool = [{id,name,q,area?,note?,must?,ts,date,by}] =====
// 待選的地點只存在這裡；排進某天時，才會在 days[].items 多一筆（帶 pid），這輪還沒做。
function poolOf(t){return t&&Array.isArray(t.pool)?t.pool:[]}
function poolAreas(t){const seen=new Set(),out=[];poolOf(t).slice().reverse().forEach(p=>{const a=p&&p.area;if(a&&!seen.has(a)){seen.add(a);out.push(a)}});return out.slice(0,6)}
function _poolKey(s){return String(s||"").replace(/\s+/g,"").toLowerCase()}
function _poolId(){return(typeof crypto!=="undefined"&&typeof crypto.randomUUID==="function")?crypto.randomUUID():rnd(8)}
function _poolGuard(t){
  if(!t){toast("請先建立行程");return false}
  if(!me){toast("離線檢視模式無法編輯，請連線並登入後再試");return false}
  if(!(t.members||[]).includes(me.uid)){toast("無法編輯此行程");return false}
  return true
}
function _gmapParse(s){
  s=String(s||"").trim();
  if(/^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(s))return{err:"短連結無法解析，請在瀏覽器開啟後複製網址列的完整連結"};
  if(!/^https?:\/\/((www|maps)\.)?google\.[a-z.]+\/maps/i.test(s))return{err:"目前只支援 Google 地圖的完整連結"};
  let name="";const pm=s.match(/\/maps\/place\/([^\/@?]+)/);
  if(pm){try{name=decodeURIComponent(pm[1].replace(/\+/g," ")).trim()}catch(e){name=pm[1].replace(/\+/g," ").trim()}}
  if(!name)return{err:"連結裡沒有地名，請從地點頁面複製連結"};
  const n="(-?\\d+(?:\\.\\d+)?)";
  const m=s.match(new RegExp("!3d"+n+"!4d"+n))||s.match(new RegExp("@"+n+","+n))||s.match(new RegExp("[?&](?:q|ll|query)="+n+"(?:,|%2C)"+n));
  if(!m)return{err:"連結裡找不到座標，請開啟地點後複製網址列的完整連結"};
  const lat=+m[1],lng=+m[2];
  if(!(Math.abs(lat)<=90&&Math.abs(lng)<=180))return{err:"連結裡的座標不正確"};
  return{name,lat,lng}
}
function addPoolPlace(t,o){
  if(!_poolGuard(t))return false;
  let nm=String((o&&o.name)||"").trim(),geoPt=null;
  if(/^https?:\/\//i.test(nm)){const g=_gmapParse(nm);if(g.err){toast(g.err);return false}nm=g.name;geoPt=[g.lat,g.lng]}
  nm=nm.slice(0,60);
  if(!nm){toast("請輸入地點名稱");return false}
  const list=poolOf(t);
  if(list.some(p=>_poolKey(p.name)===_poolKey(nm))){toast("已經在口袋名單了");return false}
  if(list.length>=200){toast("口袋名單已滿（200 筆）");return false}
  const item={id:_poolId(),name:nm,q:nm,ts:Date.now(),date:getLocalDateStr(),by:me.uid};
  if(geoPt){item.lat=geoPt[0];item.lng=geoPt[1]}
  const ar=String((o&&o.area)||"").trim().slice(0,20);if(ar)item.area=ar;
  const nt=String((o&&o.note)||"").trim().slice(0,200);if(nt)item.note=nt;
  const ad=String((o&&o.addr)||"").trim().slice(0,100);if(ad)item.addr=ad;
  if(o&&o.must)item.must=true;
  patch(t,{pool:[...list,item]});
  render();
  setTimeout(()=>poolGeoAll(t.id,true),300);
  return true
}
function editPoolPlace(t,id,o){
  if(!_poolGuard(t))return false;
  const nm=String((o&&o.name)||"").trim().slice(0,60);
  if(!nm){toast("請輸入地點名稱");return false}
  if(/^https?:\/\//i.test(nm)){toast("貼連結收藏之後開放，請先輸入名稱");return false}
  const list=poolOf(t),i=list.findIndex(p=>p&&p.id===id);
  if(i<0){toast("找不到這筆，可能已被刪除");return false}
  if(list.some((p,j)=>j!==i&&p&&_poolKey(p.name)===_poolKey(nm))){toast("已經在口袋名單了");return false}
  const old=list[i],ar=String((o&&o.area)||"").trim().slice(0,20),nt=String((o&&o.note)||"").trim().slice(0,200),ad=String((o&&o.addr)||"").trim().slice(0,100);
  const nx={...old,name:nm,q:nm};
  if(ar)nx.area=ar;else delete nx.area;
  if(nt)nx.note=nt;else delete nx.note;
  if(ad)nx.addr=ad;else delete nx.addr;
  if(o&&o.must)nx.must=true;else delete nx.must;
  const moved=nm!==old.name||ar!==(old.area||"")||ad!==(old.addr||"");
  if(moved){delete nx.lat;delete nx.lng}
  patch(t,{pool:list.map((p,j)=>j===i?nx:p)});
  render();
  if(moved)setTimeout(()=>poolGeoAll(t.id,true),300);
  return true
}
function deletePoolPlace(t,id){
  if(!_poolGuard(t))return false;
  const list=poolOf(t);
  if(!list.some(p=>p&&p.id===id)){toast("找不到這個地點，可能已被刪除");return false}
  patch(t,{pool:list.filter(p=>!(p&&p.id===id))});
  render();
  return true
}
function poolPlaced(t){const m={};getDays(t).forEach(d=>(d.items||[]).forEach(x=>{if(x&&x.pid&&!m[x.pid])m[x.pid]=d.k||""}));return m}
function poolHTML(t){
  const L=poolOf(t),can=!!me&&(t.members||[]).includes(me.uid);
  const addBtn='<button class="pill" data-a="poolnew">新增地點</button>';
  if(!L.length)return`<div class="pt-pool"><div class="glass blk"><p>還沒有口袋名單。</p>${can?`<div class="pills">${addBtn}</div>`:""}</div></div>`;
  const placed=poolPlaced(t),groups=[],idx=new Map();
  L.forEach(p=>{if(!p)return;const k=p.area||"";if(!idx.has(k)){idx.set(k,groups.length);groups.push({k,items:[]})}groups[idx.get(k)].items.push(p)});
  groups.sort((a,b)=>(a.k===""?1:0)-(b.k===""?1:0));
  const star='<svg class="ix pt-star" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="#4F7A5A" stroke="#4F7A5A" stroke-width="1.75" stroke-linejoin="round"><path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.9 6.7 19.6l1-5.8L3.5 9.7l5.9-.9L12 3.5z"/></svg>';
  const xs='<svg class="ix" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  const row=p=>{const q=encodeURIComponent((p.q||p.name||"")+(t.country?" "+t.country:""));
    return`<div class="pt-row" data-pid="${esc(p.id)}"><div class="pt-main"><div class="pt-name">${p.must?star:""}<span>${esc(p.name)}</span></div>${p.note?`<p class="pt-note">${esc(p.note)}</p>`:""}${placed[p.id]?`<span class="pt-tag">已排 ${esc(placed[p.id])}</span>`:""}</div><div class="pt-act"><button class="cb" data-a="poolplan" data-v="${esc(p.id)}">排入</button>${p.lat==null?`<a class="cb" href="https://maps.google.com/?q=${q}" target="_blank" rel="noopener">地圖</a>`:""}</div><div class="pt-ed"><button class="x ed" data-a="pooledit" data-v="${esc(p.id)}" aria-label="編輯"><i class=i-edit></i></button><button class="x ed" data-a="pooldel" data-v="${esc(p.id)}" aria-label="刪除">${xs}</button></div></div>`};
  const head=g=>(g.k||groups.length>1)?`<div class="me-day">${esc(g.k||"未分區")}</div>`:"";
  return`<div class="pt-pool">${can?`<div class="pills pt-top">${addBtn}</div>`:""}${poolMapHTML(t)}${groups.map(g=>head(g)+'<div class="glass pt-card">'+g.items.slice().sort((a,b)=>(b.must?1:0)-(a.must?1:0)).map(row).join("")+'</div>').join("")}</div>`
}
// ===== /口袋名單 =====
function poolPlanForm(t,id){
  if(!_poolGuard(t))return;
  const p=poolOf(t).find(x=>x&&x.id===id);if(!p){toast("找不到這筆，可能已被刪除");return}
  const D=getDays(t);
  if(!D.length){toast("還沒有每日行程，請先到行程頁新增一天");return}
  const di=Math.min(dayI[t.id]??0,D.length-1);
  modal(`<h3>排入行程</h3><div class="fm" data-pid="${esc(p.id)}"><p><b>${esc(p.name)}</b></p><label>哪一天<select id="fp-day">${D.map((d,i)=>`<option value="${i}" ${i===di?"selected":""}>${esc((d.k||"D"+(i+1))+(d.date?"・"+d.date:"")+(d.city?"・"+d.city:""))}</option>`).join("")}</select></label><label>時間（選填）<input id="fp-t" placeholder="例如 09:30"></label><div class="pills"><button class="pill" data-a="poolplanok">排入</button></div></div>`)
}
function poolPlanSave(t){
  if(!_poolGuard(t))return;
  const f=document.querySelector(".fm"),pid=f&&f.dataset.pid,p=poolOf(t).find(x=>x&&x.id===pid);
  if(!p){toast("找不到這筆，可能已被刪除");return}
  const D=getDays(t),di=+$("#fp-day").value,day=D[di];
  if(!day){toast("找不到這一天");return}
  const tm=$("#fp-t").value.trim();
  if(tm&&!isT(tm)){toast("時間請寫成 09:30 的格式，或留空");return}
  const x={t:tm,h:p.name,d:p.note||"",q:p.q||p.name,more:"",pid:p.id};
  if(p.lat!=null){x.lat=p.lat;x.lng=p.lng}
  if(!Array.isArray(day.items))day.items=[];
  let k=day.items.length;
  if(isT(x.t)){const n=day.items.findIndex(y=>isT(y.t)&&y.t.padStart(5,"0")>x.t.padStart(5,"0"));if(n>=0)k=n}
  day.items.splice(k,0,x);
  setDays(t,D);
  $("#modal").classList.remove("on");
  render();
  toast("已排入 "+(day.k||"D"+(di+1)))
}
// ===== 口袋名單地圖 =====
const PoolMap={m:null,ll:[],sel:null,tok:0,ks:{},
render(t){try{if(this.m)this.m.remove()}catch(e){}this.m=null;const el=document.getElementById("poolmap");if(!el||typeof L==="undefined")return;
 const pts=poolOf(t).filter(p=>p&&p.lat!=null),placed=poolPlaced(t);
 this.m=L.map("poolmap",{scrollWheelZoom:false}).setView([30,120],2);
 L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OpenStreetMap",maxZoom:18}).addTo(this.m);
 this.sel=null;this.ks={};this.m.on("popupclose",()=>{this.sel=null;this.hl(null)});
 const ll=[];
 pts.forEach(p=>{const on=!!placed[p.id];ll.push([p.lat,p.lng]);
  const d=document.createElement("div");d.style.cssText="font-size:13px;line-height:1.5;color:var(--text)";const h=document.createElement("b");h.style.fontSize="16px";h.textContent=p.name;d.appendChild(h);const meta=[p.must?"必去":"",on?"已排 "+placed[p.id]:"",p.area||""].filter(Boolean).join("・");if(meta){const m=document.createElement("div");m.style.color="var(--text-2)";m.textContent=meta;d.appendChild(m)}if(p.note){const n=document.createElement("div");n.style.cssText="margin-top:4px;white-space:pre-wrap";n.textContent=p.note;d.appendChild(n)}const nv=document.createElement("a");nv.className="pill gl mini";nv.target="_blank";nv.rel="noopener";nv.textContent="導航";nv.style.cssText="display:inline-flex;align-items:center;justify-content:center;margin-top:8px;color:var(--text);text-decoration:none";nv.href="https://www.google.com/maps/dir/?api=1&destination="+p.lat+","+p.lng+"&travelmode=walking";d.appendChild(nv);const pb=document.createElement("button");pb.type="button";pb.className="pill gl mini";pb.textContent="排入";pb.style.cssText="display:inline-flex;align-items:center;justify-content:center;margin:8px 0 0 8px;color:var(--text)";pb.addEventListener("click",()=>{const c=TV();if(c)poolPlanForm(c,p.id)});d.appendChild(pb);
  const mk=L.circleMarker([p.lat,p.lng],{radius:p.must?9:7,color:on?"#FFFFFF":"#FF7A00",weight:on?2:2.5,fillColor:"#FF7A00",fillOpacity:on?.9:0}).addTo(this.m);
  this.ks[p.id]=mk;mk.on("click",e=>{L.DomEvent.stopPropagation(e);if(this.sel===p.id){this.reset();return}
   const tok=++this.tok,open=()=>{if(tok!==this.tok)return;L.popup({offset:[0,-4],maxWidth:240,autoPan:true,autoPanPadding:[20,20],closeOnClick:false}).setLatLng([p.lat,p.lng]).setContent(d).openOn(this.m);this.sel=p.id;this.hl(p.id)};
   if(this.m.getZoom()===14&&this.m.getCenter().distanceTo([p.lat,p.lng])<5)open();else{this.m.once("moveend",open);this.m.flyTo([p.lat,p.lng],14,{duration:.8})}})});
 this.ll=ll;this.refresh()},
hl(id){document.querySelectorAll("#t-pool .pt-row").forEach(r=>r.classList.toggle("sel",!!id&&r.dataset.pid===id))},
pick(id){const k=this.ks[id];if(!k)return;try{document.getElementById("poolmap").scrollIntoView({block:"nearest"})}catch(e){}k.fire("click")},
reset(){if(!this.m)return;this.tok++;this.m.closePopup();this.sel=null;this.hl(null);if(this.ll.length)this.m.flyToBounds(this.ll,{padding:[30,30],maxZoom:14,duration:.8})},
refresh(){setTimeout(()=>{try{if(!this.m)return;this.m.invalidateSize();if(this.ll.length)this.m.fitBounds(this.ll,{padding:[30,30],maxZoom:14})}catch(e){}},80)}};
let poolMapOpen=true;
function poolMapHTML(t){const ms=poolOf(t).filter(p=>p&&p.lat==null),miss=ms.length;
 const tg=`<div class="pills" style="margin:0 0 8px"><button class="pill gl mini" data-a="poolmaptoggle">${poolMapOpen?"收合地圖":"顯示地圖"}</button></div>`,note=(poolMapOpen?"空心圓表示尚未排入行程，實心圓表示已排入行程。":"")+(miss?`有 ${miss} 個地點沒標到地圖：${esc(ms.slice(0,8).map(p=>p.name).join("、"))}。<button class="pill mini" data-a="poolgeo">重新查詢</button>`:"");
 return tg+(poolMapOpen?`<div class="glass mapbox"><div id="poolmap" class="nowmap" role="application" aria-label="口袋名單地圖"></div></div>`:"")+(note?`<p class="meta" style="margin:8px 4px 0">${note}</p>`:"")}
function dailyMissingHTML(t){const m=[];getDays(t).forEach(d=>(d.items||[]).forEach(x=>{if(x&&x.q&&x.lat==null)m.push(x.h||x.q)}));
 if(!m.length)return"";
 return`<p class="meta" style="margin:8px 4px 0">有 ${m.length} 個景點沒標到地圖：${esc(m.slice(0,8).join("、"))}${m.length>8?"…":""}。「地點」改成「店名 城市」較容易找到。<button class="pill mini" data-a="georetry">重新查詢</button></p>`}
let poolGeoBusy=false,poolGeoAgain=false;
async function poolGeoAll(tid,quiet){if(poolGeoBusy){poolGeoAgain=true;return}poolGeoBusy=true;
 try{do{poolGeoAgain=false;let t=TRIPS.find(x=>x.id===tid);if(!t||!_poolGuard(t))break;
  const todo=poolOf(t).filter(p=>p&&p.lat==null).slice(0,30),got={};let n=0;
  for(const p of todo){let g=null;for(const q of[p.addr?p.addr+(t.country?" "+t.country:""):"",(p.q||p.name)+(t.geoCity?" "+t.geoCity:(p.area?" "+p.area:""))+(t.country?" "+t.country:"")]){if(!q)continue;g=await geo(q);if(g)break}n++;if(g)got[p.id]=g;if(!quiet)toast(`查詢座標 ${n}/${todo.length}`);await new Promise(r=>setTimeout(r,1100))}
  t=TRIPS.find(x=>x.id===tid);if(!t)break;let c=0;
  const next=poolOf(t).map(p=>{const g=p&&got[p.id];if(g&&p.lat==null){c++;return{...p,lat:g[0],lng:g[1]}}return p});
  if(c){patch(t,{pool:next});render()}
  if(!quiet)toast(c?`已標出 ${c} 個地點`:"沒有找到座標")
 }while(poolGeoAgain)}finally{poolGeoBusy=false}}
document.addEventListener("click",e=>{const b=e.target.closest('[data-a="poolgeo"],[data-a="georetry"]');if(!b)return;const t=TV();if(!t)return;
 if(b.dataset.a==="poolgeo")poolGeoAll(t.id,false);else{toast("重新查詢中…");geocodeAI(t.id)}});
document.addEventListener("click",e=>{if(!e.target.closest('[data-a="poolmaptoggle"]'))return;poolMapOpen=!poolMapOpen;render()});
document.addEventListener("click",e=>{const r=e.target.closest("#t-pool .pt-row");if(!r||e.target.closest("button,a"))return;try{PoolMap.pick(r.dataset.pid)}catch(err){}});
document.addEventListener("click",e=>{if(!e.target.closest('[data-a="dmaptoggle"]'))return;dailyMapOpen=!dailyMapOpen;const b=document.getElementById("dmapbtn"),w=document.getElementById("ptdaily");if(b)b.textContent=dailyMapOpen?"收合地圖":"顯示地圖";if(w)w.classList.toggle("dmap-on",dailyMapOpen);if(dailyMapOpen)setTimeout(()=>{const t=TV();if(t){try{refreshDays(t)}catch(e){}try{drawMembers()}catch(e){}}},80)});
// ===== /口袋名單地圖 =====
window.QA_API = { toast, esc, getLocalDateStr, getTodayItems, T0: TV, addExpense, addMemoEntry, editMemoEntry, deleteMemoEntry, addPoolPlace, editPoolPlace, deletePoolPlace, poolAreas, canEdit:(t)=>!!me&&!!t&&(t.members||[]).includes(me.uid) };


/* ===== 造訪城市數：每趟取每日行程的 city 欄位；沒填任何城市才退回「地點」欄；跨旅程去重（同國家同名只算一次） ===== */
function cityCount(list){const set=new Set();
 list.forEach(t=>{const cc=t.countryCode||t.country||"",cs=getDays(t).map(d=>(d.city||"").trim()).filter(Boolean),
  src=cs.length?cs:[(t.title||"").trim()].filter(c=>c&&c!==t.country);
  src.forEach(c=>set.add(cc+"|"+c.toLowerCase()))});
 return set.size}

/* ===== 全球足跡：點圖釘 → 底部抽屜（封面、國家、日期、旅客、查看旅程、設為當前行程） ===== */
function closeMapSheet(){const el=document.getElementById("msheet");if(!el||!el.classList.contains("on"))return;el.classList.remove("on");el.setAttribute("aria-hidden","true");try{MapView.unpick()}catch(e){}}
function openMapSheet(t,s){const el=document.getElementById("msheet");if(!el)return;
 const img=t.image||photoOf(t.id)||"",m=pcMeta(t),
  sub=[flagOf(t),t.country?esc(t.country):""].filter(Boolean).join(" ")+(s.day?"・D"+s.day:""),
  line=[s.name&&s.name!==t.title?esc(t.title):"",esc(m.dateTxt),nd(t)+" 天"].filter(Boolean).join("・");
 el.innerHTML=`<button class="ms-x" type="button" data-a="msclose" aria-label="關閉"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
 ${img?`<div class="ms-ph"><img src="${esc(img)}" alt="${esc(t.title)}" onerror="this.parentNode.remove()"></div>`:""}
 <div class="ms-id"><small>${sub}</small><h3>${esc(s.name||t.title)}</h3><p>${line}</p><p>旅客：${esc(m.mateTxt)}</p></div>
 <div class="ms-act"><button class="pill" type="button" data-a="msgo" data-v="${esc(t.id)}">查看旅程</button>${t.status==="now"?"":`<button class="pill gl" type="button" data-a="setcur" data-v="${esc(t.id)}">設為當前行程</button>`}</div>`;
 el.classList.add("on");el.setAttribute("aria-hidden","false");
 requestAnimationFrame(()=>{try{const mp=MapView.map,c=mp.getContainer().getBoundingClientRect(),p=mp.latLngToContainerPoint([s.lat,s.lng]),y=c.top+p.y,lim=innerHeight-el.offsetHeight-48;if(y>lim)mp.panBy([0,y-lim])}catch(e){}})}
MapView.onPick=openMapSheet;MapView.onBlank=closeMapSheet;
document.addEventListener("click",e=>{const b=e.target.closest("[data-a]");if(!b)return;const a=b.dataset.a,v=b.dataset.v;
 if(a==="msclose")closeMapSheet();
 if(a==="msgo"){const t=visible().find(x=>x.id===v);if(!t)return;const pg=t.status==="past"?"past":t.status==="future"?"future":"now";closeMapSheet();go(pg);
  if(pg==="past")requestAnimationFrame(()=>{const el=[...document.querySelectorAll("#l-past .pc-item")].find(x=>x.dataset.pid===v);if(el)el.scrollIntoView({inline:"center",block:"nearest",behavior:"smooth"})})}});
(()=>{let ty=null;
 document.addEventListener("touchstart",e=>{ty=e.target.closest&&e.target.closest("#msheet")?e.touches[0].clientY:null},{passive:true});
 document.addEventListener("touchend",e=>{if(ty==null)return;const dy=e.changedTouches[0].clientY-ty;ty=null;if(dy>60)closeMapSheet()},{passive:true})})();

/* patch-currency-sync：編輯旅程改「國家」時，自動帶入對應幣別（查不到就不動，仍可手動選） */
document.addEventListener("input",e=>{const el=e.target;if(!el||el.id!=="f-country")return;const c=CUR[el.value.trim()],s=document.getElementById("f-cur");if(c&&s&&[...s.options].some(o=>o.value===c))s.value=c});
