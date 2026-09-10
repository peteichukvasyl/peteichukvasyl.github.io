// ======= Дані та змінні =======
let users = JSON.parse(localStorage.getItem('users')) || {Admin:{records:[]}};
let currentUser = null;
let lastLoggedOutUsers = JSON.parse(localStorage.getItem('lastLoggedOutUsers')) || [];
let records = [];
const adminHashData = {
    name: "179446d7252baa661f04e0409d3ede4b87a2efde1365d14d995e3be5a5812d70",
    email: "4aea0c3bd4d8078d69fdab591b1c5f7dbd38ca7439c0c87852c0e7a2baa9892e",
    password: "477a07283963d4639830cb2c8d286a50a883d1ebdd3d42b8a8d99b60d7154ea9"
};

// ======= Лог дій =======
function logAction(action){
    const logEl = document.getElementById('actionLogs');
    const timestamp = new Date().toLocaleString();
    const entry = document.createElement('div');
    entry.textContent = `[${timestamp}] ${action}`;
    logEl.prepend(entry);
}

// ======= Модальні =======
function closeModal(){
    document.getElementById('dataManagerModal').style.display = 'none';
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}
function openLoginModal(){
    document.getElementById('loginModal').style.display='block';
    document.getElementById('overlay').style.display='block';
}

// ======= Вкладки =======
function showTab(tab, event){
    document.getElementById('managerTab').style.display='none';
    document.getElementById('adminTab').style.display='none';
    document.getElementById('logsTab').style.display='none';
    document.getElementById('lastTab').style.display='none';
    document.querySelectorAll('#tabs button').forEach(btn=>btn.classList.remove('active'));
    switch(tab){
        case 'manager': document.getElementById('managerTab').style.display='block'; break;
        case 'admin': document.getElementById('adminTab').style.display='block'; break;
        case 'logs': document.getElementById('logsTab').style.display='block'; break;
        case 'last': document.getElementById('lastTab').style.display='block'; break;
    }
    event.target.classList.add('active');
}

// ======= Збереження =======
function saveUsers(){
    if(currentUser && users[currentUser]){
        users[currentUser].records = records;
    }
    localStorage.setItem('users',JSON.stringify(users));
    localStorage.setItem('lastLoggedOutUsers',JSON.stringify(lastLoggedOutUsers));
}

