const STORAGE_KEY = "accesslease-access-flow-preview-v1";
const popup = document.getElementById("studentSigninPopup");
const message = document.getElementById("studentSigninMessage");

function readState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function checkForNewSignIns() {
  const state = readState();
  const signIns = Array.isArray(state.signIns) ? state.signIns : [];
  const fresh = signIns.filter(item => !item.workspaceNotified);
  if (!fresh.length) return;

  fresh.forEach(item => { item.workspaceNotified = true; });
  state.signIns = signIns;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  const latest = fresh[fresh.length - 1];
  message.textContent = fresh.length > 1
    ? `${fresh.length} new student sign-ins are waiting for review.`
    : `${latest.email || "A student"} just signed in. Review the identity and request.`;
  popup.hidden = false;
}

document.getElementById("dismissStudentSignin").addEventListener("click", () => {
  popup.hidden = true;
});
window.addEventListener("storage", event => {
  if (event.key === STORAGE_KEY) checkForNewSignIns();
  if (event.key === null) popup.hidden = true;
});
window.addEventListener("focus", checkForNewSignIns);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) checkForNewSignIns();
});
checkForNewSignIns();
