// =========================
// 1. CONSTANTS + DOM + STATE
// =========================

const ADMIN_PASSWORD_HASH = "f0635afc24f61efcde90a401cc892de7c2b4469af026ad99cc2bf2b7f4d7e63e";
const MODERATOR_PASSWORD_HASH = "d1d01b6be0b11bb5f2fa53e67caefb85c06b7a6344e435a098129107b1a13b76";

// --- DOM elements ---
const userAuthSection = document.getElementById("userAuthSection");
const userAuthForm = document.getElementById("userAuthForm");
const userPanel = document.getElementById("userPanel");
const userMessagesDiv = document.getElementById("userMessages");
const contactForm = document.getElementById("contactForm");

const loginSection = document.getElementById("loginSection");
const adminPassInput = document.getElementById("adminPass");
const loginBtn = document.getElementById("loginBtn");

const userLoginForm = document.getElementById("userLoginForm");
const logoutBtn = document.getElementById("logoutBtn");

const adminSection = document.getElementById("adminSection");
const submissionTable = document.getElementById("submissionTable");
const searchInput = document.getElementById("searchInput");

const showLoginBtn = document.getElementById("showLogin");
const showRegisterBtn = document.getElementById("showRegister");

// --- State ---
let submissions = JSON.parse(localStorage.getItem("submissions") || "[]");
let blockedUsers = JSON.parse(localStorage.getItem("blockedUsers") || "{}");
let users = JSON.parse(localStorage.getItem("users") || "[]");

let currentUser = null;

try {
  currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
} catch {
  currentUser = null;
}

let currentRole = localStorage.getItem("user_role") || null;

const isAdminLogged = () => localStorage.getItem("admin_logged") === "true";
// =========================
// 2. VIEW SYSTEM + NAVIGATION
// =========================

// --- Overlay ---
let overlay = document.getElementById("overlay");

if (!overlay) {
  overlay = document.createElement("div");
  overlay.id = "overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
  overlay.style.zIndex = "1000";
  overlay.style.display = "none";
  document.body.appendChild(overlay);
}

// --- View system ---
function setView(view) {
  const sections = [userAuthSection, loginSection, userPanel, adminSection];

  sections.forEach(s => s?.classList.add("hidden"));

  switch (view) {
    case "register":
      userAuthSection?.classList.remove("hidden");
      break;

    case "login":
      loginSection?.classList.remove("hidden");
      break;

    case "user":
      userPanel?.classList.remove("hidden");
      break;

    case "admin":
      adminSection?.classList.remove("hidden");
      break;
  }
}

// --- Navigation handlers ---
function showLogin() {
  setView("login");
}

function showRegister() {
  setView("register");
}

// --- Buttons ---
showLoginBtn?.addEventListener("click", showLogin);
showRegisterBtn?.addEventListener("click", showRegister);

// --- Default view ---
setView("login");

// --- Overlay control ---
function showOverlay() {
  overlay.style.display = "block";
  document.body.style.overflow = "hidden";
}

function hideOverlay() {
  overlay.style.display = "none";
  document.body.style.overflow = "";
}
// =========================
// 3. STORAGE + UTILS
// =========================

// --- Save helpers ---
function saveSubmissions() {
  localStorage.setItem("submissions", JSON.stringify(submissions));
}

function saveBlockedUsers() {
  localStorage.setItem("blockedUsers", JSON.stringify(blockedUsers));
}

function saveUsers() {
  localStorage.setItem("users", JSON.stringify(users));
}

function saveCurrentUser() {
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  localStorage.setItem("user_role", currentUser ? currentUser.role : "");
}

// --- HTML escape (XSS protection) ---
function escapeHTML(text) {
  if (!text) return "";

  return text.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "\"": return "&quot;";
      case "'": return "&#39;";
      default: return m;
    }
  });
}

// --- Block check (auto cleanup expired blocks) ---
function isUserBlocked(email) {
  const now = Date.now();

  if (!blockedUsers[email]) return false;

  if (blockedUsers[email] > now) {
    return true;
  }

  // auto unblock if expired
  delete blockedUsers[email];
  saveBlockedUsers();

  return false;
}
// =========================
// 4. USER MESSAGES DISPLAY
// =========================

