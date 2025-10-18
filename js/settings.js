// js/settings.js - Settings Page Functionality

document.addEventListener('DOMContentLoaded', function() {
    initializeSettings();
});

function initializeSettings() {
    checkAuthentication();
    loadSettingsData();
    setupSettingsEvents();
    setupTabNavigation();
}

// Check if user is logged in
function checkAuthentication() {
    const currentUser = JSON.parse(localStorage.getItem('goalforgeCurrentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    return currentUser;
}

// Load user settings and data
function loadSettingsData() {
    const user = checkAuthentication();
    if (!user) return;

    // Load user data into forms
    loadUserProfile(user);
    loadNotificationSettings(user);
    loadPrivacySettings(user);
    loadAppearanceSettings(user);
    loadUserStats(user);
}

// Set up all event listeners
function setupSettingsEvents() {
    // Account form submission
    const accountForm = document.getElementById('accountForm');
    if (accountForm) {
        accountForm.addEventListener('submit', handleAccountUpdate);
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Real-time setting changes
    setupRealTimeSettings();
}

// Set up tab navigation
function setupTabNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active class from all items and tabs
            navItems.forEach(nav => nav.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            
            // Add active class to clicked item and target tab
            this.classList.add('active');
            document.getElementById(`${targetTab}-tab`).classList.add('active');
        });
    });
}

// Load user profile data into form
function loadUserProfile(user) {
    document.getElementById('displayName').value = user.displayName || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('bio').value = user.bio || '';
}

// Load notification settings
function loadNotificationSettings(user) {
    const settings = user.settings?.notifications || {};
    
    document.getElementById('emailGoalReminders').checked = settings.emailGoalReminders !== false;
    document.getElementById('emailCircleActivity').checked = settings.emailCircleActivity !== false;
    document.getElementById('emailWeeklyReports').checked = settings.emailWeeklyReports || false;
    document.getElementById('pushGoalUpdates').checked = settings.pushGoalUpdates !== false;
    document.getElementById('pushCircleMessages').checked = settings.pushCircleMessages !== false;
    document.getElementById('pushStreakReminders').checked = settings.pushStreakReminders !== false;
}

// Load privacy settings
function loadPrivacySettings(user) {
    const settings = user.settings?.privacy || {};
    
    // Profile visibility
    const visibility = settings.profileVisibility || 'public';
    document.querySelector(`input[name="profileVisibility"][value="${visibility}"]`).checked = true;
    
    // Activity sharing
    document.getElementById('shareGoalCompletions').checked = settings.shareGoalCompletions !== false;
    document.getElementById('shareMilestoneProgress').checked = settings.shareMilestoneProgress !== false;
}

// Load appearance settings
function loadAppearanceSettings(user) {
    const settings = user.settings?.appearance || {};
    
    // Theme
    const theme = settings.theme || 'light';
    document.querySelector(`input[name="theme"][value="${theme}"]`).checked = true;
    
    // Layout
    document.getElementById('compactLayout').checked = settings.compactLayout || false;
    
    // Apply current theme
    applyTheme(theme);
}

// Load user stats
function loadUserStats(user) {
    document.getElementById('totalGoals').textContent = user.goals?.length || 0;
    document.getElementById('currentStreak').textContent = user.streak || 0;
    document.getElementById('circlesCount').textContent = user.circles?.length || 0;
}

// Set up real-time setting changes
function setupRealTimeSettings() {
    // Theme changes
    const themeRadios = document.querySelectorAll('input[name="theme"]');
    themeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                applyTheme(this.value);
                saveSetting('appearance', 'theme', this.value);
            }
        });
    });

    // Toggle switches
    const toggles = document.querySelectorAll('.toggle-label input[type="checkbox"]');
    toggles.forEach(toggle => {
        toggle.addEventListener('change', function() {
            const category = getSettingCategory(this.id);
            const setting = this.id;
            saveSetting(category, setting, this.checked);
        });
    });

    // Radio buttons (privacy)
    const privacyRadios = document.querySelectorAll('input[name="profileVisibility"]');
    privacyRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                saveSetting('privacy', 'profileVisibility', this.value);
            }
        });
    });
}

// Handle account form submission
function handleAccountUpdate(event) {
    event.preventDefault();
    
    const user = checkAuthentication();
    if (!user) return;

    // Get form values
    const displayName = document.getElementById('displayName').value;
    const bio = document.getElementById('bio').value;

    // Update user data
    user.displayName = displayName;
    user.bio = bio;

    // Save to localStorage
    localStorage.setItem('goalforgeCurrentUser', JSON.stringify(user));
    
    // Update in users array
    updateUserInStorage(user);

    showMessage('Profile updated successfully!', 'success');
}

// Save individual setting
function saveSetting(category, setting, value) {
    const user = JSON.parse(localStorage.getItem('goalforgeCurrentUser'));
    if (!user) return;

    // Initialize settings object if it doesn't exist
    if (!user.settings) {
        user.settings = {};
    }
    if (!user.settings[category]) {
        user.settings[category] = {};
    }

    // Update setting
    user.settings[category][setting] = value;

    // Save user
    localStorage.setItem('goalforgeCurrentUser', JSON.stringify(user));
    updateUserInStorage(user);

    // Show quick save feedback
    showQuickSaveFeedback();
}

