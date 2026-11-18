/* quick-add.js — 記帳／備註／地點快速彈層（步驟 3）
 * 匯出 openQuickAdd() 並掛 window.openQuickAdd；宿主函式從 window.QA_API 取得（app.js 無匯出）。
 * 僅 UI 與記憶體暫存，寫入資料庫留下一步。
 */
const api = () => window.QA_API || {};
const LAST_KEY = "tt-qa-last";
const TYPES = ["expense", "note", "place"];
let qaEl = null;
let eventsBound = false;
let currentType = "expense";
let stopValue = "";
let editMode = null;
const drafts = [];

function readLastType() {
  try {
    const v = localStorage.getItem(LAST_KEY);
    return TYPES.includes(v) ? v : "expense";
  } catch (e) {
    return "expense";
  }
}
function writeLastType(v) {
  try {
    localStorage.setItem(LAST_KEY, v);
  } catch (e) {}
}
const rnd=(n=8)=>Math.random().toString(36).slice(2,2+n);
function defaultCurrency() {
  try {
    const a = api();
    const t = a.T0 ? a.T0() : null;
    return t && t.currency ? t.currency : "JPY";
  } catch (e) {
    return "JPY";
  }
}
function todayItems() {
  const a = api();
  if (!a.getTodayItems || !a.T0 || !a.getLocalDateStr) return [];
  const t = a.T0();
  if (!t) return [];
  return a.getTodayItems(t, a.getLocalDateStr()) || [];
}
function parseTime(s) {
  const m = String(s == null ? "" : s).match(/(\d{1,2}):(\d{2})/);
  return m ? +m[1] * 60 + +m[2] : null;
}
function nearestStop(items) {
  const now = new Date();
  const nowM = now.getHours() * 60 + now.getMinutes();
  let best = null;
  let bestDist = Infinity;
  for (const it of items) {
    const pt = parseTime(it && it.t);
    if (pt == null) continue;
    const dist = Math.abs(pt - nowM);
    if (dist < bestDist) {
      bestDist = dist;
      best = it;
    }
  }
  return best || items[0] || null;
}
function renderStop() {
  const e = api().esc;
  const wrap = document.getElementById("qa-stop");
  wrap.innerHTML = "";
  const items = todayItems();
  if (!items.length) return;
  const pick = nearestStop(items);
  stopValue = e(pick && pick.h ? pick.h : "");
  const btn = document.createElement("button");
  btn.type = "button";
  btn.innerHTML = `在哪一站：${stopValue} <span class="qa-caret">▾</span>`;
  btn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    toggleStopList(items, btn);
  });
  wrap.appendChild(btn);
}
function toggleStopList(items, btn) {
  const e = api().esc;
  const old = document.getElementById("qa-stop-list");
  if (old) old.remove();
  const list = document.createElement("div");
  list.id = "qa-stop-list";
  list.className = "qa-stop-list";
  for (const it of items) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = e(it && it.h ? it.h : "") + (it.t ? ` （${e(it.t)}）` : "");
    b.addEventListener("click", (ev) => {
      ev.stopPropagation();
      stopValue = e(it && it.h ? it.h : "");
      btn.innerHTML = `在哪一站：${stopValue} <span class="qa-caret">▾</span>`;
      list.remove();
    });
    list.appendChild(b);
  }
  btn.parentNode.insertAdjacentElement("afterend", list);
}

