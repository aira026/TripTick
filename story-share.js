/* story-share.js 第 3 段：由上落下、不遮擋、郵戳郵票 */
(function () {
  var W = 1080, H = 1920;

  var CFG = {
    stageW: 900, bottom: 200,
    ticket: { w: 760, cx: 450, top: 120, rot: -3, fall: 900 },
    photoW: 250, photoFall: 1000,
    /* 照片落點：[中心x, 頂端y, 旋轉角]，依張數 */
    layouts: {
      1: [[170, 330, -7]],
      2: [[170, 330, -8], [730, 330, 7]],
      3: [[160, 340, -8], [740, 340, 8], [450, 420, -2]],
      4: [[150, 330, -8], [750, 330, 8], [300, 440, 5], [600, 440, -5]],
      5: [[150, 320, -9], [750, 320, 9], [260, 450, 5], [640, 450, -4], [450, 400, 2]]
    },
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
  /* 落下帶一點點回彈 */
  function drop(t) {
    t = Math.max(0, Math.min(1, t));
    if (t >= 1) return 1;
    var b = 1 - Math.pow(1 - t, 3);
    return b + Math.sin(t * Math.PI) * 0.03;
  }

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

  /* 圓形郵戳：雙圈 + 目的地 + 日期 */
  function postmark(ctx, x, y, r, rot, line1, line2) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot * Math.PI / 180);
    ctx.globalAlpha = 0.78;
    ctx.strokeStyle = '#7a2e26'; ctx.fillStyle = '#7a2e26';
    ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r - 12, 0, Math.PI * 2); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '700 ' + Math.round(r * 0.26) + 'px "Space Mono", ui-monospace, monospace';
    ctx.fillText((line1 || 'AIR MAIL').toUpperCase().slice(0, 12), 0, -r * 0.22);
    ctx.font = '700 ' + Math.round(r * 0.2) + 'px "Space Mono", ui-monospace, monospace';
    ctx.fillText(line2 || '', 0, r * 0.22);
    ctx.restore();
  }

  /* 鋸齒邊郵票 */
  function stamp(ctx, x, y, w, h, rot, label) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot * Math.PI / 180);
    ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
    ctx.fillStyle = '#fbf6ea';
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = 'rgba(0,0,0,.0)';
    var step = 14, rr = 4;
    ctx.globalCompositeOperation = 'destination-out';
    for (var i = -w / 2; i <= w / 2; i += step) {
      ctx.beginPath(); ctx.arc(i, -h / 2, rr, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(i, h / 2, rr, 0, Math.PI * 2); ctx.fill();
    }
    for (var j = -h / 2; j <= h / 2; j += step) {
      ctx.beginPath(); ctx.arc(-w / 2, j, rr, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(w / 2, j, rr, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#2f4a7a';
    ctx.fillRect(-w / 2 + 12, -h / 2 + 12, w - 24, h - 24);
    ctx.fillStyle = '#fbf6ea'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '700 ' + Math.round(h * 0.34) + 'px "Space Mono", ui-monospace, monospace';
    ctx.fillText(label || '', 0, 0);
    ctx.restore();
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

    /* 信封後層（不動） */
    ctx.drawImage(A.env, 0, 0, ew, eh);

    /* 機票：先落，落點在照片後面、資訊區不被遮 */
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

    /* 拍立得：落在機票左右兩側，由上落下 */
    var n = Math.max(1, Math.min(5, S.photos.length || 3));
    var L = CFG.layouts[n];
    var win = A.win || { x: .08, y: .06, w: .84, h: .74 };
    var pw = CFG.photoW, ph = A.pol ? pw * A.pol.naturalHeight / A.pol.naturalWidth : pw * 1.2;
    var colors = ['#f4c7c3', '#c9dff0', '#d8ecc8', '#f3e3b5', '#e0cdee'];
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
      else { ctx.fillStyle = colors[i % 5]; ctx.fillRect(wx, wy, ww, wh); }
      if (A.pol) ctx.drawImage(A.pol, -pw / 2, -ph / 2, pw, ph);
      ctx.restore();
    }

    /* 前口袋 */
    ctx.drawImage(A.pre, 0, 0, ew, eh);
    ctx.restore();

    /* 郵票與郵戳（信封外、畫面角落），晚一點淡入 */
    var fade = ease((p - 1700) / 500);
    if (fade > 0) {
      ctx.save(); ctx.globalAlpha = fade;
      stamp(ctx, 900, 150, 130, 160, 6, I.code || '');
      postmark(ctx, 830, 190, 80, -12, I.to || 'AIR MAIL', I.date ? I.date.slice(0, 10) : '');
      ctx.restore();
    }
  }

  window.ssOpen = async function (id, info) {
    if (document.getElementById('ss-mask')) return;
    var S = {
      A: await getAssets(), bg: null, photos: [],
      info: Object.assign({ name: '', from: '', to: '', date: '', extra: '', seat: '', title: '', code: '' }, info || {})
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