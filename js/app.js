// js/app.js — Authentication + app initialization

const userData = {
    isLoggedIn: false,
    currentUser: null,
    users: []
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('GoalForge app loaded!');
    loadUsers();
    setupAuthSystem();
    checkExistingLogin();
});

// -----------------------------
// Local Storage Handling
// -----------------------------
function loadUsers() {
    const saved = localStorage.getItem('goalforgeUsers');
    if (saved) userData.users = JSON.parse(saved);
}

function saveUsers() {
    localStorage.setItem('goalforgeUsers', JSON.stringify(userData.users));
}

// -----------------------------
// Auth System
// -----------------------------
function setupAuthSystem() {
    const form = document.getElementById('auth-form');
    const formTitle = document.getElementById('form-title');
    const toggleLink = document.getElementById('switch-to-login');
    let mode = 'signup'; // default

    if (toggleLink) {
        toggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            mode = mode === 'signup' ? 'login' : 'signup';
            updateFormMode(mode, formTitle, toggleLink);
        });
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (mode === 'signup') handleSignup();
            else handleLogin();
        });
    }

    // Social login placeholder
    document.querySelectorAll('.social-login button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const provider = e.target.textContent.includes('Google') ? 'Google' : 'Facebook';
            showMessage(`${provider} login would go here`, 'info');
        });
    });
}

// -----------------------------
// Toggle Form (Signup ↔ Login)
// -----------------------------
function updateFormMode(mode, titleEl, toggleLink) {
    const confirmGroup = document.querySelector('#confirm-password')?.closest('.input-group');
    if (mode === 'login') {
        titleEl.textContent = 'Log In to GoalForge';
        confirmGroup.style.display = 'none';
        toggleLink.textContent = 'Create Account';
        document.querySelector('.submit-button').textContent = 'Log In';
    } else {
        titleEl.textContent = 'Sign Up For Free';
        confirmGroup.style.display = 'block';
        toggleLink.textContent = 'Log In';
        document.querySelector('.submit-button').textContent = 'Sign Up';
    }
}

// -----------------------------
// Signup Logic
// -----------------------------
function handleSignup() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const confirm = document.getElementById('confirm-password').value.trim();

    if (!isValidEmail(email)) return showMessage('Invalid email', 'error');
    if (userExists(email)) return showMessage('User already exists', 'error');
    if (password.length < 6) return showMessage('Password must be at least 6 characters', 'error');
    if (password !== confirm) return showMessage('Passwords do not match', 'error');

    const newUser = { id: Date.now(), email, password, createdAt: new Date().toISOString() };
    userData.users.push(newUser);
    saveUsers();

    localStorage.setItem('goalforgeCurrentUser', JSON.stringify(newUser));
    showMessage('Account created successfully!', 'success');
    setTimeout(() => (window.location.href = 'dashboard.html'), 1200);
}

// -----------------------------
// Login Logic
// -----------------------------
function handleLogin() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    const user = userData.users.find(u => u.email === email && u.password === password);
    if (!user) return showMessage('Invalid email or password', 'error');

    localStorage.setItem('goalforgeCurrentUser', JSON.stringify(user));
    showMessage('Login successful! Redirecting...', 'success');
    setTimeout(() => (window.location.href = 'dashboard.html'), 1200);
}

// -----------------------------
// Utility Functions
// -----------------------------
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function userExists(email) {
    return userData.users.some(u => u.email === email);
}

function showMessage(text, type = 'info') {
    const el = document.createElement('div');
    el.textContent = text;
    el.className = `toast ${type}`;
    el.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        color: white;
        background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#667eea'};
        font-weight: 500;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
}

// -----------------------------
// Auto-redirect if already logged in
// -----------------------------
function checkExistingLogin() {
    const current = localStorage.getItem('goalforgeCurrentUser');
    if (current && window.location.pathname.includes('index.html')) {
        window.location.href = 'dashboard.html';
    }
}