function field(label, input) {
  const wrap = document.createElement("div");
  wrap.className = "qa-field";
  if (label) {
    const l = document.createElement("label");
    l.textContent = label;
    wrap.appendChild(l);
  }
  wrap.appendChild(input);
  document.getElementById("qa-form").appendChild(wrap);
  return input;
}
function qaHint(el,msg){
  const wrap=el.parentNode;
  let old=wrap.querySelector(".qa-hint");
  if(old)old.remove();
  if(msg){
    const h=document.createElement("span");
    h.className="qa-hint";
    h.textContent=msg;
    wrap.appendChild(h);
  }
}
const STAR_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.9 6.7 19.6l1-5.8L3.5 9.7l5.9-.9L12 3.5z"/></svg>';
function renderAreaChips() {
  const form = document.getElementById("qa-form");
  const d = form && form._qa;
  if (!d || !d.chips) return;
  const a = api();
  const t = a.T0 ? a.T0() : null;
  const list = t && a.poolAreas ? a.poolAreas(t) : [];
  const cur = d.area.value.trim();
  d.chips.innerHTML = "";
  list.forEach((name) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "qa-chip" + (name === cur ? " on" : "");
    b.textContent = name;
    b.addEventListener("click", () => {
      d.area.value = name;
      renderAreaChips();
    });
    d.chips.appendChild(b);
  });
}
function buildForm() {
  const form = document.getElementById("qa-form");
  form.innerHTML = "";
  const a = api();
  document.getElementById("qa-date").textContent = a.getLocalDateStr
    ? a.getLocalDateStr()
    : "";
  renderStop();
  if (currentType === "place") {
    document.getElementById("qa-stop").innerHTML = "";
    stopValue = "";
  }
  if (currentType === "expense") {
    const amount = field("金額", (() => {
      const i = document.createElement("input");
      i.type = "text";
      i.inputMode = "decimal";
      i.placeholder = "例如 350";
      i.autocomplete = "off";
      return i;
    })());
    amount.focus();
    const currency = field("幣別", (() => {
      const a = api();
      const t = a.T0 ? a.T0() : null;
      const cur = t ? (t.currency || "JPY") : defaultCurrency();
      const sel = document.createElement("select");
      sel.className = "qa-select";
      const o = document.createElement("option");
      o.value = cur;
      o.textContent = cur;
      o.selected = true;
      o.disabled = true;
      sel.appendChild(o);
      return sel;
    })());
    const memo = field("備註（選填）", (() => {
      const i = document.createElement("input");
      i.type = "text";
      i.placeholder = "例如 午餐";
      return i;
    })());
    form._qa = { amount, currency, memo };
  } else if (currentType === "note") {
    const content = field("內容", (() => {
      const t = document.createElement("textarea");
      t.placeholder = "寫下備忘…";
      return t;
    })());
    if (editMode) content.value = editMode.text;
    content.focus();
    form._qa = { content };
  } else {
    const content = field("地點名稱", (() => {
      const i = document.createElement("input");
      i.type = "text";
      i.placeholder = "例如 鯉魚潭，或貼 Google 地圖連結";
      i.autocomplete = "off";
      i.maxLength = 2000;
      return i;
    })());
    const area = field("區域（選填）", (() => {
      const i = document.createElement("input");
      i.type = "text";
      i.placeholder = "例如 古城";
      i.autocomplete = "off";
      i.maxLength = 20;
      i.addEventListener("input", renderAreaChips);
      return i;
    })());
    const chips = document.createElement("div");
    chips.className = "qa-chips";
    area.parentNode.appendChild(chips);
    const must = field("必去（選填）", (() => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "qa-star";
      b.setAttribute("aria-label", "必去");
      b.setAttribute("aria-pressed", "false");
      b.innerHTML = STAR_SVG;
      b.addEventListener("click", () => {
        b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true"));
      });
      return b;
    })());
    const note = field("備註（選填）", (() => {
      const i = document.createElement("input");
      i.type = "text";
      i.autocomplete = "off";
      i.maxLength = 200;
      return i;
    })());
    const addr = field("地址（選填，定位更準）", (() => {
      const i = document.createElement("input");
      i.type = "text";
      i.placeholder = "例如 台中市西區民權路99號";
      i.autocomplete = "off";
      i.maxLength = 100;
      return i;
    })());
    form._qa = { content, area, chips, must, note, addr };
    if (editMode && editMode.kind === "place") {
      content.value = editMode.name;
      area.value = editMode.area;
      note.value = editMode.note;
      addr.value = editMode.addr;
      must.setAttribute("aria-pressed", String(editMode.must));
    }
    renderAreaChips();
    content.focus();
  }
}
function readForm() {
  const d = document.getElementById("qa-form")._qa;
  if (!d) return null;
  const a = api();
  const base = {
    type: currentType,
    date: a.getLocalDateStr ? a.getLocalDateStr() : "",
    stop: stopValue || "",
  };
  if (currentType === "expense") {
    const amount = parseFloat(String(d.amount.value).replace(/,/g, ""));
    return { ...base, amount, currency: d.currency.value, memo: d.memo.value.trim() };
  }
  if (currentType === "place") {
    return {
      ...base,
      content: d.content.value.trim(),
      area: d.area.value.trim(),
      note: d.note.value.trim(),
      addr: d.addr ? d.addr.value.trim() : "",
      must: d.must.getAttribute("aria-pressed") === "true",
    };
  }
  return { ...base, content: d.content.value.trim() };
}

