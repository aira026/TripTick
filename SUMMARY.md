# 歷歷 TripTick 專案摘要卡 v13

更新日期：2026/11/17
狀態：口袋名單完整、每日頁／行程頁減法改版、「今天」頁完成並實測通過；歡迎頁（未登入）改為影片底＋登入轉場改淡出淡入，已 commit（分支 feature/nav，本機領先 origin，尚未 push）。未來清單 `#t-future` 改為可展開行程卡，已驗收（2026/11/17）。下一輪：全球足跡 `#t-map` 改版討論（新對話，先診斷與提方向，不急著寫程式）。

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
- Service Worker 會快取舊檔：改完 app.js／quick-add.js／style.css 要升 sw.js 版本號（以 sw.js 實際為準，約 hk-v62；`grep -o "hk-v[0-9]*" sw.js` 可查），或清 SW 後關分頁重開
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
3. 景點三狀態：待選／排在某天／排在某天某時（待選＝口袋名單；「排入行程」已完成，帶 pid）
4. 今天沒排時，現場模式顯示待選點＋「今天去這個」（已完成 2026/11/11：依區域排序，不用 GPS；重用 poolPlanForm／poolPlanSave）
5. 貼 Google 地圖連結收藏景點（已完成：只收完整連結）
6. 圖卡免登入，存檔或下載才登入
7. 傳播三條線：圖卡（後）、旅伴邀請（前中，旅伴免登入可看）、模板複製（前）
8. 明確不做：景點資料庫、社群攻略、背景定位、比價訂房

## 歡迎頁（2026/11/17 完成，已 commit）
- 歡迎頁 #welcome（index.html／welcome.css／auth.js）背景透明，直接露出全站共用的 `.home-bg` 影片（fixed、z-index:-1），不另載影片；顯示期間以 `body:has(#welcome:not([hidden]):not(.revealing))` 把 header.top／main／.bnav／.drawer／.scrim 設 visibility:hidden
- 中間放首頁同款 `.home-logo`（triptick.png），按鈕仍是 `#btn-google`（class gbtn），樣式沿用首頁 `.home-btn`（玻璃膠囊、serif 16 粗），文字「登入」（登入中「登入中…」、成功「登入成功」）；Google 圖示已移除；auth.js 的 setBusy 文案已同步
- 轉場：不再用光圈收合；`.welcome.revealing` 時歡迎頁內容淡出 .3s，再讓 header／main／.bnav 以 tp-appin 淡入 .4s（延遲 .3s）；減少動態時直接淡出。auth.js transitionIn 時間（850ms 後 teardown）未動
- logo／按鈕與首頁位置為估算對齊（頂 96px、底 104px），尚未量；若需微調只改 welcome.css `.welcome-ui` padding
- 訊息與「稍後再說」文字改淺色（深色影片上可讀）

## 未來清單 #t-future（2026/11/17 完成，已驗收）
- 改為可展開行程卡（類名 .fc，CSS 在 style.css 末尾 patch 區塊，展開動畫與行程頁 .nowcard 同款）。收合＝標題（16 粗）＋小字「國旗 國家・日期・天數」＋箭頭；展開＝備註（有才顯示）、「設為當前行程」（主按鈕）、「編輯」「刪除」（透明外框次要按鈕）、右上「編輯模式」鈕、每日分頁與行程清單（重用 tabsHTML／dayHTML／itm，樣式同行程頁）
- 一次只展開一張，狀態存模組變數 FUT_OPEN（與 NOWOPEN 並列宣告）；清單依出發日由近到遠，沒日期排最後；空狀態一句話，新增旅程鈕維持頁面上方那一顆
- 新函式（app.js，tcard 前）：futTrip()、fcard(t)、renderFuture()、futToggle(id)；render() 內改呼叫 renderFuture()；主 switch 新增 `futopen`
- 每日編輯沿用行程頁同一組 handler（additem／edititem／delitem／addday／editday／delday／saveitem／saveday），靠 TV() 在 cur==="future" 時回傳 FUT_OPEN 那趟行程；refreshDays、focusDay 開頭各加 future 分支（直接呼叫 renderFuture）
- 這頁拿掉：封面照片（資料未刪）、「地圖」鈕、虛線外框、每日地圖。舊 tcard 保留給歷史旅程用
- 與決策 2（首頁三區）無衝突：這頁保留，首頁三區之後獨立處理

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
- v3 新增（2026/11/11）：清單列不用卡片；特殊列（住宿／重要班次）用淡底或色線＋小標籤；工具列用圖示＋13 字、無底色；次要按鈕用透明外框膠囊；頁面不留大面積深色；同一頁避免多顆長得一樣的膠囊按鈕（要有主次）

