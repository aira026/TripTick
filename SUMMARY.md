# 歷歷 TripTick 專案摘要卡 v13

更新日期：2026/11/15
狀態：「整體 UIUX 改版」（森林綠＋淺色內頁＋果凍／水玻璃卡，橘色全面退場）。規格以 DESIGN.md v4 為準。批次 0（色彩 token）已 commit；批次 1（行程頁水卡）腳本 batch1.cjs 已跑過並初步實測；實測回報後補了修正腳本 batch1b.cjs（見「批次 1 修正」），等使用者跑完再 commit。下一步：批次 2 口袋清單搬家。

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
- 現有 trip.status:"now" 為手動欄位（statusOf＝t.st[uid]），與決策 1 衝突（尚未移除）；T0() 仍靠它找當前行程。**行程頁（#t-now）自批次 1 起改顯示 viewTrip()，可能與 T0() 不同趟，見「2026/11/15 批次 1」**
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

## 設計規則：以 DESIGN.md v4 為準（取代 v2／v3 的色彩與背景）
- 森林綠 --accent #4F7A5A、淺色內頁 --bg #E6EDE3、果凍／水玻璃卡（.glass／.card 同一種樣式）、橘色與粉色漸層全面禁用
- v3 的字體（24 襯線／16／13）、間距（8／16／24）、元件骨架、清單列規則沿用
- 刻意保留深色：#focus（--danger-bg #1E2B24）、.story-stage；首頁影片頁用深色玻璃（--card-dark）
- --warm #F2B544 僅限小圓點與「現在」標記；--warn 只給緊急與重要班次
- 不可巢狀 backdrop-filter；需有 @supports 與 prefers-reduced-motion 備案

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

### 2026/11/13 批次 0：色彩 token（腳本 batch0.cjs，已在副本試跑通過，使用者尚未實測）
- :root 換成 v4 token，另有 --line（淡邊）、--jelly-blur、--jelly-shadow；舊變數保留為「相容別名」（--ink／--tx／--mut／--gl／--sh／--red／--aurora／--ice），因為 welcome.css、quick-add.js、story-share.css 還在用，待那些檔案改版再移除
- .aurora 改為固定不動的三顆色塊，位置由 go() 設定的 body[data-pg] 決定（預設左上＝行程頁；pool＝中；more＝右下）
- .glass／.card 統一果凍樣式；.glass .glass 關掉內層 backdrop-filter；@supports 備案用 --card-strong
- 已改套 token 的容器：.sheet、.drawer、.bnav、.more-card（--card-strong）、.dayhd、.tile、.shortcut-card、.toast／#undo／#updbar、#offbar、#reqbar、.live
- 橘／粉清除：.dot、.tc .ph、.ov::after（整條刪）、.pdot、.lvnav、.day-badge、.page-btn、.shortcut-card hover、.drawer sub.on 等；.ldot、現在標籤圓點、住宿標籤圓點改 --warm；打勾改 --accent
- app.js：go() 加 document.body.dataset.pg=id；星星與口袋地圖圓點 #FF7A00 → #4F7A5A（6 處）；內嵌文字色改 var(--text)／var(--text-2)
- map.js：新增 MAP_PIN（讀 --pin，備援 #FF7A00）；足跡圓點與兩處虛線路線（足跡、每日）都用它，路線維持橘色（綠色在山區看不清）
- index.html：theme-color → #E6EDE3
- 例外：地圖圖釘／圓圈維持橘色（--pin／--pin-sel；範圍＝.pdot、足跡圓點 MAP_PIN、口袋地圖圓圈、地圖虛線路線）；星星圖示維持綠色
- sw.js 版號由使用者手動升
- 驗證：Console 跑 getComputedStyle(document.documentElement).getPropertyValue("--accent") 應為 #4F7A5A；每日地圖橘色路線與圖釘是否清楚（綠色路線在山區看不清，已改回橘色）

