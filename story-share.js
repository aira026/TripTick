/* ===== story-share.js：IG Story 復古信封分享 modal ===== */

/* ssOpen：開啟分享 modal，縮放 1080×1920 容器至視窗寬度，塞入假資料，modal 可關閉 */
window.ssOpen = function () {
  /* 建立遮罩層 */
  var mask = document.createElement('div')
  mask.style.position = 'fixed'
  mask.style.inset = '0'
  mask.style.background = 'rgba(0,0,0,.4)'
  mask.style.zIndex = '3000'
  mask.style.display = 'flex'
  mask.style.alignItems = 'flex-end'
  mask.style.justifyContent = 'center'
  /* modal 區域 */
  var sheet = document.createElement('div')
  sheet.className = 'sheet'
  sheet.style.width = '100%'
  sheet.style.maxWidth = '720px'
  sheet.style.borderRadius = '28px 28px 0 0'
  sheet.style.padding = '22px 18px calc(26px + env(safe-area-inset-bottom))'
  sheet.style.maxHeight = '85vh'
  sheet.style.overflow = 'auto'
  sheet.style.background = 'rgba(255,255,255,.9)'
  sheet.style.animation = 'up .3s'

  /* === 分享內容：使用普通字串拼接（不使用巢狀 template literal）=== */
  var content = ''
  content = content + '<div class="story-modal">'
  content = content + '<div class="story-head">'
  content = content + '<h3>限時動態分享圖</h3>'
  content = content + '<p class="story-meta">旅程標題</p>'
  content = content + '</div>'
  content = content + '<div class="story-stage">'
  content = content + '<div class="story-bg" style="background:#e6f2fa; width:1080px; height:1920px;"></div>'
  content = content + '<div class="ss-layer-z0" style="background:#e6f2fa;"></div>'
  content = content + '<div class="ss-layer-z1" style="width:1180px; height:1333px; background:url(envelope.png) no-repeat center/cover;"></div>'
  content = content + '<div class="ss-layer-z2" style="background:#ffe8e8;"></div>'
  content = content + '<div class="ss-layer-z3" style="width:1180px; height:1333px; background:url(air tickets.png) no-repeat center/cover;"></div>'
  content = content + '<div class="ss-layer-z5" style="width:1180px; height:1333px; background:url(pre-envelope.png) no-repeat center/cover;"></div>'
  content = content + '</div>'
  content = content + '<div class="story-foot">'
  content = content + '<button class="pill gl" data-a="closedl">關閉</button>'
  content = content + '</div>'
  content = content + '</div>'

  sheet.innerHTML = content
  mask.appendChild(sheet)
  document.body.appendChild(mask)
  mask.classList.add('on')

  /* 縮放 1080×1920 容器至視窗寬度 */
  /* 計算縮放比例：視窗寬 / 1080，但不超過 1.0 */
  var shareWrap = document.querySelector('.ss-share-wrap')
  if (shareWrap) {
    var scale = Math.min(1, (document.documentElement.clientWidth || 720) / 1080)
    shareWrap.style.transform = 'scale(' + scale + ')'
    shareWrap.style.transformOrigin = 'top left'
  }

  /* 關閉 modal 點擊事件 */
  var closeBtn = mask.querySelector('[data-a="closedl"]')
  if (closeBtn) {
    closeBtn.onclick = function () {
      mask.classList.remove('on')
      setTimeout(function () { document.body.removeChild(mask) }, 220)
    }
  }
  /* 點擊遮罩區域外關閉 */
  mask.onclick = function (e) {
    if (e.target === mask || e.target.classList.contains('modal')) {
      mask.classList.remove('on')
      setTimeout(function () { document.body.removeChild(mask) }, 220)
    }
  }
}