## 進度
### 前面輪次（已完成）
- 步驟 1：日期邏輯。步驟 2：底部 5 格導覽、今天頁四種狀態、更多頁
- 步驟 3：記帳彈層（quick-add.js）三類型皆已接真實資料：花費（addExpense）、備註（新增／編輯／刪除）、地點（口袋名單，見下）
- 備忘錄頁：分段「備忘｜緊急」（stormTab）、依日期分組、空狀態、舊備忘（memo.note）以虛擬條目 id "legacy-note" 併入顯示
- 黑底按鈕改白底圓膠囊（.pill 等，CSS 在 style.css 最後面 patch 區塊）
- 資料不遷移：memo.note 留原欄位；編輯 legacy-note 改寫 memo.note，刪除時手動呼叫 undoToast（patch 的 wt 不算字串）

### 口袋名單（2026/11/10 完成，commit c34fd72；之後增強見下一節）
- 名稱「口袋名單」，欄位 trip.pool[]
- 位置：行程頁 nowCard 上方分段「每日｜口袋名單」，狀態存模組變數 nowTab（重新整理回「每日」）；以 CSS（`#t-now[data-nt]`）隱藏，不移除 DOM；applyNowTab() 切換後呼叫 MiniMap.refresh() 或 PoolMap.refresh()
- 條目：{id,name,q,area?,note?,addr?,must?,lat?,lng?,ts,date,by}；沒填的欄位不寫入；改名／區域／地址時刪掉 lat、lng 並重查
- 彈層「地點」：名稱（必填）→ 區域（選填，列最近用過 6 個）→ 必去星星（SVG，橘色實心）→ 備註 → 地址（選填，定位更準）。連續新增：存完不關，清空名稱／備註／地址／星星，保留區域
- 編輯：編輯模式下每列鉛筆＋×；鉛筆開同一彈層（openQuickAdd({mode:"edit-place",id,name,area,note,addr,must})）並隱藏上方三分頁（每次開啟都重設）；儲存呼叫 editPoolPlace（同名檢查、不跳復原）
- 刪除：patch 內建復原（陣列變短自動跳）
- 擋下：空名稱、非 Google 地圖的連結、同名（忽略空白大小寫）、滿 200 筆、非成員、未登入
- 清單依區域分組，必去排前面（星星）；已排進行程的顯示「已排 D3」標籤（poolPlaced 依行程項目的 pid 判斷）；沒座標的列顯示「未標到地圖」
- 地圖：PoolMap（app.js，QA_API 前）；空心點＝未排、實心點＝已排、必去點較大；點一下放大到該點並顯示名稱，再點回全覽；下方列出沒標到的名稱（最多 8 個）與「重新查詢」鈕（data-a="poolgeo"）
- 每日地圖：下方列出沒標到的景點（有 q 無 lat，最多 8 個）與「重新查詢」鈕（data-a="georetry" → geocodeAI(tid)）
- 兩個重新查詢鈕由 app.js 內獨立的 document click 監聽處理，不在主 switch
- 自動定位：新增或改動後 poolGeoAll(tid,quiet) 背景查詢（一次最多 30 筆、每筆間隔 1.1 秒、busy／again 旗標避免並行）；查詢順序：地址（含行程 country）→ 名稱＋區域＋country
- geo(q) 備援（最多 5 次）：原文 → 去括號 → 只用括號內別名 → 以上各轉「台→臺」。失敗點會多等數秒（每次約 1.1 秒）

