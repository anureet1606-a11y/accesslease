const STORAGE_KEY = "accesslease-access-flow-preview-v1";
const popup = document.getElementById("studentSigninPopup");
const message = document.getElementById("studentSigninMessage");
const previewButton = document.getElementById("previewSigninAlert");

function readState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function eventToken(item, index) {
  return String(item.id || item.at || `${item.email || "student"}-${index}`);
}

function showPopup(text) {
  message.textContent = text;
  popup.hidden = false;
}

function checkForNewSignIns() {
  const state = readState();
  const signIns = Array.isArray(state.signIns) ? state.signIns : [];
  if (!signIns.length) return;

  const latestIndex = signIns.length - 1;
  const latest = signIns[latestIndex];
  const latestToken = eventToken(latest, latestIndex);
  if (state.workspaceLastPopup === latestToken) return;

  const previousIndex = state.workspaceLastPopup
    ? signIns.findIndex((item, index) => eventToken(item, index) === state.workspaceLastPopup)
    : -1;
  const freshCount = previousIndex >= 0 ? signIns.length - previousIndex - 1 : 1;
  state.workspaceLastPopup = latestToken;
  signIns.slice(previousIndex + 1).forEach(item => { item.workspaceNotified = true; });
  state.signIns = signIns;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  showPopup(freshCount > 1
    ? `${freshCount} new student sign-ins are waiting for review.`
    : `${latest.email || "A student"} just signed in. Review the identity and request.`);
}

function previewSignInAlert() {
  const state = readState();
  const signIns = Array.isArray(state.signIns) ? state.signIns : [];
  const at = new Date().toISOString();
  const id = `preview-${Date.now()}`;
  const record = { id, email: "preview.student@example.com", seen: false, at, workspaceNotified: true };
  signIns.push(record);
  state.signIns = signIns;
  state.workspaceLastPopup = id;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  showPopup("Preview alert: preview.student@example.com just signed in. Review the inbox.");
}

document.getElementById("dismissStudentSignin").addEventListener("click", () => {
  popup.hidden = true;
});
previewButton?.addEventListener("click", previewSignInAlert);
window.addEventListener("storage", event => {
  if (event.key === STORAGE_KEY) checkForNewSignIns();
  if (event.key === null) popup.hidden = true;
});
window.addEventListener("focus", checkForNewSignIns);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) checkForNewSignIns();
});
checkForNewSignIns();
