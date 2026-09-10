// ===== ФУНКЦІЯ ХЕШУВАННЯ SHA-256 =====
// Приймає текст і повертає його SHA-256 хеш у вигляді hex-рядка
async function sha256(text) {
  const encoder = new TextEncoder(); // кодуємо текст у байти (UTF-8)
  const data = encoder.encode(text);

  // створюємо SHA-256 хеш через Web Crypto API
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // перетворюємо байти у hex-рядок
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}


// ===== ГЕНЕРАЦІЯ ХЕШУ З ПАРОЛЯ =====
// Беремо пароль з input, хешуємо його і показуємо результат
async function generateHash() {
  const password = document.getElementById('genPassword').value.trim(); // отримуємо пароль
  const output = document.getElementById('generatedHash'); // поле виводу

  // перевірка на пустий ввід
  if (!password) {
    output.textContent = 'Введіть пароль.';
    output.className = 'result error';
    return;
  }

  // створення хешу
  const hash = await sha256(password);

  // вивід результату
  output.textContent = hash;
  output.className = 'result success';
}


// ===== ПЕРЕВІРКА ПАРОЛЯ ПО ХЕШУ =====
// Порівнює введений пароль з відомим хешем
async function checkHash() {
  const knownHash = document.getElementById('hashToCheck').value.trim().toLowerCase(); // хеш для перевірки
  const password = document.getElementById('checkPassword').value.trim(); // введений пароль
  const result = document.getElementById('checkResult'); // поле результату

  // перевірка на пусті значення
  if (!knownHash || !password) {
    result.textContent = 'Введіть хеш і пароль.';
    result.className = 'result error';
    return;
  }

  // хешуємо введений пароль
  const passwordHash = await sha256(password);

  // порівняння хешів
  if (passwordHash === knownHash) {
    result.textContent = 'Пароль підходить до хешу.';
    result.className = 'result success';
  } else {
    result.textContent = 'Пароль не підходить.';
    result.className = 'result error';
  }
}


// ===== КОПІЮВАННЯ ТЕКСТУ =====
// Копіює текст з елемента в буфер обміну
function copyText(elementId) {
  const text = document.getElementById(elementId).textContent;

  // перевірка чи є що копіювати
  if (!text || text.startsWith('Результат') || text.startsWith('Тут')) {
    alert('Немає тексту для копіювання.');
    return;
  }

  // копіювання в буфер
  navigator.clipboard.writeText(text)
    .then(() => alert('Скопійовано у буфер обміну!'))
    .catch(() => alert('Не вдалося скопіювати текст.'));
}


// ===== ВСТАВКА З БУФЕРА ОБМІНУ =====
// Читає текст з clipboard і вставляє в поле перевірки хешу
async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText(); // читаємо буфер
    document.getElementById('hashToCheck').value = text; // вставляємо у input
  } catch {
    alert('Не вдалося вставити текст із буфера обміну.');
  }
}