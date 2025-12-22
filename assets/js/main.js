// assets/js/main.js

let appConfig = {};

// --- INITIALIZATION ---
async function initApp() {
  try {
    console.log("System initiating...");
    const response = await fetch('assets/config.json');
    if (!response.ok) throw new Error("Config missing");
    appConfig = await response.json();
    console.log("Config loaded.");

    router(); // Start Router

  } catch (e) {
    document.querySelector("#app").innerHTML = "<h1>CRITICAL ERROR</h1><p>SYSTEM CONFIG MISSING. CHECK CONSOLE.</p>";
    console.error(e);
  }
}

// --- ROUTING ---
const navigateTo = url => {
  history.pushState(null, null, url);
  router();
};

const router = async () => {
  // Define routes here to ensure all view functions are ready
  const routes = [
    { path: "/", view: viewHome },
    { path: "/projects", view: viewProjects },
    { path: "/skills", view: viewSkills },
    { path: "/profile", view: viewProfile }
  ];

  const potentialMatches = routes.map(route => ({
    route: route,
    isMatch: location.pathname === route.path
  }));

  let match = potentialMatches.find(p => p.isMatch);
  if (!match) {
    match = { route: routes[0], isMatch: true };
  }

  const app = document.querySelector("#app");
  app.innerHTML = match.route.view();

  updateActiveMenu(match.route.path);

  // Execute post-render scripts if any
  if (match.route.view === viewProfile) {
    initProfileScript();
  }
};

// --- VIEWS ---

function viewHome() {
  return `
        <h1>// NOTIFICATION</h1>
        <p>FROM: ${appConfig.profile?.pseudo || 'UNKNOWN'}</p>
        <p>SUBJECT: WELCOME</p>
        <p>--------------------------------</p>
        <p>Welcome to the secure terminal.</p>
        <p>Use the menu on the left to navigate the system files.</p>
    `;
}

function viewProjects() {
  const list = appConfig.projects.map(p => `
        <li>
            <strong>${p.name}</strong> [${p.tags.join(', ')}]<br>
            > ${p.description}<br>
            <a href="${p.link}" target="_blank">[OPEN_SOURCE]</a>
        </li><br>
    `).join('');

  return `<h1>// CASE_FILES</h1><ul>${list}</ul>`;
}

function viewSkills() {
  const skills = [
    "Linux Kernel ......... [ROOT_ACCESS]",
    "Docker/OCI ........... [DEPLOYED]",
    "Kubernetes ........... [ORCHESTRATED]",
    "Network L2-L7 ........ [SECURE]",
    "Python Scripting ..... [OPTIMIZED]",
    "Go Lang .............. [COMPILED]"
  ];

  const listItems = skills.map(s => `<li>${s}</li>`).join('');

  return `
        <h1>// SYSTEM_VITALS</h1>
        <p>RUNNING DIAGNOSTICS...</p>
        <ul class="terminal-list">${listItems}</ul>
        <p style="color: #0f0; margin-top: 20px;">> ALL SYSTEMS OPERATIONAL</p>
    `;
}

function viewProfile() {
  return `
        <h1>// PROFILE</h1>
        <p><strong>SUBJECT:</strong> ${appConfig.profile?.role}</p>
        <p><strong>ALIAS:</strong> ${appConfig.profile?.pseudo}</p>
        <hr style="border: 1px dashed #555">
        <h3>CONTACT_DATA:</h3>
        <div id="contact-zone">
            <p><span class="redacted">EMAIL-REDACTED-PHONE-REDACTED-TELEGRAM-REDACTED</span></p>
            <div id="auth-ui" style="margin-top: 15px;">
                <a href="#" class="inline-btn" id="decrypt-trigger">[DECRYPT DATA]</a>
            </div>
            <div id="error-msg" style="color: var(--accent-red); margin-top: 10px; min-height: 1.2em;"></div>
        </div>
    `;
}

// Separate function for Profile logic to avoid property attachment issues
function initProfileScript() {
  const trigger = document.getElementById('decrypt-trigger');
  const authUI = document.getElementById('auth-ui');

  if (trigger) {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();

      // Replace button with input field
      authUI.innerHTML = `
                <div style="display: flex; align-items: center;">
                    <span style="margin-right: 10px;">KEY:</span>
                    <input type="password" id="token-input" class="terminal-input" placeholder="***" autocomplete="off">
                    <button id="confirm-btn" class="inline-btn" style="margin-left: 10px;">ENTER</button>
                </div>
            `;

      const input = document.getElementById('token-input');
      const confirmBtn = document.getElementById('confirm-btn');

      // Focus with a slight delay to ensure render
      setTimeout(() => input.focus(), 50);

      // Handle Enter key
      input.addEventListener('keyup', (ev) => {
        if (ev.key === 'Enter') attemptDecrypt(input.value);
      });

      // Handle Button click
      confirmBtn.addEventListener('click', () => attemptDecrypt(input.value));
    });
  }
}


// --- LOGIC & HELPERS ---

function updateActiveMenu(path) {
  document.querySelectorAll('.noir-btn[data-link]').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('href') === path) {
      btn.classList.add('active');
    }
  });
}

function attemptDecrypt(token) {
  const errorBox = document.getElementById('error-msg');
  errorBox.innerText = "DECRYPTING...";

  // Check if CryptoJS is loaded
  if (!window.CryptoJS) {
    errorBox.innerText = "ERROR: Crypto Module Missing (Check Internet/File)";
    return;
  }

  setTimeout(() => {
    try {
      if (!appConfig.encrypted_contacts) {
        throw new Error("CONFIG ERROR: Data missing");
      }

      // Check if placeholder is still there
      if (appConfig.encrypted_contacts.includes("ВСТАВЬ_СЮДА")) {
        throw new Error("ADMIN ERROR: Config not updated with real hash.");
      }

      // Attempt Decrypt
      const bytes = CryptoJS.AES.decrypt(appConfig.encrypted_contacts, token);
      let decryptedText = "";

      try {
        decryptedText = bytes.toString(CryptoJS.enc.Utf8);
      } catch (err) {
        // UTF-8 conversion failed usually means wrong key
        throw new Error("ACCESS DENIED: Invalid Token");
      }

      if (!decryptedText) {
        throw new Error("ACCESS DENIED: Invalid Token");
      }

      // Success! Render data
      const contactZone = document.getElementById('contact-zone');

      // Format lines nicely
      const formattedContacts = decryptedText.split('\n')
        .filter(line => line.trim() !== "") // Remove empty lines
        .map(line =>
          `<p style="border-left: 3px solid var(--accent-red); padding-left: 10px; margin: 5px 0;">${line}</p>`
        ).join('');

      contactZone.innerHTML = formattedContacts;

    } catch (e) {
      console.error(e);
      errorBox.innerText = e.message.replace("Error:", "");

      // Add shake animation class if we had one, or just flash text
      const input = document.getElementById('token-input');
      if (input) {
        input.value = "";
        input.focus();
      }
    }
  }, 300);
}

// --- GLOBAL EVENT LISTENERS ---

document.addEventListener('DOMContentLoaded', initApp);

document.body.addEventListener("click", e => {
  // Traverse up to find the anchor tag if clicked on icon/span
  const target = e.target.closest("a");

  // Only intercept if it has [data-link] attribute
  if (target && target.matches("[data-link]")) {
    e.preventDefault();
    navigateTo(target.href);
  }
});

window.addEventListener("popstate", router);