// Get setting category from ID
function getSettingCategory(settingId) {
    if (settingId.includes('email') || settingId.includes('push')) {
        return 'notifications';
    } else if (settingId.includes('share') || settingId.includes('Visibility')) {
        return 'privacy';
    } else if (settingId.includes('Layout') || settingId.includes('theme')) {
        return 'appearance';
    }
    return 'general';
}

// Apply theme to the page
function applyTheme(theme) {
    const body = document.body;
    
    // Remove existing theme classes
    body.classList.remove('theme-light', 'theme-dark');
    
    // Apply new theme
    if (theme === 'dark') {
        body.classList.add('theme-dark');
    } else if (theme === 'light') {
        body.classList.add('theme-light');
    } else {
        // Auto theme - use system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            body.classList.add('theme-dark');
        } else {
            body.classList.add('theme-light');
        }
    }
}

// Update user in main users array
function updateUserInStorage(updatedUser) {
    const users = JSON.parse(localStorage.getItem('goalforgeUsers')) || [];
    const userIndex = users.findIndex(user => user.id === updatedUser.id);
    
    if (userIndex !== -1) {
        users[userIndex] = updatedUser;
        localStorage.setItem('goalforgeUsers', JSON.stringify(users));
    }
}

// Save notification settings
function saveNotificationSettings() {
    const user = JSON.parse(localStorage.getItem('goalforgeCurrentUser'));
    if (!user) return;

    if (!user.settings) user.settings = {};
    if (!user.settings.notifications) user.settings.notifications = {};

    user.settings.notifications = {
        emailGoalReminders: document.getElementById('emailGoalReminders').checked,
        emailCircleActivity: document.getElementById('emailCircleActivity').checked,
        emailWeeklyReports: document.getElementById('emailWeeklyReports').checked,
        pushGoalUpdates: document.getElementById('pushGoalUpdates').checked,
        pushCircleMessages: document.getElementById('pushCircleMessages').checked,
        pushStreakReminders: document.getElementById('pushStreakReminders').checked
    };

    localStorage.setItem('goalforgeCurrentUser', JSON.stringify(user));
    updateUserInStorage(user);
    
    showMessage('Notification settings saved!', 'success');
}

// Save privacy settings
function savePrivacySettings() {
    const user = JSON.parse(localStorage.getItem('goalforgeCurrentUser'));
    if (!user) return;

    if (!user.settings) user.settings = {};
    if (!user.settings.privacy) user.settings.privacy = {};

    const visibility = document.querySelector('input[name="profileVisibility"]:checked').value;

    user.settings.privacy = {
        profileVisibility: visibility,
        shareGoalCompletions: document.getElementById('shareGoalCompletions').checked,
        shareMilestoneProgress: document.getElementById('shareMilestoneProgress').checked
    };

    localStorage.setItem('goalforgeCurrentUser', JSON.stringify(user));
    updateUserInStorage(user);
    
    showMessage('Privacy settings saved!', 'success');
}

// Save appearance settings
function saveAppearanceSettings() {
    const user = JSON.parse(localStorage.getItem('goalforgeCurrentUser'));
    if (!user) return;

    if (!user.settings) user.settings = {};
    if (!user.settings.appearance) user.settings.appearance = {};

    const theme = document.querySelector('input[name="theme"]:checked').value;

    user.settings.appearance = {
        theme: theme,
        compactLayout: document.getElementById('compactLayout').checked
    };

    localStorage.setItem('goalforgeCurrentUser', JSON.stringify(user));
    updateUserInStorage(user);
    
    showMessage('Appearance settings saved!', 'success');
}

// Data management functions

function deleteAccount() {
    if (confirm('Are you absolutely sure? This will permanently delete your account and all data. This action cannot be undone.')) {
        const user = JSON.parse(localStorage.getItem('goalforgeCurrentUser'));
        if (user) {
            // Remove from users array
            const users = JSON.parse(localStorage.getItem('goalforgeUsers')) || [];
            const updatedUsers = users.filter(u => u.id !== user.id);
            localStorage.setItem('goalforgeUsers', JSON.stringify(updatedUsers));
            
            // Clear current user
            localStorage.removeItem('goalforgeCurrentUser');
            
            showMessage('Account deleted successfully', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        }
    }
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('goalforgeCurrentUser');
    showMessage('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Show quick save feedback
function showQuickSaveFeedback() {
    const feedback = document.createElement('div');
    feedback.textContent = '✓ Saved';
    feedback.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        animation: fadeInOut 2s ease;
    `;
    
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        feedback.remove();
    }, 2000);
}

// Reuse message function
function showMessage(text, type = 'info') {
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
    
    if (type === 'error') messageEl.style.background = '#ef4444';
    else if (type === 'success') messageEl.style.background = '#10b981';
    else messageEl.style.background = '#667eea';
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        messageEl.remove();
    }, 3000);
}

// Add fadeInOut animation to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(10px); }
        20% { opacity: 1; transform: translateY(0); }
        80% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-10px); }
    }
`;
document.head.appendChild(style);