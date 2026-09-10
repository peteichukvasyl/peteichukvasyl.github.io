// =========================
// ADMIN PASSWORD HASH
// =========================
const ADMIN_PASSWORD_HASH = 'ab4a870841fb588e8b215143c5ac14461436b561198376d508dfe0e28e30ba78';

// =========================
// DOM ELEMENTS
// =========================
const authForm = document.getElementById('authForm');
const authName = document.getElementById('authName');
const authEmail = document.getElementById('authEmail');

const adminForm = document.getElementById('adminForm');
const adminPasswordInput = document.getElementById('adminPassword');

const authSection = document.getElementById('authSection');
const userInfo = document.getElementById('userInfo');
const displayName = document.getElementById('displayName');
const displayEmail = document.getElementById('displayEmail');
const adminLabel = document.getElementById('adminLabel');
const logoutBtn = document.getElementById('logoutBtn');
const clearCommentsBtn = document.getElementById('clearCommentsBtn');

const commentForm = document.getElementById('commentForm');
const commentTextInput = document.getElementById('commentText');
const commentsList = document.getElementById('commentsList');

// =========================
// STATE
// =========================
let savedEmail = localStorage.getItem('ccw_email') || null;
let savedName = localStorage.getItem('ccw_name') || null;
let isAdmin = localStorage.getItem('ccw_isAdmin') === 'true';

let comments = JSON.parse(localStorage.getItem('ccw_comments')) || [];
let users = JSON.parse(localStorage.getItem('ccw_users')) || {};

// антиспам
let lastCommentTime = 0;
const COMMENT_DELAY = 2000;

// =========================
// STORAGE
// =========================
function saveComments() {
  localStorage.setItem('ccw_comments', JSON.stringify(comments));
}

function saveUsers() {
  localStorage.setItem('ccw_users', JSON.stringify(users));
}

// =========================
// USERS SYSTEM
// =========================
function getUser(email) {
  if (!email) return { warnings: 0, banned: false, spam: 0 };

  if (!users[email]) {
    users[email] = {
      warnings: 0,
      banned: false,
      spam: 0
    };
  }

  return users[email];
}

// =========================
// USER CONTROL
// =========================

function giveWarning(email) {
  const user = getUser(email);
  user.warnings += 1;

  alert(`Warning ${user.warnings}/3`);

  if (user.warnings >= 3) {
    user.banned = true;
    alert("User automatically banned (3/3)");
  }

  saveUsers();
}

function banUser(email) {
  const user = getUser(email);
  user.banned = true;
  saveUsers();
}

function unbanUser(email) {
  const user = getUser(email);
  user.banned = false;
  user.warnings = 0;
  user.spam = 0;
  saveUsers();
}

// =========================
// BAD WORDS FILTER
// =========================

const BAD_WORDS = [
  // англійські
  'fuck','shit','bitch','ass','damn','fucking','motherfucker',

  // базові російські/суржик
  'хуй','пизда','пиздец','блядь','сука',
  'гавно','говно',
  'мудак','долбоеб','дебил','идиот','лох',
  'урод','мразь','тварь','сволочь','чмо',
  'гандон','гандоны',

  // українські
  'гівно','дебіл','ідіот','лох','дурень','тупий',
  'падлюка','паскуда','сволота',
  'мразота',

  // розмовні/суржик
  'йоб','єб','єбать','єбало','єблан','єбучий','єбнутий',
  'заєб','заєбав','заєбало',
  'пох','нах','хер','нахер','похер',

  // діалектні (узагальнено, без розширення списків)
  'курва','богати','пана бога'
];

function containsBadWords(text) {
  return BAD_WORDS.some(word =>
    text.toLowerCase().includes(word)
  );
}

// =========================
// ADMIN ACTIONS
// =========================

function adminWarn(email, reason = "rule violation") {
  const user = getUser(email);

  user.warnings = (user.warnings || 0) + 1;

  alert(`Увага: попередження ${user.warnings}/3`);

  if (user.warnings >= 3) {
    user.banned = true;
  }

  saveUsers();
  renderComments();
}

function adminBan(email) {
  const user = getUser(email);
  user.banned = true;

  saveUsers();
  renderComments();
}

