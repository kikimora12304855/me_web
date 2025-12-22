/**
 * =================================================================================
 * NOIR_NET // TERMINAL CORE
 * =================================================================================
 * Архитектура: Vanilla JS (SPA)
 * Философия: Модульность, Безопасность, Отсутствие зависимостей (кроме Crypto-JS)
 */

// === 1. СОСТОЯНИЕ И КОНФИГУРАЦИЯ (STATE) ===
// Храним данные приложения в одном месте для удобного доступа
const State = {
    config: null,      // Загруженный config.json
    currentRoute: null // Текущий активный путь
};

// === 2. СЕРВИСЫ (SERVICES) ===
// Чистая логика без привязки к интерфейсу (Data & Security)

const DataService = {
    /**
     * Загружает конфигурацию с защитой от ошибок
     */
    async loadConfig() {
        try {
            console.log(">> SYSTEM: Initiating protocols...");
            const response = await fetch('assets/config.json');
            
            if (!response.ok) throw new Error("Config load failed (HTTP " + response.status + ")");
            
            State.config = await response.json();
            console.log(">> SYSTEM: Config loaded successfully.");
            return true;
        } catch (e) {
            console.error("CRITICAL ERROR:", e);
            UI.renderCriticalError(e.message);
            return false;
        }
    }
};

const SecurityService = {
    /**
     * Пытается расшифровать данные. 
     * Возвращает текст или выбрасывает ошибку.
     * Не взаимодействует с DOM напрямую (Принцип единственной ответственности).
     */
    decrypt(encryptedData, token) {
        // 1. Проверка наличия библиотеки
        if (!window.CryptoJS) throw new Error("Encryption module missing (CryptoJS).");
        
        // 2. Проверка данных
        if (!encryptedData) throw new Error("No encrypted data found.");
        if (encryptedData.includes("ВСТАВЬ_СЮДА")) throw new Error("Placeholder detected in config.");

        try {
            // 3. Попытка дешифровки (AES)
            const bytes = CryptoJS.AES.decrypt(encryptedData, token);
            const originalText = bytes.toString(CryptoJS.enc.Utf8);

            // 4. Проверка результата (пустая строка значит неверный ключ)
            if (!originalText) throw new Error("Invalid Access Token.");
            
            return originalText;
        } catch (err) {
            // Перехватываем технические ошибки библиотеки и возвращаем понятную
            throw new Error("Access Denied: Invalid Token.");
        }
    }
};

// === 3. ПРЕДСТАВЛЕНИЯ (VIEWS) ===
// Генераторы HTML-кода. Возвращают строки (English content).

const Views = {
    /**
     * Главная страница
     */
    home() {
        const profile = State.config.profile || {};
        return `
            <h1>// NOTIFICATION</h1>
            <p>FROM: ${profile.pseudo || 'UNKNOWN'}</p>
            <p>SUBJECT: WELCOME</p>
            <p>--------------------------------</p>
            <p>Welcome to the secure terminal.</p>
            <p>Use the menu on the left to navigate system files.</p>
            <p class="blink">_</p>
        `;
    },

    /**
     * Страница проектов (DRY: используем map для генерации списка)
     */
    projects() {
        const projects = State.config.projects || [];
        
        if (projects.length === 0) return `<h1>// EMPTY</h1><p>Project archive not found.</p>`;

        const listHtml = projects.map(p => `
            <li class="project-item">
                <strong>${p.name}</strong> [${p.tags.join(', ')}]<br>
                <span class="dim">> ${p.description}</span><br>
                <a href="${p.link}" target="_blank" rel="noopener noreferrer">[SOURCE_CODE]</a>
            </li><br>
        `).join('');

        return `<h1>// CASE_FILES</h1><ul>${listHtml}</ul>`;
    },

    /**
     * Страница навыков
     */
    skills() {
        // Данные можно вынести в config.json, но для примера оставим здесь
        const skillsData = [
            { name: "Linux Kernel", status: "[ROOT_ACCESS]" },
            { name: "Docker/OCI",   status: "[DEPLOYED]" },
            { name: "Kubernetes",   status: "[ORCHESTRATED]" },
            { name: "Network L2-L7",status: "[SECURE]" },
            { name: "Python / Bash",status: "[OPTIMIZED]" }
        ];

        const listHtml = skillsData.map(s => 
            `<li>${s.name.padEnd(20, '.')} ${s.status}</li>`
        ).join('');

        return `
            <h1>// SYSTEM_VITALS</h1>
            <p>RUNNING DIAGNOSTICS...</p>
            <ul class="terminal-list">${listHtml}</ul>
            <p style="color: #0f0; margin-top: 20px;">> ALL SYSTEMS OPERATIONAL</p>
        `;
    },

    /**
     * Страница профиля (Секретная зона)
     */
    profile() {
        const profile = State.config.profile || {};
        return `
            <h1>// PROFILE</h1>
            <p><strong>SUBJECT:</strong> ${profile.role}</p>
            <p><strong>ALIAS:</strong> ${profile.pseudo}</p>
            <hr style="border: 1px dashed #555">
            <h3>ENCRYPTED CHANNEL:</h3>
            <div id="contact-zone">
                <p><span class="redacted">EMAIL-REDACTED-PHONE-REDACTED-TELEGRAM-REDACTED</span></p>
                
                <!-- UI для ввода пароля -->
                <div id="auth-ui" style="margin-top: 15px;">
                    <a href="#" class="inline-btn" id="decrypt-trigger">[DECRYPT DATA]</a>
                </div>
                
                <!-- Зона для ошибок -->
                <div id="error-msg" style="color: var(--accent-red); margin-top: 10px; min-height: 1.2em;"></div>
            </div>
        `;
    }
};

