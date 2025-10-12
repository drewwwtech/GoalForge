// js/app.js - Main Application Logic

// User data structure
const userData = {
    isLoggedIn: false,
    currentUser: null,
    users: [] // Will store all registered users
};

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    console.log('GoalForge app loaded!');
    initializeApp();
});

function initializeApp() {
    // Load existing users from localStorage
    loadUsers();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check if user is already logged in
    checkExistingLogin();
}

// Load users from localStorage
function loadUsers() {
    const savedUsers = localStorage.getItem('goalforgeUsers');
    if (savedUsers) {
        userData.users = JSON.parse(savedUsers);
    }
}

// Save users to localStorage
function saveUsers() {
    localStorage.setItem('goalforgeUsers', JSON.stringify(userData.users));
}

// Set up all event listeners
function setupEventListeners() {
    // Login form submission
    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleSignup);
    }
    
    // Login button in header
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', showLoginModal);
    }
    
    // Social login buttons
    const socialButtons = document.querySelectorAll('.social-login button');
    socialButtons.forEach(button => {
        button.addEventListener('click', handleSocialLogin);
    });
}

// Handle signup form submission
function handleSignup(event) {
    event.preventDefault(); // Prevent page reload
    
    // Get form data
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Validate form
    if (validateSignupForm(email, password, confirmPassword)) {
        // Create new user
        const newUser = createUser(email, password);
        
        // Save user and log them in
        userData.users.push(newUser);
        userData.currentUser = newUser;
        userData.isLoggedIn = true;
        
        saveUsers();
        
        // Show success message and redirect
        showMessage('Account created successfully!', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    }
}

// Validate signup form
function validateSignupForm(email, password, confirmPassword) {
    // Check if email is valid
    if (!isValidEmail(email)) {
        showMessage('Please enter a valid email address', 'error');
        return false;
    }
    
    // Check if user already exists
    if (userExists(email)) {
        showMessage('An account with this email already exists', 'error');
        return false;
    }
    
    // Check password length
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters long', 'error');
        return false;
    }
    
    // Check if passwords match
    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return false;
    }
    
    return true;
}

// Check if email is valid
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Check if user already exists
function userExists(email) {
    return userData.users.some(user => user.email === email);
}

// Create new user object
function createUser(email, password) {
    return {
        id: Date.now().toString(), // Simple ID generation
        email: email,
        password: password, // In real app, this would be hashed
        createdAt: new Date().toISOString(),
        goals: [],
        circles: [],
        streak: 0
    };
}

// Show message to user
function showMessage(text, type = 'info') {
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}-message`;
    messageEl.textContent = text;
    messageEl.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    // Set background color based on type
    if (type === 'error') {
        messageEl.style.background = '#ef4444'; // Red
    } else if (type === 'success') {
        messageEl.style.background = '#10b981'; // Green
    } else {
        messageEl.style.background = '#667eea'; // Blue
    }
    
    // Add to page
    document.body.appendChild(messageEl);
    
    // Remove after 3 seconds
    setTimeout(() => {
        messageEl.remove();
    }, 3000);
}

// Check if user is already logged in
function checkExistingLogin() {
    const savedUser = localStorage.getItem('goalforgeCurrentUser');
    if (savedUser) {
        userData.currentUser = JSON.parse(savedUser);
        userData.isLoggedIn = true;
        // If on login page but already logged in, redirect to dashboard
        if (window.location.pathname.includes('index.html')) {
            window.location.href = 'dashboard.html';
        }
    }
}

// Handle social login (placeholder for now)
function handleSocialLogin(event) {
    const provider = event.target.textContent.includes('Google') ? 'google' : 'facebook';
    showMessage(`${provider} login would be implemented here`, 'info');
}

// Show login modal (for header login button)
function showLoginModal() {
    showMessage('Login functionality would open here', 'info');
}

