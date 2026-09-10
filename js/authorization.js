// ==================== CORE CONFIG ====================
const DB_KEY = 'moderation.users.v1';
const CURRENT_USER = 'moderation.currentUser';
const COMMENTS_KEY = 'moderation.comments.v1';

// ==================== STATE ====================
let currentUser = null;
let isRegister = false;

// ==================== UTILS ====================
const uid = () => Math.random().toString(36).slice(2, 9);

// ==================== NOTIFY ====================
const notify = (msg) => {
  const n = document.createElement('div');
  n.className = 't';
  n.textContent = msg;
  document.getElementById('toast').appendChild(n);
  setTimeout(() => n.remove(), 4000);
};

// ==================== STORAGE: USERS ====================
function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(DB_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function saveUsers(list) {
  localStorage.setItem(DB_KEY, JSON.stringify(list));
}

// ==================== STORAGE: CURRENT USER ====================
function saveCurrentUser() {
  localStorage.setItem(CURRENT_USER, JSON.stringify(currentUser));
}

function loadCurrentUser() {
  const u = localStorage.getItem(CURRENT_USER);
  return u ? JSON.parse(u) : null;
}

// ==================== STORAGE: COMMENTS ====================
function getComments() {
  try {
    return JSON.parse(localStorage.getItem(COMMENTS_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function saveComments(list) {
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(list));
}

// ==================== HASH PASSWORD ====================
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ==================== FORM ELEMENTS ====================
const authForm = document.getElementById('authForm');
const toggleForm = document.getElementById('toggleForm');
const formTitle = document.getElementById('formTitle');

const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const submitBtn = document.getElementById('submitBtn');

// ==================== TOGGLE LOGIN / REGISTER ====================
toggleForm.addEventListener('click', () => {
  isRegister = !isRegister;

  nameInput.style.display = isRegister ? 'block' : 'none';
  submitBtn.textContent = isRegister ? 'Зареєструватися' : 'Увійти';
  formTitle.textContent = isRegister ? 'Реєстрація' : 'Вхід';
  toggleForm.textContent = isRegister ? 'Перейти до входу' : 'Перейти до реєстрації';

  authForm.reset();
});

// ==================== AUTH SUBMIT ====================
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const pass = passwordInput.value;
  let users = getUsers();

  if (isRegister) {
    // ================= REGISTER =================
    if (users.find(u => u.email === email)) {
      notify('Користувач вже існує');
      return;
    }

    const name = nameInput.value.trim();
    if (!name) {
      notify("Введіть ім'я");
      return;
    }

    const hashedPass = await hashPassword(pass);

    const newUser = {
      id: uid(),
      name,
      email,
      password: hashedPass,
      role: 'user',
      status: 'active',
      banUntil: null,
      violations: []
    };

    users.push(newUser);
    saveUsers(users);

    currentUser = newUser;
    saveCurrentUser();

    notify('Реєстрація успішна');

  } else {
    // ================= LOGIN =================
    const hashedPass = await hashPassword(pass);

    const user = users.find(
      u => u.email === email && u.password === hashedPass
    );

    if (!user) {
      notify('Невірний email або пароль');
      return;
    }

    currentUser = user;
    saveCurrentUser();

    notify('Вхід успішний');
  }

  // після входу/реєстрації
  afterAuth();
});

// ==================== AFTER AUTH ====================
function afterAuth() {
  if (!currentUser) return;

  if (currentUser.role === 'admin') {
    document.getElementById('secretPanel').style.display = 'block';
    renderUserTable();
  } else {
    renderUserPanel();
  }
}


// ==================== ADMIN / USER DOM ====================
const secretPanel = document.getElementById('secretPanel');
const userTbody = document.getElementById('userTbody');

const userPanel = document.getElementById('userPanel');
const userInfo = document.getElementById('userInfo');
const violationsTbody = document.getElementById('violationsTbody');

// ==================== USER PANEL ====================
function renderUserPanel() {
  if (!currentUser) return;

  userInfo.textContent =
    `Ім'я: ${currentUser.name}, Email: ${currentUser.email}, Роль: ${currentUser.role}`;

  violationsTbody.innerHTML = '';

  (currentUser.violations || []).forEach(v => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${v.type}</td>
      <td>${v.reason}</td>
      <td>${new Date(v.t).toLocaleString('uk-UA')}</td>
      <td>${v.until ? new Date(v.until).toLocaleString('uk-UA') : ''}</td>
    `;

    violationsTbody.appendChild(tr);
  });

  userPanel.style.display = 'block';
}

// ==================== USERS TABLE ====================
function renderUserTable() {
  const users = getUsers();
  userTbody.innerHTML = '';

  users.forEach(u => {

    const statusClass =
      u.status === 'banned' ? 'ban' :
      u.status === 'warned' ? 'warn' :
      'user';

    const roleOptions = ['user', 'moderator', 'admin']
      .map(r => `<option value="${r}" ${u.role === r ? 'selected' : ''}>${r}</option>`)
      .join('');

    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${u.name}</td>
      <td>${u.email}</td>

      <td>
        ${currentUser.role === 'admin'
          ? `<select onchange="changeRole('${u.id}', this.value)">
              ${roleOptions}
            </select>`
          : `<span class="pill ${u.role}">${u.role}</span>`
        }
      </td>

      <td>${u.ip || ''}</td>

      <td><span class="pill ${statusClass}">${u.status}</span></td>

      <td>${u.banUntil ? new Date(u.banUntil).toLocaleString('uk-UA') : ''}</td>

      <td class="table-actions">
        ${currentUser.role === 'admin' && currentUser.id !== u.id ? `
          <button onclick="warnUser('${u.id}')">Warn</button>
          <button onclick="tempBanUserPrompt('${u.id}')">Temp Ban</button>
          <button onclick="permaBanUser('${u.id}')">Ban</button>
        ` : ''}
      </td>
    `;

    userTbody.appendChild(tr);
  });
}

// ==================== ROLE CHANGE ====================
function changeRole(id, newRole) {
  const users = getUsers();
  const u = users.find(x => x.id === id);
  if (!u) return;

  const oldRole = u.role;
  u.role = newRole;

  saveUsers(users);

  notify(`Роль: ${oldRole} → ${newRole}`);

  if (currentUser.id === id) {
    currentUser.role = newRole;
    saveCurrentUser();
    renderUserPanel();
  }

  renderUserTable();
}

// ==================== WARN ====================
function warnUser(id) {
  const reason = prompt('Причина попередження?');
  if (!reason) return;

  const users = getUsers();
  const u = users.find(x => x.id === id);
  if (!u) return;

  u.status = 'warned';
  u.violations = u.violations || [];

  u.violations.push({
    type: 'warn',
    reason,
    t: Date.now()
  });

  saveUsers(users);
  notify(`User warned`);
  renderUserTable();
}

// ==================== TEMP BAN ====================
function tempBanUserPrompt(id) {
  const reason = prompt('Причина бану?');
  if (!reason) return;

  const days = parseInt(prompt('Днів бану?'), 10) || 1;

  tempBanUser(id, reason, days * 24 * 60 * 60 * 1000);
}

function tempBanUser(id, reason, duration) {
  const users = getUsers();
  const u = users.find(x => x.id === id);
  if (!u) return;

  u.status = 'banned';
  u.banUntil = Date.now() + duration;

  u.violations = u.violations || [];

  u.violations.push({
    type: 'tempban',
    reason,
    t: Date.now(),
    until: u.banUntil
  });

  saveUsers(users);
  notify(`User temporarily banned`);
  renderUserTable();
}

// ==================== PERMANENT BAN ====================
function permaBanUser(id) {
  const reason = prompt('Причина бану?');
  if (!reason) return;

  const users = getUsers();
  const u = users.find(x => x.id === id);
  if (!u) return;

  u.status = 'banned';
  u.banUntil = null;

  u.violations = u.violations || [];

  u.violations.push({
    type: 'perma',
    reason,
    t: Date.now()
  });

  saveUsers(users);
  notify(`User permanently banned`);
  renderUserTable();
}

// ==================== CHECK STATUS ====================
function checkCurrentUserStatus() {
  if (!currentUser) return;

  if (currentUser.status === 'banned') {
    if (currentUser.banUntil && currentUser.banUntil > Date.now()) {
      notify(`Banned until ${new Date(currentUser.banUntil).toLocaleString('uk-UA')}`);
    } else if (!currentUser.banUntil) {
      notify('Permanently banned');
    }
  }

  if (currentUser.status === 'warned') {
    notify('You have a warning');
  }
}


// ==================== SPAM CONTROL ====================
const lastCommentTime = {};
const SPAM_DELAY = 5000;

// ==================== CREATE COMMENT ====================
function createComment(text, lifetime, toRole = 'broadcast') {

  if (!currentUser) return;

  // 🔥 антиспам
  const now = Date.now();

  if (
    lastCommentTime[currentUser.id] &&
    now - lastCommentTime[currentUser.id] < SPAM_DELAY
  ) {
    notify('Не спамте');
    return;
  }

  lastCommentTime[currentUser.id] = now;

  const comments = getComments();

  const comment = {
    id: uid(),
    userId: currentUser.id,
    userName: currentUser.name,
    role: currentUser.role,

    text,
    toRole,

    created: now,
    deleteAt: lifetime ? now + Number(lifetime) : null,
    edited: false
  };

  comments.push(comment);
  saveComments(comments);
  renderComments();
}

// ==================== EDIT COMMENT ====================
function editComment(id) {
  const comments = getComments();
  const c = comments.find(x => x.id === id);
  if (!c) return;

  if (c.userId !== currentUser.id) return;

  const newText = prompt('Редагувати:', c.text);
  if (!newText) return;

  c.text = newText;
  c.edited = true;

  saveComments(comments);
  renderComments();
}

// ==================== DELETE COMMENT ====================
function deleteComment(id) {
  let comments = getComments();

  comments = comments.filter(c => c.id !== id);

  saveComments(comments);
  renderComments();
}

// ==================== CLEANUP EXPIRED ====================
function cleanupComments() {
  const now = Date.now();

  let comments = getComments();

  comments = comments.filter(c => {
    if (!c.deleteAt) return true;
    return c.deleteAt > now;
  });

  saveComments(comments);
}

// ==================== ACCESS CONTROL ====================
function canView(c) {

  if (!currentUser) return false;

  // admin / moderator бачать все
  if (currentUser.role === 'admin') return true;
  if (currentUser.role === 'moderator') return true;

  // user бачить тільки:
  return (
    c.userId === currentUser.id ||
    c.toRole === 'broadcast' ||
    c.toRole === 'user'
  );
}

function canEdit(c) {
  return currentUser && c.userId === currentUser.id;
}

function canDelete(c) {
  if (!currentUser) return false;

  if (currentUser.role === 'admin') return true;
  if (currentUser.role === 'moderator') return true;

  return c.userId === currentUser.id;
}

// ==================== GROUP BY USER ====================
function groupByUser(comments) {
  const map = {};

  comments.forEach(c => {
    if (!map[c.userId]) {
      map[c.userId] = {
        userName: c.userName,
        items: []
      };
    }

    map[c.userId].items.push(c);
  });

  return map;
}


// ==================== DOM ELEMENTS ====================
const sendCommentBtn = document.getElementById('sendCommentBtn');
const commentText = document.getElementById('commentText');
const commentTimer = document.getElementById('commentTimer');

const commentsList = document.getElementById('commentsList');

// (опційно для адміна якщо є окремий блок)
const commentsAdminList = document.getElementById('commentsAdminList');

// ==================== SEND COMMENT ====================
sendCommentBtn?.addEventListener('click', () => {

  const text = commentText.value.trim();

  if (!text) {
    notify('Напишіть повідомлення');
    return;
  }

  if (!currentUser) {
    notify('Потрібен вхід');
    return;
  }

  // якщо в тебе є select "кому"
  const commentTarget = document.getElementById('commentTarget');
  const target = commentTarget?.value || 'broadcast';

  createComment(text, commentTimer?.value, target);

  commentText.value = '';
  notify('Коментар додано');
});

// ==================== RENDER COMMENTS ====================
function renderComments() {

  cleanupComments();

  const comments = getComments();

  if (!commentsList) return;

  commentsList.innerHTML = '';

  // ================= USER VIEW =================
  if (currentUser.role !== 'admin' && currentUser.role !== 'moderator') {

    const myComments = comments.filter(c => c.userId === currentUser.id);

    myComments.forEach(c => {

      if (!canView(c)) return;

      const div = document.createElement('div');
      div.className = 'comment';

      div.innerHTML = `
        <div class="comment-top">
          <b>Я</b>
          <small>${new Date(c.created).toLocaleString('uk-UA')}</small>
        </div>

        <div class="comment-text">
          ${c.text}
        </div>
      `;

      commentsList.appendChild(div);
    });

    return;
  }

  // ================= ADMIN / MODERATOR VIEW =================
  const grouped = groupByUser(comments);

  Object.keys(grouped).forEach(userId => {

    const group = grouped[userId];

    const wrapper = document.createElement('div');
    wrapper.className = 'comment-group';

    wrapper.innerHTML = `
      <div class="comment-group-header" onclick="this.parentNode.classList.toggle('open')">
        <b>${group.userName}</b>
        <span>${group.items.length} коментарів</span>
      </div>

      <div class="comment-group-body">
        ${group.items.map(c => `
          <div class="comment">
            <div class="comment-top">
              <small>${new Date(c.created).toLocaleString('uk-UA')}</small>
              <span class="pill">${c.toRole}</span>
            </div>

            <div class="comment-text">
              ${c.text}
              ${c.edited ? '<i> (edited)</i>' : ''}
            </div>

            <div class="comment-actions">
              ${canEdit(c) ? `<button onclick="editComment('${c.id}')">Edit</button>` : ''}
              ${canDelete(c) ? `<button onclick="deleteComment('${c.id}')">Delete</button>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    commentsList.appendChild(wrapper);
  });
}

// ==================== INIT ====================
window.addEventListener('load', () => {

  currentUser = loadCurrentUser();

  if (currentUser) {
    checkCurrentUserStatus();

    if (currentUser.role === 'admin') {
      document.getElementById('secretPanel').style.display = 'block';
      renderUserTable();
    } else {
      renderUserPanel();
    }
  }

  renderComments();
});

// ==================== AUTO REFRESH ====================
setInterval(() => {
  renderComments();
}, 10000);

// ==================== GLOBAL FUNCTIONS ====================
window.editComment = editComment;
window.deleteComment = deleteComment;