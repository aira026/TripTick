# 歷歷 TripTick 專案摘要卡 v9

更新日期：2026/11/10
狀態：口袋名單（trip.pool）完成並實測通過（commit c34fd72，分支 feature/nav，尚未 push）。下一步見「下一步」。

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
- 檔案：index.html、app.js、auth.js、story-share.js、map.js、leaflet.js、quick-add.js、style.css、sw.js、trips.json
- Firebase（Auth＋Firestore）、Google 登入、Leaflet 地圖、LocalStorage 離線快照
- window.print() 輸出 PDF，匯率預設 0.21
- Service Worker 會快取舊檔：改完 app.js／quick-add.js／style.css 要升 sw.js 版本號（以 sw.js 實際為準，約 hk-v48；`grep -o "hk-v[0-9]*" sw.js` 可查），或清 SW 後關分頁重開
- 頁面切換：index.html 的 `<main>` 內多個 `<section class="panel" id="t-xxx">`，
  `go(id)` 切換 `.on`；事件用 `data-t`（切頁）、`data-a`（動作）代理，handler 內 `a=b.dataset.a`、`v=b.dataset.v`
- 資料：trips[].days[].items[]；day.date 為 "1/15（五）"（無年份），item 欄位 t/h/d/type/q/more，另有 lat/lng（定位成功才有）
- 現有 trip.status:"now" 為手動欄位，與決策 1 衝突（尚未移除）；T0() 仍靠它找當前行程
- 定位（geocoding）：app.js 的 geo(q) 打 OpenStreetMap Nominatim（免金鑰、約 1 次/秒）。map.js 只負責畫點，不查座標

## 本機開發
- 用 Go Live 開 `http://localhost:5500`（不要用 127.0.0.1）
- Google Cloud Console → Credentials → Browser key → Website restrictions 已需加入
  `http://localhost:5500/*`、`http://127.0.0.1:5500/*`
- 分支：feature/nav（備份 tag：v-before-nav）；github.io 只會是 main，看不到本機改動
- 本機 commit 尚未 push（領先 origin/feature/nav；以 git status／git log 為準）

## 已定案：產品決策
1. 行程狀態由日期自動計算，不手動切換「當前」
2. 首頁分三區：進行中／即將出發／規劃中，點卡片直接編輯
3. 景點三狀態：待選／排在某天／排在某天某時（待選＝口袋名單，已完成；「排進某天」未做）
4. 今天沒排時，現場模式顯示附近待選點＋「今天去這個」（未做）
5. 貼 Google 地圖連結收藏景點（未做）
6. 圖卡免登入，存檔或下載才登入
7. 傳播三條線：圖卡（後）、旅伴邀請（前中，旅伴免登入可看）、模板複製（前）
8. 明確不做：景點資料庫、社群攻略、背景定位、比價訂房

## 已定案：導覽
行程內底部 5 格：今天｜行程｜記帳（中間圓鈕）｜票券｜更多
- 今天：依狀態切換（旅途中有排：下一站大卡＋導航／旅途中沒排：附近待選＋「今天去這個」／即將出發與規劃中：倒數＋待辦，無日期顯示「設定出發日期」／已結束：回憶摘要＋提示歸檔）
- 行程：頂部分段「每日｜口袋名單」（見下），每日含實際地圖
- 中間鈕：開底部彈層（花費／備註／地點），不跳頁；無字、錢幣 SVG
- 票券：票券／飲食卡／緊急資訊（頂部固定橫幅，全螢幕大字、離線可用）
- 更多：備忘錄、打包清單、帳本（匯率置頂）、旅伴、匯出
- 「今天」只從底部導覽進入，不放進漢堡選單
- 詞彙：「記一筆」一律改「記帳」（彈層標題另用中性詞）

漢堡選單（四類，尚未實作）
我的旅程（依日期分進行中／即將出發／規劃中）／回憶（歷史旅程，頂部全球足跡）／建立（新增行程〔手動／AI〕、探索與範例）／帳號