### 2026/11/15 批次 1：行程頁水卡（腳本 batch1.cjs，已在副本試跑通過；使用者尚未實測）
- 結構：`#t-now` ＝ bar(1,vt)（編輯模式列，原樣）＋ `.nowrow`〔水卡 `#nowcard`（.glass）＋ 切換鈕 `.nc-sw`（沿用 .page-btn.pg-auto，重整 SVG）〕＋ poolSeg()＋poolHTML(t)（口袋名單原樣，仍在卡片下方）
- 水卡內：`#live.nc-top`（liveHTML，點擊展開）＋ `.nc-more`（grid-template-rows 0fr→1fr，380ms；卡片圓角 28→36 同步過渡，變數 --nc-r）。展開區 ＝ 國旗國家＋標題（24 襯線）＋起訖日期＋`#cd` 倒數小標＋每日行程（#ptdaily：日分頁／當天清單／dtools／地圖）。收合時 `.nc-more` 加 inert
- 地圖按鈕：只先出現「顯示地圖」；`.pt-daily.dmap-on` 才顯示 .locbar（分享位置／同行位置）
- 五種狀態（liveHTML）：行程中（圓點 --warm 呼吸）／行程前（灰點 --text-2、「尚未開始」＋出發倒數 N 天＋預覽行程鈕）／行程後（灰點、標題靠右「非行程時段」＋「旅程已結束…」＋預覽行程鈕）／預覽模式（圓點 --warm 淡、上一個／下一個／回到即時；ldot.sim）／無行程（nowEmpty()：水卡「還沒有行程」＋主鈕「來趟旅行吧！」data-a="add" data-v="now"＋次要「輸入邀請碼」「匯入範例：北海道」＋原 guide()；未登入或 Firebase 未設定仍用舊 emptyNow()）。首頁在批次 3 才做，主鈕暫時開現有新增旅程彈窗
- **顯示用行程（新）**：`tripList()`（visible() 依 startDate 排序，無日期排最後）、`pickTrip()`（今天在起訖內者優先，多趟取 status now 者否則最早；沒有則距今最近；都沒日期退回 T0() 或第一趟）、`viewTrip()`（手動切換 VIEW_ID 優先，失效自動退回 pickTrip；重新整理頁面會重置）。`tripNext`（data-a="tripnext"）循環切換，只改顯示、不寫資料；只有一趟時按鈕 disabled；切換時重畫、toast「顯示：行程名」、重設 LIVE 預覽
- **TV()＝行程頁上下文的「當前行程」**：`RV || (cur==="now" && viewTrip()) || T0()`；RV 是 nowCard 渲染期間暫存的行程（讓 itm→dietWarn 吃對的行程）。**T0() 完全沒改**。已改用 TV() 的地方：主 click handler 的 t（addday／editday／delday／additem／edititem／delitem／saveitem／saveday／pool 系列／tplreset／archive…）、saveItem／itemForm／dayForm／saveDay、itm 的 dietWarn、pickPt、daymore change、print／afterprint、AI 小精靈（aiCtx／aiHTML／套用）、口袋地圖小卡「排入」、poolgeo、dmaptoggle、**QA_API.T0（＝TV，所以行程頁開記帳彈層時寫入顯示中的那一趟；其他頁仍是 T0）**
- **LT()＝viewTrip()||T0()**：位置分享（syncLoc／updLocBar／drawMembers／people／askloc／locshare）跟著顯示中的行程；safeTick／syncReq／safetoggle／checkin／reqshare／reqskip（緊急與請求分享）仍用 T0()
- bar(arch,t0)：新增選用的第二參數；「重設為範例」鈕改由 bar() 依顯示行程決定（bar0 沒動）；tplreset handler 加 templateId 檢查，避免誤蓋非範例行程
- 編輯模式：開啟時若水卡收合，自動展開（否則看不到鉛筆與新增鈕）
- tick()：#cd 倒數小標改吃 viewTrip()，放在展開區
- 60 秒 refreshLive：若 pickTrip 結果與畫面上的 #nowcard[data-tid] 不同（跨日），整頁重畫 renderNow
- 動畫：水波（.nc-rip 容器＋.ripple，白 radial-gradient .4→0，600ms，點卡片上半部才觸發）；果凍壓彈（.jelly，410ms：1→.97→1.02→1；用在展開、切換行程、卡內按鈕）。prefers-reduced-motion：JS 與 CSS 雙重關閉。@supports 備案沿用 .glass 規則（--card-strong）。卡內 .days button／.dayhd 關閉 backdrop-filter，避免巢狀
- 已刪舊規則（同一次改動）：.hero／.hero small／.hero h2／.hero p／.hero .cdp／.hero .pills／.hero .pill.lt、.glass.dark.hero、.glass.dark（列印）、.live、.glass.live、.lvh、.simtag、.lvoff／.lvoff .meta、#live:has(.lvoff)（兩條）、.lvctl（含 button 與 disabled）、舊 .lvnav／.lvrow／.lvst 與舊 .ldot 區塊（整段改寫）。列印：隱藏 .nc-sw／.nc-rip，強制展開 .nc-more
- 與規格的小出入／自行決定（請實測後告知要不要改）：展開後圓角 36（規格只說「圓角一起過渡」）；水波在淺色卡上很淡（照規格白 .4）；空狀態保留邀請碼與範例鈕（原功能）；行程後「非行程時段」標題靠右（照截圖）
- **批次 1 修正（batch1b.cjs，2026/11/15 實測後）**：①切換鈕改放卡片右上角（.nc-sw 絕對定位於 #nowcard 內，標題列右側讓位 56px），不再並排；②pickTrip 改為「今天進行中（多趟取 status now）> 手動設為當前的行程（T0）> 最近的未歸檔 > 最近的任何」。原版只看日期，導致實測時麵包屑（T0＝台南）與水卡（日期最近＝韓國）不一致，歸檔／重設當前也換不掉。此規則與 DESIGN.md「沒有則選最近」略有出入，是依使用者實測需求改（手動「設為當前」仍是目前唯一的當前行程來源，決策 1 日期自動計算尚未做）；③「設為當前」「歸檔」成功後清除 VIEW_ID；④預覽圓點改實心 --warm（去掉 opacity .55）
- 驗證：行程頁有行程時看到單張水卡；點卡展開／再點收合；切換鈕輪流顯示各行程（toast 顯示名稱）；Console 設 `window.__TODAY` 對行程頁無效（行程頁用手機時間）；改 `VIEW_ID` 無法從外部測，請直接按切換鈕