function displayUserMessages() {
  if (!currentUser) return;

  const email = currentUser.email;
  userMessagesDiv.innerHTML = "";

  const userMsgs = submissions.filter(s => s.email === email);

  if (userMsgs.length === 0) {
    userMessagesDiv.innerHTML = "<p>Ви ще не залишали повідомлень.</p>";
    return;
  }

  userMsgs.forEach((msg) => {
    const div = document.createElement("div");
    div.className = "comment-box";

    div.innerHTML = `
      <div class="comment-meta">
        <span class="role-${escapeHTML(currentUser.role)}">
          ${escapeHTML(currentUser.role)}
        </span> | 
        <strong>${escapeHTML(msg.name)}</strong> 
        (${escapeHTML(msg.email)}) | 
        <small>${new Date(msg.timestamp).toLocaleString()}</small>
      </div>

      <div class="comment-text">
        ${escapeHTML(msg.message)}
      </div>

      ${msg.adminReply ? `
        <div class="comment-box admin-reply">
          <strong>Адміністратор:</strong>
          <div>${escapeHTML(msg.adminReply)}</div>
        </div>
      ` : ""}

      ${msg.moderatorReply ? `
        <div class="comment-box moderator-reply">
          <strong>Модератор:</strong>
          <div>${escapeHTML(msg.moderatorReply)}</div>
        </div>
      ` : ""}
    `;

    userMessagesDiv.appendChild(div);
  });
}
// =========================
// 5. USER REGISTRATION
// =========================

userAuthForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = userAuthForm.userEmail.value.trim().toLowerCase();

  const firstName = userAuthForm.userName.value.trim();
  const surname = userAuthForm.userSurname.value.trim();
  const password = userAuthForm.userPassword.value.trim();

  const name = `${firstName} ${surname}`.trim();

  // --- Validation ---
  if (!email || !firstName || !surname || !password) {
    alert("Заповніть всі поля");
    return;
  }

  if (password.length < 8) {
    alert("Пароль повинен містити мінімум 8 символів");
    return;
  }

  // --- Block check ---
  if (isUserBlocked(email)) {
    alert("Ви заблоковані");
    return;
  }

  // --- Existing user check ---
  const existingUser = users.find(u => u.email === email);

  if (existingUser) {
    alert("Користувач вже існує");
    return;
  }

  // --- Hash password ---
  const passwordHash = await sha256(password);

  // --- Create user ---
  const newUser = {
    email,
    name,
    password: passwordHash,
    role: "user"
  };

  users.push(newUser);
  saveUsers();

  currentUser = {
    email,
    name,
    role: "user"
  };

  saveCurrentUser();

  alert("Реєстрація успішна!");

  setView("user");
  displayUserMessages();

  userAuthForm.reset();
});
// =========================
// 6. USER LOGIN
// =========================

userLoginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail")?.value.trim().toLowerCase();
  const password = document.getElementById("loginPassword")?.value.trim();

  if (!email || !password) {
    alert("Заповніть всі поля");
    return;
  }

  // --- Find user ---
  const user = users.find(u => u.email === email);

  if (!user) {
    alert("Користувача не знайдено");
    return;
  }

  // --- Password check ---
  const passwordHash = await sha256(password);

  if (passwordHash !== user.password) {
    alert("Невірний пароль");
    return;
  }

  // --- Block check ---
  if (isUserBlocked(email)) {
    alert("Ви заблоковані");
    return;
  }

  // --- Set session ---
  currentUser = {
    email: user.email,
    name: user.name,
    role: user.role
  };

  saveCurrentUser();

  alert("Вхід успішний");

  setView("user");
  displayUserMessages();

  userLoginForm.reset();
});
// =========================
// 7. ADMIN / MODERATOR LOGIN
// =========================

loginBtn?.addEventListener("click", async () => {
  const pass = adminPassInput?.value.trim();

  if (!pass) {
    alert("Введіть пароль");
    return;
  }

  const passHash = await sha256(pass);

  // --- Admin login ---
  if (passHash === ADMIN_PASSWORD_HASH) {
    currentRole = "admin";
  }

  // --- Moderator login ---
  else if (passHash === MODERATOR_PASSWORD_HASH) {
    currentRole = "moderator";
  }

  else {
    alert("Невірний пароль");
    return;
  }

  // --- Save role/session ---
  localStorage.setItem("user_role", currentRole);
  localStorage.setItem("admin_logged", "true");

  // --- UI switch ---
  setView("admin");

  alert(`Вхід успішний: ${currentRole}`);

  adminPassInput.value = "";
});

// =========================
// LOGOUT (ADMIN / MOD)
// =========================

logoutBtn?.addEventListener("click", () => {
  localStorage.removeItem("admin_logged");
  localStorage.removeItem("user_role");

  currentRole = null;

  setView("login");
});

// =========================
// USER LOGOUT
// =========================

document.getElementById("userLogoutBtn")?.addEventListener("click", () => {
  currentUser = null;

  localStorage.removeItem("currentUser");
  localStorage.removeItem("user_role");

  setView("login");
});
// =========================
// 8. MESSAGES ACTIONS (CRUD)
// =========================

