/* story-share.js 第 5 段：斜插機票、標題郵票郵戳、透明背景、拖曳排版、點機票編輯 */
(function () {
  var W = 1080, H = 1920;

  var CFG = {
    files: { title: 'triptick.png', stamp: 'stamp.png', mark: 'postmark.png' },
    stageW: 900, bottom: 200,
    ticket: { w: 900, cx: 349, cy: 209, rot: 56, fall: 1400 },
    photoW: 250, photoFall: 1000,
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
    /* 以下座標以信封左上角為原點 */
    stamp: { x: 756, y: 846, w: 218, rot: 4 },
    mark:  { x: 787, y: 977, w: 409, rot: 0 },
    /* 以下是整張畫布座標 */
    title: { cy: 400, w: 620 }
  };

  var MONO = '"Space Mono", ui-monospace, Menlo, "PingFang TC", monospace';
  var RAD = Math.PI / 180;

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
      var F = CFG.files;
      assetsP = Promise.all([
        load('envelope.png'), load('pre-envelope.png'),
        load(encodeURI('air tickets.png')), load('Polaroid.png'),
        load(encodeURI(F.title)), load(encodeURI(F.stamp)), load(encodeURI(F.mark))
      ]).then(function (r) {
        return { env: r[0], pre: r[1], tk: r[2], pol: r[3], title: r[4], stamp: r[5], mark: r[6],
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
    var f = Math.round(size);
    for (; f > 8; f--) {
      ctx.font = '700 ' + f + 'px ' + MONO;
      if (ctx.measureText(txt).width <= maxW) break;
    }
    ctx.fillText(txt, x, y);
  }

  /* 機票本體 + 文字，原點在機票中心（預覽、完整機票共用） */
  function ticketFace(ctx, tw, th, S) {
    var A = S.A, I = S.info;
    if (!A.tk) return;
    ctx.drawImage(A.tk, -tw / 2, -th / 2, tw, th);
    ctx.fillStyle = '#3b2a24'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    var F = CFG.fields, size = tw * 0.024;
    var put = function (k, v) {
      var f = F[k];
      fitText(ctx, v, -tw / 2 + f.x * tw, -th / 2 + f.y * th, f.max * tw, size);
    };
    put('passenger', I.name); put('from', I.from); put('to', I.to);
    put('date', I.date); put('extra', I.extra); put('seat', I.seat);
  }

  /* 各物件的最終位置（動畫與點擊判斷共用） */
  function layout(S) {
    var A = S.A;
    var ew = CFG.stageW, eh = A.env ? ew * A.env.naturalHeight / A.env.naturalWidth : ew;
    var ox = (W - ew) / 2, oy = H - CFG.bottom - eh;
    var T = CFG.ticket, tw = T.w;
    var th = A.tk ? tw * A.tk.naturalHeight / A.tk.naturalWidth : tw * 0.28;
    var ticket = { cx: T.cx + S.offT[0], cy: T.cy + S.offT[1], rot: T.rot, w: tw, h: th };
    var n = Math.max(1, Math.min(3, S.photos.length || 3));
    var L = CFG.layouts[n], pw = CFG.photoW;
    var ph = A.pol ? pw * A.pol.naturalHeight / A.pol.naturalWidth : pw * 1.2;
    var photos = [];
    for (var i = 0; i < n; i++) {
      photos.push({ cx: L[i][0] + S.offP[i][0], cy: L[i][1] + ph / 2 + S.offP[i][1],
                    rot: L[i][2], w: pw, h: ph });
    }
    return { ew: ew, eh: eh, ox: ox, oy: oy, ticket: ticket, photos: photos, n: n };
  }

  function hitTest(S, x, y) {
    var L = layout(S), lx = x - L.ox, ly = y - L.oy;
    function inside(o) {
      var dx = lx - o.cx, dy = ly - o.cy, c = Math.cos(o.rot * RAD), s = Math.sin(o.rot * RAD);
      var rx = dx * c + dy * s, ry = -dx * s + dy * c;
      return Math.abs(rx) < o.w / 2 && Math.abs(ry) < o.h / 2;
    }
    for (var i = L.photos.length - 1; i >= 0; i--) if (inside(L.photos[i])) return { kind: 'p', i: i };
    if (inside(L.ticket)) return { kind: 't', i: 0 };
    return null;
  }

  function draw(ctx, p, S) {
    var A = S.A;
    ctx.clearRect(0, 0, W, H);
    if (S.bg) cover(ctx, S.bg.img, 0, 0, W, H);

    /* 標題與標語 */
    if (A.title) {
      var tw0 = CFG.title.w, th0 = tw0 * A.title.naturalHeight / A.title.naturalWidth;
      ctx.save(); ctx.globalAlpha = ease(p / 500);
      ctx.drawImage(A.title, (W - tw0) / 2, CFG.title.cy - th0 / 2, tw0, th0);
      ctx.restore();
    }
    if (!A.env || !A.pre) return;

    var L = layout(S);
    ctx.save();
    ctx.translate(L.ox, L.oy);
    ctx.drawImage(A.env, 0, 0, L.ew, L.eh);

    /* 機票（斜插，由上落下） */
    var T = L.ticket;
    var ty = T.cy - (1 - drop(p / 800)) * CFG.ticket.fall;
    ctx.save();
    ctx.translate(T.cx, ty); ctx.rotate(T.rot * RAD);
    ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
    if (A.tk) ctx.drawImage(A.tk, -T.w / 2, -T.h / 2, T.w, T.h);
    ctx.shadowColor = 'transparent';
    ctx.restore();
    ctx.save();
    ctx.translate(T.cx, ty); ctx.rotate(T.rot * RAD);
    ticketFace(ctx, T.w, T.h, S);
    ctx.restore();

    /* 拍立得 */
    var win = A.win || { x: .08, y: .06, w: .84, h: .74 };
    var colors = ['#f4c7c3', '#c9dff0', '#d8ecc8'];
    for (var i = 0; i < L.photos.length; i++) {
      var o = L.photos[i];
      var py = o.cy - (1 - drop((p - 700 - i * 160) / 800)) * (CFG.photoFall + o.h);
      var pw = o.w, ph = o.h;
      ctx.save();
      ctx.translate(o.cx, py); ctx.rotate(o.rot * RAD);
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

    /* 前口袋 */
    ctx.drawImage(A.pre, 0, 0, L.ew, L.eh);

    /* 郵票、郵戳（在信封前方） */
    var fade = ease((p - 1700) / 500);
    if (fade > 0) {
      ctx.save(); ctx.globalAlpha = fade;
      var st = CFG.stamp;
      if (A.stamp) {
        var sh = st.w * A.stamp.naturalHeight / A.stamp.naturalWidth;
        ctx.save(); ctx.translate(st.x, st.y); ctx.rotate(st.rot * RAD);
        ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
        ctx.drawImage(A.stamp, -st.w / 2, -sh / 2, st.w, sh);
        ctx.restore();
      }
      var mk = CFG.mark;
      if (A.mark) {
        var mh = mk.w * A.mark.naturalHeight / A.mark.naturalWidth;
        ctx.save(); ctx.translate(mk.x, mk.y); ctx.rotate(mk.rot * RAD);
        ctx.drawImage(A.mark, -mk.w / 2, -mh / 2, mk.w, mh);
        ctx.restore();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  window.ssOpen = async function (id, info) {
    if (document.getElementById('ss-mask')) return;
    var S = {
      A: await getAssets(), bg: null, photos: [],
      offT: [0, 0], offP: [[0, 0], [0, 0], [0, 0]],
      info: Object.assign({ name: '', from: '', to: '', date: '', extra: '', seat: '', title: '' }, info || {})
    };

    var mask = document.createElement('div');
    mask.id = 'ss-mask';
    mask.style.cssText = 'position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,.65);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;';

    var scale = Math.min((window.innerWidth - 24) / W, (window.innerHeight - 120) / H);
    var cv = newCanvas(W, H);
    cv.style.cssText = 'width:' + (W * scale) + 'px;height:' + (H * scale) + 'px;border-radius:16px;flex:none;touch-action:none;background-color:#eee;background-image:conic-gradient(#ccc 25%,#f4f4f4 0 50%,#ccc 0 75%,#f4f4f4 0);background-size:24px 24px;';
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

    /* ===== 拖曳排版 + 點擊 ===== */
    var drag = null;
    function pt(e) {
      var r = cv.getBoundingClientRect();
      return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
    }
    cv.onpointerdown = function (e) {
      var q = pt(e);
      drag = { hit: hitTest(S, q.x, q.y), sx: q.x, sy: q.y, lx: q.x, ly: q.y, moved: false };
      try { cv.setPointerCapture(e.pointerId); } catch (er) {}
    };
    cv.onpointermove = function (e) {
      if (!drag) return;
      var q = pt(e);
      if (!drag.moved && Math.hypot(q.x - drag.sx, q.y - drag.sy) > 12) drag.moved = true;
      if (drag.moved && drag.hit) {
        var dx = q.x - drag.lx, dy = q.y - drag.ly;
        var off = drag.hit.kind === 't' ? S.offT : S.offP[drag.hit.i];
        off[0] += dx; off[1] += dy; still();
      }
      drag.lx = q.x; drag.ly = q.y;
    };
    cv.onpointerup = function () {
      if (!drag) return;
      var d = drag; drag = null;
      if (d.moved) return;
      if (d.hit && d.hit.kind === 't') openTicket(); else play();
    };

    /* ===== 完整機票 + 編輯 ===== */
    function openTicket() {
      cancelAnimationFrame(raf); still();
      var ov = document.createElement('div');
      ov.style.cssText = 'position:absolute;inset:0;background:rgba(20,15,12,.92);overflow:auto;display:flex;flex-direction:column;align-items:center;gap:14px;padding:24px 16px;';
      var tw = 1000, th = A_th();
      function A_th() { return S.A.tk ? tw * S.A.tk.naturalHeight / S.A.tk.naturalWidth : 280; }
      var tc = newCanvas(tw, th);
      tc.style.cssText = 'width:min(100%,560px);height:auto;flex:none;border-radius:10px;';
      function paint() {
        var x = tc.getContext('2d'); x.clearRect(0, 0, tw, th);
        x.save(); x.translate(tw / 2, th / 2); ticketFace(x, tw, th, S); x.restore();
      }
      paint();
      ov.appendChild(tc);

      var grid = document.createElement('div');
      grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;width:min(100%,560px);';
      var keys = [['name', '旅客'], ['to', '目的地'], ['from', '航班 / 出發地'], ['date', '日期時間'], ['extra', 'SHELF 欄'], ['seat', '座位']];
      keys.forEach(function (k) {
        var lab = document.createElement('label');
        lab.style.cssText = 'display:flex;flex-direction:column;gap:4px;color:#e9dccb;font-size:13px;';
        lab.textContent = k[1];
        var inp = document.createElement('input');
        inp.value = S.info[k[0]] || '';
        inp.style.cssText = 'padding:10px;border:0;border-radius:10px;font-size:16px;';
        inp.oninput = function () { S.info[k[0]] = inp.value; paint(); still(); };
        lab.appendChild(inp); grid.appendChild(lab);
      });
      ov.appendChild(grid);

      var ok = document.createElement('button');
      ok.textContent = '完成';
      ok.style.cssText = 'padding:12px 40px;border:0;border-radius:99px;background:#fff;font-size:16px;flex:none;';
      ok.onclick = function () { if (ov.parentNode) ov.parentNode.removeChild(ov); still(); };
      ov.appendChild(ok);
      mask.appendChild(ov);
    }

    /* ===== 按鈕列 ===== */
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;justify-content:center;flex:none;max-width:' + (W * scale) + 'px;';
    function mk(text, primary) {
      var b = document.createElement('button');
      b.textContent = text;
      b.style.cssText = 'padding:9px 14px;border:0;border-radius:99px;font-size:14px;background:' + (primary ? '#111' : '#fff') + ';color:' + (primary ? '#fff' : '#111') + ';';
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
    mk('透明背景').onclick = function () { free([S.bg]); S.bg = null; still(); };
    mk('拍立得照片').onclick = function () {
      picker(true, async function (fs) {
        if (!fs.length) return;
        if (fs.length > 3) { alert('最多 3 張，已取前 3 張'); fs = fs.slice(0, 3); }
        var items = [];
        for (var i = 0; i < fs.length; i++) { var it = await toItem(fs[i]); if (it) items.push(it); }
        free(S.photos); S.photos = items; play();
      });
    };
    mk('重設排版').onclick = function () {
      S.offT = [0, 0]; S.offP = [[0, 0], [0, 0], [0, 0]]; play();
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