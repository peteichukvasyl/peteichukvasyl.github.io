// =========================
// DOM ЕЛЕМЕНТИ
// =========================

// Авторизація
const authForm = document.getElementById('authForm');
const authName = document.getElementById('authName');
const authEmail = document.getElementById('authEmail');

// Сесія користувача
const authSection = document.getElementById('authSection');
const userInfo = document.getElementById('userInfo');
const displayName = document.getElementById('displayName');
const displayEmail = document.getElementById('displayEmail');
const logoutBtn = document.getElementById('logoutBtn');

// Коментарі
const commentForm = document.getElementById('commentForm');
const commentTextInput = document.getElementById('commentText');
const commentsList = document.getElementById('commentsList');

// =========================
// СТАН
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
// ЗБЕРЕЖЕННЯ
// =========================

function saveComments() {
  localStorage.setItem('ccw_comments', JSON.stringify(comments));
}

function saveUsers() {
  localStorage.setItem('ccw_users', JSON.stringify(users));
}

// =========================
// КОРИСТУВАЧІ
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
// ФОРМАТ ДАТИ
// =========================

function formatDateTime(dateStr) {
  const d = new Date(dateStr);

  return `${String(d.getDate()).padStart(2,'0')}.` +
         `${String(d.getMonth()+1).padStart(2,'0')}.` +
         `${d.getFullYear()} ` +
         `${String(d.getHours()).padStart(2,'0')}:` +
         `${String(d.getMinutes()).padStart(2,'0')}`;
}

// =========================
// 24H ЧАС
// =========================

const DAY = 24 * 60 * 60 * 1000;

function getTimeLeft(dateStr) {
  const now = Date.now();
  const diff = DAY - (now - new Date(dateStr).getTime());

  if (diff <= 0) return null;

  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diff % (1000 * 60)) / 1000);

  return `${h}г ${m}х ${s}с`;
}

// =========================
// ОЧИСТКА СТАРИХ КОМЕНТАРІВ
// =========================

function cleanOldComments() {
  const now = Date.now();

  comments = comments.filter(c => {
    return (now - new Date(c.date).getTime()) < DAY;
  });

  saveComments();
}

// =========================
// ЦЕНЗУРА СЛІВ
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
  const lower = text.toLowerCase();
  return BAD_WORDS.some(word => lower.includes(word));
}

// =========================
// ПОПЕРЕДЖЕННЯ СИСТЕМА
// =========================

function adminWarn(email, reason = "порушення правил") {
  const user = getUser(email);

  user.warnings = (user.warnings || 0) + 1;

  alert(`Попередження ${user.warnings}/3`);

  if (user.warnings >= 3) {
    user.banned = true;
    alert("Користувача заблоковано (3/3)");
  }

  saveUsers();
  renderComments();
}

// =========================
// БАН / РОЗБАН
// =========================

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
// АНТИСПАМ ЛОГІКА
// =========================

function handleSpam(user) {
  user.spam = (user.spam || 0) + 1;

  saveUsers();

  if (user.spam >= 3) {
    user.banned = true;
    saveUsers();
    alert("Вас заблоковано за спам");
    return true;
  }

  alert("Зачекайте 2 секунди перед наступним коментарем");
  return false;
}

// =========================
// EMAIL ВАЛІДАЦІЯ
// =========================

function validateEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

// =========================
// СТАРТ СЕСІЇ
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

  commentForm.style.display = admin ? 'none' : 'block';

  renderComments();
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
// РЕНДЕР КОМЕНТАРІВ
// =========================

