// js/navigation.js - Global Navigation & Shared Functions

// Global logout function
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('goalforgeCurrentUser');
        showMessage('Logged out successfully', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

// Global message function
function showMessage(text, type = 'info') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.global-message');
    existingMessages.forEach(msg => msg.remove());
    
    const messageEl = document.createElement('div');
    messageEl.className = `global-message message ${type}-message`;
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
    
    if (type === 'error') messageEl.style.background = '#ef4444';
    else if (type === 'success') messageEl.style.background = '#10b981';
    else messageEl.style.background = '#667eea';
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        messageEl.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => messageEl.remove(), 300);
    }, 3000);
}

// Check authentication on protected pages
function checkAuth() {
    const currentUser = JSON.parse(localStorage.getItem('goalforgeCurrentUser'));
    if (!currentUser && !window.location.pathname.includes('index.html')) {
        window.location.href = 'index.html';
        return null;
    }
    return currentUser;
}

// Get current user data
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('goalforgeCurrentUser'));
}

// Update user data
function updateCurrentUser(updatedUser) {
    localStorage.setItem('goalforgeCurrentUser', JSON.stringify(updatedUser));
    
    // Also update in users array
    const users = JSON.parse(localStorage.getItem('goalforgeUsers')) || [];
    const userIndex = users.findIndex(user => user.id === updatedUser.id);
    if (userIndex !== -1) {
        users[userIndex] = updatedUser;
        localStorage.setItem('goalforgeUsers', JSON.stringify(users));
    }
}

// Add animations to CSS
if (!document.querySelector('style[data-global-animations]')) {
    const style = document.createElement('style');
    style.setAttribute('data-global-animations', 'true');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .global-message {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
    `;
    document.head.appendChild(style);
}