// --- Delete submission ---
function deleteSubmission(idx) {
  if (!canDelete()) {
    alert("Немає прав видаляти!");
    return;
  }

  if (!confirm("Видалити це повідомлення?")) return;

  if (idx < 0 || idx >= submissions.length) return;

  submissions.splice(idx, 1);
  saveSubmissions();

  loadSubmissions(searchInput?.value.trim() || "");
}

// --- Block user ---
function blockUserPrompt(email) {
  if (!canBlock()) {
    alert("Немає прав блокувати!");
    return;
  }

  const input = prompt(
    `Введіть тривалість блокування для ${email}\nФормати: 10m, 2h, 3d, 1y`,
    "1d"
  );

  if (!input) return;

  const match = input.trim().match(/^(\d+)([mhdy])$/i);

  if (!match) {
    alert("Невірний формат (10m, 2h, 3d, 1y)");
    return;
  }

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  const multipliers = {
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    y: 365 * 24 * 60 * 60 * 1000
  };

  blockedUsers[email] = Date.now() + value * multipliers[unit];
  saveBlockedUsers();

  alert(`Користувач ${email} заблокований`);
  loadSubmissions(searchInput?.value.trim() || "");
}

// --- Unblock user ---
function unblockUser(email) {
  if (!canBlock()) {
    alert("Немає прав розблокувати!");
    return;
  }

  if (!blockedUsers[email]) return;

  delete blockedUsers[email];
  saveBlockedUsers();

  alert(`Користувач ${email} розблокований`);
  loadSubmissions(searchInput?.value.trim() || "");
}

// --- Reply system ---
function showReplyPrompt(idx) {
  if (!canReply()) {
    alert("Немає прав відповідати!");
    return;
  }

  if (idx < 0 || idx >= submissions.length) return;

  const sub = submissions[idx];

  if (currentRole === "admin") {
    const reply = prompt("Відповідь адміністратора", sub.adminReply || "");
    if (reply !== null) {
      submissions[idx].adminReply = reply.trim();
    }
  }

  if (currentRole === "moderator") {
    const reply = prompt("Відповідь модератора", sub.moderatorReply || "");
    if (reply !== null) {
      submissions[idx].moderatorReply = reply.trim();
    }
  }

  saveSubmissions();
  loadSubmissions(searchInput?.value.trim() || "");
}
// =========================
// 9. ADMIN TABLE (LOAD)
// =========================

function loadSubmissions(filter = "") {
  if (!submissionTable) return;

  submissionTable.innerHTML = "";

  const f = filter.toLowerCase();

  const filteredSubs = submissions.filter(s =>
    (s.email || "").toLowerCase().includes(f)
  );

  filteredSubs.forEach((sub, idx) => {
    const tr = document.createElement("tr");

    const role = sub.role || "user";

    tr.innerHTML = `
      <td>${escapeHTML(sub.name)}</td>
      <td>${escapeHTML(sub.email)}</td>
      <td>${escapeHTML(sub.message)}</td>

      <td>
        ${escapeHTML(sub.adminReply || "")}
        ${escapeHTML(sub.moderatorReply || "")}
      </td>

      <td>
        <span class="role-${role}">
          ${escapeHTML(role)}
        </span>
      </td>

      <td>
        <button class="btn-small btn-reply" onclick="showReplyPrompt(${idx})">
          Відповісти
        </button>

        ${
          canDelete()
            ? `<button class="btn-small btn-delete" onclick="deleteSubmission(${idx})">
                Видалити
              </button>`
            : ""
        }

        ${
          canBlock()
            ? isUserBlocked(sub.email)
              ? `<button class="btn-small btn-unblock" onclick="unblockUser('${sub.email}')">
                  Розблокувати
                </button>`
              : `<button class="btn-small btn-block" onclick="blockUserPrompt('${sub.email}')">
                  Заблокувати
                </button>`
            : ""
        }
      </td>
    `;

    submissionTable.appendChild(tr);
  });
}

// --- Search ---
searchInput?.addEventListener("input", () => {
  loadSubmissions(searchInput.value.trim());
});
// =========================
// 10. INITIALIZATION + THEME
// =========================

// --- SHA256 ---
async function sha256(str) {
  const buf = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buf);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// --- Initialize app state ---
window.addEventListener("load", () => {
  const isAdmin = localStorage.getItem("admin_logged") === "true";

  if (isAdmin && currentRole) {
    setView("admin");
  }
  else if (currentUser) {
    setView("user");
    displayUserMessages();
  }
  else {
    setView("login");
  }

  loadSubmissions();
});

// =========================
// THEME TOGGLE
// =========================

document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("toggleTheme");

  if (!toggleBtn) return;

  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    toggleBtn.textContent = "☀️";
  } else {
    toggleBtn.textContent = "🌙";
  }

  toggleBtn.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark");

    toggleBtn.textContent = isDark ? "☀️" : "🌙";

    localStorage.setItem("theme", isDark ? "dark" : "light");
  });
});