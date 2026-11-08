# 歷歷 TripTick 專案摘要卡 v6

更新日期：2026/11/07
狀態：預寫版。備忘錄頁重整三個 commit 驗收通過後才套用；若有項目未通過，請在「進度」改回實況。

## 一句話
旅伴再問「下一站去哪」，打開歷歷就知道。
旅行前中後的串連：規劃 → 現場 → 回憶歸檔。

## 品牌立場
只放使用者自己決定的東西：無廣告、無攻略、無他人貼文、無景點資料庫。
核心：單手操作、離線優先、清晰可信、減法美學。

## 技術架構（已查證）
- 原生 JavaScript PWA，無 TypeScript、無打包工具
- index.html 以 `<script type="module" src="app.js">` 載入，app.js 有頂層 await
  → 函式不會自動進 window；Console 測試要手動掛 window（app.js 底部已掛 6 個，驗收後可刪）
- 檔案：index.html、app.js、auth.js、story-share.js、map.js、leaflet.js、style.css、sw.js、trips.json
- Firebase（Auth＋Firestore）、Google 登入、Leaflet 地圖、LocalStorage 離線快照
- window.print() 輸出 PDF，匯率預設 0.21
- Service Worker 會快取舊檔：改完 app.js 要升 sw.js 快取版本號，或清 SW 後關分頁重開
- 頁面切換：index.html 的 `<main>` 內多個 `<section class="panel" id="t-xxx">`，
  `go(id)`（app.js 約 793 行）切換 `.on`；事件用 `data-t`（切頁）、`data-a`（動作）代理
- 資料：trips[].days[].items[]；day.date 為 "1/15（五）"（無年份），item 欄位 t/h/d/type/q/more，無座標與排序欄位
- 現有 trip.status:"now" 為手動欄位，與決策 1 衝突（尚未移除）；T0() 仍靠它找當前行程

## 本機開發
- 用 Go Live 開 `http://localhost:5500`（不要用 127.0.0.1）
- Google Cloud Console → Credentials → Browser key → Website restrictions 已需加入
  `http://localhost:5500/*`、`http://127.0.0.1:5500/*`
- 分支：feature/nav（備份 tag：v-before-nav）；github.io 只會是 main，看不到本機改動
- 協作方式：我出規格，Cline 套用並回報 git diff；UI 每步附截圖；每步 commit

## 已定案：產品決策
1. 行程狀態由日期自動計算，不手動切換「當前」
2. 首頁分三區：進行中／即將出發／規劃中，點卡片直接編輯
3. 景點三狀態：待選／排在某天／排在某天某時
4. 今天沒排時，現場模式顯示附近待選點＋「今天去這個」
5. 貼 Google 地圖連結收藏景點
6. 圖卡免登入，存檔或下載才登入
7. 傳播三條線：圖卡（後）、旅伴邀請（前中，旅伴免登入可看）、模板複製（前）
8. 明確不做：景點資料庫、社群攻略、背景定位、比價訂房

## 已定案：導覽
行程內底部 5 格：今天｜行程｜記帳（中間圓鈕）｜票券｜更多
- 今天：依狀態切換（旅途中有排：下一站大卡＋導航／旅途中沒排：附近待選＋「今天去這個」／即將出發與規劃中：倒數＋待辦，無日期顯示「設定出發日期」／已結束：回憶摘要＋提示歸檔）
- 行程：每日＋地圖
- 中間鈕：開底部彈層，不跳頁、不佔目前頁面狀態；無字、錢幣 SVG
- 票券：票券／飲食卡／緊急資訊（頂部固定橫幅，全螢幕大字、離線可用）
- 更多：備忘錄、打包清單、帳本（匯率置頂）、旅伴、匯出
- 「今天」只從底部導覽進入，不放進漢堡選單
- 詞彙：「記一筆」一律改「記帳」（彈層標題另用中性詞，因含備註與地點）

漢堡選單（四類，尚未實作）
我的旅程（依日期分進行中／即將出發／規劃中）／回憶（歷史旅程，頂部全球足跡）／建立（新增行程〔手動／AI〕、探索與範例）／帳號