export function openQuickAdd(opts) {
  installStyle();
  createEl();
  if (opts && opts.mode === "edit-place") {
    editMode = { kind: "place", id: opts.id, name: opts.name || "", area: opts.area || "", note: opts.note || "", addr: opts.addr || "", must: !!opts.must };
    currentType = "place";
  } else if (opts && opts.mode === "edit-note") {
    editMode = { id: opts.id, text: opts.text || "" };
    currentType = "note";
  } else if (opts && (opts.type === "note" || opts.type === "place")) {
    editMode = null;
    currentType = opts.type;
  } else {
    editMode = null;
    currentType = readLastType();
  }
  document.querySelectorAll(".qa-tab").forEach((b) =>
    b.classList.toggle("on", b.dataset.qt === currentType)
  );
  bindEvents();
  { const tb = document.querySelector(".qa-tabs"); if (tb) tb.style.display = editMode ? "none" : ""; }
  buildForm();
  document.body.classList.add("qa-open");
}
window.openQuickAdd = openQuickAdd;

function installStyle() {
  const id = "qa-style";
  if (document.getElementById(id)) return;
  const s = document.createElement("style");
  s.id = id;
  s.textContent = `
    #qa {
      position: fixed;
      inset: 0;
      z-index: 3500;
      display: none;
    }
    body.qa-open #qa {
      display: block;
    }
    .qa-scrim {
      position: fixed;
      inset: 0;
      background: rgba(58, 46, 38, 0.25);
      opacity: 0;
      transition: opacity 200ms ease;
    }
    body.qa-open .qa-scrim {
      opacity: 1;
    }
    .qa-sheet {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      max-width: 720px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.86);
      border: 1px solid rgba(255, 255, 255, 0.6);
      -webkit-backdrop-filter: blur(16px) saturate(140%);
      backdrop-filter: blur(16px) saturate(140%);
      box-shadow: 0 10px 26px rgba(17, 17, 17, 0.08);
      border-top-left-radius: 28px;
      border-top-right-radius: 28px;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
      transform: translateY(100%);
      transition: transform 200ms ease;
      padding: 14px 16px calc(16px + env(safe-area-inset-bottom));
      max-height: 88vh;
      overflow: auto;
      display: flex;
      flex-direction: column;
    }
    body.qa-open .qa-sheet {
      transform: translateY(0);
    }
    .qa-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 10px;
    }
    .qa-tabs {
      display: flex;
      gap: 6px;
      padding: 4px;
      background: rgba(255, 255, 255, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.4);
      border-radius: 999px;
    }
    .qa-tab {
      flex: 1;
      min-height: 44px;
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: #7A6A5C;
      font: inherit;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      padding: 0 12px;
    }
    .qa-tab.on {
      background: #fff;
      color: #3A2E26;
      font-weight: 700;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
    }
    .qa-close {
      width: 44px;
      height: 44px;
      min-width: 44px;
      min-height: 44px;
      border: 0;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.45);
      color: #3A2E26;
      display: grid;
      place-items: center;
      cursor: pointer;
    }
    .qa-close svg {
      width: 20px;
      height: 20px;
      stroke: currentColor;
    }
    .qa-date {
      font-size: 13px;
      color: #7A6A5C;
      padding: 6px 0 2px 0;
    }
    .qa-stop {
      font-size: 13px;
      padding: 8px 0 4px 0;
    }
    .qa-stop button {
      background: transparent;
      border: 0;
      color: #3A2E26;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      text-align: left;
      padding: 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .qa-stop button:active {
      opacity: 0.7;
    }
    .qa-caret {
      font-size: 10px;
      color: #7A6A5C;
      margin-left: auto;
    }
    .qa-stop-list {
      display: none;
      margin-top: 6px;
      padding: 8px;
      border: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.7);
    }
    .qa-stop-list button {
      width: 100%;
      text-align: left;
      border: 0;
      background: transparent;
      padding: 6px 4px;
      font-size: 13px;
      color: #3A2E26;
      cursor: pointer;
      border-radius: 10px;
    }
    .qa-stop-list button:active {
      background: rgba(58, 46, 38, 0.08);
    }
    .qa-form {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding-bottom: 10px;
    }
    .qa-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .qa-field label {
      font-size: 13px;
      color: #7A6A5C;
      font-weight: 600;
    }
    .qa-field input,
    .qa-field textarea {
      width: 100%;
      min-height: 44px;
      border: 1px solid rgba(58, 46, 38, 0.18);
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.55);
      color: #3A2E26;
      font: inherit;
      font-size: 15px;
      padding: 8px 12px;
      box-sizing: border-box;
    }
    .qa-field input::placeholder {
      color: #A89A88;
    }
    .qa-field textarea {
      min-height: 96px;
      resize: vertical;
    }
    .qa-foot {
      display: flex;
      justify-content: flex-end;
      padding-top: 6px;
    }
    .qa-save {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 48px;
      min-width: 96px;
      padding: 0 24px;
      border: 1px solid #EADFCF;
      border-radius: 999px;
      background: #fff;
      color: #3A2E26;
      font: inherit;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
    }
    .qa-save:active {
      opacity: 0.85;
    }
    .qa-select {
      appearance: none;
      height: 48px;
      padding: 0 36px 0 16px;
      border-radius: 16px;
      border: 1px solid #EADFCF;
      background: #fff;
      color: #3A2E26;
      font-size: 16px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%233A2E26' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      background-size: 16px;
      cursor: pointer;
    }
    .qa-hint {
      font-size: 13px;
      color: #C2402A;
    }
    .qa-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .qa-chip {
      min-height: 44px;
      padding: 0 16px;
      border: 1px solid #EADFCF;
      border-radius: 999px;
      background: #fff;
      color: #7A6A5C;
      font: inherit;
      font-size: 13px;
      cursor: pointer;
    }
    .qa-chip.on {
      color: #3A2E26;
      font-weight: 700;
    }
    .qa-star {
      align-self: flex-start;
      width: 44px;
      height: 44px;
      padding: 0;
      border: 1px solid #EADFCF;
      border-radius: 999px;
      background: #fff;
      display: grid;
      place-items: center;
      cursor: pointer;
    }
    .qa-star svg {
      width: 22px;
      height: 22px;
      fill: none;
      stroke: #FF7A00;
      stroke-width: 1.75;
      stroke-linejoin: round;
    }
    .qa-star[aria-pressed="true"] svg {
      fill: #FF7A00;
    }
    @media (prefers-reduced-motion: reduce) {
      .qa-scrim,
      .qa-sheet {
        transition: none !important;
      }
    }
  `;
  document.head.appendChild(s);
}

