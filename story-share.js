/* story-share.js 第 8 段：參考線吸附、郵戳日期、新分享圖示、LOGO 不可刪、整體下移 */
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
    stamp: { x: 756, y: 846, w: 218, rot: 4 },
    mark:  { x: 787, y: 977, w: 409, rot: 0 },
    /* 郵戳日期：相對郵戳圖中心的偏移，size 為字級 */
    markText: { x: -60, y: 0, size: 38, rot: 0 },
    title: { cy: 400, w: 620 },
    snap: 14, snapRot: 4,
    topSafe: 96
  };

  var ICON = {
    bg: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
    pol: '<rect x="4" y="3" width="16" height="18" rx="2"/><rect x="7" y="6" width="10" height="9" rx="1"/>',
    reset: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    share: '<path d="M12 15V3"/><path d="M8 7l4-4 4 4"/><path d="M6 10H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    zin: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M8 11h6M11 8v6"/>',
    zout: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M8 11h6"/>',
    rl: '<path d="M4 12a8 8 0 0 1 14-5.3"/><path d="M18 3v4h-4"/>',
    rr: '<path d="M20 12a8 8 0 0 0-14-5.3"/><path d="M6 3v4h4"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    del: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>'
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
  async function loadAny(names) {
    for (var i = 0; i < names.length; i++) {
      var im = await load(encodeURI(names[i]));
      if (im) return im;
    }
    return null;
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
        loadAny(['envelope.png', 'Envelope.png']),
        loadAny(['pre-envelope.png', 'Pre-envelope.png']),
        loadAny(['air tickets.png', 'Air tickets.png', 'air-tickets.png']),
        loadAny(['Polaroid.png', 'polaroid.png']),
        loadAny([F.title]), loadAny([F.stamp]), loadAny([F.mark])
      ]).then(function (r) {
        var names = ['envelope.png', 'pre-envelope.png', 'air tickets.png', 'Polaroid.png', F.title, F.stamp, F.mark];
        var missing = [];
        r.forEach(function (v, i) { if (!v) missing.push(names[i]); });
        if (missing.length) { console.warn('[story-share] 找不到圖檔：', missing); assetsP = null; }
        return { env: r[0], pre: r[1], tk: r[2], pol: r[3], title: r[4], stamp: r[5], mark: r[6],
                 missing: missing, win: r[3] ? detectWindow(r[3]) : null };
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

  function ticketText(ctx, tw, th, S) {
    var I = S.info;
    ctx.fillStyle = '#3b2a24'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    var F = CFG.fields, size = tw * 0.024;
    var put = function (k, v) {
      var f = F[k];
      fitText(ctx, v, -tw / 2 + f.x * tw, -th / 2 + f.y * th, f.max * tw, size);
    };
    put('passenger', I.name); put('from', I.from); put('to', I.to);
    put('date', I.date); put('extra', I.extra); put('seat', I.seat);
  }

  /* 日期轉成 2025.07.18 */
  function dotDate(s) {
    var m = String(s || '').match(/(\d{4})-(\d{2})-(\d{2})/);
    return m ? m[1] + '.' + m[2] + '.' + m[3] : '';
  }

  function placePhotos(S) {
    var n = Math.max(1, Math.min(3, S.photos.length || 3)), L = CFG.layouts[n];
    S.els.forEach(function (e) {
      if (e.k !== 'photo') return;
      if (e.i < n) {
        e.x = S.env.ox + L[e.i][0]; e.y = S.env.oy + L[e.i][1] + e.h / 2;
        e.rot = L[e.i][2]; e.sc = 1; e.vis = true;
      } else e.vis = false;
    });
  }

  function build(S) {
    var A = S.A, ew = CFG.stageW;
    var eh = A.env ? ew * A.env.naturalHeight / A.env.naturalWidth : ew;
    var ox = (W - ew) / 2, oy = H - CFG.bottom - eh;
    S.env = { ew: ew, eh: eh, ox: ox, oy: oy };
    var T = CFG.ticket, tw = T.w;
    var th = A.tk ? tw * A.tk.naturalHeight / A.tk.naturalWidth : tw * 0.28;
    var els = [{ k: 'ticket', x: ox + T.cx, y: oy + T.cy, rot: T.rot, sc: 1, vis: !!A.tk, w: tw, h: th, front: false }];
    var pw = CFG.photoW, ph = A.pol ? pw * A.pol.naturalHeight / A.pol.naturalWidth : pw * 1.2;
    for (var i = 0; i < 3; i++) els.push({ k: 'photo', i: i, x: 0, y: 0, rot: 0, sc: 1, vis: true, w: pw, h: ph, front: false });
    var st = CFG.stamp, mk = CFG.mark, ti = CFG.title;
    els.push({ k: 'stamp', x: ox + st.x, y: oy + st.y, rot: st.rot, sc: 1, vis: !!A.stamp, w: st.w,
               h: A.stamp ? st.w * A.stamp.naturalHeight / A.stamp.naturalWidth : st.w, front: true });
    els.push({ k: 'mark', x: ox + mk.x, y: oy + mk.y, rot: mk.rot, sc: 1, vis: !!A.mark, w: mk.w,
               h: A.mark ? mk.w * A.mark.naturalHeight / A.mark.naturalWidth : mk.w, front: true });
    els.push({ k: 'title', x: W / 2, y: ti.cy, rot: 0, sc: 1, vis: !!A.title, w: ti.w,
               h: A.title ? ti.w * A.title.naturalHeight / A.title.naturalWidth : ti.w * 0.3, front: true, nodel: true });
    S.els = els; S.sel = null; S.guides = [];
    placePhotos(S);
  }

  function hit(S, x, y) {
    var list = S.els.filter(function (e) { return !e.front; }).concat(S.els.filter(function (e) { return e.front; }));
    for (var i = list.length - 1; i >= 0; i--) {
      var e = list[i];
      if (!e.vis) continue;
      var dx = x - e.x, dy = y - e.y, c = Math.cos(e.rot * RAD), s = Math.sin(e.rot * RAD);
      var rx = (dx * c + dy * s) / e.sc, ry = (-dx * s + dy * c) / e.sc;
      if (Math.abs(rx) < e.w / 2 && Math.abs(ry) < e.h / 2) return e;
    }
    return null;
  }

  function drawEl(ctx, e, S, p) {
    if (!e.vis) return;
    var A = S.A, dy = 0, al = 1;
    if (e.k === 'ticket') dy = -(1 - drop(p / 800)) * CFG.ticket.fall;
    else if (e.k === 'photo') dy = -(1 - drop((p - 700 - e.i * 160) / 800)) * (CFG.photoFall + e.h);
    else if (e.k === 'title') al = ease(p / 500);
    else al = ease((p - 1700) / 500);
    if (al <= 0) return;
    var w = e.w, h = e.h;
    ctx.save();
    ctx.globalAlpha = al;
    ctx.translate(e.x, e.y + dy); ctx.rotate(e.rot * RAD); ctx.scale(e.sc, e.sc);
    if (e.k === 'ticket') {
      ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
      ctx.drawImage(A.tk, -w / 2, -h / 2, w, h);
      ctx.shadowColor = 'transparent';
      ticketText(ctx, w, h, S);
    } else if (e.k === 'photo') {
      var win = A.win || { x: .08, y: .06, w: .84, h: .74 };
      var colors = ['#f4c7c3', '#c9dff0', '#d8ecc8'];
      var im = S.photos[e.i] ? S.photos[e.i].img : null;
      var wx = -w / 2 + win.x * w, wy = -h / 2 + win.y * h, ww = win.w * w, wh = win.h * h;
      ctx.shadowColor = 'rgba(0,0,0,.28)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
      ctx.fillStyle = '#fff'; ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.shadowColor = 'transparent';
      if (im) cover(ctx, im, wx, wy, ww, wh);
      else { ctx.fillStyle = colors[e.i % 3]; ctx.fillRect(wx, wy, ww, wh); }
      if (A.pol) ctx.drawImage(A.pol, -w / 2, -h / 2, w, h);
    } else {
      var img = A[e.k];
      if (img) {
        if (e.k === 'stamp') { ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3; }
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        ctx.shadowColor = 'transparent';
        if (e.k === 'mark') {
          var d = dotDate(S.info.date);
          if (d) {
            var T = CFG.markText;
            ctx.save();
            ctx.translate(T.x, T.y); ctx.rotate(T.rot * RAD);
            ctx.globalAlpha = al * 0.9;
            ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.font = '700 ' + T.size + 'px ' + MONO;
            var pp = d.split('.');
            ctx.fillText(pp[0] + '.', 0, -T.size * 0.6);
            ctx.fillText(pp[1] + '.' + pp[2], 0, T.size * 0.6);
            ctx.restore();
          }
        }
      }
    }
    ctx.restore();
  }

  function frame(ctx, e) {
    ctx.save();
    ctx.translate(e.x, e.y); ctx.rotate(e.rot * RAD); ctx.scale(e.sc, e.sc);
    ctx.setLineDash([16 / e.sc, 10 / e.sc]);
    ctx.lineWidth = 4 / e.sc; ctx.strokeStyle = '#fff';
    ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 6;
    ctx.strokeRect(-e.w / 2, -e.h / 2, e.w, e.h);
    ctx.restore();
  }

  function drawGuides(ctx, S) {
    if (!S.guides || !S.guides.length) return;
    ctx.save();
    ctx.strokeStyle = '#ff2d78'; ctx.lineWidth = 3; ctx.setLineDash([]);
    ctx.shadowColor = 'rgba(255,45,120,.6)'; ctx.shadowBlur = 8;
    S.guides.forEach(function (g) {
      ctx.beginPath();
      if (g === 'v') { ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); }
      else { ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); }
      ctx.stroke();
    });
    ctx.restore();
  }

  function draw(ctx, p, S, ui) {
    var A = S.A;
    ctx.clearRect(0, 0, W, H);
    if (S.bg) cover(ctx, S.bg.img, 0, 0, W, H);

    if (ui && A.missing && A.missing.length) {
      ctx.save();
      ctx.fillStyle = '#7a2e26'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '700 34px ' + MONO;
      ctx.fillText('找不到圖檔：', W / 2, 900);
      ctx.font = '700 28px ' + MONO;
      A.missing.forEach(function (m, i) { ctx.fillText(m, W / 2, 950 + i * 40); });
      ctx.restore();
    }

    if (A.env) ctx.drawImage(A.env, S.env.ox, S.env.oy, S.env.ew, S.env.eh);
    S.els.filter(function (e) { return !e.front; }).forEach(function (e) { drawEl(ctx, e, S, p); });
    if (A.pre) ctx.drawImage(A.pre, S.env.ox, S.env.oy, S.env.ew, S.env.eh);
    S.els.filter(function (e) { return e.front; }).forEach(function (e) { drawEl(ctx, e, S, p); });
    if (ui && S.sel && S.sel.vis) frame(ctx, S.sel);
    if (ui) drawGuides(ctx, S);
  }

  /* 拖曳吸附：回傳要顯示的參考線 */
  function snapMove(e) {
    var g = [];
    if (Math.abs(e.x - W / 2) < CFG.snap) { e.x = W / 2; g.push('v'); }
    if (Math.abs(e.y - H / 2) < CFG.snap) { e.y = H / 2; g.push('h'); }
    return g;
  }
  function snapRot(e) {
    var r = ((e.rot % 360) + 360) % 360, hit = false;
    [0, 90, 180, 270, 360].forEach(function (a) {
      if (Math.abs(r - a) < CFG.snapRot) { e.rot = a % 360; hit = true; }
    });
    return hit;
  }

  window.ssOpen = async function (id, info) {
    if (document.getElementById('ss-mask')) return;
    var S = {
      A: await getAssets(), bg: null, photos: [], els: [], sel: null, env: null, guides: [],
      info: Object.assign({ name: '', from: '', to: '', date: '', extra: '', seat: '', title: '' }, info || {})
    };
    build(S);

    var mask = document.createElement('div');
    mask.id = 'ss-mask';
    mask.style.cssText = 'position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,.65);display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:8px;padding:calc(' + CFG.topSafe + 'px + env(safe-area-inset-top)) 0 calc(10px + env(safe-area-inset-bottom));box-sizing:border-box;';

    var availH = window.innerHeight - CFG.topSafe - 10 - 42 - 8 - 46 - 8 - 24;
    var scale = Math.min((window.innerWidth - 24) / W, availH / H);
    var cv = newCanvas(W, H);
    cv.style.cssText = 'width:' + (W * scale) + 'px;height:' + (H * scale) + 'px;border-radius:16px;flex:none;touch-action:none;background:linear-gradient(180deg,#cdb99f,#a8927a);';
    var cx = cv.getContext('2d');

    var raf = 0;
    function play() {
      cancelAnimationFrame(raf);
      var t0 = performance.now();
      (function f(now) {
        var p = now - t0;
        draw(cx, p, S, true);
        if (p < 2800) raf = requestAnimationFrame(f);
      })(t0);
    }
    function still() { cancelAnimationFrame(raf); draw(cx, 1e9, S, true); }

    function iconBtn(parent, icon, label, primary, size) {
      var b = document.createElement('button');
      b.title = label; b.setAttribute('aria-label', label);
      b.innerHTML = '<svg viewBox="0 0 24 24" width="' + (size - 24) + '" height="' + (size - 24) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + icon + '</svg>';
      b.style.cssText = 'width:' + size + 'px;height:' + size + 'px;border:0;border-radius:50%;display:flex;align-items:center;justify-content:center;flex:none;background:' + (primary ? '#111' : '#fff') + ';color:' + (primary ? '#fff' : '#111') + ';';
      parent.appendChild(b); return b;
    }

    var bar = document.createElement('div');
    bar.style.cssText = 'display:flex;gap:8px;justify-content:center;flex:none;visibility:hidden;';
    var bZout = iconBtn(bar, ICON.zout, '縮小', false, 42);
    var bZin = iconBtn(bar, ICON.zin, '放大', false, 42);
    var bRl = iconBtn(bar, ICON.rl, '向左轉', false, 42);
    var bRr = iconBtn(bar, ICON.rr, '向右轉', false, 42);
    var bEdit = iconBtn(bar, ICON.edit, '編輯機票文字', false, 42);
    var bDel = iconBtn(bar, ICON.del, '刪除', false, 42);
    function syncBar() {
      bar.style.visibility = S.sel ? 'visible' : 'hidden';
      bEdit.style.display = S.sel && S.sel.k === 'ticket' ? 'flex' : 'none';
      bDel.style.display = S.sel && S.sel.nodel ? 'none' : 'flex';
    }
    function clampSc(v) { return Math.max(0.3, Math.min(3, v)); }
    bZin.onclick = function () { if (S.sel) { S.sel.sc = clampSc(S.sel.sc * 1.1); still(); } };
    bZout.onclick = function () { if (S.sel) { S.sel.sc = clampSc(S.sel.sc / 1.1); still(); } };
    bRl.onclick = function () { if (S.sel) { S.sel.rot -= 10; still(); } };
    bRr.onclick = function () { if (S.sel) { S.sel.rot += 10; still(); } };
    bDel.onclick = function () { if (S.sel && !S.sel.nodel) { S.sel.vis = false; S.sel = null; syncBar(); still(); } };
    bEdit.onclick = function () { openTicket(); };

    var ptrs = {}, g = null;
    function pt(e) {
      var r = cv.getBoundingClientRect();
      return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
    }
    cv.onpointerdown = function (e) {
      var q = pt(e); ptrs[e.pointerId] = q;
      try { cv.setPointerCapture(e.pointerId); } catch (er) {}
      var ids = Object.keys(ptrs);
      if (ids.length === 1) {
        var prev = S.sel, h = hit(S, q.x, q.y);
        S.sel = h;
        g = { mode: 'drag', el: h, was: !!h && prev === h, sx: q.x, sy: q.y, lx: q.x, ly: q.y, moved: false };
        syncBar(); still();
      } else if (ids.length === 2 && S.sel) {
        var a = ptrs[ids[0]], b = ptrs[ids[1]];
        g = { mode: 'pinch', el: S.sel, d0: Math.hypot(b.x - a.x, b.y - a.y) || 1,
              a0: Math.atan2(b.y - a.y, b.x - a.x), sc0: S.sel.sc, r0: S.sel.rot, moved: true };
      }
    };
    cv.onpointermove = function (e) {
      if (!ptrs[e.pointerId]) return;
      var q = pt(e); ptrs[e.pointerId] = q;
      if (!g || !g.el) return;
      if (g.mode === 'drag') {
        if (!g.moved && Math.hypot(q.x - g.sx, q.y - g.sy) > 12) g.moved = true;
        if (g.moved) {
          g.el.x += q.x - g.lx; g.el.y += q.y - g.ly;
          S.guides = snapMove(g.el);
          still();
        }
        g.lx = q.x; g.ly = q.y;
      } else if (g.mode === 'pinch') {
        var ids = Object.keys(ptrs);
        if (ids.length < 2) return;
        var a = ptrs[ids[0]], b = ptrs[ids[1]];
        g.el.sc = clampSc(g.sc0 * Math.hypot(b.x - a.x, b.y - a.y) / g.d0);
        g.el.rot = g.r0 + (Math.atan2(b.y - a.y, b.x - a.x) - g.a0) / RAD;
        snapRot(g.el);
        still();
      }
    };
    function up(e) {
      delete ptrs[e.pointerId];
      var left = Object.keys(ptrs).length;
      if (g && g.mode === 'drag' && !g.moved && left === 0) {
        if (g.el && g.el.k === 'ticket' && g.was) openTicket();
      }
      if (left === 0 || (g && g.mode === 'pinch')) g = null;
      if (left === 0) { S.guides = []; still(); }
    }
    cv.onpointerup = up; cv.onpointercancel = up;

    function openTicket() {
      still();
      var ov = document.createElement('div');
      ov.style.cssText = 'position:fixed;inset:0;z-index:3100;background:#1d1612;display:flex;flex-direction:column;';
      var tw = 1000, th = S.A.tk ? tw * S.A.tk.naturalHeight / S.A.tk.naturalWidth : 280;
      var top = document.createElement('div');
      top.style.cssText = 'flex:none;padding:calc(14px + env(safe-area-inset-top)) 16px 12px;display:flex;justify-content:center;';
      var tc = newCanvas(tw, th);
      tc.style.cssText = 'display:block;width:min(100%,460px);height:auto;border-radius:10px;';
      function paint() {
        var x = tc.getContext('2d'); x.clearRect(0, 0, tw, th);
        if (S.A.tk) x.drawImage(S.A.tk, 0, 0, tw, th);
        x.save(); x.translate(tw / 2, th / 2); ticketText(x, tw, th, S); x.restore();
      }
      paint();
      top.appendChild(tc); ov.appendChild(top);

      var form = document.createElement('div');
      form.style.cssText = 'flex:1;min-height:0;overflow-y:auto;padding:4px 16px 16px;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;align-content:start;';
      var keys = [['name', '旅客 PASSENGER', 1], ['to', '目的地 DESTINATION', 1],
                  ['date', '日期時間 DATE & TIME', 2],
                  ['from', '航班 FLIGHT', 1], ['seat', '座位 SEAT', 1],
                  ['extra', 'SHELF', 2]];
      keys.forEach(function (k) {
        var lab = document.createElement('label');
        lab.style.cssText = 'display:flex;flex-direction:column;gap:5px;min-width:0;color:#e9dccb;font-size:12px;' + (k[2] === 2 ? 'grid-column:1 / -1;' : '');
        lab.textContent = k[1];
        var inp = document.createElement('input');
        inp.value = S.info[k[0]] || '';
        inp.style.cssText = 'width:100%;box-sizing:border-box;padding:11px 12px;border:0;border-radius:10px;font-size:16px;background:#fff;color:#111;';
        inp.oninput = function () { S.info[k[0]] = inp.value; paint(); still(); };
        lab.appendChild(inp); form.appendChild(lab);
      });
      ov.appendChild(form);

      var foot = document.createElement('div');
      foot.style.cssText = 'flex:none;padding:12px 16px calc(12px + env(safe-area-inset-bottom));border-top:1px solid rgba(255,255,255,.12);';
      var ok = document.createElement('button');
      ok.textContent = '完成';
      ok.style.cssText = 'width:100%;padding:14px;border:0;border-radius:99px;background:#fff;color:#111;font-size:16px;font-weight:600;';
      ok.onclick = function () { if (ov.parentNode) ov.parentNode.removeChild(ov); still(); };
      foot.appendChild(ok); ov.appendChild(foot);
      document.body.appendChild(ov);
    }

    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;justify-content:center;flex:none;';
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

    iconBtn(row, ICON.bg, '背景照片', false, 46).onclick = function () {
      picker(false, async function (fs) {
        if (!fs[0]) return;
        var it = await toItem(fs[0]); if (!it) return;
        free([S.bg]); S.bg = it; still();
      });
    };
    iconBtn(row, ICON.pol, '拍立得照片（最多 3 張）', false, 46).onclick = function () {
      picker(true, async function (fs) {
        if (!fs.length) return;
        if (fs.length > 3) { alert('最多 3 張，已取前 3 張'); fs = fs.slice(0, 3); }
        var items = [];
        for (var i = 0; i < fs.length; i++) { var it = await toItem(fs[i]); if (it) items.push(it); }
        free(S.photos); S.photos = items;
        S.sel = null; syncBar(); placePhotos(S); play();
      });
    };
    iconBtn(row, ICON.reset, '重設排版', false, 46).onclick = function () {
      build(S); syncBar(); play();
    };
    iconBtn(row, ICON.share, '儲存 / 分享', true, 46).onclick = async function () {
      var c = newCanvas(W, H);
      draw(c.getContext('2d'), 1e9, S, false);
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
    iconBtn(row, ICON.close, '關閉', false, 46).onclick = close;

    mask.appendChild(cv); mask.appendChild(bar); mask.appendChild(row);
    document.body.appendChild(mask);
    play();
  };
})();