## 資料接口（QA_API，app.js 底部）
（批次 1 起 QA_API.T0 ＝ TV()：行程頁回傳顯示中的行程，其他頁回傳 T0()）
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
- 口袋名單 handler：poolnew／pooledit／pooldel／poolplan／poolplanok／nowtab（主 switch），poolgeo／georetry／poolmaptoggle／dmaptoggle（獨立監聽）
- CSS 慣例（v4 改版期間改了）：直接改或刪舊規則，不再用末尾 patch 區塊，被取代的 selector 同一次改動清掉；表單內 `.fm label{display:block}` 會蓋掉 .chk 的 flex，要用更高優先權；`#live:has(...)` 可依內容換外觀
- setEdit(on)、bar0(arch) 是編輯模式與頂部按鈕列的核心，改周邊時不可動（批次 1 沒動；bar(arch,t0) 才是行程頁用的外層）
- 行程頁相關的「現在是哪一趟」一律用 TV()（行程頁上下文）或 LT()（位置分享），不要在行程頁功能裡新寫 T0()
- 小地圖容器在隱藏分頁時尺寸為 0：切分頁後要 invalidateSize（refresh）

## 已知限制
- 彈層記帳固定「自己付、全員平分」；幣別固定為 trip 幣別
- patch 寫整個 memo／pool：多人同時編輯會後寫蓋先寫
- addExpense 沒有 members 檢查
- 未登入提示文案目前是「無法編輯此行程」，之後改「請先登入」
- 撥打 119 固定寫死
- 分段切換狀態重新整理不保留
- 行程頁手動切換的行程（VIEW_ID）與展開狀態（NOWOPEN）重新整理後重置
- 行程頁每日行程收在水卡展開區；口袋名單分段（每日｜口袋名單）暫時留在卡片下方，批次 2 移除
- 位置分享改跟顯示中的行程（LT）；若正在分享 A 行程、顯示切到 B，syncLoc 會停掉 A 的本機定位追蹤
- 定位準確度（OpenStreetMap）：地址含縣市最準；只填名稱＋含糊區域（如「東區」）可能配到別的城市，且配錯無法偵測；台灣地名 OSM 多用「臺」。區域欄目前同時當定位線索，是已知取捨（改法見下一步）
- 定位失敗的點會多等數秒；Nominatim 限速約 1 次/秒
- 「今天」有行程的畫面：按鈕與版面維持舊樣式，尚未做手機單手實測
- 彈層「在哪一站」清單 CSS 為 display:none，疑似看不到清單（地點分頁已隱藏，花費／備註分頁可能受影響，待手機實測）
- 舊備忘沒有日期，固定排在「未標日期」最下面
- hokkaido.html 是靜態展示頁，與 app 無關

