/* ===== SS：IG Story 分享圖（僅視覺骨架，不做上傳/動畫/匯出） ===== */

/* 狀態：僅保存在當前視窗，關閉頁面即捨棄 */
let ssState = { trip: null, scale: 1 };

/* 開啟 SS Story 彈窗 */
function openSSTory(trip){
  ssState.trip = trip;
  const stage = document.querySelector('.ss-stage');
  if (!stage) return;

  /* 計算縮放：以 1080×1920 為基準，同時適應螢寬與螢高 */
  const viewW = document.documentElement.clientWidth || 720;
  const viewH = document.documentElement.clientHeight || 1334;
  ssState.scale = Math.min(1, viewW / 1080, viewH / 1920);

  /* 塞入假資料 */
  const html = ssRenderFake(trip);
  stage.innerHTML = html;

  /* 顯示模態視窗 */
  const modal = document.getElementById('ss-modal');
  if (modal) {
    modal.classList.add('on');
    document.body.style.overflow = 'hidden';
  }

  /* 圖片載入後重新計算（若需要） */
  const imgs = stage.querySelectorAll('img');
  if (imgs.length) {
    imgs.forEach(img => {
      if (img.complete && img.naturalWidth) return;
      img.onload = () => { ssRecalcStage(); };
      img.onerror = () => { ssRecalcStage(); };
    });
  }
}

/* 產生假資料 HTML（背景色 + 佔位圖） */
function ssRenderFake(trip){
  const title = trip.title || '我的旅程';
  const country = trip.country || '未知國家';
  const dates = `${trip.startDate || ''}${trip.endDate ? ' – ' + trip.endDate.slice(5) : ''}`.trim() || '日期未定';

  return `
    <div class="ss-share-wrap" style="--ss-scale:${ssState.scale}">
      <!-- z0：背景純色 -->
      <div class="ss-layer-z0"></div>

      <!-- z1：信封 Envelope.png -->
      <img src="envelope.png" class="ss-layer-z1" width="1080" height="1920" loading="eager">

      <!-- z2：拍立得假色塊 -->
      <div class="ss-layer-z2"></div>

      <!-- z3：機票 air tickets.png -->
      <img src="air tickets.png" class="ss-layer-z3" width="1080" height="1920" loading="eager">

      <!-- z5：預覆層 pre-envelope.png -->
      <img src="pre-envelope.png" class="ss-layer-z5" width="1080" height="1920" loading="eager">

      <!-- 舞台區域：顯示行程資訊 -->
      <div class="ss-stage" style="--ss-scale:${ssState.scale}">
        <div class="ss-stage-header">
          <h2>${esc(title)}</h2>
          <p>${esc(country)}</p>
        </div>
        <div class="ss-stage-meta">${esc(dates)}</div>
        <div class="ss-stage-note">IG Story 分享圖（預覽模式）</div>
      </div>
    </div>
  `;
}

/* 縮放重計算（視窗大小變更時） */
function ssRecalcStage(){
  const viewW = document.documentElement.clientWidth || 720;
  const viewH = document.documentElement.clientHeight || 1334;
  const newScale = Math.min(1, viewW / 1080, viewH / 1920);
  if (Math.abs(newScale - ssState.scale) > 0.01) {
    ssState.scale = newScale;
    const wrap = document.querySelector('.ss-share-wrap');
    if (wrap) wrap.style.transform = `scale(${ssState.scale})`;
  }
}

/* 關閉 SS Story 彈窗 */
function closeSSTory(){
  const modal = document.getElementById('ss-modal');
  if (modal) {
    modal.classList.remove('on');
    document.body.style.overflow = '';
  }
  ssState.trip = null;
}

/* 綁定事件：視窗大小變更重新縮放 */
addEventListener('resize', ssRecalcStage);

/* 綁定模態視窗關閉按鈕（假設存在 id="ss-modal" 與內部 .close-btn） */
document.addEventListener('DOMContentLoaded', ()=> {
  const modal = document.getElementById('ss-modal');
  if (modal) {
    const closeBtn = modal.querySelector('.close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeSSTory);
    // 點擊遮罩關閉
    modal.addEventListener('click', e=>{
      if(e.target===modal||e.target.classList.contains('modal'))closeSSTory();
    });
  }
});

/* 轉義輔助 */
function esc(x){return String(x||'').replace(/[&<>\"]/g,c=>({'&':'&','<':'<','>':'>',"'':'"'}[c]));}