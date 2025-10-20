// ===============================================
// 🚨 IMMEDIATE SECURITY CHECK: Must execute first 🚨
// This checks if the main login key is present. If not, redirect immediately.
// ===============================================
if (!localStorage.getItem('goalforgeCurrentUser')) {
    window.location.href = 'index.html'; 
}

class FriendsManager {
    constructor() {
        this.friends = this.loadFriends();
        this.friendRequests = this.loadFriendRequests();
        this.activities = this.loadActivities();
        this._injectStyles();
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeApp());
        } else {
            this.initializeApp();
        }
    }

    initializeApp() {
        this.setupEventListeners();
        this.renderFriends();
        this.renderActivities();
        this.renderSuggestions();
    }

    setupEventListeners() {

        document.querySelectorAll('.add-friend-btn, .add-first-friend-btn').forEach(btn => {
            btn.addEventListener('click', () => this.openAddFriendModal());
        });


        const modal = document.getElementById('addFriendModal');
        if (modal) {
            modal.querySelector('.close-modal').addEventListener('click', () => this.closeModal());
            modal.querySelector('.cancel-btn').addEventListener('click', () => this.closeModal());
            modal.querySelector('.friend-form').addEventListener('submit', (e) => this.sendFriendRequest(e));
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
        }

      
        const quickAddBtn = document.querySelector('.send-request-btn');
        if (quickAddBtn) {
            quickAddBtn.addEventListener('click', () => this.quickAddFriend());
        }

 
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchFriends(e.target.value));
        }
    }

    _injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /*
             * MODAL STYLING: Self-contained CSS for the Add Friend Modal
             */
            
            .modal-overlay {
                display: none; /* CRITICAL: Hides the overlay when closed */
                position: fixed; 
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                justify-content: center;
                align-items: center;
                z-index: 2000;
            }
            
            .modal-overlay.active {
                display: flex; /* Makes the overlay visible when JavaScript adds the 'active' class */
            }

            .modal-content {
                background: white;
                padding: 40px; /* Generous padding for breathing room */
                border-radius: 12px;
                width: 450px;
                max-width: 90%;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
                position: relative;
                animation: fadeIn 0.3s ease-out;
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 25px;
            }

            .modal-header h2 {
                font-size: 24px;
                margin: 0;
                color: #1f2937;
            }

            .close-modal {
                background: none;
                border: none;
                font-size: 30px;
                color: #9ca3af;
                cursor: pointer;
                line-height: 1;
                padding: 0;
                transition: color 0.2s;
            }

            .close-modal:hover {
                color: #6b7280;
            }
            
            /* Form elements inside the modal */
            .form-group {
                margin-bottom: 20px;
            }

            .form-group label {
                display: block;
                font-weight: 500;
                margin-bottom: 8px;
                color: #374151;
                font-size: 14px;
            }

            .form-group input[type="email"],
            .form-group textarea {
                width: 100%;
                padding: 12px;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                box-sizing: border-box;
                font-size: 14px;
            }
            
            .form-group textarea {
                resize: vertical;
                min-height: 80px;
            }

            /* Modal Buttons */
            .modal-actions {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 30px;
            }

            .modal-actions button {
                padding: 10px 20px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                border: none;
            }

            .modal-actions .cancel-btn {
                background: #e5e7eb;
                color: #374151;
            }

            .modal-actions .cancel-btn:hover {
                background: #d1d5db;
            }

            .modal-actions .send-request-btn {
                background: #5b4bdb;
                color: white;
            }

            .modal-actions .send-request-btn:hover {
                background: #4f46e5;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    }


    openAddFriendModal() {
        const modal = document.getElementById('addFriendModal');
        if (modal) {
            modal.classList.add('active');
            document.getElementById('friend-email').focus();
        }
    }

    closeModal() {
        const modal = document.getElementById('addFriendModal');
        if (modal) {
            modal.classList.remove('active');
            document.querySelector('.friend-form').reset();
        }
    }

    sendFriendRequest(e) {
        e.preventDefault();
        
        const email = document.getElementById('friend-email').value;
        const message = document.getElementById('friend-message').value;
        
        if (!this.isValidEmail(email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return;
        }

    
        const request = {
            id: Date.now().toString(),
            email: email,
            message: message,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };

        this.friendRequests.push(request);
        this.saveFriendRequests();
        this.closeModal();
        
        this.showNotification('Friend request sent successfully!');
        
    
        setTimeout(() => {
            this.simulateFriendAcceptance(email);
        }, 2000);
    }

    quickAddFriend() {
        const emailInput = document.querySelector('.friend-email-input');
        const email = emailInput.value.trim();
        
        if (!email) {
            this.showNotification('Please enter an email address', 'error');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return;
        }

        this.simulateFriendAcceptance(email);
        emailInput.value = '';
    }

    simulateFriendAcceptance(email) {
        const name = email.split('@')[0];
        const newFriend = {
            id: Date.now().toString(),
            name: name.charAt(0).toUpperCase() + name.slice(1),
            email: email,
            avatar: name.charAt(0).toUpperCase(),
            joinedDate: new Date().toISOString(),
            goalsCompleted: Math.floor(Math.random() * 10),
            activeGoals: Math.floor(Math.random() * 5) + 1
        };

        this.friends.push(newFriend);
        this.saveFriends();
        this.renderFriends();
        
    
        this.addActivity(`${newFriend.name} accepted your friend request and joined GoalForge!`);
        
        this.showNotification(`${newFriend.name} is now your friend!`);
    }

    renderFriends() {
        const friendsList = document.querySelector('.friends-list');
        if (!friendsList) return;

        if (this.friends.length === 0) {
            this.showEmptyFriendsState();
            return;
        }

        this.hideEmptyFriendsState();

        const friendsHTML = this.friends.map(friend => `
            <div class="friend-card" data-friend-id="${friend.id}">
                <div class="friend-avatar">${friend.avatar}</div>
                <div class="friend-info">
                    <h4 class="friend-name">${this.escapeHtml(friend.name)}</h4>
                    <div class="friend-stats">
                        <span>${friend.activeGoals} active goals</span>
                        <span>${friend.goalsCompleted} completed</span>
                    </div>
                </div>
                <div class="friend-actions">
                    <button class="friend-action-btn message-btn" onclick="friendsManager.messageFriend('${friend.id}')" >
                        Message
                    </button>
                    <button class="friend-action-btn remove-btn" onclick="friendsManager.removeFriend('${friend.id}')">
                        Remove
                    </button>
                </div>
            </div>
        `).join('');

        friendsList.innerHTML = friendsHTML;
    }

    renderActivities() {
        const activityList = document.querySelector('.activity-list');
        if (!activityList) return;

        if (this.activities.length === 0) {
            activityList.innerHTML = '<div class="empty-activity"><p>Friend activity will appear here</p></div>';
            return;
        }

        const activitiesHTML = this.activities.slice(0, 5).map(activity => `
            <div class="activity-item">
                <p class="activity-message">${this.escapeHtml(activity.message)}</p>
                <p class="activity-time">${this.formatTime(activity.timestamp)}</p>
            </div>
        `).join('');

        activityList.innerHTML = activitiesHTML;
    }

    renderSuggestions() {
        const suggestionsList = document.querySelector('.suggestions-list');
        if (!suggestionsList) return;

 
        const suggestions = [
            { name: 'Alex Johnson', email: 'alex@example.com' },
            { name: 'Sarah Miller', email: 'sarah@example.com' },
            { name: 'Mike Chen', email: 'mike@example.com' }
        ];

        const suggestionsHTML = suggestions.map((suggestion, index) => `
            <div class="suggestion-item">
                <div class="suggestion-info">
                    <div class="suggestion-avatar">${suggestion.name.charAt(0)}</div>
                    <div>
                        <strong>${suggestion.name}</strong>
                        <div style="font-size: 12px; color: #6b7280;">${suggestion.email}</div>
                    </div>
                </div>
                <button class="add-suggestion-btn" onclick="friendsManager.addSuggestion('${suggestion.email}')">
                    Add
                </button>
            </div>
        `).join('');

        suggestionsList.innerHTML = suggestionsHTML;
    }

    showEmptyFriendsState() {
        const friendsList = document.querySelector('.friends-list');
        if (friendsList) {
            friendsList.innerHTML = `
                <div class="empty-friends-state">
                    <h3>No friends yet</h3>
                    <p>Add friends to build your accountability network!</p>
                    <button class="add-first-friend-btn">Add Your First Friend</button>
                </div>
            `;
            
    
            const addBtn = friendsList.querySelector('.add-first-friend-btn');
            if (addBtn) {
                addBtn.addEventListener('click', () => this.openAddFriendModal());
            }
        }
    }

    hideEmptyFriendsState() {
        const emptyState = document.querySelector('.empty-friends-state');
        if (emptyState) {
            emptyState.remove();
        }
    }

    messageFriend(friendId) {
        const friend = this.friends.find(f => f.id === friendId);
        if (friend) {
            this.showNotification(`Opening chat with ${friend.name}...`);
    
        }
    }

    removeFriend(friendId) {
        const friend = this.friends.find(f => f.id === friendId);
        if (friend && confirm(`Are you sure you want to remove ${friend.name} from your friends?`)) {
            this.friends = this.friends.filter(f => f.id !== friendId);
            this.saveFriends();
            this.renderFriends();
            this.addActivity(`You removed ${friend.name} from your friends.`);
            this.showNotification('Friend removed successfully');
        }
    }

    addSuggestion(email) {
        this.simulateFriendAcceptance(email);
    }

    searchFriends(query) {
        if (!query.trim()) {
            this.renderFriends();
            return;
        }

        const filteredFriends = this.friends.filter(friend =>
            friend.name.toLowerCase().includes(query.toLowerCase()) ||
            friend.email.toLowerCase().includes(query.toLowerCase())
        );

        const friendsList = document.querySelector('.friends-list');
        if (friendsList) {
            if (filteredFriends.length === 0) {
                friendsList.innerHTML = '<div class="empty-friends-state"><p>No friends found matching your search</p></div>';
            } else {
     
                const friendsHTML = filteredFriends.map(friend => `
                    <div class="friend-card" data-friend-id="${friend.id}">
                        <div class="friend-avatar">${friend.avatar}</div>
                        <div class="friend-info">
                            <h4 class="friend-name">${this.escapeHtml(friend.name)}</h4>
                            <div class="friend-stats">
                                <span>${friend.activeGoals} active goals</span>
                                <span>${friend.goalsCompleted} completed</span>
                            </div>
                        </div>
                        <div class="friend-actions">
                            <button class="friend-action-btn message-btn" onclick="friendsManager.messageFriend('${friend.id}')">
                                Message
                            </button>
                            <button class="friend-action-btn remove-btn" onclick="friendsManager.removeFriend('${friend.id}')">
                                Remove
                            </button>
                        </div>
                    </div>
                `).join('');

                friendsList.innerHTML = friendsHTML;
            }
        }
    }

    addActivity(message) {
        const activity = {
            id: Date.now().toString(),
            message: message,
            timestamp: new Date().toISOString()
        };

        this.activities.unshift(activity);
        this.saveActivities();
        this.renderActivities();
    }


    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
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

    showNotification(message, type = 'success') {

        // Check if GoalsManager (and its notification function) is available globally
        // This is a common pattern when sharing a function across pages.
        if (window.goalsManager && typeof window.goalsManager.showNotification === 'function') {
            window.goalsManager.showNotification(message);
        } else {
            // Fallback: create a temporary notification if the main one isn't loaded
            const notification = document.createElement('div');
            notification.className = 'notification';
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                top: 100px;
                right: 20px;
                background: ${type === 'error' ? '#ef4444' : '#10b981'};
                color: white;
                padding: 12px 20px;
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 3000;
            `;

            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
        }
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    loadFriends() {
        const saved = localStorage.getItem('goalforge-friends');
        return saved ? JSON.parse(saved) : [];
    }

    saveFriends() {
        localStorage.setItem('goalforge-friends', JSON.stringify(this.friends));
    }

    loadFriendRequests() {
        const saved = localStorage.getItem('goalforge-friend-requests');
        return saved ? JSON.parse(saved) : [];
    }

    saveFriendRequests() {
        localStorage.setItem('goalforge-friend-requests', JSON.stringify(this.friendRequests));
    }

    loadActivities() {
        const saved = localStorage.getItem('goalforge-activities');
        return saved ? JSON.parse(saved) : [
            {
                id: '1',
                message: 'Welcome to GoalForge! Connect with friends to stay motivated.',
                timestamp: new Date().toISOString()
            }
        ];
    }

    saveActivities() {
        localStorage.setItem('goalforge-activities', JSON.stringify(this.activities));
    }
}

// 🚨 CORRECT INITIALIZATION 🚨
let friendsManager;
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize the correct Manager for this page
    friendsManager = new FriendsManager(); 

    // 2. The Logout Handler (which was being blocked before)
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault(); 
            
            // 1. Clear the critical authentication key
            localStorage.removeItem('goalforgeCurrentUser'); 
            
            // 2. Clear any other user data (to be thorough)

            
            // 3. Redirect to the login page (index.html)
            window.location.href = 'index.html'; 
        });
    }
});