### 2026/11/11 增強（commit 順序：dcf74a5 → 751be6d → 9c0356f → 7f850c5 → ab76a60 → e995cef → 3bf58fa → 4ce1190；之後兩輪待 commit）
- 貼 Google 地圖連結：名稱欄可貼完整連結（maxLength 2000）。_gmapParse：地名取 /maps/place/名稱，座標優先 !3d!4d，其次 @緯度,經度，再其次 q=／ll=；短連結（maps.app.goo.gl）與非 Google 連結提示後擋下；成功直接存 lat／lng。編輯模式不收連結
- 行程層級「定位城市」：trip.geoCity（編輯旅程表單「定位城市（選填）」）；poolGeoAll 有填就用它取代區域當定位線索；區域只負責分組。只影響口袋名單，每日行程定位未動
- 地圖圖釘小卡：名稱、必去／已排／區域、備註、「導航」（Google 步行導航）、「排入」；口袋名單地圖可收合（模組變數 poolMapOpen，按鈕 data-a="poolmaptoggle"，獨立監聽）；有座標的列不再顯示「開啟地圖」，沒座標的保留
- 排入行程：每列「排入」（data-a="poolplan"）與圖釘小卡按鈕開彈層 modal（poolPlanForm：選天＋時間選填），poolPlanSave 在該天 items 依時間插入 {t,h,d,q,more,pid,lat?,lng?}；口袋名單條目保留；可重複排入；無復原（到該天刪除即可）。Leaflet 小卡會擋住 document 層點擊代理，小卡內按鈕要直接 addEventListener
- 公開範本（tplPayload 白名單）不會帶出 pool
- Firestore 規則實測允許 pool 欄位與 lat／lng

### 每日頁／行程頁改版（2026/11/11，CSS 都在 style.css 末尾 patch-css 區塊）
- 每日頁順序：日分頁 → 當天標題（城市為主 24 襯線，小字「D1・日期」＋天氣，無卡片、無粉色圓）→ 行程清單（細分隔線；時間灰字、標題 16 粗、備註灰色最多兩行；有座標不顯示「開啟地圖」）→ 底部一列（顯示地圖｜分享位置｜同行位置｜未分享）。地圖預設收合（dailyMapOpen，data-a="dmaptoggle"，展開時呼叫 refreshDays＋drawMembers）
- ptsOf 不再把城市中心點（trip.spots）當圖釘，僅在當天完全沒有座標項目時才當備援；圖釘小卡只在「別天」的點才顯示 D 標籤、日期與「看 D 行程」
- 項目類型：新增／編輯行程表單有「類型」下拉（一般／住宿／重要班次，欄位 item.type="stay"/"crit"；未知舊值會保留）。住宿＝淡白底圓角＋「住宿」標籤（橘色小圓點）；重要班次＝紅色左邊線＋淡紅標籤。飲食屬性改為圓角小標籤（.dietrow）
- 行程頁：深色大卡改淺色（.glass.dark.hero 覆寫）；Booking／成員／帳本／飲食卡／緊急為圖示工具列（.tools／.tl，緊急圖示警示紅）；頁尾重複捷徑列在 #t-now 隱藏；「非行程時段／預覽行程」只在編輯模式出現（.lvoff.ed）；旅程進行中的「現在／下一步」卡片未動

### 「今天」頁（2026/11/11 完成）
- 旅途中今天沒排：renderToday 呼叫 todayPickHTML(t,today)。標題「今天」（24 襯線）＋小字「D?・日期・城市」＋一句話＋清單（尚未排進行程的口袋名單；細分隔線、無卡片；必去星星；區域灰字；右側「今天去這個」透明外框膠囊 44 高）。排序：區域與今天城市相符優先，再必去。口袋名單空或全排完：一句話＋「新增口袋名單」（data-a="poolnew"）
- 「今天去這個」：data-a="todaygo" data-v=口袋名單 id，主 switch 內先把 dayI[t.id] 設為今天（todayDayIdx），再呼叫 poolPlanForm(t,v)；排入後 render() 重畫，該列消失、今天頁變成有行程的狀態
- 測試今天沒排：Console 設 `window.__TODAY="2027-01-20"`（只影響該分頁，重新整理失效），再點底部「今天」。go 沒掛 window，不能直接呼叫
- 有行程的今天頁（renderCurrent）只做文字層級小改：刪掉重複的「D1 現在時間」列、標題襯線 24、時間深棕 16 粗、「現在」標籤前加橘點、底部導覽目前頁加橘點。**導航圓鈕、上一站／回到當下／下一站三顆圓鈕與卡片位置刻意維持原樣**（試過底部操作列與拿掉按鈕，使用者實測覺得更差，已還原）。排版是否符合單手／戴手套，等手機實測截圖後再逐項調，不一次大改
- 注意：renderCurrent 同時給 #t-today 與 #t-current 用

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
- 口袋名單：trip.pool[]（見上）；trip.geoCity（字串，定位城市）；行程項目可帶 pid（對應 pool id）、type（stay／crit）
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
- 口袋名單 handler：poolnew／pooledit／pooldel／poolplan／poolplanok／nowtab／futopen（主 switch），poolgeo／georetry／poolmaptoggle／dmaptoggle（獨立監聽）
- CSS 慣例：新樣式一律加在 style.css 末尾（後蓋前）；表單內 `.fm label{display:block}` 會蓋掉 .chk 的 flex，要用更高優先權；`#live:has(...)` 可依內容換外觀
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
- TV() 現在有三種來源：RV（渲染中）→ 行程頁／口袋頁的 viewTrip() → 未來清單展開的 futTrip() → T0()；新增依賴 TV() 的功能要注意 cur 是哪一頁
- 「今天」有行程的畫面：按鈕與版面維持舊樣式，尚未做手機單手實測
- 彈層「在哪一站」清單 CSS 為 display:none，疑似看不到清單（地點分頁已隱藏，花費／備註分頁可能受影響，待手機實測）
- 舊備忘沒有日期，固定排在「未標日期」最下面
- hokkaido.html 是靜態展示頁，與 app 無關

