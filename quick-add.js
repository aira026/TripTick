/* quick-add.js — 記帳／備註／地點快速彈層（步驟 3）
 * 匯出 openQuickAdd() 並掛 window.openQuickAdd；宿主函式從 window.QA_API 取得（app.js 無匯出）。
 * 僅 UI 與記憶體暫存，寫入資料庫留下一步。
 */
const QA_API = window.QA_API || {};
const getLocalDateStr = QA_API.getLocalDateStr;
const getTodayItems = QA_API.getTodayItems;
const T0 = QA_API.T0;
const toast = QA_API.toast;
const esc = QA_API.esc;
const LAST_KEY = "tt-qa-last";
const TYPES = ["expense", "note", "place"];
let qaEl = null;
let eventsBound = false;
let currentType = "expense";
let stopValue = "";
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
    const t = T0 ? T0() : null;
    return t && t.currency ? t.currency : "JPY";
  } catch (e) {
    return "JPY";
  }
}
function todayItems() {
  if (!getTodayItems || !T0 || !getLocalDateStr) return [];
  const t = T0();
  if (!t) return [];
  return getTodayItems(t, getLocalDateStr()) || [];
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
  const wrap = document.getElementById("qa-stop");
  wrap.innerHTML = "";
  const items = todayItems();
  if (!items.length) return;
  const pick = nearestStop(items);
  stopValue = esc(pick && pick.h ? pick.h : "");
  const btn = document.createElement("button");
  btn.type = "button";
  btn.innerHTML = `在哪一站：${stopValue} <span class="qa-caret">▾</span>`;
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleStopList(items, btn);
  });
  wrap.appendChild(btn);
}
function toggleStopList(items, btn) {
  const old = document.getElementById("qa-stop-list");
  if (old) old.remove();
  const list = document.createElement("div");
  list.id = "qa-stop-list";
  list.className = "qa-stop-list";
  for (const it of items) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = esc(it && it.h ? it.h : "") + (it.t ? ` （${esc(it.t)}）` : "");
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      stopValue = esc(it && it.h ? it.h : "");
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
function buildForm() {
  const form = document.getElementById("qa-form");
  form.innerHTML = "";
  document.getElementById("qa-date").textContent = getLocalDateStr
    ? getLocalDateStr()
    : "";
  renderStop();
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
      const sel = document.createElement("select");
      for (const c of ["JPY", "TWD", "USD", "EUR"]) {
        const o = document.createElement("option");
        o.value = c;
        o.textContent = c;
        if (c === defaultCurrency()) o.selected = true;
        sel.appendChild(o);
      }
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
    content.focus();
    form._qa = { content };
  } else {
    const content = field("地點名稱或 Google 地圖連結", (() => {
      const i = document.createElement("input");
      i.type = "url";
      i.placeholder = "例如 鯉魚潭 或 https://maps.google.com/?q=…";
      return i;
    })());
    content.focus();
    form._qa = { content };
  }
}
function readForm() {
  const d = document.getElementById("qa-form")._qa;
  if (!d) return null;
  const base = {
    type: currentType,
    date: getLocalDateStr ? getLocalDateStr() : "",
    stop: stopValue || "",
  };
  if (currentType === "expense") {
    if (!d.amount.value.trim()) return null;
    const amount = parseFloat(String(d.amount.value).replace(/,/g, ""));
    if (!Number.isFinite(amount)) return null;
    return { ...base, amount, currency: d.currency.value, memo: d.memo.value.trim() };
  }
  if (!d.content.value.trim()) return null;
  return { ...base, content: d.content.value.trim() };
}

export function openQuickAdd() {
  installStyle();
  createEl();
  currentType = readLastType();
  document.querySelectorAll(".qa-tab").forEach((b) =>
    b.classList.toggle("on", b.dataset.qt === currentType)
  );
  bindEvents();
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
      gap: 8px;
      height: 48px;
      min-width: 96px;
      padding: 0 24px;
      border: 1px solid #EADFCF;
      border-radius: 999px;
      background: #fff;
      color: #3A2E26;
      font: inherit;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
    }
    .qa-save:active {
      opacity: 0.85;
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
  const close = () => {
    document.body.classList.remove("qa-open");
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
    drafts.push({ id: rnd(8), ts: Date.now(), ...data });
    toast("已儲存（示範）");
    close();
  });
}

