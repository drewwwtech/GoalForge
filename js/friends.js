// Friends Management
class FriendsManager {
    constructor() {
        this.friends = [];
        this.init();
    }

    init() {
        this.loadFriends();
        this.setupEventListeners();
        this.renderFriends();
        this.renderActivity();
    }

    loadFriends() {
        const savedData = localStorage.getItem('goalforge-data');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.friends = data.friends || [];
        }
    }

    setupEventListeners() {
        // Add friend buttons
        const addFriendBtns = document.querySelectorAll('.add-friend-btn, .add-first-friend-btn');
        addFriendBtns.forEach(btn => {
            btn.addEventListener('click', () => this.openAddFriendModal());
        });

        // Modal controls
        const modal = document.getElementById('addFriendModal');
        if (modal) {
            modal.querySelector('.close-modal').addEventListener('click', () => this.closeModal());
            modal.querySelector('.cancel-btn').addEventListener('click', () => this.closeModal());
            modal.querySelector('.friend-form').addEventListener('submit', (e) => this.handleAddFriend(e));
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
        }

        // Quick add friend form
        const quickAddForm = document.querySelector('.friend-search');
        if (quickAddForm) {
            quickAddForm.querySelector('.send-request-btn').addEventListener('click', () => this.handleQuickAddFriend());
        }

        // Search functionality
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e));
        }
    }

    openAddFriendModal() {
        const modal = document.getElementById('addFriendModal');
        if (modal) {
            modal.style.display = 'flex';
            document.getElementById('friend-email').focus();
        }
    }

    closeModal() {
        const modal = document.getElementById('addFriendModal');
        if (modal) {
            modal.style.display = 'none';
            modal.querySelector('.friend-form').reset();
        }
    }

    handleAddFriend(e) {
        e.preventDefault();
        
        const email = document.getElementById('friend-email').value;
        const message = document.getElementById('friend-message').value;

        if (this.addFriend(email)) {
            this.closeModal();
            alert(`Friend request sent to ${email}`);
        }
    }

    handleQuickAddFriend() {
        const emailInput = document.querySelector('.friend-email-input');
        const email = emailInput.value.trim();
        
        if (email && this.addFriend(email)) {
            emailInput.value = '';
            alert(`Friend request sent to ${email}`);
        }
    }

    addFriend(email) {
        if (!email) {
            alert('Please enter an email address');
            return false;
        }

        // Check if friend already exists
        if (this.friends.some(friend => friend.email === email)) {
            alert('This friend is already in your list');
            return false;
        }

        const newFriend = {
            id: Date.now(),
            name: email.split('@')[0], // Simple name generation
            email: email,
            goalsCompleted: 0,
            lastActive: 'Just now',
            avatar: email.substring(0, 2).toUpperCase(),
            status: 'pending'
        };

        this.friends.push(newFriend);
        this.saveFriends();
        this.renderFriends();
        this.renderActivity();

        return true;
    }

    handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        this.renderFriends(searchTerm);
    }

    saveFriends() {
        const savedData = localStorage.getItem('goalforge-data');
        if (savedData) {
            const data = JSON.parse(savedData);
            data.friends = this.friends;
            localStorage.setItem('goalforge-data', JSON.stringify(data));
        }
    }

    renderFriends(searchTerm = '') {
        const friendsList = document.querySelector('.friends-list');
        if (!friendsList) return;

        friendsList.innerHTML = '';

        let filteredFriends = this.friends;
        if (searchTerm) {
            filteredFriends = this.friends.filter(friend => 
                friend.name.toLowerCase().includes(searchTerm) || 
                friend.email.toLowerCase().includes(searchTerm)
            );
        }

        if (filteredFriends.length === 0) {
            friendsList.innerHTML = `
                <div class="empty-friends-state">
                    <h3>No friends found</h3>
                    <p>${searchTerm ? 'Try a different search term' : 'Add friends to build your accountability network!'}</p>
                    <button class="add-first-friend-btn">Add Your First Friend</button>
                </div>
            `;
            
            friendsList.querySelector('.add-first-friend-btn').addEventListener('click', () => this.openAddFriendModal());
            return;
        }

        filteredFriends.forEach(friend => {
            const friendCard = this.createFriendCard(friend);
            friendsList.appendChild(friendCard);
        });
    }

    createFriendCard(friend) {
        const card = document.createElement('div');
        card.className = 'friend-card';
        card.innerHTML = `
            <div class="friend-avatar">${friend.avatar}</div>
            <div class="friend-info">
                <h4 class="friend-name">${friend.name}</h4>
                <div class="friend-stats">
                    <span>${friend.goalsCompleted} goals completed</span>
                    <span>${friend.lastActive}</span>
                </div>
            </div>
            <div class="friend-actions">
                <button class="friend-action-btn message-btn">Message</button>
                <button class="friend-action-btn remove-btn" data-id="${friend.id}">Remove</button>
            </div>
        `;

        card.querySelector('.remove-btn').addEventListener('click', (e) => {
            this.removeFriend(friend.id);
        });

        card.querySelector('.message-btn').addEventListener('click', (e) => {
            this.sendMessage(friend.id);
        });

        return card;
    }

    removeFriend(friendId) {
        if (confirm('Are you sure you want to remove this friend?')) {
            this.friends = this.friends.filter(friend => friend.id !== friendId);
            this.saveFriends();
            this.renderFriends();
            this.renderActivity();
        }
    }

    sendMessage(friendId) {
        const friend = this.friends.find(f => f.id === friendId);
        if (friend) {
            const message = prompt(`Send a message to ${friend.name}:`);
            if (message) {
                alert(`Message sent to ${friend.name}: "${message}"`);
                // In a real app, this would send to a backend
            }
        }
    }

    renderActivity() {
        const activityFeed = document.querySelector('.activity-feed');
        const activityList = document.querySelector('.activity-list');
        
        if (activityFeed) {
            this.renderDashboardActivity(activityFeed);
        }
        
        if (activityList) {
            this.renderFriendsActivity(activityList);
        }
    }

    renderDashboardActivity(container) {
        if (this.friends.length === 0) {
            container.innerHTML = '<div class="empty-state">Friend activity will appear here</div>';
            return;
        }

        // Generate some sample activity
        const activities = [
            `${this.friends[0]?.name} completed "Learn Spanish" goal! 🎉`,
            `${this.friends[1]?.name || 'Sarah'} is on a 7-day streak! 🔥`,
            `${this.friends[0]?.name || 'Alex'} just checked in for the week ✅`,
            'Your circle completed 12 goals this week!'
        ];

        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <p class="activity-message">${activity}</p>
                <p class="activity-time">${Math.floor(Math.random() * 24)} hours ago</p>
            </div>
        `).join('');
    }

    renderFriendsActivity(container) {
        if (this.friends.length === 0) {
            container.innerHTML = '<div class="empty-activity"><p>Friend activity will appear here</p></div>';
            return;
        }

        const activities = this.friends.map(friend => 
            `${friend.name} completed ${friend.goalsCompleted} goals - Last active: ${friend.lastActive}`
        );

        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <p class="activity-message">${activity}</p>
            </div>
        `).join('');
    }
}

// Initialize friends manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.friends-main') || document.querySelector('.activity-feed')) {
        window.friendsManager = new FriendsManager();
    }
});