// ======= Хешування =======
async function hashString(str){
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

// ======= Авторизація Адмін =======
async function loginAdmin(){
    const name = document.getElementById('adminName').value.trim();
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;
    if(!name || !email || !password){ showAuthMsg('Всі поля обов\'язкові'); return; }

    const nameHash = await hashString(name);
    const emailHash = await hashString(email);
    const passHash = await hashString(password);

    if(nameHash === adminHashData.name && emailHash === adminHashData.email && passHash === adminHashData.password){
        currentUser = "Admin";
        document.getElementById('loginModal').style.display='none';
        document.getElementById('dataManagerModal').style.display='block';
        document.getElementById('overlay').style.display='block';
        showDataSummary();
        showAllUsers();
        showLastUsers();
        logAction("Адмін увійшов");
    }else{ showAuthMsg("Невірні дані"); }
}

function showAuthMsg(msg){document.getElementById('authMessage').textContent=msg;}

// ======= Вхід/Вихід =======
function logout(){
    if(currentUser==="Admin"){
        lastLoggedOutUsers.push(currentUser);
        saveUsers();
        logAction("Адмін вийшов");
        currentUser=null;
        records=[];
        closeModal();
    }
}

// ======= Функції очищення та експорту =======
function clearLocalStorage(){if(confirm("Очистити LocalStorage?")){localStorage.clear();logAction("LocalStorage очищено");showDataSummary();}}
function clearSessionStorage(){if(confirm("Очистити SessionStorage?")){sessionStorage.clear();logAction("SessionStorage очищено");showDataSummary();}}
function clearAllCookies(){if(confirm("Видалити всі Cookies?")){const cookies=document.cookie.split("; ");cookies.forEach(c=>{const eq=c.indexOf("=");const name=eq>-1?c.substr(0,eq):c;document.cookie=name+'=;expires=Thu,01 Jan 1970 00:00:00 UTC; path=/;';});logAction("Всі Cookies видалено");showDataSummary();}}
function clearSpecificData(){const key=prompt("Введіть ключ LocalStorage/SessionStorage:");if(!key)return;if(localStorage.getItem(key)){localStorage.removeItem(key);logAction(`LocalStorage: ключ ${key} видалено`);}else if(sessionStorage.getItem(key)){sessionStorage.removeItem(key);logAction(`SessionStorage: ключ ${key} видалено`);}else{alert("Дані не знайдено");}showDataSummary();}
function clearSpecificCookie(){const key=prompt("Введіть назву Cookie:");if(!key)return;document.cookie=key+'=;expires=Thu,01 Jan 1970 00:00:00 UTC; path=/;';logAction(`Cookie ${key} видалено`);showDataSummary();}
function exportData(){const data={localStorage,sessionStorage,cookies:document.cookie};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='data_export.json';a.click();URL.revokeObjectURL(url);logAction("Дані експортовані");}
function showDataSummary(){const ls=Object.keys(localStorage),ss=Object.keys(sessionStorage),cookies=document.cookie?document.cookie.split("; "):[];let html=`<b>LocalStorage:</b> ${ls.length} ключів<br>`;html+=ls.length?ls.join(", "):"пусто";html+=`<br><b>SessionStorage:</b> ${ss.length} ключів<br>`;html+=ss.length?ss.join(", "):"пусто";html+=`<br><b>Cookies:</b> ${cookies.length} шт.<br>`;html+=cookies.length?cookies.join(", "):"пусто";document.getElementById('dataSummary').innerHTML=html;}

// ======= Користувачі та записи =======
function showAllUsers(){
    const list=document.getElementById('allUsers');if(!list)return;list.innerHTML='';
    for(let u in users){
        if(u==="Admin") continue;
        const div=document.createElement('div'); div.classList.add('userRecord');
        div.innerHTML=`<span>${u} (${users[u].records?users[u].records.length:0} записів)</span>
        <div>
        <button onclick="viewUserRecords('${u}')">Переглянути/Редагувати</button>
        <button onclick="deleteUser('${u}')">Видалити</button>
        </div>`;
        list.appendChild(div);
    }
}
function viewUserRecords(u){
    if(!users[u] || !users[u].records || !users[u].records.length){alert("Дані відсутні"); return;}
    const recordsDiv = document.createElement('div'); recordsDiv.innerHTML=`<b>Редагування записів ${u}:</b>`;
    users[u].records.forEach((r,i)=>{
        const recDiv=document.createElement('div'); recDiv.classList.add('dataRecord');
        recDiv.innerHTML=`
            <input type="text" value="${r.date||''}" placeholder="Дата" onchange="users['${u}'].records[${i}].date=this.value; saveUsers(); logAction('Дата запису ${i+1} змінена');">
            <input type="number" value="${r.hours||0}" placeholder="Год" onchange="users['${u}'].records[${i}].hours=parseFloat(this.value); saveUsers(); logAction('Години запису ${i+1} змінено');">
            <input type="number" value="${r.minutes||0}" placeholder="Хв" onchange="users['${u}'].records[${i}].minutes=parseFloat(this.value); saveUsers(); logAction('Хвилини запису ${i+1} змінено');">
            <input type="number" value="${r.rate||0}" placeholder="Ставка" onchange="users['${u}'].records[${i}].rate=parseFloat(this.value); saveUsers(); logAction('Ставка запису ${i+1} змінена');">
            <input type="text" value="${r.currency||'₴'}" placeholder="Валюта" onchange="users['${u}'].records[${i}].currency=this.value; saveUsers(); logAction('Валюта запису ${i+1} змінена');">
            <button onclick="deleteRecord('${u}',${i})">Видалити</button>
        `;
        recordsDiv.appendChild(recDiv);
    });
    const adminTab=document.getElementById('adminTab');
    adminTab.innerHTML=''; adminTab.appendChild(recordsDiv);
}
function deleteRecord(u,i){users[u].records.splice(i,1); saveUsers(); showAllUsers(); logAction(`Запис ${i+1} користувача ${u} видалено`);}
function deleteUser(u){if(confirm(`Видалити користувача ${u}?`)){delete users[u]; saveUsers(); showAllUsers(); logAction(`Користувач ${u} видалений`);}}
function showLastUsers(){const list=document.getElementById('lastUsers');if(!list)return;list.innerHTML='';lastLoggedOutUsers.slice(-5).reverse().forEach(u=>{const div=document.createElement('div');div.textContent=u;list.appendChild(div);});}

// ======= Ініціалізація =======
document.addEventListener('DOMContentLoaded',()=>{});