## 已定案：設計規則 v2（詳見 DESIGN.md）
- 背景：柔和暖色漸層，禁止模糊色塊與動畫
- 卡片：半透明奶油白玻璃＋輕模糊＋1px 白邊，大卡圓角 28
- 按鈕：白底圓膠囊＋淺邊，圖示可帶橘；不做橘底實心按鈕
- 橘 #FF7A00 只用於路線、打勾、狀態點、圖示；文字 #3A2E26／#7A6A5C；警示 #C2402A
- 字體 3 種：24 襯線／16／13；間距 8／16／24；點擊區 ≥44
- 圖示：一套 SVG 線條，粗細 1.75、大小 22，不用 emoji
- 底部導覽：玻璃浮條，目前頁深棕粗字＋橘色小圓點

## 進度
### 前面輪次（已完成）
- 步驟 1：日期邏輯。步驟 2：底部 5 格導覽、今天頁四種狀態、更多頁
- 步驟 3：記帳彈層（quick-add.js）三類型皆已接真實資料：花費（addExpense）、備註（新增／編輯／刪除）、地點（口袋名單，見下）
- 備忘錄頁：分段「備忘｜緊急」（stormTab）、依日期分組、空狀態、舊備忘（memo.note）以虛擬條目 id "legacy-note" 併入顯示
- 黑底按鈕改白底圓膠囊（.pill 等，CSS 在 style.css 最後面 patch 區塊）
- 資料不遷移：memo.note 留原欄位；編輯 legacy-note 改寫 memo.note，刪除時手動呼叫 undoToast（patch 的 wt 不算字串）

### 口袋名單（2026/11/10 完成，commit c34fd72）
- 名稱「口袋名單」，欄位 trip.pool[]
- 位置：行程頁 nowCard 上方分段「每日｜口袋名單」，狀態存模組變數 nowTab（重新整理回「每日」）；以 CSS（`#t-now[data-nt]`）隱藏，不移除 DOM；applyNowTab() 切換後呼叫 MiniMap.refresh() 或 PoolMap.refresh()
- 條目：{id,name,q,area?,note?,addr?,must?,lat?,lng?,ts,date,by}；沒填的欄位不寫入；改名／區域／地址時刪掉 lat、lng 並重查
- 彈層「地點」：名稱（必填）→ 區域（選填，列最近用過 6 個）→ 必去星星（SVG，橘色實心）→ 備註 → 地址（選填，定位更準）。連續新增：存完不關，清空名稱／備註／地址／星星，保留區域
- 編輯：編輯模式下每列鉛筆＋×；鉛筆開同一彈層（openQuickAdd({mode:"edit-place",id,name,area,note,addr,must})）並隱藏上方三分頁（每次開啟都重設）；儲存呼叫 editPoolPlace（同名檢查、不跳復原）
- 刪除：patch 內建復原（陣列變短自動跳）
- 擋下：空名稱、http 連結（提示「貼連結收藏之後開放」）、同名（忽略空白大小寫）、滿 200 筆、非成員、未登入
- 清單依區域分組，必去排前面（星星）；已排進行程的顯示「已排 D3」標籤（排進行程功能尚未做，目前恆為未排）；沒座標的列顯示「未標到地圖」
- 地圖：PoolMap（app.js，QA_API 前）；空心點＝未排、實心點＝已排、必去點較大；點一下放大到該點並顯示名稱，再點回全覽；下方列出沒標到的名稱（最多 8 個）與「重新查詢」鈕（data-a="poolgeo"）
- 每日地圖：下方列出沒標到的景點（有 q 無 lat，最多 8 個）與「重新查詢」鈕（data-a="georetry" → geocodeAI(tid)）
- 兩個重新查詢鈕由 app.js 內獨立的 document click 監聽處理，不在主 switch
- 自動定位：新增或改動後 poolGeoAll(tid,quiet) 背景查詢（一次最多 30 筆、每筆間隔 1.1 秒、busy／again 旗標避免並行）；查詢順序：地址（含行程 country）→ 名稱＋區域＋country
- geo(q) 備援（最多 5 次）：原文 → 去括號 → 只用括號內別名 → 以上各轉「台→臺」。失敗點會多等數秒（每次約 1.1 秒）
- 公開範本（tplPayload 白名單）不會帶出 pool
- Firestore 規則實測允許 pool 欄位與 lat／lng

