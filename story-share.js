/* story-share.js 第 4 段：3 張限制、郵戳波浪銷印、TRIPTICK 郵票 */
(function () {
  var W = 1080, H = 1920;

  var CFG = {
    stageW: 900, bottom: 200,
    ticket: { w: 760, cx: 450, top: -20, rot: -3, fall: 900 },
    photoW: 250, photoFall: 1000,
    /* 照片落點：[中心x, 頂端y, 旋轉角]，座標以信封左上角為原點 */
    layouts: {
      1: [[450, 240, -3]],
      2: [[230, 200, -8], [670, 200, 8]],
      3: [[230, 200, -8], [670, 200, 8], [450, 250, -2]]
    },
    fields: {
      passenger: { x: .17, y: .38, max: .27 },
      from:      { x: .13, y: .59, max: .13 },
      to:        { x: .61, y: .39, max: .16 },
      date:      { x: .60, y: .59, max: .17 },
      extra:     { x: .13, y: .775, max: .13 },
      seat:      { x: .53, y: .775, max: .10 }
    },
    /* 郵票與郵戳（畫布座標） */
    stamp: { x: 905, y: 175, w: 140, h: 170, rot: 6 },
    mark:  { x: 790, y: 225, r: 88, rot: -10 }
  };

  var MONO = '"Space Mono", ui-monospace, Menlo, "PingFang TC", monospace';
  var PLANE = 'M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z';
  var PLANE2 = 'm21.854 2.147-10.94 10.939';

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
  function drop(t) {
    t = Math.max(0, Math.min(1, t));
    if (t >= 1) return 1;
    return 1 - Math.pow(1 - t, 3) + Math.sin(t * Math.PI) * 0.03;
  }
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function newCanvas(w, h) {
    var c = document.createElement('canvas'); c.width = w; c.height = h; return c;
  }

  function detectWindow(img) {
    try {
      var c = newCanvas(img.naturalWidth, img.naturalHeight);
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
        load(encodeURI('air tickets.png')), load('Polaroid.png'),
        load('stamp-logo.png')
      ]).then(function (r) {
        return { env: r[0], pre: r[1], tk: r[2], pol: r[3], logo: r[4],
                 win: r[3] ? detectWindow(r[3]) : null };
      });
    }
    return assetsP;
  }

  async function compress(file) {
    var url = URL.createObjectURL(file);
    var im = await load(url);
    URL.revokeObjectURL(url);
    if (!im) return null;
    var s = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight));
    var w = Math.round(im.naturalWidth * s), h = Math.round(im.naturalHeight * s);
    var q = 0.9, blob = null;
    for (var n = 0; n < 8; n++) {
      var c = newCanvas(w, h);
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
      ctx.font = '700 ' + f + 'px ' + MONO;
      if (ctx.measureText(txt).width <= maxW) break;
    }
    ctx.fillText(txt, x, y);
  }

  /* ===== 郵票：獨立圖層繪製（鋸齒邊不會在匯出時變透明洞） ===== */
  function makeStamp(logo) {
    var w = CFG.stamp.w, h = CFG.stamp.h, pad = 10;
    var c = newCanvas(w + pad * 2, h + pad * 2), x = c.getContext('2d');
    x.translate(pad, pad);
    x.fillStyle = '#fbf6ea'; x.fillRect(0, 0, w, h);
    x.globalCompositeOperation = 'destination-out';
    var step = 14, rr = 4.5, i;
    for (i = step / 2; i < w; i += step) {
      x.beginPath(); x.arc(i, 0, rr, 0, 7); x.fill();
      x.beginPath(); x.arc(i, h, rr, 0, 7); x.fill();
    }
    for (i = step / 2; i < h; i += step) {
      x.beginPath(); x.arc(0, i, rr, 0, 7); x.fill();
      x.beginPath(); x.arc(w, i, rr, 0, 7); x.fill();
    }
    x.globalCompositeOperation = 'source-over';
    if (logo) {
      cover(x, logo, 12, 12, w - 24, h - 24);
    } else {
      x.fillStyle = '#2f4a7a'; x.fillRect(12, 12, w - 24, h - 24);
      x.strokeStyle = 'rgba(251,246,234,.55)'; x.lineWidth = 2;
      x.strokeRect(19, 19, w - 38, h - 38);
      x.save();
      x.translate(w / 2 - 30, h / 2 - 34); x.scale(2.5, 2.5);
      x.strokeStyle = '#fbf6ea'; x.lineWidth = 1.7;
      x.lineCap = 'round'; x.lineJoin = 'round';
      x.stroke(new Path2D(PLANE)); x.stroke(new Path2D(PLANE2));
      x.restore();
      x.fillStyle = '#fbf6ea'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = '700 15px ' + MONO;
      x.fillText('TRIPTICK', w / 2, h - 36);
    }
    return c;
  }

  /* ===== 郵戳 + 波浪銷印線（含墨跡斑駁） ===== */
  function makeMarks(info) {
    var c = newCanvas(W, 460), x = c.getContext('2d');
    var M = CFG.mark, R = rng(20251018);
    var ink = '#5b2a22';
    x.strokeStyle = ink; x.fillStyle = ink; x.lineCap = 'round';

    /* 圓形郵戳 */
    x.save();
    x.translate(M.x, M.y); x.rotate(M.rot * Math.PI / 180);
    x.lineWidth = 5; x.beginPath(); x.arc(0, 0, M.r, 0, 7); x.stroke();
    x.lineWidth = 2; x.beginPath(); x.arc(0, 0, M.r - 11, 0, 7); x.stroke();
    x.lineWidth = 2;
    x.beginPath(); x.moveTo(-M.r + 14, -8); x.lineTo(M.r - 14, -8);
    x.moveTo(-M.r + 14, 22); x.lineTo(M.r - 14, 22); x.stroke();
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = '700 15px ' + MONO;
    x.fillText('AIR MAIL', 0, -M.r * 0.5);
    var to = (info.to || info.title || '').toUpperCase();
    x.font = '700 22px ' + MONO;
    while (x.measureText(to).width > M.r * 1.55 && to.length > 2) to = to.slice(0, -1);
    x.fillText(to, 0, 7);
    var dt = (info.date || '').split(' ')[0];
    x.font = '700 15px ' + MONO;
    x.fillText(dt, 0, M.r * 0.55);
    x.restore();

    /* 波浪銷印線：橫跨郵戳與郵票 */
    x.lineWidth = 6;
    for (var k = 0; k < 5; k++) {
      var y0 = 135 + k * 33;
      x.beginPath();
      for (var px = 735; px <= 1030; px += 4) {
        var py = y0 + Math.sin((px - 735) / 48 * Math.PI * 2) * 9;
        if (px === 735) x.moveTo(px, py); else x.lineTo(px, py);
      }
      x.stroke();
    }

    /* 墨跡斑駁：隨機擦掉小點與墨塊 */
    x.globalCompositeOperation = 'destination-out';
    var i;
    for (i = 0; i < 1100; i++) {
      x.globalAlpha = 0.5 + R() * 0.5;
      x.beginPath(); x.arc(R() * W, R() * 460, 0.4 + R() * 2.2, 0, 7); x.fill();
    }
    for (i = 0; i < 45; i++) {
      x.globalAlpha = 0.25 + R() * 0.35;
      x.beginPath(); x.arc(700 + R() * 340, 100 + R() * 250, 3 + R() * 7, 0, 7); x.fill();
    }
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    return c;
  }

  function draw(ctx, p, S) {
    var A = S.A, I = S.info;
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

    ctx.save();
    ctx.translate(ox, oy);
    ctx.drawImage(A.env, 0, 0, ew, eh);

    /* 機票 */
    if (A.tk) {
      var T = CFG.ticket, tw = T.w, th = tw * A.tk.naturalHeight / A.tk.naturalWidth;
      var ty = T.top - (1 - drop(p / 800)) * (T.fall + th);
      ctx.save();
      ctx.translate(T.cx, ty + th / 2);
      ctx.rotate(T.rot * Math.PI / 180);
      ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
      ctx.drawImage(A.tk, -tw / 2, -th / 2, tw, th);
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#3b2a24'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      var F = CFG.fields;
      var put = function (k, v) {
        var f = F[k];
        fitText(ctx, v, -tw / 2 + f.x * tw, -th / 2 + f.y * th, f.max * tw, 18);
      };
      put('passenger', I.name); put('from', I.from); put('to', I.to);
      put('date', I.date); put('extra', I.extra); put('seat', I.seat);
      ctx.restore();
    }

    /* 拍立得（最多 3 張） */
    var n = Math.max(1, Math.min(3, S.photos.length || 3));
    var L = CFG.layouts[n];
    var win = A.win || { x: .08, y: .06, w: .84, h: .74 };
    var pw = CFG.photoW, ph = A.pol ? pw * A.pol.naturalHeight / A.pol.naturalWidth : pw * 1.2;
    var colors = ['#f4c7c3', '#c9dff0', '#d8ecc8'];
    for (var i = 0; i < n; i++) {
      var pos = L[i];
      var py = pos[1] - (1 - drop((p - 700 - i * 160) / 800)) * (CFG.photoFall + ph);
      ctx.save();
      ctx.translate(pos[0], py + ph / 2);
      ctx.rotate(pos[2] * Math.PI / 180);
      var im = S.photos[i] ? S.photos[i].img : null;
      var wx = -pw / 2 + win.x * pw, wy = -ph / 2 + win.y * ph, ww = win.w * pw, wh = win.h * ph;
      ctx.shadowColor = 'rgba(0,0,0,.28)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
      ctx.fillStyle = '#fff'; ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
      ctx.shadowColor = 'transparent';
      if (im) cover(ctx, im, wx, wy, ww, wh);
      else { ctx.fillStyle = colors[i % 3]; ctx.fillRect(wx, wy, ww, wh); }
      if (A.pol) ctx.drawImage(A.pol, -pw / 2, -ph / 2, pw, ph);
      ctx.restore();
    }

    ctx.drawImage(A.pre, 0, 0, ew, eh);
    ctx.restore();

    /* 郵票 + 郵戳銷印，淡入 */
    var fade = ease((p - 1700) / 500);
    if (fade > 0) {
      ctx.save(); ctx.globalAlpha = fade;
      var st = CFG.stamp;
      ctx.save();
      ctx.translate(st.x, st.y); ctx.rotate(st.rot * Math.PI / 180);
      ctx.shadowColor = 'rgba(0,0,0,.28)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
      ctx.drawImage(S.stampImg, -S.stampImg.width / 2, -S.stampImg.height / 2);
      ctx.restore();
      ctx.globalAlpha = fade * 0.82;
      ctx.drawImage(S.marks, 0, 0);
      ctx.restore();
    }
  }

  window.ssOpen = async function (id, info) {
    if (document.getElementById('ss-mask')) return;
    var S = {
      A: await getAssets(), bg: null, photos: [],
      info: Object.assign({ name: '', from: '', to: '', date: '', extra: '', seat: '', title: '' }, info || {})
    };
    S.stampImg = makeStamp(S.A.logo);
    S.marks = makeMarks(S.info);

    var mask = document.createElement('div');
    mask.id = 'ss-mask';
    mask.style.cssText = 'position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,.65);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;';

    var scale = Math.min((window.innerWidth - 24) / W, (window.innerHeight - 120) / H);
    var cv = newCanvas(W, H);
    cv.style.cssText = 'width:' + (W * scale) + 'px;height:' + (H * scale) + 'px;border-radius:16px;flex:none;cursor:pointer;';
    var cx = cv.getContext('2d');

    var raf = 0;
    function play() {
      cancelAnimationFrame(raf);
      var t0 = performance.now();
      (function f(now) {
        var p = now - t0;
        draw(cx, p, S);
        if (p < 2800) raf = requestAnimationFrame(f);
      })(t0);
    }
    function still() { cancelAnimationFrame(raf); draw(cx, 1e9, S); }
    cv.onclick = play;

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
        if (fs.length > 3) { alert('最多 3 張，已取前 3 張'); fs = fs.slice(0, 3); }
        var items = [];
        for (var i = 0; i < fs.length; i++) { var it = await toItem(fs[i]); if (it) items.push(it); }
        free(S.photos); S.photos = items; play();
      });
    };
    mk('儲存 / 分享', true).onclick = async function () {
      var c = newCanvas(W, H);
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