function renderComments() {
  commentsList.innerHTML = '';

  comments.forEach((comment, i) => {
    const user = getUser(comment.email);

    const isOwn = comment.email === savedEmail;
    const isBanned = user.banned;

    const canEdit = isOwn && !isBanned;
    const canDelete = isOwn && !isBanned;

    const commentDiv = document.createElement('div');
    commentDiv.className = 'ccw-comment';

    // =========================
    // РЕДАГУВАННЯ
    // =========================
    if (comment.isEditing) {
      commentDiv.innerHTML = `
        <textarea class="ccw-edit-textarea">${comment.text}</textarea>
        <div class="ccw-edit-actions">
          <button class="save">Зберегти</button>
          <button class="cancel">Скасувати</button>
        </div>
      `;

      const textarea = commentDiv.querySelector('textarea');

      commentDiv.querySelector('.save').onclick = () => {
        const newText = textarea.value.trim();
        if (!newText) return;

        comments[i].text = newText;
        comments[i].isEditing = false;

        saveComments();
        renderComments();
      };

      commentDiv.querySelector('.cancel').onclick = () => {
        comments[i].isEditing = false;
        renderComments();
      };

    } else {

      // =========================
      // ЗВИЧАЙНИЙ РЕЖИМ
      // =========================

      commentDiv.innerHTML = `
        <div class="ccw-comment-header">
          <div>
            <span class="ccw-comment-author">
              ${comment.name}
              ${comment.isAdmin ? '[АДМІН]' : ''}
              ${isBanned ? '[ЗАБЛОКОВАНО]' : ''}
            </span>

            <span class="ccw-comment-date">
              ${formatDateTime(comment.date)} • ${getTimeLeft(comment.date) ?? 'закінчився'}
            </span>
          </div>

          <div class="ccw-comment-buttons">
            ${canEdit ? '<button class="edit">Редагувати</button>' : ''}
            ${canDelete ? '<button class="delete">Видалити</button>' : ''}

            ${isAdmin ? `
              <button class="warn">Попередження</button>
              <button class="ban">Блок</button>
              <button class="unban">Розблок</button>
            ` : ''}
          </div>
        </div>

        <div class="ccw-comment-text">
          ${comment.text}
        </div>
      `;

      // =========================
      // РЕДАГУВАННЯ
      // =========================
      if (canEdit) {
        commentDiv.querySelector('.edit').onclick = () => {
          comments[i].isEditing = true;
          renderComments();
        };
      }

      // =========================
      // ВИДАЛЕННЯ
      // =========================
      if (canDelete) {
        commentDiv.querySelector('.delete').onclick = () => {
          if (confirm('Видалити коментар?')) {
            comments.splice(i, 1);
            saveComments();
            renderComments();
          }
        };
      }

      // =========================
      // АДМІН КНОПКИ
      // =========================
      if (isAdmin) {
        commentDiv.querySelector('.warn').onclick = () => {
          adminWarn(comment.email);
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
// АВТОРИЗАЦІЯ
// =========================

authForm.onsubmit = (e) => {
  e.preventDefault();

  const name = authName.value.trim();
  const email = authEmail.value.trim();

  if (!name) return alert('Введіть ім’я');
  if (!validateEmail(email)) return alert('Невірний email');

  startSession(name, email, false);
};

// =========================
// ДОДАВАННЯ КОМЕНТАРЯ
// =========================

commentForm.onsubmit = (e) => {
  e.preventDefault();

  const user = getUser(savedEmail);

  if (user.banned) {
    return alert("Ви заблоковані");
  }

  const text = commentTextInput.value.trim();
  if (!text) return;

  // =========================
  // ЦЕНЗУРА
  // =========================
  if (containsBadWords(text)) {
    adminWarn(savedEmail, "неприпустима лексика");
    alert("Заборонені слова");
    return;
  }

  // =========================
  // АНТИСПАМ
  // =========================
  const now = Date.now();

  if (now - lastCommentTime < COMMENT_DELAY) {
    const blocked = handleSpam(user);
    if (blocked) return;
    return;
  }

  lastCommentTime = now;

  comments.push({
    email: savedEmail,
    name: savedName,
    text,
    isEditing: false,
    isAdmin: isAdmin,
    date: new Date().toISOString()
  });

  saveComments();

  commentTextInput.value = '';
  renderComments();
};

// =========================
// LOGOUT КНОПКА
// =========================

logoutBtn.onclick = logout;

// =========================
// АВТОЗАПУСК
// =========================

if (savedName && savedEmail) {
  startSession(savedName, savedEmail, isAdmin);
}

// =========================
// ГОЛОВНИЙ ЦИКЛ
// =========================

setInterval(() => {
  cleanOldComments();
  renderComments();
}, 30000);

// =========================
// ПЕРШИЙ РЕНДЕР
// =========================

renderComments();