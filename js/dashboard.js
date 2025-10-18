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


        if (this.currentUser.streak === undefined) {
            this.currentUser.streak = 0;
            this.currentUser.lastCheckin = null;
            localStorage.setItem('goalforgeCurrentUser', JSON.stringify(this.currentUser));
        }

        const welcomeElement = document.querySelector('.welcome-content h1');
        if (welcomeElement) {
            const displayName = this.currentUser.displayName || this.currentUser.email.split('@')[0];
            welcomeElement.textContent = `Welcome back, ${displayName}!`;
        }
    }


    initializeDashboard() {
        this.setupProfileDropdown();
        this.setupModals();
        this.setupDailyStreakSystem();
        this.loadRecentActivity();
    }

    setupEventListeners() {
        const addGoalBtn = document.querySelector('.add-goal-btn');
        if (addGoalBtn) addGoalBtn.addEventListener('click', () => window.location.href = 'goals.html');

        const encouragebtn = document.querySelector('.encourage-btn');
        if (encouragebtn) encouragebtn.addEventListener('click', () => this.sendEncouragement());
    }


    setupProfileDropdown() {
        const profileTrigger = document.querySelector('.profile-trigger');
        const dropdownMenu = document.querySelector('.profile-dropdown');

        if (profileTrigger && dropdownMenu) {
            profileTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
            });

            document.addEventListener('click', (e) => {
                if (!dropdownMenu.contains(e.target) && !profileTrigger.contains(e.target)) {
                    dropdownMenu.style.display = 'none';
                }
            });
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) logoutBtn.addEventListener('click', () => this.handleLogout());

        const viewProfileBtn = document.getElementById('viewProfileBtn');
        const profileModal = document.getElementById('profileModal');
        const closeModalBtn = profileModal?.querySelector('.close-modal');

        if (viewProfileBtn && profileModal) {
            viewProfileBtn.addEventListener('click', () => this.openProfileModal());
            closeModalBtn?.addEventListener('click', () => this.closeModal(profileModal));
            profileModal.addEventListener('click', (e) => {
                if (e.target === profileModal) this.closeModal(profileModal);
            });
        }
    }


    setupModals() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeAllModals();
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

        if (profileEmail) profileEmail.textContent = this.currentUser.email;

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
        document.querySelectorAll('.modal-overlay').forEach(modal => modal.classList.remove('active'));
    }


    loadDashboardData() {
        this.loadGoalsSummary();
        this.loadFriendActivity();
        this.updateStreakDisplay();
    }

    loadGoalsSummary() {
        let goals = JSON.parse(localStorage.getItem('goalforge-goals')) || [];
        const goalsBanner = document.querySelector('.goals-banner .goal-lists');

        if (!goalsBanner) return;
        goalsBanner.innerHTML = '';

        if (goals.length === 0) {
            goalsBanner.innerHTML = '<div class="empty-state">No goals yet. Create your first goal!</div>';
            return;
        }

        const activeGoals = goals.filter(goal => goal.status === 'active');
        const completedGoals = goals.filter(goal => goal.status === 'completed');

        goalsBanner.innerHTML = `
            <div class="goals-summary">
                <div class="goal-stat"><span class="stat-number">${activeGoals.length}</span><span class="stat-label">Active</span></div>
                <div class="goal-stat"><span class="stat-number">${completedGoals.length}</span><span class="stat-label">Completed</span></div>
                <div class="goal-stat"><span class="stat-number">${Math.round((completedGoals.length / goals.length) * 100) || 0}%</span><span class="stat-label">Success</span></div>
            </div>
            <div class="recent-goals">
                <h4>Recent Goals</h4>
                ${activeGoals.slice(0, 3).map(goal => `
                    <div class="recent-goal">
                        <span class="goal-title">${this.escapeHtml(goal.title)}</span>
                        <span class="goal-progress">${goal.progress || 0}%</span>
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
            "Sarah reached 50% on 'Learn Spanish' 📘",
            "Mike completed 'Morning Run' goal! 🎉",
            "Your streak is getting impressive! 💪"
        ];

        if (Math.random() > 0.5) {
            const randomActivity = mockActivities[Math.floor(Math.random() * mockActivities.length)];
            this.addActivity(randomActivity);
        }
    }

    sendEncouragement() {
        const quotes = [
            "Keep pushing! Small steps still move you forward 💪",
            "Your consistency is your superpower 🔥",
            "You're doing great — don't stop now! 🌟",
            "Progress, not perfection. Keep it up! 🚀",
            "Your effort today builds your tomorrow 💯"
        ];

        const friends = ['Sarah', 'Mike', 'Alex'];
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        const randomFriend = friends[Math.floor(Math.random() * friends.length)];

        this.showNotification(`Sent support to ${randomFriend}: "${randomQuote}"`, "success");
        this.addActivity(`You encouraged ${randomFriend}: "${randomQuote}" ❤️`);

        setTimeout(() => {
            const randomFriend = friends[Math.floor(Math.random() * friends.length)];
            this.addActivity(`${randomFriend} appreciated your encouragement! ❤️`);
        }, 2000);
    }

    addActivity(message) {
        const activities = JSON.parse(localStorage.getItem('goalforge-activities')) || [];
        const newActivity = { id: Date.now().toString(), message, timestamp: new Date().toISOString() };

        activities.unshift(newActivity);
        localStorage.setItem('goalforge-activities', JSON.stringify(activities));
        this.loadFriendActivity();
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('goalforgeCurrentUser');
            this.showNotification('Logged out successfully', 'success');
            setTimeout(() => window.location.href = 'index.html', 1000);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed; top: 100px; right: 20px;
            padding: 12px 20px; border-radius: 8px;
            color: white; font-weight: 500; z-index: 10000;
            background: ${type === 'error' ? '#ef4444' :
                type === 'success' ? '#10b981' : '#667eea'};
            animation: slideIn 0.3s ease;
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
        return unsafe.replace(/&/g, "&amp;")
                     .replace(/</g, "&lt;")
                     .replace(/>/g, "&gt;")
                     .replace(/"/g, "&quot;")
                     .replace(/'/g, "&#039;");
    }
}

const dashboardStyle = document.createElement('style');
dashboardStyle.textContent = `
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
.goals-summary { display: flex; justify-content: space-around; margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; }
.goal-stat { text-align: center; }
.stat-number { font-size: 24px; font-weight: bold; color: #5b4bdb; }
.stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
.recent-goals { margin-top: 15px; }
.recent-goal { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
.recent-goal:last-child { border-bottom: none; }
.goal-title { font-size: 14px; color: #374151; }
.goal-progress { font-size: 12px; color: #10b981; font-weight: 600; }
.checkin-btn { padding: 12px 24px; border-radius: 8px; border: none; cursor: pointer; font-weight: bold; background: #4caf50; color: white; transition: all 0.3s ease; font-size: 14px; margin-top: 10px; }
.checkin-btn:hover:not(:disabled) { background: #45a049; transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.2); }
.checkin-btn.completed { background: #2196f3; cursor: not-allowed; transform: none; box-shadow: none; }
.checkin-btn:disabled { cursor: not-allowed; opacity: 0.8; }
.streak-section { text-align: center; margin-bottom: 20px; }
.streak-count { font-size: 24px; font-weight: bold; color: #5b4bdb; margin-bottom: 8px; }
.streak-message { font-size: 14px; color: #6b7280; font-style: italic; line-height: 1.4; }
`;
document.head.appendChild(dashboardStyle);


let dashboardManager;
document.addEventListener('DOMContentLoaded', () => {
    dashboardManager = new DashboardManager();
    dashboardManager.loadDashboardData();
});