## 已定案：設計規則 v2（詳見 DESIGN.md）
- 背景：柔和暖色漸層（米色到淡杏色），禁止模糊色塊與動畫
- 卡片：半透明奶油白玻璃＋輕模糊＋1px 白邊，大卡圓角 28
- 按鈕：白底圓膠囊＋淺邊，圖示可帶橘；不做橘底實心按鈕
- 橘 #FF7A00 只用於路線、打勾、狀態點、圖示；文字 #3A2E26／#7A6A5C
- 字體 3 種：24 襯線／16／13；間距 8／16／24；點擊區 ≥44
- 圖示：一套 SVG 線條，粗細 1.75、大小 22，不用 emoji
- 底部導覽：玻璃浮條，目前頁深棕粗字＋橘色小圓點

## 進度（2026/11/07）
- 步驟 1 完成：日期邏輯
- 步驟 2 完成：底部 5 格導覽、今天頁四種狀態、更多頁
- 步驟 3 進行中：記帳彈層（quick-add.js）
  - 花費：已接真實資料（addExpense）
  - 備註：新增、編輯、刪除完成（編輯模式內鉛筆＋×，彈層帶入原文）
  - 地點：仍為示範
- 備忘錄頁重整完成（sw.js hk-v42）
  - 頂部分段切換「備忘｜緊急」，預設「備忘」，切換狀態存在模組變數 stormTab（重新整理會回「備忘」）
  - 備忘頁：備忘錄依日期分組（.me-day）、空狀態「還沒有備忘。」＋「記一筆」、個人備忘沒內容時只在編輯模式出現、頁尾小字提醒勿記敏感資料
  - 緊急頁：撥打 119（白底、#C2402A）、備案提醒、緊急步驟（只在使用者自己存過時顯示；編輯模式才出現新增）
  - 預設緊急步驟（租車事故）已移除，GST.crisis 改為 []
  - 步驟編號圓點：白底深棕邊框，第 1 個紅色；步驟改清單列
  - 黑底按鈕改白底圓膠囊：.pill、.pill.mini.on、.menu、.who

## 資料接口（QA_API，app.js 底部）
{ toast, esc, getLocalDateStr, getTodayItems, T0, addExpense, addMemoEntry, editMemoEntry, deleteMemoEntry, canEdit }
- 寫入規則：先檢查登入與成員 → 建新物件（不可原地修改 t.memo.entries）→ patch（不 await）→ render() → 回傳 true/false
- quick-add 送出一律現抓 T0()（onSnapshot 每次會換掉 t）
- openQuickAdd(opts)：無參數＝新增；{mode:"edit-note",id,text}＝編輯備註；{type:"note"}＝強制備註分頁；後兩者都不寫入「上次類型」

## 資料結構（已查證）
- 花費：trip.expenses[]（item/amount/paidBy/splitWith；新筆多 id、date）。舊資料無 id，刪除靠 index
- 幣別：只有 trip.currency；RATES 預設 JPY 0.21
- 備忘：trip.memo = {risks[], steps[], note, entries[]}；entries 每筆 {id,text,ts,date}，編輯過多 editedAt
- 預設步驟已移除：steps 只來自使用者資料（t.memo.steps 或舊的 t.storm.crisis）。若使用者早先編輯備案時預設步驟被存進資料，仍會顯示，需手動刪除
- 景點：trip.days[].items[]、trip.spots[]；沒有「待選」概念
- Firestore：trips/{tripId}；patch() 即時 updateDoc；離線靠 persistentLocalCache
- 權限：!me 時編輯被擋；成員判斷 t.members.includes(me.uid)

## patch() 行為（改寫入前先看）
- 寫入頂層欄位，陣列整個替換
- 內建 undo：wt() 比較舊新「重量」，新值較小就彈「已刪除／復原」（6.5 秒）；wt 算陣列長度，不算字串
- 寫入前不可原地修改舊資料，否則 undo 失效
- 不可用 "memo.entries" 這種路徑寫入