## 資料接口（QA_API，app.js 底部）
{ toast, esc, getLocalDateStr, getTodayItems, T0, addExpense, addMemoEntry, editMemoEntry, deleteMemoEntry, addPoolPlace, editPoolPlace, deletePoolPlace, poolAreas, canEdit }
- 寫入規則：先檢查登入與成員（_poolGuard）→ 建新物件（不可原地修改舊資料）→ patch（不 await）→ render() → 回傳 true/false
- quick-add 送出一律現抓 T0()（onSnapshot 每次會換掉 t）
- openQuickAdd(opts)：無參數＝新增；{mode:"edit-note",id,text}＝編輯備註；{mode:"edit-place",...}＝編輯口袋名單；{type:"note"|"place"}＝強制該分頁。編輯模式不寫入「上次類型」（localStorage tt-qa-last）
- editMemoEntry／deleteMemoEntry 傳入 id "legacy-note" 時，操作的是 memo.note

## 資料結構（已查證）
- 花費：trip.expenses[]（item/amount/paidBy/splitWith；新筆多 id、date）。舊資料無 id，刪除靠 index
- 幣別：只有 trip.currency；RATES 預設 JPY 0.21
- 備忘：trip.memo = {risks[], steps[], note, entries[]}；entries 每筆 {id,text,ts,date}
- 口袋名單：trip.pool[]（見上）
- 景點：trip.days[].items[]、trip.spots[]
- Firestore：trips/{tripId}；patch() 即時 updateDoc；離線靠 persistentLocalCache
- 權限：!me 時編輯被擋；成員判斷 t.members.includes(me.uid)

## patch() 行為（改寫入前先看）
- 寫入頂層欄位，陣列整個替換
- 內建 undo：wt() 比較舊新「重量」，新值較小就彈「已刪除／復原」（6.5 秒）；wt 算陣列長度，不算字串
- 寫入前不可原地修改舊資料，否則 undo 失效
- 不可用 "memo.entries" 這種路徑寫入
- 改陣列內容但長度不變（如寫入 lat／lng、編輯條目）不會誤跳復原

## UI 慣例（新增畫面前必看）
- 編輯：全站統一「編輯模式」，開啟後才出現鉛筆與 ×（class ed、mb、x）。body:not(.editing) .ed 為 display:none；鉛筆圖示 `<i class=i-edit></i>`
- 想「平常隱藏、編輯模式才出現」：外面包一層 <div class="ed">，不靠重畫
- 分段切換：<div class="seg"><button class="on">…</button></div>，選擇器是 .seg button.on
- 不另做 popover 或 ⋯ 選單
- 備忘一律走底部彈層寫入；備忘 handler 慣例：eb(k,i)（memoedit／memodel）、meb(id)（meedit／medel）
- 口袋名單 handler：poolnew／pooledit／pooldel／nowtab（主 switch），poolgeo／georetry（獨立監聽）
- setEdit(on)、bar0(arch) 是編輯模式與頂部按鈕列的核心，改周邊時不可動
- 小地圖容器在隱藏分頁時尺寸為 0：切分頁後要 invalidateSize（refresh）

## 已知限制
- 彈層記帳固定「自己付、全員平分」；幣別固定為 trip 幣別
- patch 寫整個 memo／pool：多人同時編輯會後寫蓋先寫
- addExpense 沒有 members 檢查
- 未登入提示文案目前是「無法編輯此行程」，之後改「請先登入」
- 撥打 119 固定寫死
- 分段切換狀態重新整理不保留
- 定位準確度（OpenStreetMap）：地址含縣市最準；只填名稱＋含糊區域（如「東區」）可能配到別的城市，且配錯無法偵測；台灣地名 OSM 多用「臺」。區域欄目前同時當定位線索，是已知取捨（改法見下一步）
- 定位失敗的點會多等數秒；Nominatim 限速約 1 次/秒
- 彈層「在哪一站」清單 CSS 為 display:none，疑似看不到清單（地點分頁已隱藏，花費／備註分頁可能受影響，待手機實測）
- 舊備忘沒有日期，固定排在「未標日期」最下面
- hokkaido.html 是靜態展示頁，與 app 無關

