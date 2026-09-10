// ======= Локальні дані =======
let currentUser = null;
let users = JSON.parse(localStorage.getItem('users')) || {};
let records = [];

// ======= Хешування пароля =======
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ======= Створення адміна =======
async function ensureAdmin() {
    const adminKey = 'Admin';
    if (!users[adminKey]) {
        const passHash = '8a24109db65a00a76a99cd5117c182bfa3225d7e08d2b213e67be14757ca0230'; //hash
        users[adminKey] = { passwordHash: passHash, records: [] };
        localStorage.setItem('users', JSON.stringify(users));
    }
}

// ======= Останні користувачі =======
let lastLoggedOutUsers = JSON.parse(localStorage.getItem('lastLoggedOutUsers')) || [];

function updateLastLoggedOutPanel() {
    const list = document.getElementById('lastLoggedOutList');
    if (!list) return;
    list.innerHTML = '';
    lastLoggedOutUsers.slice(-5).reverse().forEach(user => {
        const li = document.createElement('li');
        li.textContent = user;
        list.appendChild(li);
    });
}

// ======= Збереження користувачів =======
function saveUsers() {
    if (currentUser && users[currentUser]) {
        users[currentUser].records = records;
    }
    localStorage.setItem('users', JSON.stringify(users));
}

// ======= Реєстрація =======
async function register() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!username || !password) { showAuthMsg('Введіть логін і пароль'); return; }
    if (users[username]) { showAuthMsg('Користувач вже існує'); return; }
    const passHash = await hashPassword(password);
    users[username] = { passwordHash: passHash, records: [] };
    saveUsers();
    showAuthMsg('Користувача зареєстровано', 'green');
}




// ======= Вхід =======
async function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const passHash = await hashPassword(password);
    if (users[username] && users[username].passwordHash === passHash) {
        currentUser = username;
        records = users[username].records;
        document.getElementById('auth').style.display = 'none';
        document.getElementById('tracker').style.display = 'block';
        document.getElementById('currentUser').textContent = currentUser;
        if (currentUser === 'Admin') {
            document.getElementById('adminPanel').style.display = 'block';
            showAllUsers();
            updateLastLoggedOutPanel();
        } else {
            document.getElementById('adminPanel').style.display = 'none';
        }
        updateDisplay();
     } else {
    showAuthMsg('Невірний логін або пароль');
  }
}

// ======= Вихід =======
function logout() {
    if (currentUser && currentUser !== 'Admin') {
        lastLoggedOutUsers.push(currentUser);
        localStorage.setItem('lastLoggedOutUsers', JSON.stringify(lastLoggedOutUsers));
        updateLastLoggedOutPanel();
    }
    saveUsers();
    currentUser = null;
    records = [];
    document.getElementById('auth').style.display = 'block';
    document.getElementById('tracker').style.display = 'none';
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('adminPanel').style.display = 'none';
}

// ======= Повідомлення авторизації =======
function showAuthMsg(msg, color = 'red') {
    const el = document.getElementById('authMessage');
    el.textContent = msg;
    el.style.color = color;
}

// ======= Видалення даних користувача =======
function showDeleteModal() {
    if (!currentUser) { alert('Користувач не авторизований'); return; }
    if (currentUser === 'Admin') { alert('Адмінські дані не можна видалити'); return; }
    document.getElementById('confirmPassword').value = '';
    document.getElementById('deleteModal').style.display = 'block';
}

async function confirmDelete() {
    const password = document.getElementById('confirmPassword').value;
    const passHash = await hashPassword(password);
    if (passHash === users[currentUser].passwordHash) {
        delete users[currentUser];
        saveUsers();
        document.getElementById('deleteModal').style.display = 'none';
        logout();
        alert('Операція завершена: обліковий запис та пов’язані дані видалено.');
    } else {
        alert('Не вдалось видалити обліковий запис: пароль неправильний.');
    }
}