## 改版待辦（依序，每批做完換新聊天室、更新本檔）
### 批次 1：行程頁 — 已完成（見上方「2026/11/15 批次 1」），待使用者實測與 commit
### 批次 2：口袋清單搬家
- 現況綁定：nowTab 變數、poolSeg()（nowCard 回傳字串尾端，卡片下方）、applyNowTab()、#t-now[data-nt] CSS（`.pt-daily` 在水卡展開區內，data-nt="pool" 時仍會被隱藏）、主 switch 的 nowtab handler、PoolMap.refresh（切分頁時）
- **批次 2 必須處理 TV()**：口袋清單搬到 #t-pool 後 cur==="pool"，TV() 會退回 T0()；要把條件擴成 `(cur==="now"||cur==="pool")&&viewTrip()`，口袋名單才會跟行程頁顯示同一趟。poolHTML(t)／PoolMap.render／poolgeo／QA_API.addPoolPlace 都靠 TV()/t
- 目標：從行程頁分頁移除；「更多」頁（#t-more .more-grid）加一顆按鈕，點進新的 #t-pool 分頁（go("pool")）；BN_GROUP 加 pool→more，LB／ICN／renderDrawer 補上；一併清除上述 5 處殘留；列表卡選中項目 --accent 邊
### 批次 2 之後：卡片「換景點」按鈕（使用者 2026/11/15 提出，規格已答覆，尚未動工）
- 外觀：只有圖示、無文字、不用 emoji；建議圖釘＋雙向小箭頭（線條 1.75、22），要和切換行程的重整鈕、「導航至下一站」紙飛機區分
- 位置（使用者已答）：卡片裡面、切換（重整）鈕的正下方、與「下一步」文字同一列的右側
- 「附近」（使用者已答）：優先做「按下才一次性 GPS 定位」（navigator.geolocation，前景、使用者點擊觸發，不屬決策 8 排除的背景定位；與決策 4 當初「不用 GPS」是調整），依距離排序口袋名單景點（需有 lat/lng，沿用 poolgeo）；定位被拒或失敗時退回「同區域」（pool.area／geoCity）
- 「換掉」（使用者已答）：**取代**下一步那一項（寫入每日行程資料）；沒有下一步（當天已結束）時按鈕仍在，選了之後變成新的下一步（加在當天末尾）
- 流程：按鈕 → 列出附近口袋景點（彈層或卡內清單，動工前再問）→ 挑一個 → 取代並重畫水卡
- 動工前還要問：被取代項目的時間（保留原時間／清空）、被換掉的項目是否放回口袋名單、僅「行程中／預覽」顯示還是行程前後也顯示、列出幾個、清單樣式
- 依賴批次 2：口袋名單先搬到 #t-pool 並確定資料來源跟 TV()
### 批次 3：首頁
- 目前沒有首頁（brand 與預設都是 go("current")，底部 5 格不含首頁，BN_PAGES 不含 current）。預設新增 #t-home 為第一畫面，登入後落地，底部導覽顯示（深色玻璃，結構不變）
- 影片背景：muted playsinline autoplay loop、poster、object-fit:cover、遮罩 linear-gradient(rgba(20,32,26,.25),rgba(20,32,26,.45))；WebM＋MP4；影片不進 sw.js 的 PRE 預先快取（使用者之後提供影片檔；暫定森林影片）
- 沒新增過行程者出現呼吸按鈕「來趟旅行吧！」（白底 rgba(255,255,255,.92)、深字 #22302A、圓膠囊），沿用 form() 新增旅程彈窗，完成後跳行程頁
- 光斑在影片右上，文字放左下到中間
### 其他待決定／待辦
- 琥珀色警示類未動（DESIGN.md 沒規範，需使用者決定）：.dwarn、.ftag.soft、.hl、#focus 的 .hl；另 .leaflet-tooltip.mname 深色、#t-past .addfab 與 .pc-item 的黑陰影、.chip.live／.mdot 藍色（成員定位）
- welcome.css、quick-add.js、story-share.css、auth.js 使用者指定先不動；移除相容別名前要先改它們
- 批次 0 沒有逐頁拆除舊的疊層覆寫（例如 .pill／.seg／.menu 的黑底再被白底覆寫），隨各頁批次一併整理
- 原待辦仍在：T0() 改日期自動計算並移除手動 status:"now"；首頁三區與漢堡選單四類；整併 addex 與 addExpense；app.js 底部測試用 window 掛載清理；登出後清 has-bnav 殘留

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
- 改版期間追加：每批做完（使用者跑腳本、實測、commit）→ 更新本檔 → 換新聊天室；新聊天室要重傳 DESIGN.md、SUMMARY.md、style.css、app.js、index.html、map.js（批次 2、3 不需要截圖；批次 3 首頁可附參考截圖）
- sw.js 版號由使用者手動升（不經腳本）