function adminUnban(email) {
  const user = getUser(email);
  user.banned = false;
  user.warnings = 0;
  user.spam = 0;

  saveUsers();
  renderComments();
}

// =========================
// CLEAN OLD COMMENTS
// =========================

const DAY = 24 * 60 * 60 * 1000;

function cleanOldComments() {
  const now = Date.now();

  comments = comments.filter(c =>
    (now - new Date(c.date).getTime()) < DAY
  );

  saveComments();
}

// =========================
// TIME HELPERS (24H SYSTEM)
// =========================

function getTimeLeft(dateStr) {
  const now = Date.now();
  const diff = DAY - (now - new Date(dateStr).getTime());

  if (diff <= 0) return null;

  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diff % (1000 * 60)) / 1000);

  return `${h}h ${m}m ${s}s`;
}

// =========================
// DATE FORMAT
// =========================

function formatDateTime(dateStr) {
  const d = new Date(dateStr);

  return `${String(d.getDate()).padStart(2,'0')}.` +
         `${String(d.getMonth() + 1).padStart(2,'0')}.` +
         `${d.getFullYear()} ` +
         `${String(d.getHours()).padStart(2,'0')}:` +
         `${String(d.getMinutes()).padStart(2,'0')}`;
}

// =========================
// BANNED USERS LIST (UI)
// =========================

function renderBannedUsers() {
  const container = document.getElementById('bannedList');
  if (!container) return;

  container.innerHTML = '';

  const bannedUsers = Object.entries(users)
    .filter(([_, u]) => u.banned);

  bannedUsers.forEach(([email, user]) => {
    const div = document.createElement('div');

    div.innerHTML = `
      <div>
        <strong>${email}</strong>
        <small>warnings: ${user.warnings}</small>
      </div>
      <button class="unbanBtn">Розблокувати</button>
    `;

    div.querySelector('.unbanBtn').onclick = () => {
      unbanUser(email);
      renderBannedUsers();
    };

    container.appendChild(div);
  });
}

// =========================
// RENDER COMMENTS
// =========================

function renderComments() {
  commentsList.innerHTML = '';

  comments.forEach((comment, i) => {
    const user = getUser(comment.email);

    const isOwn = comment.email === savedEmail;
    const isBanned = user.banned;

    const canEdit = !isAdmin && isOwn;
    const canDelete = isAdmin || isOwn;

    const commentDiv = document.createElement('div');
    commentDiv.className = 'ccw-comment';

    if (comment.isEditing) {
      commentDiv.innerHTML = `
        <textarea class="ccw-edit-textarea">${comment.text}</textarea>
        <div>
          <button class="save">Зберегти</button>
          <button class="cancel">Скасувати</button>
        </div>
      `;

      commentDiv.querySelector('.save').onclick = () => {
        comments[i].text = commentDiv.querySelector('textarea').value.trim();
        comments[i].isEditing = false;
        saveComments();
        renderComments();
      };

      commentDiv.querySelector('.cancel').onclick = () => {
        comments[i].isEditing = false;
        renderComments();
      };

    } else {

      commentDiv.innerHTML = `
        <div>
          <strong>
            ${comment.name}${comment.isAdmin ? ' [АДМІН]' : ''}
            ${isBanned ? ' [ЗАБЛОКОВАНО]' : ''}
          </strong>

          <small>
            ${formatDateTime(comment.date)} • ${getTimeLeft(comment.date) ?? 'expired'}
          </small>
        </div>

        <div class="ccw-comment-buttons">
          ${canEdit && !isBanned ? '<button class="edit">Редагувати</button>' : ''}
          ${canDelete && !isBanned ? '<button class="delete">Видалити</button>' : ''}

          ${isAdmin ? `
            <button class="warn">Попередження</button>
            <button class="ban">Заблокувати</button>
            <button class="unban">Розблокувати</button>
          ` : ''}
        </div>

        <div>${comment.text}</div>
      `;

      // EDIT
      if (canEdit && !isBanned) {
        commentDiv.querySelector('.edit').onclick = () => {
          comments[i].isEditing = true;
          renderComments();
        };
      }

      // DELETE
      if (canDelete && !isBanned) {
        commentDiv.querySelector('.delete').onclick = () => {
          if (confirm('Видалити коментар?')) {
            comments.splice(i, 1);
            saveComments();
            renderComments();
          }
        };
      }

      // ADMIN BUTTONS
      if (isAdmin) {
        commentDiv.querySelector('.warn').onclick = () => {
          adminWarn(comment.email, "manual warning");
        };

        commentDiv.querySelector('.ban').onclick = () => {
          adminBan(comment.email);
        };

        commentDiv.querySelector('.unban').onclick = () => {
          adminUnban(comment.email);
        };
      }
    }

    commentsList.appendChild(commentDiv);
  });
}

