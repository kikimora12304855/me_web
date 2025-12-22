// assets/js/main.js

let appConfig = {};

async function initApp() {
  try {
    const response = await fetch('assets/config.json');
    if (!response.ok) throw new Error("Config missing");
    appConfig = await response.json();

    // Start Router
    router();

    // Setup Decrypt Button
    document.getElementById('auth-trigger').addEventListener('click', (e) => {
      e.preventDefault();
      unlockGate();
    });

  } catch (e) {
    document.querySelector("#app").innerHTML = "<h1>CRITICAL ERROR</h1><p>SYSTEM CONFIG MISSING. CHECK CONSOLE.</p>";
    console.error(e);
  }
}

const navigateTo = url => {
  history.pushState(null, null, url);
  router();
};

const router = async () => {
  const routes = [
    { path: "/", view: viewHome },
    { path: "/projects", view: viewProjects },
    { path: "/skills", view: viewSkills },
    { path: "/about", view: viewAbout }
  ];

  const potentialMatches = routes.map(route => {
    return {
      route: route,
      isMatch: location.pathname === route.path
    };
  });

  let match = potentialMatches.find(potentialMatch => potentialMatch.isMatch);

  if (!match) {
    match = { route: routes[0], isMatch: true };
  }

  const app = document.querySelector("#app");
  app.innerHTML = match.route.view();

  updateActiveMenu(match.route.path);
};

// --- VIEWS ---

function viewHome() {
  return `
        <h1>// NOTIFICATION</h1>
        <p>FROM: ${appConfig.profile?.pseudo || 'UNKNOWN'}</p>
        <p>SUBJECT: WELCOME</p>
        <p>--------------------------------</p>
        <p>Welcome to the secure terminal.</p>
        <p>All data is encrypted. Use the menu on the left to navigate.</p>
        <br>
        <p>> STATUS: ONLINE</p>
        <p>> ENCRYPTION: AES-256</p>
    `;
}

function viewProjects() {
  const list = appConfig.projects.map(p => `
        <li>
            <strong>${p.name}</strong> [${p.tags.join(', ')}]<br>
            > ${p.description}<br>
            <a href="${p.link}">[OPEN_SOURCE]</a>
        </li><br>
    `).join('');

  return `
        <h1>// CASE_FILES</h1>
        <p>LOADING PROJECT DATABASE...</p>
        <ul>${list}</ul>
    `;
}

function viewSkills() {
  return `
        <h1>// VITALS</h1>
        <p>SYSTEM DIAGNOSTICS:</p>
        <ul>
            <li>LINUX KERNEL ..... [98%]</li>
            <li>DOCKER ........... [90%]</li>
            <li>KUBERNETES ....... [75%]</li>
            <li>PYTHON ........... [85%]</li>
            <li>NETWORKING ....... [95%]</li>
        </ul>
    `;
}

function viewAbout() {
  return `
        <h1>// SUSPECT_PROFILE</h1>
        <pre>${appConfig.profile?.ascii_avatar || 'NO_IMAGE'}</pre>
        <p>NAME: ${appConfig.profile?.role}</p>
        <p>STATUS: WANTED (FOR HIRING)</p>
        <p>--------------------------------</p>
        <p>Highly skilled operative. Specializes in infrastructure automation and security auditing.</p>
    `;
}

// --- UI HELPERS ---

function updateActiveMenu(path) {
  document.querySelectorAll('.noir-btn').forEach(btn => {
    btn.classList.remove('active');
    const btnPath = btn.getAttribute('href');
    if (btnPath === path) {
      btn.classList.add('active');
    }
  });
}

function unlockGate() {
  const token = prompt("ENTER SECURITY TOKEN:");
  if (!token) return;

  try {
    // Simple verification simulation or actual decryption if string exists
    if (appConfig.encrypted_contacts && window.CryptoJS) {
      const bytes = CryptoJS.AES.decrypt(appConfig.encrypted_contacts, token);
      const originalText = bytes.toString(CryptoJS.enc.Utf8);
      if (originalText) {
        alert("ACCESS GRANTED:\n" + originalText);
      } else {
        throw new Error("Bad Token");
      }
    } else {
      alert("MODULE NOT LOADED OR EMPTY");
    }
  } catch (e) {
    alert("ACCESS DENIED");
  }
}

// --- EVENT LISTENERS ---

document.addEventListener('DOMContentLoaded', initApp);

document.body.addEventListener("click", e => {
  // Traverse up to find the anchor tag if clicked on icon/span
  const target = e.target.closest("a");

  if (target && target.matches("[data-link]")) {
    e.preventDefault();
    navigateTo(target.href);
  }
});

window.addEventListener("popstate", router);