## 下一步（建議順序）
0. 全球足跡 `#t-map` 改版（新對話進行）：現況 index.html 為 `<section id="t-map" class="panel">`，內有 `#stats`（三張 .glass.stat：造訪國家／總天數／趟旅行）與 `.glass.mapbox` 內的 `#map`；資料由 app.js render() 計算、map.js 的 MapView 繪製（需上傳 map.js）。使用者覺得「有點可惜」但還沒有方向：先診斷現況並提 2～3 個方向，確認後才寫腳本；對照 DESIGN.md v3（一頁一個焦點、不留大面積深色、裝飾性圖形不要、地圖預設收合的原則是否適用要討論）
1. 其餘黑底元素逐項改版（.glass.dark 其他頁、.toast、#undo、#updbar、#offbar、.drawer 內 button.on／.login／.sub.on、.story-stage、.days button.on／.plus、.bar button.on、.chip）；白底 .pill 看不清處檢查（.pc-act、.codebox、.story-foot）
2. 旅程進行中的「現在／下一步」卡片與行程頁其他分頁（票券、備忘錄）套用減法；今天頁排版等手機截圖再議
3. T0() 改日期自動計算；首頁三區、漢堡選單四類
4. 整併 addex 與 addExpense；app.js 底部測試用 window 掛載清理

## 待辦
- T0() 改用日期自動計算，移除手動 status:"now"
- 首頁三區、漢堡選單四類改版
- 登入頁已改影片底＋淡出淡入（見「歡迎頁」）；auth.js transitionIn 內的光圈圓心變數（--ox／--oy／--R）已不再被 CSS 使用，可日後清理
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
- 同一對話內上傳過的檔案 Claude 仍可讀，不必重傳；對不上時腳本會停下，再重傳最新版；換新對話一定要重傳
- 搬腳本：`mv ~/Downloads/檔名.cjs .`；node 路徑與檔名之間要有空格；commit 完才 rm 腳本
- 規格寫「目標與限制」，限制要含「哪些函式不准動」
- 出規格前先看原檔（上傳），並先確認同類 UI 的現有做法，新功能照既有慣例
- 「程式理論上對、畫面不對」時，先用 Console 跑 getComputedStyle 或實際狀態再下結論
- 寫 HTML 結構前要對照 CSS 選擇器
- 要退回：用 git revert 或 git stash，不用 git reset --hard
- 本機用 localhost:5500；改完 app.js／quick-add.js／style.css 要升 sw.js 版本號
- Claude 交腳本前，先用上傳檔案的副本在沙盒試跑，確認全部命中、語法檢查通過
- 腳本已套用過再跑會顯示「找到 0 處」並停下，屬正常，不會改檔
- 只改使用者要求的範圍，使用者說「樣式我改過、不用動」的部分不動；排版調整先講診斷與方案、確認後再寫腳本，一次只改一類
- 腳本交出後，要先確認使用者是否已跑過前一版；腳本一律以「使用者目前的檔案狀態」為基準，找不到就停下並請使用者回報 `git status --short`、`git diff --stat`
- 還原用 revert 腳本或 git checkout（commit 前的改動可用）；使用者說「更差」就先整個退回，再討論
- 是否買 Claude API 接 Cline：評估後暫不買（流程已有腳本保險）；若試用，先小額儲值並設月上限