function createEl() {
  if (qaEl) return qaEl;
  const div = document.createElement("div");
  div.id = "qa";
  div.innerHTML = `
    <div class="qa-scrim" id="qa-scrim"></div>
    <div class="qa-sheet" id="qa-sheet">
      <div class="qa-bar">
        <div class="qa-tabs">
          <button class="qa-tab on" type="button" data-qt="expense">花費</button>
          <button class="qa-tab" type="button" data-qt="note">備註</button>
          <button class="qa-tab" type="button" data-qt="place">地點</button>
        </div>
        <button class="qa-close" id="qa-close" type="button" aria-label="關閉">
          <svg viewBox="0 0 24 24" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
        </button>
      </div>
      <div class="qa-date" id="qa-date"></div>
      <div class="qa-stop" id="qa-stop"></div>
      <div class="qa-form" id="qa-form"></div>
      <div class="qa-foot">
        <button class="qa-save" id="qa-save" type="button">儲存</button>
      </div>
    </div>
  `;
  document.body.appendChild(div);
  qaEl = div;
  return div;
}
function bindEvents() {
  if (eventsBound) return;
  eventsBound = true;
  const sheet = document.getElementById("qa-sheet");
  const scrim = document.getElementById("qa-scrim");
  const closeBtn = document.getElementById("qa-close");
  const saveBtn = document.getElementById("qa-save");
  const tabs = document.querySelector(".qa-tabs");
  if (editMode) tabs.style.display = "none";
  const close = () => {
    document.body.classList.remove("qa-open");
    editMode = null;
  };
  const on = (el, ev, fn, opt) => { if (el) el.addEventListener(ev, fn, opt); };
  on(closeBtn, "click", close);
  on(scrim, "click", close);
  let startY = 0;
  on(sheet, "touchstart", (e) => {
    startY = e.touches[0].clientY;
  }, { passive: true });
  on(sheet, "touchmove", (e) => {
    if (e.touches[0].clientY - startY > 80) close();
  }, { passive: true });
  on(tabs, "click", (e) => {
    const b = e.target.closest(".qa-tab");
    if (!b) return;
    const t = b.dataset.qt;
    if (!TYPES.includes(t)) return;
    document.querySelectorAll(".qa-tab").forEach((x) => x.classList.toggle("on", x === b));
    currentType = t;
    writeLastType(t);
    buildForm();
  });
  on(saveBtn, "click", () => {
    const data = readForm();
    if (!data) return;
    const a = api();
    const form = document.getElementById("qa-form");
    const amtEl = form._qa && form._qa.amount;
    if (currentType === "expense") {
      const raw = String(amtEl ? amtEl.value : "").replace(/,/g, "").trim();
      const amount = parseFloat(raw);
      if (!raw || !Number.isFinite(amount) || amount <= 0) {
        qaHint(amtEl, "金額必須大於 0");
        if (amtEl) amtEl.focus();
        return;
      }
      qaHint(amtEl, "");
      const t = a.T0 ? a.T0() : null;
      if (!t) { a.toast("請先建立行程"); return; }
      if (!a.canEdit || !a.canEdit(t)) { a.toast("無法編輯此行程"); return; }
      if (!a.addExpense) { a.toast("儲存功能不可用"); return; }
      if (!a.addExpense(t, { item: data.memo || "花費", amount, date: data.date })) return;
      close();
      form.querySelectorAll("input, textarea, select").forEach((el) => {
        el.value = "";
        if (el.tagName === "SELECT") el.selectedIndex = 0;
      });
      stopValue = "";
      a.toast("已記帳");
      return;
    }
    if (currentType === "note") {
      const t = a.T0 ? a.T0() : null;
      if (!t) { a.toast("請先建立行程"); return; }
      if (!a.canEdit || !a.canEdit(t)) { a.toast("無法編輯此行程"); return; }
      if (!a.addMemoEntry) { a.toast("儲存功能不可用"); return; }
      if (!data.content || !data.content.trim()) {
        const contentEl = form._qa && form._qa.content;
        qaHint(contentEl, "內容不可空白");
        if (contentEl) contentEl.focus();
        return;
      }
      const contentEl = form._qa && form._qa.content;
      qaHint(contentEl, "");
      if (editMode) {
        if (!a.editMemoEntry(t, editMode.id, data.content.trim())) return;
        close();
        form.querySelectorAll("input, textarea, select").forEach((el) => {
          el.value = "";
          if (el.tagName === "SELECT") el.selectedIndex = 0;
        });
        stopValue = "";
        editMode = null;
        a.toast("已更新");
        return;
      }
      if (!a.addMemoEntry(t, { text: data.content.trim(), date: data.date })) return;
      close();
      form.querySelectorAll("input, textarea, select").forEach((el) => {
        el.value = "";
        if (el.tagName === "SELECT") el.selectedIndex = 0;
      });
      stopValue = "";
      a.toast("已記下");
      return;
    }
    // 地點：連續新增。存完不關閉，只清空名稱／備註／必去，保留區域。
    const t = a.T0 ? a.T0() : null;
    const nameEl = form._qa && form._qa.content;
    if (!t) { a.toast("請先建立行程"); return; }
    if (!a.canEdit || !a.canEdit(t)) { a.toast("無法編輯此行程"); return; }
    if (!a.addPoolPlace) { a.toast("儲存功能不可用"); return; }
    if (!data.content) {
      qaHint(nameEl, "請輸入地點名稱");
      if (nameEl) nameEl.focus();
      return;
    }
    if (editMode && editMode.kind === "place" && /^https?:\/\//i.test(data.content)) {
      qaHint(nameEl, "編輯時請輸入名稱；要用連結請新增一筆");
      if (nameEl) nameEl.focus();
      return;
    }
    qaHint(nameEl, "");
    if (editMode && editMode.kind === "place") {
      if (!a.editPoolPlace) { a.toast("儲存功能不可用"); return; }
      if (!a.editPoolPlace(t, editMode.id, { name: data.content, area: data.area, addr: data.addr, must: data.must, note: data.note })) return;
      close();
      a.toast("已更新");
      return;
    }
    if (!a.addPoolPlace(t, { name: data.content, area: data.area, addr: data.addr, must: data.must, note: data.note })) return;
    const d = form._qa;
    d.content.value = "";
    d.note.value = "";
    if (d.addr) d.addr.value = "";
    d.must.setAttribute("aria-pressed", "false");
    renderAreaChips();
    d.content.focus();
    a.toast("已加入口袋名單");
  });
}

