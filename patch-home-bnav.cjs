// 第二類：首頁不顯示下方導覽。只把 BN_PAGES 清單的 "home" 拿掉；CSS 不動；順便升 sw.js 版號。
const fs = require("fs");
const cp = require("child_process");
const APP = "app.js", SW = "sw.js";
const OLD = 'const BN_PAGES=["home","now","tix","storm","yen","pack","pool","more"];';
const NEW = 'const BN_PAGES=["now","tix","storm","yen","pack","pool","more"];';

const app0 = fs.readFileSync(APP, "utf8"), sw0 = fs.readFileSync(SW, "utf8");
const n = app0.split(OLD).length - 1;
if (n !== 1) {
  console.log(`找到 ${n} 處目標文字（應為 1）。停止，沒有改檔。若不是已套用過，請回報 git status --short 與 grep -n "BN_PAGES" app.js`);
  process.exit(n === 0 ? 0 : 1);
}
const vers = sw0.match(/hk-v\d+/g) || [];
if (!vers.length || new Set(vers).size !== 1) { console.log("sw.js 版號找不到或不一致。停止，沒有改檔。"); process.exit(1); }

const app1 = app0.replace(OLD, () => NEW);
const next = "hk-v" + (parseInt(vers[0].slice(4), 10) + 1);
fs.writeFileSync(APP, app1); fs.writeFileSync(SW, sw0.split(vers[0]).join(next));
const r = cp.spawnSync(process.execPath, ["--check", "--input-type=module"], { input: app1 });
if (r.status !== 0) {
  fs.writeFileSync(APP, app0); fs.writeFileSync(SW, sw0);
  console.log("語法檢查沒過，已全部還原。\n" + r.stderr);
  process.exit(1);
}
console.log(`完成：BN_PAGES 已拿掉 "home"；sw.js ${vers[0]} → ${next}；語法檢查通過`);
