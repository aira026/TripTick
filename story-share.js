/* story-share.js 第 1 段：視覺骨架（假資料） */
window.ssOpen = function () {
  var W = 1080, H = 1920;
  var SW = 900, SH = Math.round(900 * 1333 / 1180); /* 信封舞台 900 x 1017 */

  var mask = document.createElement('div');
  mask.style.cssText = 'position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,.6);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;';

  /* 預覽區：依視窗縮放 */
  var scale = Math.min((window.innerWidth - 32) / W, (window.innerHeight - 90) / H);
  var box = document.createElement('div');
  box.style.cssText = 'width:' + (W * scale) + 'px;height:' + (H * scale) + 'px;position:relative;overflow:hidden;border-radius:16px;flex:none;';

  var canvas = document.createElement('div');
  canvas.style.cssText = 'position:absolute;left:0;top:0;width:' + W + 'px;height:' + H + 'px;transform:scale(' + scale + ');transform-origin:top left;overflow:hidden;background:#d9c9b6;';

  /* 信封舞台 */
  var stage = document.createElement('div');
  stage.style.cssText = 'position:absolute;left:' + ((W - SW) / 2) + 'px;bottom:120px;width:' + SW + 'px;height:' + SH + 'px;';

  function img(src, z, extra) {
    var e = document.createElement('img');
    e.src = src;
    e.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;z-index:' + z + ';pointer-events:none;' + (extra || '');
    return e;
  }

  /* z1 信封 */
  stage.appendChild(img('envelope.png', 1));

  /* z2 拍立得假色塊 */
  var colors = ['#f4c7c3', '#c9dff0', '#d8ecc8'];
  var rots = [-10, 4, 11];
  var lefts = [140, 330, 520];
  for (var i = 0; i < 3; i++) {
    var p = document.createElement('div');
    p.style.cssText = 'position:absolute;z-index:2;width:240px;height:290px;top:' + (150 + i * 20) + 'px;left:' + lefts[i] + 'px;background:' + colors[i] + ';border:10px solid #fff;box-sizing:border-box;transform:rotate(' + rots[i] + 'deg);';
    stage.appendChild(p);
  }

  /* z3 機票（容器 + 假資料文字） */
  var tk = document.createElement('div');
  tk.style.cssText = 'position:absolute;z-index:3;left:60px;top:90px;width:780px;';
  var tkImg = document.createElement('img');
  tkImg.src = 'air tickets.png';
  tkImg.style.cssText = 'display:block;width:100%;height:auto;';
  tk.appendChild(tkImg);
  stage.appendChild(tk);

  /* z5 前口袋 */
  stage.appendChild(img('pre-envelope.png', 5));

  canvas.appendChild(stage);
  box.appendChild(canvas);

  var btn = document.createElement('button');
  btn.textContent = '關閉';
  btn.style.cssText = 'flex:none;padding:10px 40px;border:0;border-radius:99px;background:#fff;font-size:16px;';
  function close() { document.body.removeChild(mask); }
  btn.onclick = close;
  mask.onclick = function (e) { if (e.target === mask) close(); };

  mask.appendChild(box);
  mask.appendChild(btn);
  document.body.appendChild(mask);
};