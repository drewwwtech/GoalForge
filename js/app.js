// GoalForge Main Application
class GoalForgeApp {
    constructor() {
        this.currentUser = null;
        this.goals = [];
        this.friends = [];
        this.init();
    }

    init() {
        console.log('GoalForge app initialized');
        this.loadUserData();
        this.setupEventListeners();
        this.updateUI();
    }

    loadUserData() {
        // Load from localStorage or create demo data
        const savedData = localStorage.getItem('goalforge-data');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.currentUser = data.user;
            this.goals = data.goals || [];
            this.friends = data.friends || [];
        } else {
            this.createDemoData();
        }
    }

    createDemoData() {
        this.currentUser = {
            name: 'User',
            email: 'user@goalforge.com',
            joinDate: new Date().toISOString()
        };

        this.goals = [
            {
                id: 1,
                title: 'Run 5K',
                description: 'Complete a 5K run without stopping',
                category: 'Health & Fitness',
                progress: 60,
                deadline: '2024-12-31',
                created: new Date().toISOString(),
                milestones: [
                    { text: 'Run 1K', completed: true },
                    { text: 'Run 3K', completed: true },
                    { text: 'Run 5K', completed: false }
                ]
            }
        ];

        this.friends = [
            {
                id: 1,
                name: 'Sarah Chen',
                goalsCompleted: 12,
                lastActive: '2 hours ago'
            },
            {
                id: 2, 
                name: 'Mike Rodriguez',
                goalsCompleted: 8,
                lastActive: '1 day ago'
            }
        ];

        this.saveData();
    }

    saveData() {
        const data = {
            user: this.currentUser,
            goals: this.goals,
            friends: this.friends
        };
        localStorage.setItem('goalforge-data', JSON.stringify(data));
    }

    setupEventListeners() {
        // Navigation
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-link')) {
                this.handleNavigation(e);
            }
        });

        // Login/Logout
        const loginBtn = document.querySelector('.login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.handleLogin());
        }
    }

    handleNavigation(e) {
        e.preventDefault();
        const page = e.target.getAttribute('href');
        if (page) {
            window.location.href = page;
        }
    }

    handleLogin() {
        // Simple login simulation
        alert('Login functionality would go here!');
    }

    updateUI() {
        // Update user greeting if on dashboard
        const welcomeElement = document.querySelector('.welcome-content h1');
        if (welcomeElement && this.currentUser) {
            welcomeElement.textContent = `Welcome back, ${this.currentUser.name}!`;
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.goalForgeApp = new GoalForgeApp();
});