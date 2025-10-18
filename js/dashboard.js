// ==================== DASHBOARD SCRIPT ====================
class DashboardManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.checkAuthentication();
            this.initializeDashboard();
            this.setupEventListeners();
            this.loadDashboardData();
        });
    }

    checkAuthentication() {
        this.currentUser = JSON.parse(localStorage.getItem('goalforgeCurrentUser'));
        if (!this.currentUser) {
            window.location.href = 'index.html';
            return;
        }

        // Update welcome message
        const welcomeElement = document.querySelector('.welcome-content h1');
        if (welcomeElement) {
            const displayName = this.currentUser.displayName || this.currentUser.email.split('@')[0];
            welcomeElement.textContent = `Welcome back, ${displayName}!`;
        }
    }

    initializeDashboard() {
        this.setupProfileDropdown();
        this.setupModals();
        this.updateStreakDisplay();
        this.loadRecentActivity();
    }

    setupEventListeners() {
        // Create goal button
        const addGoalBtn = document.querySelector('.add-goal-btn');
        if (addGoalBtn) {
            addGoalBtn.addEventListener('click', () => {
                window.location.href = 'goals.html';
            });
        }

        // Check-in button
        const checkinBtn = document.querySelector('.checkin-btn');
        if (checkinBtn) {
            checkinBtn.addEventListener('click', () => {
                this.completeWeeklyCheckin();
            });
        }

        // Encourage button
        const encourageBtn = document.querySelector('.encourage-btn');
        if (encourageBtn) {
            encourageBtn.addEventListener('click', () => {
                this.sendEncouragement();
            });
        }
    }

    // ==================== PROFILE DROPDOWN ====================
    setupProfileDropdown() {
        const profileTrigger = document.querySelector('.profile-trigger');
        const dropdownMenu = document.querySelector('.profile-dropdown');

        if (profileTrigger && dropdownMenu) {
            profileTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const isVisible = dropdownMenu.style.display === 'block';
                dropdownMenu.style.display = isVisible ? 'none' : 'block';
            });

            // Close when clicking outside
            document.addEventListener('click', (e) => {
                if (!dropdownMenu.contains(e.target) && !profileTrigger.contains(e.target)) {
                    dropdownMenu.style.display = 'none';
                }
            });
        }

        // === LOGOUT HANDLER ===
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // === PROFILE MODAL HANDLER ===
        const viewProfileBtn = document.getElementById('viewProfileBtn');
        const profileModal = document.getElementById('profileModal');
        const closeModalBtn = profileModal?.querySelector('.close-modal');

        if (viewProfileBtn && profileModal) {
            viewProfileBtn.addEventListener('click', () => {
                this.openProfileModal();
            });

            closeModalBtn?.addEventListener('click', () => {
                this.closeModal(profileModal);
            });

            profileModal.addEventListener('click', (e) => {
                if (e.target === profileModal) {
                    this.closeModal(profileModal);
                }
            });
        }
    }

    // ==================== MODALS ====================
    setupModals() {
        // Close all modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    openProfileModal() {
        const modal = document.getElementById('profileModal');
        if (modal) {
            this.updateProfileModalContent();
            modal.classList.add('active');
        }
    }

    updateProfileModalContent() {
        if (!this.currentUser) return;

        const profileEmail = document.getElementById('profileEmail');
        const memberSince = document.getElementById('memberSince');

        if (profileEmail) {
            profileEmail.textContent = this.currentUser.email;
        }

        if (memberSince) {
            const joinDate = this.currentUser.createdAt ?
                new Date(this.currentUser.createdAt).toLocaleDateString() : 'Recently';
            memberSince.textContent = joinDate;
        }
    }

    closeModal(modal) {
        modal.classList.remove('active');
    }

    closeAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.classList.remove('active');
        });
    }
    
    // ==================== DATA & ACTIVITY ====================
    loadDashboardData() {
        this.loadGoalsSummary();
        this.loadFriendActivity();
        this.updateMotivationPanel();
    }

    

    loadGoalsSummary() {
        console.log('Loading goals summary...');

        let goals = JSON.parse(localStorage.getItem('goalforge-goals')) || [];
        console.log('Loaded goals:', goals);
        


        const goalsBanner = document.querySelector('.goals-banner .goal-lists');

        console.log('Found goalsBanner:', goalsBanner);
        if (!goalsBanner) {
            console.warn('Goals banner element not found.');
           return;
        }

        goalsBanner.innerHTML = '';

        if (goals.length === 0) {
            goalsBanner.innerHTML = '<div class="empty-state">No goals yet. Create your first goal!</div>';
            return;
        }

        goals.forEach(goal => {
            const goalItem = document.createElement('div');
            goalItem.classList.add('goal-item');
            goalItem.innerHTML = `
                <div class="goal-title">${goal.title}</div>
                <div class="goal-category">${goal.category}</div>
                <div> class="goal-deadline">${goal.deadline ? goal.deadline : 'No deadline'}</div>
            `;
            goalsBanner.appendChild(goalItem);
        });

        const activeGoals = goals.filter(goal => goal.status === 'active');
        const completedGoals = goals.filter(goal => goal.status === 'completed');

        goalsBanner.innerHTML = `
            <div class="goals-summary">
                <div class="goal-stat">
                    <span class="stat-number">${activeGoals.length}</span>
                    <span class="stat-label">Active Goals</span>
                </div>
                <div class="goal-stat">
                    <span class="stat-number">${completedGoals.length}</span>
                    <span class="stat-label">Completed</span>
                </div>
                <div class="goal-stat">
                    <span class="stat-number">${Math.round((completedGoals.length / goals.length) * 100) || 0}%</span>
                    <span class="stat-label">Success Rate</span>
                </div>
            </div>
            <div class="recent-goals">
                <h4>Recent Goals</h4>
                ${activeGoals.slice(0, 3).map(goal => `
                    <div class="recent-goal">
                        <span class="goal-title">${this.escapeHtml(goal.title)}</span>
                        <span class="goal-progress">${goal.progress}%</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    

    loadFriendActivity() {
        const activities = JSON.parse(localStorage.getItem('goalforge-activities')) || [];
        const activityFeed = document.querySelector('.activity-feed');

        if (!activityFeed) return;

        if (activities.length === 0) {
            activityFeed.innerHTML = `
                <div class="empty-state">
                    <p>No recent activity</p>
                    <p>Add friends to see their progress!</p>
                </div>
            `;
            return;
        }

        activityFeed.innerHTML = activities.slice(0, 5).map(activity => `
            <div class="activity-item">
                <p class="activity-message">${this.escapeHtml(activity.message)}</p>
                <p class="activity-time">${this.formatTime(activity.timestamp)}</p>
            </div>
        `).join('');
    }

    loadRecentActivity() {
        const mockActivities = [
            "You completed your daily check-in! 🔥",
            "Sarah reached 50% on 'Learn Spanish'",
            "Mike completed 'Morning Run' goal! 🎉",
            "Your streak is getting impressive! 💪"
        ];

        if (Math.random() > 0.5) {
            const randomActivity = mockActivities[Math.floor(Math.random() * mockActivities.length)];
            this.addActivity(randomActivity);
        }
    }

    updateStreakDisplay() {
        const streakCount = document.querySelector('.streak-count');
        const streakMessage = document.querySelector('.streak-message');

        if (!streakCount || !streakMessage) return;

        const streak = this.currentUser.streak || 0;

        streakCount.textContent = `${streak} day streak!`;

        if (streak === 0) {
            streakMessage.textContent = "Start your journey today!";
        } else if (streak < 7) {
            streakMessage.textContent = "Great start! Keep building your streak.";
        } else if (streak < 30) {
            streakMessage.textContent = "You're building great habits!";
        } else {
            streakMessage.textContent = "Incredible consistency! You're inspiring others.";
        }
    }

    updateMotivationPanel() {
        const checkinStatus = document.querySelector('.checkin-status');
        if (checkinStatus) {
            const today = new Date().toDateString();
            const lastCheckin = this.currentUser.lastCheckin;

            if (lastCheckin === today) {
                checkinStatus.textContent = "Completed";
                checkinStatus.className = "checkin-status completed";
            } else {
                checkinStatus.textContent = "Pending";
                checkinStatus.className = "checkin-status pending";
            }
        }
    }

    // ==================== ACTIONS ====================
    completeWeeklyCheckin() {
        const today = new Date().toDateString();

        this.currentUser.lastCheckin = today;
        this.currentUser.streak = (this.currentUser.streak || 0) + 1;

        localStorage.setItem('goalforgeCurrentUser', JSON.stringify(this.currentUser));

        this.updateStreakDisplay();
        this.updateMotivationPanel();

        this.showNotification("Weekly check-in completed! Your streak continues! 🎉", "success");

        this.addActivity("Completed weekly check-in and maintained streak! 🔥");
    }

    sendEncouragement() {
        this.showNotification("Encouragement sent to your friends! 💌", "success");

        setTimeout(() => {
            const friends = ['Sarah', 'Mike', 'Alex'];
            const randomFriend = friends[Math.floor(Math.random() * friends.length)];
            this.addActivity(`${randomFriend} appreciated your encouragement! ❤️`);
        }, 2000);
    }

    addActivity(message) {
        const activities = JSON.parse(localStorage.getItem('goalforge-activities')) || [];
        const newActivity = {
            id: Date.now().toString(),
            message: message,
            timestamp: new Date().toISOString()
        };

        activities.unshift(newActivity);
        localStorage.setItem('goalforge-activities', JSON.stringify(activities));

        this.loadFriendActivity();
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('goalforgeCurrentUser');
            this.showNotification('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    }

    // ==================== UTILITIES ====================
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#667eea'};
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString();
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// ==================== STYLE INJECTION ====================
const dashboardStyle = document.createElement('style');
dashboardStyle.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }

    .goals-summary {
        display: flex;
        justify-content: space-around;
        margin-bottom: 20px;
        padding: 15px;
        background: #f8fafc;
        border-radius: 8px;
    }

    .goal-stat {
        text-align: center;
    }

    .stat-number {
        display: block;
        font-size: 24px;
        font-weight: bold;
        color: #5b4bdb;
    }

    .stat-label {
        font-size: 12px;
        color: #6b7280;
        text-transform: uppercase;
    }

    .recent-goals {
        margin-top: 15px;
    }

    .recent-goal {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #e5e7eb;
    }

    .recent-goal:last-child {
        border-bottom: none;
    }

    .goal-title {
        font-size: 14px;
        color: #374151;
    }

    .goal-progress {
        font-size: 12px;
        color: #10b981;
        font-weight: 600;
    }

    .checkin-status.pending {
        background: #fef3c7;
        color: #92400e;
    }

    .checkin-status.completed {
        background: #d1fae5;
        color: #065f46;
    }
`;
document.head.appendChild(dashboardStyle);

// ==================== INITIALIZE DASHBOARD ====================
let dashboardManager;
document.addEventListener('DOMContentLoaded', () => {
    const dashboardManager = new DashboardManager();
    dashboardManager.loadDashboardData();
});