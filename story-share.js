/* story-share.js 第 2 段：Canvas 版（套框、上傳、動畫、匯出） */
(function () {
  var W = 1080, H = 1920;

  /* ===== 位置微調區：數字都集中在這裡 ===== */
  var CFG = {
    stageW: 900, bottom: 120,                 /* 信封寬度、離底部距離 */
    ticket: { w: 760, cx: 450, top: 235, rot: -4, rise: 420 },
    photoW: 250, photoTop: 330, photoRise: 430,
    /* 機票文字：x、y 是佔機票寬高的比例，max 是可用寬度比例 */
    fields: {
      passenger: { x: .17, y: .38, max: .27 },
      from:      { x: .13, y: .59, max: .13 },
      to:        { x: .61, y: .39, max: .16 },
      date:      { x: .60, y: .59, max: .17 },
      extra:     { x: .13, y: .775, max: .13 },
      seat:      { x: .53, y: .775, max: .10 }
    }
  };

  var assetsP = null;
  function load(src) {
    return new Promise(function (res) {
      var i = new Image();
      i.onload = function () { res(i); };
      i.onerror = function () { res(null); };
      i.src = src;
    });
  }
  function ease(t) { t = Math.max(0, Math.min(1, t)); return 1 - Math.pow(1 - t, 3); }

  /* 自動找出 Polaroid.png 中間透明的相片窗口 */
  function detectWindow(img) {
    try {
      var c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      var x = c.getContext('2d'); x.drawImage(img, 0, 0);
      var w = c.width, h = c.height, d = x.getImageData(0, 0, w, h).data;
      var a = function (px, py) { return d[(py * w + px) * 4 + 3]; };
      var cx = w >> 1, cy = Math.round(h * 0.42);
      if (a(cx, cy) > 20) {
        var ok = false;
        for (var dy = 0; dy < h * 0.3 && !ok; dy += 4) {
          if (a(cx, Math.min(h - 1, cy + dy)) <= 20) { cy = cy + dy; ok = true; }
          else if (a(cx, Math.max(0, cy - dy)) <= 20) { cy = cy - dy; ok = true; }
        }
        if (!ok) return null;
      }
      var l = cx, r = cx, t = cy, b = cy;
      while (l > 0 && a(l - 1, cy) <= 20) l--;
      while (r < w - 1 && a(r + 1, cy) <= 20) r++;
      while (t > 0 && a(cx, t - 1) <= 20) t--;
      while (b < h - 1 && a(cx, b + 1) <= 20) b++;
      return { x: l / w, y: t / h, w: (r - l + 1) / w, h: (b - t + 1) / h };
    } catch (e) { return null; }
  }

  function getAssets() {
    if (!assetsP) {
      assetsP = Promise.all([
        load('envelope.png'), load('pre-envelope.png'),
        load(encodeURI('air tickets.png')), load('Polaroid.png')
      ]).then(function (r) {
        return { env: r[0], pre: r[1], tk: r[2], pol: r[3],
                 win: r[3] ? detectWindow(r[3]) : null };
      });
    }
    return assetsP;
  }

  /* 壓縮到 500KB 內 */
  async function compress(file) {
    var url = URL.createObjectURL(file);
    var im = await load(url);
    URL.revokeObjectURL(url);
    if (!im) return null;
    var s = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight));
    var w = Math.round(im.naturalWidth * s), h = Math.round(im.naturalHeight * s);
    var q = 0.9, blob = null;
    for (var n = 0; n < 8; n++) {
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(im, 0, 0, w, h);
      blob = await new Promise(function (r) { c.toBlob(r, 'image/jpeg', q); });
      if (!blob || blob.size <= 500 * 1024) break;
      if (q > 0.55) q -= 0.1; else { w = Math.round(w * 0.85); h = Math.round(h * 0.85); }
    }
    return blob;
  }

  function cover(ctx, im, x, y, w, h) {
    var s = Math.max(w / im.naturalWidth, h / im.naturalHeight);
    var dw = im.naturalWidth * s, dh = im.naturalHeight * s;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.drawImage(im, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    ctx.restore();
  }

  function fitText(ctx, txt, x, y, maxW, size) {
    if (!txt) return;
    var f = size;
    for (; f > 8; f--) {
      ctx.font = '700 ' + f + 'px "Space Mono", ui-monospace, Menlo, "PingFang TC", monospace';
      if (ctx.measureText(txt).width <= maxW) break;
    }
    ctx.fillText(txt, x, y);
  }

  /* 主繪製：p 是動畫經過的毫秒數，傳很大的數字就是最終畫面 */
  function draw(ctx, p, S) {
    var A = S.A;
    ctx.clearRect(0, 0, W, H);
    if (S.bg) cover(ctx, S.bg.img, 0, 0, W, H);
    else {
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#e3d5c3'); g.addColorStop(1, '#c9b49a');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    if (!A.env || !A.pre) return;

    var ew = CFG.stageW, eh = ew * A.env.naturalHeight / A.env.naturalWidth;
    var ox = (W - ew) / 2, oy = H - CFG.bottom - eh;
    var slide = (1 - ease(p / 600)) * (H - oy + 60);
    ctx.save();
    ctx.translate(ox, oy + slide);

    /* z1 信封後層 */
    ctx.drawImage(A.env, 0, 0, ew, eh);

    /* z2 機票（在照片後面） */
    if (A.tk) {
      var T = CFG.ticket, tw = T.w, th = tw * A.tk.naturalHeight / A.tk.naturalWidth;
      var tr = (1 - ease((p - 600) / 700)) * T.rise;
      ctx.save();
      ctx.translate(T.cx, T.top + th / 2 + tr);
      ctx.rotate(T.rot * Math.PI / 180);
      ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
      ctx.drawImage(A.tk, -tw / 2, -th / 2, tw, th);
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#3b2a24'; ctx.textBaseline = 'middle';
      var F = CFG.fields, I = S.info;
      var put = function (k, v) {
        var f = F[k];
        fitText(ctx, v, -tw / 2 + f.x * tw, -th / 2 + f.y * th, f.max * tw, 18);
      };
      put('passenger', I.name); put('from', I.from); put('to', I.to);
      put('date', I.date); put('extra', I.extra); put('seat', I.seat);
      ctx.restore();
    }

    /* z3 拍立得（照片在下、相紙框在上） */
    var n = S.photos.length || 3;
    var rots = [-9, 3, 8, -5, 6], dys = [0, -14, 10, -6, 8];
    var win = A.win || { x: .08, y: .06, w: .84, h: .74 };
    var pw = CFG.photoW, ph = A.pol ? pw * A.pol.naturalHeight / A.pol.naturalWidth : pw * 1.2;
    var gap = n === 1 ? 0 : Math.min(210, 520 / (n - 1));
    var colors = ['#f4c7c3', '#c9dff0', '#d8ecc8', '#f3e3b5', '#e0cdee'];
    for (var i = 0; i < n; i++) {
      var cx = 450 + (i - (n - 1) / 2) * gap;
      var pr = (1 - ease((p - 900 - i * 150) / 700)) * CFG.photoRise;
      ctx.save();
      ctx.translate(cx, CFG.photoTop + dys[i % 5] + ph / 2 + pr);
      ctx.rotate((n === 1 ? -3 : rots[i % 5]) * Math.PI / 180);
      var im = S.photos[i] ? S.photos[i].img : null;
      var wx = -pw / 2 + win.x * pw, wy = -ph / 2 + win.y * ph, ww = win.w * pw, wh = win.h * ph;
      ctx.shadowColor = 'rgba(0,0,0,.28)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
      ctx.fillStyle = '#fff'; ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
      ctx.shadowColor = 'transparent';
      if (im) cover(ctx, im, wx, wy, ww, wh);
      else { ctx.fillStyle = colors[i % 5]; ctx.fillRect(wx, wy, ww, wh); }
      if (A.pol) ctx.drawImage(A.pol, -pw / 2, -ph / 2, pw, ph);
      ctx.restore();
    }

    /* z5 前口袋 */
    ctx.drawImage(A.pre, 0, 0, ew, eh);
    ctx.restore();
  }

  window.ssOpen = async function (id, info) {
    if (document.getElementById('ss-mask')) return;
    var S = {
      A: await getAssets(), bg: null, photos: [],
      info: Object.assign({ name: '', from: '', to: '', date: '', extra: '', seat: '', title: '' }, info || {})
    };

    var mask = document.createElement('div');
    mask.id = 'ss-mask';
    mask.style.cssText = 'position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,.65);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;';

    var scale = Math.min((window.innerWidth - 24) / W, (window.innerHeight - 120) / H);
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    cv.style.cssText = 'width:' + (W * scale) + 'px;height:' + (H * scale) + 'px;border-radius:16px;flex:none;cursor:pointer;';
    var cx = cv.getContext('2d');

    var raf = 0;
    function play() {
      cancelAnimationFrame(raf);
      var t0 = performance.now();
      (function f(now) {
        var p = now - t0;
        draw(cx, p, S);
        if (p < 2600) raf = requestAnimationFrame(f);
      })(t0);
    }
    function still() { cancelAnimationFrame(raf); draw(cx, 1e9, S); }
    cv.onclick = play;

    /* 按鈕列 */
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;justify-content:center;flex:none;';
    function mk(text, primary) {
      var b = document.createElement('button');
      b.textContent = text;
      b.style.cssText = 'padding:10px 16px;border:0;border-radius:99px;font-size:15px;background:' + (primary ? '#111' : '#fff') + ';color:' + (primary ? '#fff' : '#111') + ';';
      row.appendChild(b); return b;
    }
    function picker(multi, cb) {
      var inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = multi;
      inp.onchange = function () { cb(Array.prototype.slice.call(inp.files)); };
      inp.click();
    }
    function free(list) { list.forEach(function (o) { if (o && o.url) URL.revokeObjectURL(o.url); }); }
    async function toItem(file) {
      var blob = await compress(file);
      if (!blob) return null;
      var url = URL.createObjectURL(blob);
      var img = await load(url);
      return img ? { url: url, img: img } : null;
    }

    mk('背景').onclick = function () {
      picker(false, async function (fs) {
        if (!fs[0]) return;
        var it = await toItem(fs[0]); if (!it) return;
        free([S.bg]); S.bg = it; still();
      });
    };
    mk('拍立得照片').onclick = function () {
      picker(true, async function (fs) {
        if (!fs.length) return;
        if (fs.length > 5) { alert('最多 5 張，已取前 5 張'); fs = fs.slice(0, 5); }
        var items = [];
        for (var i = 0; i < fs.length; i++) { var it = await toItem(fs[i]); if (it) items.push(it); }
        free(S.photos); S.photos = items; play();
      });
    };
    mk('儲存 / 分享', true).onclick = async function () {
      var c = document.createElement('canvas'); c.width = W; c.height = H;
      draw(c.getContext('2d'), 1e9, S);
      var blob = await new Promise(function (r) { c.toBlob(r, 'image/png'); });
      if (!blob) return;
      var name = 'trip-story-' + (S.info.title || 'trip') + '-' + new Date().toISOString().slice(0, 10) + '.png';
      var file = new File([blob], name, { type: 'image/png' });
      try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file] }); return;
        }
      } catch (e) { if (e && e.name === 'AbortError') return; }
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a'); a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    };
    function close() {
      cancelAnimationFrame(raf);
      free([S.bg]); free(S.photos);
      if (mask.parentNode) mask.parentNode.removeChild(mask);
    }
    mk('關閉').onclick = close;
    mask.onclick = function (e) { if (e.target === mask) close(); };

    mask.appendChild(cv); mask.appendChild(row);
    document.body.appendChild(mask);
    play();
  };
})();