## 下一步（建議順序）
1. 貼 Google 地圖連結收藏（決策 5）：先驗證——完整連結常含座標（@緯度,經度 或 !3d!4d），但短連結（maps.app.goo.gl）瀏覽器端通常無法解析（跨來源限制）。第一版建議只收完整連結，短連結提示改貼完整連結；成功直接存 lat／lng，免查詢
2. 區域不再當定位線索，或增加行程層級「定位城市」（例如這趟填「台中」，所有查詢帶它），區域只負責分組
3. 「今天」頁：沒排行程時依區域顯示口袋名單＋「今天去這個」
4. 排進某天／某時（items 新增一筆並帶 pid；要處理 patch 的復原誤觸，建議兩個欄位同一次寫入並手動處理 undo）；口袋名單條目不移走，畫面顯示「已排 D3」
5. 其餘黑底元素逐項改版（.glass.dark、.it.stay、.toast、#undo、#updbar、#offbar、.drawer 內 button.on／.login／.sub.on、.story-stage、.days button.on／.plus、.bar button.on、.chip）；白底 .pill 在淺色背景看不清處檢查（.pc-act、.codebox、.story-foot）
6. 口袋名單頁焦點偏多（新增鈕＋地圖＋清單）：考慮地圖可收合；每列「開啟地圖」連結可移除（點地圖上的點即可）
7. 整併 addex 與 addExpense 的重複邏輯；app.js 底部測試用 window 掛載清理

## 待辦
- T0() 改用日期自動計算，移除手動 status:"now"
- 首頁三區、漢堡選單四類改版
- 登入頁與轉場動畫拆除，套用設計規則 v2（welcome.css、auth.js 的 transitionIn）
- 舊畫面逐頁套用 v2；標題襯線字體指定並進 SW 快取
- 登出後清掉 has-bnav 殘留（目前無害）
- 圓弧卡住：偶發，未重現（出現時先跑 document.getElementById("welcome").className）
- 測試時若 Console 出現 Firestore 的 access control checks，先排除網路與網址問題再判斷程式

## 協作方式（2026/11/08 起）
原因：Cline 轉貼或回報的程式碼會被改字，也曾整段重寫連帶刪掉相鄰函式，所以不再信任它的回報與轉貼。

分工
- 使用者把真正的檔案直接上傳給 Claude（不經過 Cline）
- Claude 寫小腳本（.cjs）：只在目標文字「剛好出現一次」才替換；找不到或重複就停下、不改檔；改完自動跑語法檢查，沒過自動還原；順便升 sw.js 版號
- 使用者在終端機執行腳本與驗證；腳本只放專案資料夾，用完刪除、不 commit
- Cline 只負責 git add 與 git commit，不碰程式碼
- 驗收一律由使用者在瀏覽器實測

固定指令（在專案資料夾執行）
- 語法檢查，最後要看到 `exit code: 0`：
  `"/Library/Application Support/Adobe/Creative Cloud Libraries/CCLibrary.app/Contents/libs/node" --check --input-type=module < app.js; echo "exit code: $?"`
- 執行腳本：同一個 node 路徑，後面接腳本檔名（每支腳本檔名不同，指令要完整寫出）
- 動工前：`git status --short`

通則
- 使用者是新手，且用免費版：回覆要精簡省 token；一次只給一個明確步驟
- 不使用 git add -A；只 add 指定檔案（不加 .DS_Store、HANDOFF、patch 檔）；SUMMARY.md 單獨 commit
- commit 要寫成可直接複製的指令區塊（不要只寫訊息文字，zsh 會把它當指令報錯）；每個 commit 先確認再執行；commit 後用 `git log --oneline -3 --stat` 驗證，一律以使用者終端機為準
- 一輪功能 commit 前不要再疊新腳本，避免多輪改動混在一起
- 規格寫「目標與限制」，限制要含「哪些函式不准動」
- 出規格前先看原檔（上傳），並先確認同類 UI 的現有做法，新功能照既有慣例
- 「程式理論上對、畫面不對」時，先用 Console 跑 getComputedStyle 或實際狀態再下結論
- 寫 HTML 結構前要對照 CSS 選擇器
- 要退回：用 git revert 或 git stash，不用 git reset --hard
- 本機用 localhost:5500；改完 app.js／quick-add.js／style.css 要升 sw.js 版本號
- Claude 交腳本前，先用上傳檔案的副本在沙盒試跑，確認全部命中、語法檢查通過
- 腳本已套用過再跑會顯示「找到 0 處」並停下，屬正常，不會改檔
- 是否買 Claude API 接 Cline：評估後暫不買（流程已有腳本保險）；若試用，先小額儲值並設月上限