## UI 慣例（新增畫面前必看）
- 編輯：全站統一「編輯模式」，開啟後才出現鉛筆與 ×（class ed、mb、x）。body:not(.editing) .ed 為 display:none
- 想「平常隱藏、編輯模式才出現」：外面包一層 <div class="ed">，不靠重畫
- 分段切換：<div class="seg"><button class="on">…</button></div>，選擇器是 .seg button.on，class 不可寫成 "seg button"
- 不另做 popover 或 ⋯ 選單
- 「結束並儲存」不讀 #memo-note；#memo-note 只在 change 事件存入。切換備忘／緊急前會先比對並觸發 change，避免未儲存內容丟失

## 已知限制
- 彈層記帳固定「自己付、全員平分」
- 彈層幣別固定為 trip 幣別；混幣別排在彈層三類型接完之後
- patch 寫整個 memo 物件：多人同時編輯會後寫蓋先寫
- addExpense 沒有 members 檢查
- 未登入提示文案目前是「無法編輯此行程」，之後改「請先登入」
- 撥打 119 固定寫死（台灣、日本通用），之後改成每趟行程可設緊急電話
- 分段切換狀態重新整理不保留

## 下一步
1. 合併個人備忘與備忘錄（要動資料讀取，單獨一輪）
   - 只留備忘錄一個入口；舊個人備忘有內容時顯示為一筆「舊備忘」，可編輯可刪除；沒內容不顯示
   - 動工前先確認真實行程中個人備忘是否有內容
2. 其餘黑底元素逐項改版（清單以階段 3 回報為準）：.glass.dark、.it.stay、.toast、#undo、#updbar、#offbar、.drawer 內按鈕、.story-stage 等，需先決定哪些屬於「大塊深色」要改、哪些（如 toast）保留
3. 地點：先定「待選池」（trip 層級欄位、item id、三狀態），再接彈層
4. 彈層小修：幣別下拉樣式、遮罩偏淡；下滑關閉待手機實測
5. 整併 addex 與 addExpense 的重複邏輯（三類型接完後）

## 待辦
- T0() 改用日期自動計算，移除手動 status:"now"
- 首頁三區、漢堡選單四類改版
- 登入頁與轉場動畫拆除，套用設計規則 v2（welcome.css、auth.js 的 transitionIn）
- 舊畫面逐頁套用 v2（.me-list 字級與間距、.rw 備案列等）
- 標題襯線字體指定並進 SW 快取
- app.js 底部測試用 window 掛載清理（QA_API 要留）
- 登出後清掉 has-bnav 殘留（目前無害）
- 登出後 ro 出現時機不明，之後遇到再查
- 圓弧卡住：偶發，未重現（出現時先跑 document.getElementById("welcome").className）
- stormHTML 的 Mr 暫留，待確認 memoOf 補齊後是否可移除
- 測試時若 Console 出現 Firestore Write／Listen 的 access control checks，先排除網路與網址問題再判斷程式

## 協作流程（固定做法）
- 我出規格，Cline 套用並貼 diff；規格寫「目標與限制」
- 出規格前先請 Cline 唯讀查證，並先確認同類 UI 的現有做法，新功能照既有慣例做
- 動工前先 git status；不使用 git add -A；SUMMARY.md 單獨 commit
- 每個 commit 訊息先貼給我確認；每階段結束停下，不自行進下一階段
- Cline 無瀏覽器，驗收只能標「未實測」，由我在瀏覽器實測並回報
- 回報要求：git log --oneline、git show --stat、diff 分段貼
- 「程式理論上對、畫面不對」時，先用 Console 跑 getComputedStyle 或實際狀態再下結論
- 寫 HTML 結構前要對照 CSS 選擇器（例如 .seg button.on）
- 要退回某個 commit：請 Cline 用 git revert，不要用 git reset --hard
- 改完 app.js／style.css 要升 sw.js 版本號（目前 hk-v42）
- 本機用 localhost:5500，不用 127.0.0.1
