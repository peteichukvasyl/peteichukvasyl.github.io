// ==== Масив для журналу дій адміністраторів ====
  let adminLog = JSON.parse(localStorage.getItem('adminLog') || '[]');

  // ==== Функція додавання запису до журналу ====
  function addAdminLog(entry) {
    const timestamp = new Date().toLocaleString();
    adminLog.push(`[${timestamp}] ${entry}`);
    localStorage.setItem('adminLog', JSON.stringify(adminLog));
    updateAdminLogDisplay();
  }

  // ==== Функція оновлення відображення журналу в #adminLog ====
  function updateAdminLogDisplay() {
    const adminLogElement = document.getElementById('adminLog');
    if(adminLogElement){
      adminLogElement.textContent = adminLog.join('\n');
    }
  }

  // ==== Функція очищення журналу адміністраторів ====
  function clearAdminLog() {
    if (!currentUser || currentUser.role !== 'superadmin') {
      alert('Очищення журналу доступне лише суперадміну.');
      return;
    }
    if (confirm('Ви впевнені, що хочете очистити журнал дій? Цю дію не можна буде скасувати.')) {
      adminLog = [];
      localStorage.removeItem('adminLog');
      updateAdminLogDisplay();
      addAdminLog(`Журнал дій очищено користувачем ${currentUser.username}`);
    }
  }

  // ==== Хешування SHA-256 ====
  async function hashText(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ==== Валідація пароля (мін 8 символів, букви і цифри) ====
  function validatePassword(pass) {
    return /^(?=.*[a-zA-Z])(?=.*\d)[A-Za-z\d]{8,}$/.test(pass);
  }

  // ==== Отримання адміністраторів з localStorage ====
  function getAdmins() {
    return JSON.parse(localStorage.getItem('adminsData') || '{}');
  }
  // ==== Збереження адміністраторів у localStorage ====
  function saveAdmins(admins) {
    localStorage.setItem('adminsData', JSON.stringify(admins));
  }

  // ==== Отримання коментарів з localStorage ====
  function getComments() {
    return JSON.parse(localStorage.getItem('commentsData') || '[]');
  }
  // ==== Збереження коментарів у localStorage ====
  function saveComments(comments) {
    localStorage.setItem('commentsData', JSON.stringify(comments));
  }

  // ==== Отримання поточного користувача із сесії (localStorage) ====
  function getCurrentUser() {
    const user = localStorage.getItem('currentAdminUser');
    if(!user) return null;
    try {
      return JSON.parse(user);
    } catch {
      return null;
    }
  }
  // ==== Збереження поточного користувача в сесію ====
  function setSession(username) {
    const admins = getAdmins();
    if(admins[username]){
      localStorage.setItem('currentAdminUser', JSON.stringify({username, role: admins[username].role}));
    }
  }
  // ==== Очищення сесії ====
  function clearSession() {
    localStorage.removeItem('currentAdminUser');
  }

  // ==== Змінні DOM ====
  const loginSection = document.getElementById('loginSection');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');

  const adminSection = document.getElementById('adminSection');
  const welcomeAdmin = document.getElementById('welcomeAdmin');
  const logoutBtn = document.getElementById('logoutBtn');

  const commentsList = document.getElementById('commentsList');
  const deleteAllCommentsBtn = document.getElementById('deleteAllCommentsBtn');

  const userListSection = document.getElementById('userListSection');
  const usersTableBody = document.getElementById('usersTableBody');

  const addUserSection = document.getElementById('addUserSection');
  const addUserForm = document.getElementById('addUserForm');
  const addUserError = document.getElementById('addUserError');
  const addUserSuccess = document.getElementById('addUserSuccess');

  const changePasswordForm = document.getElementById('changePasswordForm');
  const passwordChangeError = document.getElementById('passwordChangeError');
  const passwordChangeSuccess = document.getElementById('passwordChangeSuccess');

  const editCommentSection = document.getElementById('editCommentSection');
  const editCommentForm = document.getElementById('editCommentForm');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const editHistory = document.getElementById('editHistory');

  const editFullName = document.getElementById('editFullName');
  const editEmail = document.getElementById('editEmail');
  const editMessage = document.getElementById('editMessage');

  // ==== Змінні для роботи з коментарями ====
  let comments = [];
  let currentUser = null; 
  let editingCommentId = null;

  
  // ==== Початкові адміністратори (якщо немає) ====
async function initAdmins() {
  let admins = getAdmins();
  if (Object.keys(admins).length === 0) {
    // Використовуємо заздалегідь згенеровані SHA-256 хеші
    admins['moderator'] = {
      passwordHash: '2b6445db8606a4bc4324e07a684e1088d990f094c8d8024e002060d486bac43a',
      role: 'moderator'
    };
    admins['superadmin'] = {
      passwordHash: '537767628c1187178c524f660f34c2fdcf665c051d9aa8d9dd4f3c4232dac95b',
      role: 'superadmin'
    };
    saveAdmins(admins);
  }
}

  // ==== Відображення списку користувачів (тільки суперадмін) ====
  function loadUserList() {
  usersTableBody.innerHTML = '';
  if(!currentUser || currentUser.role !== 'superadmin') {
    userListSection.style.display = 'none';
    addUserSection.style.display = 'none';
    deleteAllCommentsBtn.style.display = 'none';
    return;
  }
  userListSection.style.display = 'block';
  addUserSection.style.display = 'block';
  deleteAllCommentsBtn.style.display = 'inline-block';

  const admins = getAdmins();
  for(const [username, data] of Object.entries(admins)){
    const tr = document.createElement('tr');

    // Забороняємо видаляти себе
    const deleteButton = username === currentUser.username ? '' :
      `<button class="deleteUserBtn" data-username="${username}" aria-label="Видалити користувача ${username}">Видалити</button>`;

    tr.innerHTML = `
      <td>${username}</td>
      <td>${data.role}</td>
      <td><code>${data.passwordHash}</code></td>
      <td>${deleteButton}</td>
    `;
    usersTableBody.appendChild(tr);
  }

  // Обробник кнопок видалення користувачів (делегування)
  usersTableBody.querySelectorAll('.deleteUserBtn').forEach(btn => {
    btn.onclick = function() {
      const usernameToDelete = this.dataset.username;
      if(confirm(`Ви впевнені, що хочете видалити користувача "${usernameToDelete}" і всі його дані? Цю дію не можна буде скасувати.`)){
        deleteUser(usernameToDelete);
      }
    };
  });
}
function deleteUser(username) {
  if(!currentUser || currentUser.role !== 'superadmin') {
    alert('Видалення користувачів доступне лише суперадміну.');
    return;
  }
  if(username === currentUser.username) {
    alert('Ви не можете видалити себе.');
    return;
  }

  const admins = getAdmins();
  if(!admins[username]) {
    alert('Користувача не знайдено.');
    return;
  }

  // Видаляємо користувача з admins
  delete admins[username];
  saveAdmins(admins);

  // Видаляємо коментарі користувача (за іменем, припускаємо, що fullName === username або інше співпадіння)
  comments = getComments();
  comments = comments.filter(comment => comment.fullName !== username);
  saveComments(comments);
  loadComments();

  loadUserList();
  addAdminLog(`Видалено користувача ${username} і всі його дані користувачем ${currentUser.username}`);
}

  // ==== Відображення коментарів ====
  function loadComments() {
    commentsList.innerHTML = '';
    comments = getComments();

    if(comments.length === 0) {
      commentsList.innerHTML = '<p style="text-align:center; color:#000;">Немає коментарів</p>';
      return;
    }

    comments.forEach(comment => {
  const div = document.createElement('div');
  div.className = 'comment-item';
  div.dataset.id = comment.id;

  const headHTML = `
    <div class="comment-header">${comment.fullName}</div>
    <div class="comment-email">${comment.email}</div>
  `;
  const messageHTML = `<div class="comment-message">${escapeHTML(comment.message)}</div>`;

  let actionsHTML = '';
  if (currentUser && (currentUser.role === 'superadmin' || currentUser.role === 'moderator')) {
    actionsHTML = `<div class="comment-actions">`;

    if (currentUser.role === 'superadmin') {
      actionsHTML += `<button class="editBtn" aria-label="Редагувати коментар">Редагувати</button>`;
    }

    actionsHTML += `<button class="deleteBtn" aria-label="Видалити коментар">Видалити</button>`;
    actionsHTML += `</div>`;
  }

  div.innerHTML = headHTML + messageHTML + actionsHTML;
  commentsList.appendChild(div);
});


    // Делегування подій для кнопок (щоб уникнути множинних обробників)
    commentsList.onclick = function(e) {
      const target = e.target;
      const commentDiv = target.closest('.comment-item');
      if(!commentDiv) return;

      const commentId = commentDiv.dataset.id;

      if(target.classList.contains('editBtn')){
        openEditComment(commentId);
      } else if(target.classList.contains('deleteBtn')){
        if(confirm('Ви впевнені, що хочете видалити цей коментар?')){
          deleteComment(commentId);
        }
      }
    };
  }

  // ==== Відкрити редагування коментаря ====
  function openEditComment(commentId) {
    if(!currentUser || currentUser.role !== 'superadmin') {
      alert('Редагування доступне тільки суперадміну.');
      return;
    }
    const idNum = Number(commentId);
    const comment = comments.find(c => c.id === idNum);
    if(!comment) return;

    editingCommentId = idNum;
    editFullName.value = comment.fullName;
    editEmail.value = comment.email;
    editMessage.value = comment.message;

    loadEditHistory(comment);

    editCommentSection.style.display = 'block';
    editCommentSection.scrollIntoView({behavior:'smooth'});
  }

  // ==== Завантажити історію редагування коментаря ====
  function loadEditHistory(comment) {
    if(!comment.editHistory || comment.editHistory.length === 0){
      editHistory.textContent = 'Історія змін відсутня.';
      return;
    }
    const historyText = comment.editHistory
      .map((entry, i) => 
        `Зміна #${i+1} (${new Date(entry.timestamp).toLocaleString()}):\n` +
        `Ім'я: ${entry.fullName}\n` +
        `Email: ${entry.email}\n` +
        `Повідомлення:\n${entry.message}\n`
      ).join('\n---\n');
    editHistory.textContent = historyText;
  }

  // ==== Зберегти зміни коментаря ====
  function saveEditedComment() {
    const comment = comments.find(c => c.id === editingCommentId);
    if(!comment) return;

    // Створити запис історії до змін
    if(!comment.editHistory) comment.editHistory = [];
    comment.editHistory.push({
      timestamp: Date.now(),
      fullName: comment.fullName,
      email: comment.email,
      message: comment.message
    });

    // Оновити дані коментаря
    comment.fullName = editFullName.value.trim();
    comment.email = editEmail.value.trim();
    comment.message = editMessage.value.trim();

    saveComments(comments);
    loadComments();
    addAdminLog(`Відредаговано коментар ID=${comment.id} користувачем ${currentUser.username}`);

    editingCommentId = null;
    editCommentSection.style.display = 'none';
  }

  // ==== Відміна редагування ====
  function cancelEdit() {
    editingCommentId = null;
    editCommentSection.style.display = 'none';
  }

  // ==== Видалити коментар ====
  function deleteComment(commentId) {
    const idNum = Number(commentId);
    const index = comments.findIndex(c => c.id === idNum);
    if(index === -1) return;

    comments.splice(index, 1);
    saveComments(comments);
    loadComments();
    addAdminLog(`Видалено коментар ID=${idNum} користувачем ${currentUser.username}`);
  }

  // ==== Видалити всі коментарі ====
  function deleteAllComments() {
    if(!currentUser || currentUser.role !== 'superadmin') {
      alert('Видалення всіх коментарів доступне лише суперадміну.');
      return;
    }
    if(confirm('Ви впевнені, що хочете видалити всі коментарі? Цю дію не можна буде скасувати.')){
      comments = [];
      saveComments(comments);
      loadComments();
      addAdminLog(`Видалено всі коментарі користувачем ${currentUser.username}`);
    }
  }

  // ==== Обробка додавання нового користувача (суперадмін) ====
addUserForm.onsubmit = async function(e) {
  e.preventDefault();
  addUserError.textContent = '';
  addUserSuccess.textContent = '';

  if (!currentUser || currentUser.role !== 'superadmin') {
    addUserError.textContent = 'Додавання користувачів доступне лише суперадміну.';
    hideMessagesLater();
    return;
  }

  const username = this.newUsername.value.trim();
  const password = this.newUserPassword.value.trim();
  const role = this.newUserRole.value;

  if (!username || !password) {
    addUserError.textContent = 'Введіть логін і пароль.';
    hideMessagesLater();
    return;
  }

  if (!validatePassword(password)) {
    addUserError.textContent = 'Пароль має бути не менше 8 символів, містити букви та цифри.';
    hideMessagesLater();
    return;
  }

  const admins = getAdmins();
  if (admins[username]) {
    addUserError.textContent = 'Користувач з таким логіном вже існує.';
    hideMessagesLater();
    return;
  }

  const hash = await hashText(password);
  admins[username] = { passwordHash: hash, role };
  saveAdmins(admins);

  addUserSuccess.textContent = `Користувача ${username} успішно додано.`;
  addUserForm.reset();
  loadUserList();
  addAdminLog(`Додано нового користувача: ${username} (${role})`);
  hideMessagesLater();
};

// Функція для автоматичного приховування повідомлень
function hideMessagesLater() {
  setTimeout(() => {
    addUserError.textContent = '';
    addUserSuccess.textContent = '';
  }, 4000);
}

// Автоочищення повідомлень
function hidePasswordMessagesLater() {
  setTimeout(() => {
    passwordChangeError.textContent = '';
    passwordChangeSuccess.textContent = '';
  }, 4000);
}

  // Обробка зміни пароля
changePasswordForm.onsubmit = async function(e) {
  e.preventDefault();
  passwordChangeError.textContent = '';
  passwordChangeSuccess.textContent = '';

  if (!currentUser) {
    passwordChangeError.textContent = 'Ви не авторизовані.';
    hidePasswordMessagesLater();
    return;
  }

  const oldPassword = this.oldPassword.value.trim();
  const newPassword = this.newPassword.value.trim();

  if (!oldPassword || !newPassword) {
    passwordChangeError.textContent = 'Заповніть обидва поля.';
    hidePasswordMessagesLater();
    return;
  }

  if (!validatePassword(newPassword)) {
    passwordChangeError.textContent = 'Новий пароль має бути не менше 8 символів, містити букви та цифри.';
    hidePasswordMessagesLater();
    return;
  }

  const admins = getAdmins();
  const userData = admins[currentUser.username];

  if (!userData) {
    passwordChangeError.textContent = 'Користувача не знайдено.';
    hidePasswordMessagesLater();
    return;
  }

  const oldHash = await hashText(oldPassword);
  if (oldHash !== userData.passwordHash) {
    passwordChangeError.textContent = 'Старий пароль невірний.';
    hidePasswordMessagesLater();
    return;
  }

  const newHash = await hashText(newPassword);
  userData.passwordHash = newHash;
  saveAdmins(admins);

  passwordChangeSuccess.textContent = 'Пароль успішно змінено.';
  changePasswordForm.reset();
  hidePasswordMessagesLater();
};

  // ==== Обробка входу ====
  loginForm.onsubmit = async function(e) {
    e.preventDefault();
    loginError.textContent = '';

    const username = this.username.value.trim();
    const password = this.password.value.trim();

    if(!username || !password){
      loginError.textContent = 'Введіть логін і пароль.';
      return;
    }

    const admins = getAdmins();
    if(!admins[username]){
      loginError.textContent = 'Користувача не знайдено.';
      return;
    }

    const hash = await hashText(password);
    if(hash !== admins[username].passwordHash){
      loginError.textContent = 'Неправильний пароль.';
      return;
    }

    currentUser = {username, role: admins[username].role};
    setSession(username);
    addAdminLog(`Увійшов користувач ${username}`);
    updateUIForLoggedInUser();
  };

  // ==== Вихід ====
  logoutBtn.onclick = function() {
    if(currentUser){
      addAdminLog(`Вийшов користувач ${currentUser.username}`);
    }
    currentUser = null;
    clearSession();
    updateUIForLoggedOutUser();
  };

  // ==== Оновлення UI після входу ====
  function updateUIForLoggedInUser() {
    loginSection.style.display = 'none';
    adminSection.style.display = 'block';
    welcomeAdmin.textContent = `Вітаємо, ${currentUser.username} (${currentUser.role})!`;

    loadComments();
    loadUserList();
    updateAdminLogDisplay();

    if(currentUser.role === 'superadmin'){
      deleteAllCommentsBtn.style.display = 'inline-block';
    } else {
      deleteAllCommentsBtn.style.display = 'none';
    }
  }

  // ==== Оновлення UI після виходу ====
  function updateUIForLoggedOutUser() {
    loginSection.style.display = 'block';
    adminSection.style.display = 'none';
  }

  // ==== Допоміжна функція для escape HTML ====
  function escapeHTML(str) {
    return str.replace(/[&<>"']/g, function(m) {
      return {'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[m];
    });
  }

  // ==== Події для редагування коментаря ====
  editCommentForm.onsubmit = function(e) {
    e.preventDefault();
    saveEditedComment();
  };
  cancelEditBtn.onclick = cancelEdit;

  // ==== Кнопка видалити всі коментарі ====
  deleteAllCommentsBtn.onclick = deleteAllComments;

  // ==== Кнопка очищення журналу дій ====
  document.addEventListener('DOMContentLoaded', () => {
    const clearBtn = document.getElementById('clearAdminLogBtn');
    if(clearBtn){
      clearBtn.addEventListener('click', clearAdminLog);
    }
  });

  // ==== Ініціалізація ====
  (async function(){
    await initAdmins();

    // Відновлення сесії
    currentUser = getCurrentUser();

    if(currentUser){
      updateUIForLoggedInUser();
    } else {
      updateUIForLoggedOutUser();
    }
  })();