// === 4. ИНТЕРФЕЙС (UI CONTROLLER) ===
// Управление DOM-элементами и обработка событий интерфейса

const UI = {
    elements: {
        app: () => document.querySelector("#app"),
        menuLinks: () => document.querySelectorAll('.noir-btn[data-link]')
    },

    /**
     * Рендерит HTML в основную область
     */
    renderContent(html) {
        this.elements.app().innerHTML = html;
    },

    /**
     * Показывает критическую ошибку (например, если нет конфига)
     */
    renderCriticalError(msg) {
        this.elements.app().innerHTML = `
            <h1 style="color:red">CRITICAL ERROR</h1>
            <p>ERROR CODE: ${msg}</p>
            <p>CONTACT ADMINISTRATOR.</p>
        `;
    },

    /**
     * Обновляет активный пункт меню (Визуализация)
     */
    updateActiveMenu(path) {
        this.elements.menuLinks().forEach(btn => {
            const isActive = btn.getAttribute('href') === path;
            btn.classList.toggle('active', isActive);
        });
    },

    /**
     * Логика формы дешифровки (UI Form Logic)
     */
    setupDecryptionForm() {
        const trigger = document.getElementById('decrypt-trigger');
        if (!trigger) return; // Если кнопки нет, выходим

        const authUI = document.getElementById('auth-ui');
        
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Заменяем кнопку на форму ввода
            authUI.innerHTML = `
                <div style="display: flex; align-items: center;">
                    <span style="margin-right: 10px;">KEY:</span>
                    <input type="password" id="token-input" class="terminal-input" placeholder="***" autocomplete="off">
                    <button id="confirm-btn" class="inline-btn" style="margin-left: 10px;">ENTER</button>
                </div>
            `;

            const input = document.getElementById('token-input');
            const btn = document.getElementById('confirm-btn');

            // Автофокус
            setTimeout(() => input.focus(), 50);

            // Обработчики ввода
            const submitHandler = () => this.handleDecryptionAttempt(input.value);
            
            btn.addEventListener('click', submitHandler);
            input.addEventListener('keyup', (ev) => {
                if (ev.key === 'Enter') submitHandler();
            });
        });
    },

    /**
     * Обработка попытки ввода пароля
     */
    handleDecryptionAttempt(token) {
        const errorBox = document.getElementById('error-msg');
        errorBox.innerText = "EXECUTING...";

        // Имитация задержки процессора для "кинематографичности"
        setTimeout(() => {
            try {
                // Вызов сервиса безопасности
                const decryptedText = SecurityService.decrypt(State.config.encrypted_contacts, token);
                
                // Успех: Рендерим контакты
                this.renderContacts(decryptedText);
                
            } catch (err) {
                // Ошибка: Показываем сообщение
                errorBox.innerText = `ERROR: ${err.message}`;
                
                // Очистка и фокус
                const input = document.getElementById('token-input');
                if (input) {
                    input.value = "";
                    input.focus();
                    input.classList.add('shake-anim'); // Можно добавить CSS анимацию тряски
                    setTimeout(() => input.classList.remove('shake-anim'), 500);
                }
            }
        }, 300);
    },

    /**
     * Отображение расшифрованных контактов
     */
    renderContacts(text) {
        const contactZone = document.getElementById('contact-zone');
        
        // Форматируем текст в HTML
        const htmlLines = text.split('\n')
            .filter(line => line.trim() !== "")
            .map(line => `<p style="border-left: 3px solid var(--accent-red); padding-left: 10px; margin: 5px 0;">${line}</p>`)
            .join('');

        contactZone.innerHTML = htmlLines;
    }
};

// === 5. МАРШРУТИЗАТОР (ROUTER) ===
// Управление навигацией без перезагрузки страницы

const Router = {
    routes: [
        { path: "/", view: Views.home },
        { path: "/projects", view: Views.projects },
        { path: "/skills", view: Views.skills },
        { path: "/profile", view: Views.profile }
    ],

    /**
     * Переход по ссылке
     */
    navigate(url) {
        history.pushState(null, null, url);
        this.processRoute();
    },

    /**
     * Определение текущего роута и рендер
     */
    processRoute() {
        const currentPath = location.pathname;
        
        // Поиск совпадения или возврат на главную (Fallback)
        let match = this.routes.find(r => r.path === currentPath);
        if (!match) match = this.routes[0];

        // 1. Рендерим View
        UI.renderContent(match.view());
        
        // 2. Обновляем Меню
        UI.updateActiveMenu(match.path);

        // 3. Специфичная логика для страниц (Hooks)
        if (match.view === Views.profile) {
            UI.setupDecryptionForm();
        }
    },

    /**
     * Инициализация событий роутера
     */
    init() {
        // Обработка кнопки "Назад" в браузере
        window.addEventListener("popstate", () => this.processRoute());

        // Перехват кликов по ссылкам (SPA режим)
        document.body.addEventListener("click", e => {
            const target = e.target.closest("a[data-link]");
            if (target) {
                e.preventDefault();
                this.navigate(target.href);
            }
        });

        // Первичный запуск
        this.processRoute();
    }
};

// === 6. ЯДРО (CORE INIT) ===
// Точка входа в приложение

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Загрузка данных
    const isConfigLoaded = await DataService.loadConfig();
    
    // 2. Если конфиг загружен, запускаем роутер
    if (isConfigLoaded) {
        Router.init();
    }
});