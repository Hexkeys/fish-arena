const frame = document.getElementById("view");
const address = document.getElementById("address");
const back = document.getElementById("back");
const forward = document.getElementById("forward");
const reload = document.getElementById("reload");
const go = document.getElementById("go");
const home = document.getElementById("home");

const HOME = "https://example.com";
let history = [];
let index = -1;

function normalize(value) {
  value = value.trim();
  if (!/^https?:\/\//i.test(value)) value = "https://" + value;
  return new URL(value).href;
}

function load(value, push = true) {
  try {
    const url = normalize(value);
    if (push) {
      history = history.slice(0, index + 1);
      history.push(url);
      index++;
    }
    address.value = url;
    frame.src = "/proxy?url=" + encodeURIComponent(url);
    back.disabled = index <= 0;
    forward.disabled = index >= history.length - 1;
  } catch {
    address.focus();
    address.select();
  }
}

go.onclick = () => load(address.value);
address.onkeydown = (e) => { if (e.key === "Enter") load(address.value); };
back.onclick = () => { if (index > 0) { index--; load(history[index], false); } };
forward.onclick = () => { if (index < history.length - 1) { index++; load(history[index], false); } };
reload.onclick = () => load(history[index] || HOME, false);
home.onclick = () => load(HOME);

load(HOME);