// =========================
// AUTH USER
// =========================

authForm.onsubmit = e => {
  e.preventDefault();

  const name = authName.value.trim();
  const email = authEmail.value.trim();

  if (!name) return alert('Enter name');
  if (!/\S+@\S+\.\S+/.test(email)) return alert('Invalid email');

  startSession(name, email, false);
};

// =========================
// ADMIN LOGIN
// =========================

adminForm.onsubmit = async e => {
  e.preventDefault();

  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(adminPasswordInput.value)
  );

  const result = Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  if (result === ADMIN_PASSWORD_HASH) {
    startSession('Адміністратор', '', true);
  } else {
    alert('Невірний пароль');
  }
};

// =========================
// ADD COMMENT
// =========================

commentForm.onsubmit = e => {
  e.preventDefault();

  const user = getUser(savedEmail);

  if (user.banned) {
    return alert("Ви заблоковані");
  }

  const text = commentTextInput.value.trim();
  if (!text) return;

  // BAD WORDS CHECK
  if (containsBadWords(text)) {
    adminWarn(savedEmail, "bad words");
    return alert("Неприпустимі слова");
  }

  // SPAM CHECK
  const now = Date.now();

  if (now - lastCommentTime < COMMENT_DELAY) {
    user.spam = (user.spam || 0) + 1;
    saveUsers();

    if (user.spam >= 3) {
      user.banned = true;
      saveUsers();
      return alert("Вас заблоковано за спам");
    }

    return alert("Зачекайте 2 секунди");
  }

  lastCommentTime = now;

  comments.push({
    email: savedEmail,
    name: savedName,
    text,
    isEditing: false,
    isAdmin: false,
    date: new Date().toISOString()
  });

  saveComments();
  commentTextInput.value = '';
  renderComments();

  alert("Коментар додано");
};

// =========================
// SESSION START
// =========================

function startSession(name, email, admin = false) {
  savedName = name;
  savedEmail = email;
  isAdmin = admin;

  localStorage.setItem('ccw_name', name);
  localStorage.setItem('ccw_email', email);
  localStorage.setItem('ccw_isAdmin', admin ? 'true' : 'false');

  authSection.style.display = 'none';
  userInfo.style.display = 'flex';

  displayName.textContent = admin ? 'Адміністратор' : name;
  displayEmail.textContent = admin ? '' : email;
  adminLabel.textContent = admin ? '[АДМІН]' : '';

  commentForm.style.display = admin ? 'none' : 'block';
  clearCommentsBtn.style.display = admin ? 'inline-block' : 'none';

  renderComments();
  renderBannedUsers();
}

// =========================
// LOGOUT
// =========================

function logout() {
  localStorage.removeItem('ccw_name');
  localStorage.removeItem('ccw_email');
  localStorage.removeItem('ccw_isAdmin');

  savedName = null;
  savedEmail = null;
  isAdmin = false;

  authSection.style.display = 'block';
  userInfo.style.display = 'none';
  commentForm.style.display = 'none';

  commentsList.innerHTML = '';
}

// =========================
// BUTTONS
// =========================

logoutBtn.onclick = logout;

clearCommentsBtn.onclick = () => {
  if (confirm('Видалити всі коментарі?')) {
    comments = [];
    saveComments();
    renderComments();
  }
};

// =========================
// AUTO CLEAN + RERENDER
// =========================

setInterval(() => {
  cleanOldComments();
  renderComments();
  renderBannedUsers();
}, 30000);

// =========================
// INIT
// =========================

renderComments();
renderBannedUsers();