// ======= Події для модального видалення =======
document.getElementById('deleteDataBtn').addEventListener('click', showDeleteModal);
document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
    document.getElementById('deleteModal').style.display = 'none';
});

// ======= Валютні курси =======
const exchangeRates = { '₴': 1, '€': 50.49, '$': 43.84, 'BYN': 15.08, 'RUB': 0.49, 'PLN': 11.78, 'CZK': 2.06 };

// ======= Оновлення відображення =======
function updateDisplay() {
    const list = document.getElementById('recordList');
    list.innerHTML = '';
    let totals = { '₴': 0, '€': 0, '$': 0, 'BYN': 0, 'RUB': 0, 'PLN': 0, 'CZK': 0 };
    records.forEach((rec, index) => {
        const earned = (rec.hours + rec.minutes / 60 - rec.break) * rec.rate;
        totals[rec.currency] += earned;
        const li = document.createElement('li');
        li.innerHTML = `<span>Дата: ${rec.date}, Години: ${rec.hours}ч ${rec.minutes}м, Ставка: ${rec.rate.toFixed(2)} ${rec.currency}, Пауза: ${rec.break.toFixed(2)}ч, Зароблено: ${earned.toFixed(2)} ${rec.currency}</span>`;
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Видалити';
        delBtn.onclick = () => { records.splice(index, 1); updateDisplay(); }
        li.appendChild(delBtn);
        list.appendChild(li);
    });
    let totalStr = '';
    for (let c in totals) { if (totals[c] > 0) totalStr += `${totals[c].toFixed(2)} ${c} `; }
    document.getElementById('totalDisplay').textContent = totalStr;
    saveUsers();
}

// ======= Додавання запису =======
function addRecord() {
    const date = document.getElementById('date').value;
    const hours = parseFloat(document.getElementById('hours').value) || 0;
    const minutes = parseFloat(document.getElementById('minutes').value) || 0;
    const rate = parseFloat(document.getElementById('rate').value) || 0;
    const currency = document.getElementById('currency').value;
    const br = parseFloat(document.getElementById('break').value) || 0;
    if (!date) { alert('Введіть дату'); return; }
    records.push({ date, hours, minutes, rate, currency, break: br });
    updateDisplay();
    document.getElementById('hours').value = '';
    document.getElementById('minutes').value = '';
    document.getElementById('rate').value = '';
    document.getElementById('break').value = '';
}

// ======= Очищення всіх записів =======
function clearRecords() {
    if (confirm('Видалити всі записи?')) {
        records = [];
        if (currentUser && users[currentUser]) users[currentUser].records = records;
        updateDisplay();
    }
}

// ======= Встановити сьогоднішню дату =======
document.getElementById('setTodayBtn').addEventListener('click', () => {
    document.getElementById('date').value = new Date().toISOString().slice(0, 10);
});

// ======= Конвертор валют =======
function convertCurrency() {
    const amount = parseFloat(document.getElementById('convertAmount').value) || 0;
    const from = document.getElementById('fromCurrency').value;
    const to = document.getElementById('toCurrency').value;
    const percent = parseFloat(document.getElementById('percentAmount').value) || 0;
    const result = amount * exchangeRates[from] / exchangeRates[to] * (1 + percent / 100);
    document.getElementById('conversionResult').textContent = `Результат: ${result.toFixed(2)} ${to}`;
}

// ======= Показати всіх користувачів (адмін) =======
function showAllUsers() {
    const list = document.getElementById('allUsers');
    if (!list) return;
    list.innerHTML = '';
    for (let user in users) {
        if (user === 'Admin') continue;
        const li = document.createElement('li');
        li.textContent = `${user} (${users[user].records.length} записів)`;
        list.appendChild(li);
    }
}

// ======= Ініціалізація =======
document.addEventListener('DOMContentLoaded', async () => {
    await ensureAdmin();
    updateLastLoggedOutPanel(); // показує останніх користувачів при завантаженні
});