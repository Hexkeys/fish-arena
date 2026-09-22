const form = document.querySelector("#nav");
const input = document.querySelector("#url");
const frame = document.querySelector("#view");
const welcome = document.querySelector("#welcome");
let history = [], index = -1;

function normalize(value) {
  let u = value.trim();
  if (!u) return "";
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  return u;
}
function openUrl(value, push = true) {
  const url = normalize(value);
  if (!url) return;
  if (push) {
    history = history.slice(0, index + 1);
    history.push(url);
    index++;
  }
  input.value = url;
  welcome.classList.add("hidden");
  frame.classList.add("visible");
  frame.src = "/proxy?url=" + encodeURIComponent(url);
}
form.addEventListener("submit", e => { e.preventDefault(); openUrl(input.value); });
document.querySelector("#back").onclick = () => {
  if (index > 0) { index--; openUrl(history[index], false); }
};
document.querySelector("#forward").onclick = () => {
  if (index < history.length - 1) { index++; openUrl(history[index], false); }
};
document.querySelector("#reload").onclick = () => {
  if (index >= 0) frame.src = frame.src;
};
document.querySelector("#home").onclick = () => {
  frame.classList.remove("visible"); welcome.classList.remove("hidden"); input.value = "https://example.com";
};
