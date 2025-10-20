// ===============================================
// 🚨 IMMEDIATE SECURITY CHECK: Must execute first 🚨
// This checks if the main login key is present. If not, redirect immediately.
// You must apply this exact block to the top of circles.js, settings.js, and help.js as well.
// ===============================================
if (!localStorage.getItem('goalforgeCurrentUser')) {
    window.location.href = 'index.html'; 
}
// ===============================================


class GoalsManager {
    constructor() {
        this.goals = this.loadGoals();
        this.currentFilter = 'all';
        this.notifications = [];
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
      
        this.modal = document.getElementById('createGoalModal');
        this.goalsGrid = document.querySelector('.goals-grid');
        this.emptyState = document.querySelector('.empty-goals-state');
        
        
        this.setupEventListeners();
        
        
        setTimeout(() => {
            this.renderGoals();
        }, 100);
    }

    setupEventListeners() {
        
        document.querySelectorAll('.create-goal-btn, .create-first-goal-btn').forEach(btn => {
            btn.addEventListener('click', () => this.openModal());
        });

        
        document.querySelector('.close-modal').addEventListener('click', () => this.closeModal());
        document.querySelector('.cancel-btn').addEventListener('click', () => this.closeModal());
        
        // Assuming this should be refactored to handle submission/edit (if not already done)
        document.querySelector('.goal-form').addEventListener('submit', (e) => this.createGoal(e));
        
        
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });

        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target));
        });

        document.querySelector('.sort-select').addEventListener('change', (e) => {
            this.sortGoals(e.target.value);
        });
    }

    openModal() {
        this.modal.classList.add('active');
        document.getElementById('goal-title').focus();
    }

    closeModal() {
        this.modal.classList.remove('active');
        document.querySelector('.goal-form').reset();

        document.querySelector('.modal-header h2').textContent = 'Create New Goal';
        document.querySelector('.create-btn').textContent = 'Create Goal';
        this.editingGoalId = null;
    }

    createGoal(e) {
        e.preventDefault();
        
        const goal = {
            id: Date.now().toString(),
            title: document.getElementById('goal-title').value,
            description: document.getElementById('goal-description').value,
            category: document.getElementById('goal-category').value,
            deadline: document.getElementById('goal-deadline').value,
            progress: 0,
            milestones: [],
            createdAt: new Date().toISOString(),
            status: 'active'
        };

        this.goals.push(goal);
        this.saveGoals();
        this.renderGoals();
        this.closeModal();
        

        this.showNotification('Goal created successfully!');
    }


    completeGoal(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (goal) {
            if (goal.status === 'completed') {
    
                goal.status = 'active';
                goal.progress = 0;
                goal.completedAt = null;
                this.showNotification('Goal reactivated!');
            } else {

                goal.status = 'completed';
                goal.progress = 100;
                goal.completedAt = new Date().toISOString();
                this.showNotification('Goal completed! Great job!');
            }
            this.saveGoals();
            this.renderGoals();
        }
    }

    renderGoals() {

        this.goalsGrid.innerHTML = '';


        const filteredGoals = this.getFilteredGoals();

        if (filteredGoals.length === 0) {
            this.showEmptyState();
            return;
        }

        this.hideEmptyState();
        
        const goalsHTML = filteredGoals.map(goal => `
            <div class="goal-card ${goal.status === 'completed' ? 'completed' : ''}" data-goal-id="${goal.id}">
                <div class="goal-header">
                    <h3 class="goal-title">${this.escapeHtml(goal.title)}</h3>
                    <span class="goal-category">${goal.category}</span>
                </div>
                
                ${goal.description ? `<p class="goal-description">${this.escapeHtml(goal.description)}</p>` : ''}
                
                <div class="goal-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${goal.progress}%"></div>
                    </div>
                </div>
                
                ${goal.deadline ? `
                    <div class="goal-deadline">
                        <strong>Target:</strong> ${new Date(goal.deadline).toLocaleDateString()}
                    </div>
                ` : ''}
                
                <div class="goal-status">
                    <span class="status-badge ${goal.status}">${goal.status}</span>
                    ${goal.completedAt ? `
                        <div class="completion-date">
                            Completed: ${new Date(goal.completedAt).toLocaleDateString()}
                        </div>
                    ` : ''}
                </div>
                
                <div class="goal-actions">
                    <button class="complete-goal-btn" onclick="goalsManager.completeGoal('${goal.id}')">
                        ${goal.status === 'completed' ? 'Reactivate' : 'Mark Complete'}
                    </button>
                    <button class="edit-goal-btn" onclick="goalsManager.editGoal('${goal.id}')">
                        Edit
                    </button>
                    <button class="delete-goal-btn" onclick="goalsManager.deleteGoal('${goal.id}')">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');

        this.goalsGrid.innerHTML = goalsHTML;
    }

    getFilteredGoals() {
        switch (this.currentFilter) {
            case 'active':
                return this.goals.filter(goal => goal.status === 'active');
            case 'completed':
                return this.goals.filter(goal => goal.status === 'completed');
            case 'all':
            default:
                return this.goals;
        }
    }

    showEmptyState() {

        const existingEmptyState = document.querySelector('.empty-goals-state');
        if (existingEmptyState) {
            existingEmptyState.remove();
        }

        let message = '';
        switch (this.currentFilter) {
            case 'active':
                message = 'No active goals. Create a goal to get started!';
                break;
            case 'completed':
                message = 'No completed goals yet. Keep working on your active goals!';
                break;
            case 'all':
            default:
                message = 'No goals yet. Create your first goal to start tracking your progress!';
        }

        const emptyStateHTML = `
            <div class="empty-goals-state">
                <h3>${this.currentFilter === 'all' ? 'No goals yet' : `No ${this.currentFilter} goals`}</h3>
                <p>${message}</p>
                ${this.currentFilter !== 'completed' ? 
                    '<button class="create-first-goal-btn">Create Your First Goal</button>' : 
                    '<button class="view-active-btn" onclick="goalsManager.setFilter(document.querySelector(\'.filter-btn\'))">View Active Goals</button>'
                }
            </div>
        `;

        this.goalsGrid.innerHTML = emptyStateHTML;
        
        const createBtn = this.goalsGrid.querySelector('.create-first-goal-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.openModal());
        }
    }

    hideEmptyState() {
        const emptyState = document.querySelector('.empty-goals-state');
        if (emptyState) {
            emptyState.remove();
        }
    }

    viewGoal(goalId) {

        this.showNotification('Redirecting to goal details...');
    }

    editGoal(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (goal) {

            document.getElementById('goal-title').value = goal.title;
            document.getElementById('goal-description').value = goal.description;
            document.getElementById('goal-category').value = goal.category;
            document.getElementById('goal-deadline').value = goal.deadline;
            
    
            document.querySelector('.modal-header h2').textContent = 'Edit Goal';
            document.querySelector('.create-btn').textContent = 'Update Goal';
            
            

            this.editingGoalId = goalId;
            
            this.openModal();
        }
    }

    deleteGoal(goalId) {
        if (confirm('Are you sure you want to delete this goal?')) {
            this.goals = this.goals.filter(goal => goal.id !== goalId);
            this.saveGoals();
            this.renderGoals();
            this.showNotification('Goal deleted successfully!');
        }
    }

    setFilter(button) {

        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        

        this.currentFilter = button.textContent.toLowerCase().replace(' goals', '');
        this.renderGoals();
    }

    sortGoals(sortBy) {

        this.showNotification(`Sorted by: ${sortBy}`);
    }

    showNotification(message) {

        this.clearNotifications();
        

        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 3000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);
        this.notifications.push(notification);

        
        setTimeout(() => {
            this.removeNotification(notification);
        }, 2000);
    }

    clearNotifications() {
        this.notifications.forEach(notification => {
            if (notification.parentNode) {
                notification.remove();
            }
        });
        this.notifications = [];
    }

    removeNotification(notification) {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
                this.notifications = this.notifications.filter(n => n !== notification);
            }, 300);
        }
    }

    loadGoals() {
        const saved = localStorage.getItem('goalforge-goals');
        return saved ? JSON.parse(saved) : [];
    }

    saveGoals() {
        localStorage.setItem('goalforge-goals', JSON.stringify(this.goals));

        window.dispatchEvent(new Event('goalforge:goalsUpdated'));
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


const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    /* Goal card specific styles */
    .goal-card {
        transition: all 0.3s ease;
    }
    
    .goal-card.completed {
        opacity: 0.8;
        background: #f8fafc;
        border-color: #d1d5db;
    }
    
    .goal-card.completed .goal-title {
        text-decoration: line-through;
        color: #6b7280;
    }
    
    .goal-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
    }
    
    .goal-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
        flex: 1;
    }
    
    .goal-category {
        background: #eef2ff;
        color: #5b4bdb;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
    }
    
    .goal-description {
        color: #6b7280;
        margin-bottom: 16px;
        line-height: 1.4;
    }
    
    .goal-progress {
        margin-bottom: 12px;
    }
    
    .progress-bar {
        width: 100%;
        height: 8px;
        background: #f3f4f6;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 8px;
    }
    
    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #5b4bdb, #8b5cf6);
        border-radius: 4px;
        transition: width 0.3s ease;
    }
    
    .progress-text {
        font-size: 12px;
        color: #6b7280;
        font-weight: 500;
    }
    
    .goal-deadline {
        font-size: 14px;
        color: #374151;
        margin-bottom: 12px;
    }
    
    .goal-status {
        margin-bottom: 16px;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    
    .status-badge {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        display: inline-block;
        width: fit-content;
    }
    
    .status-badge.active {
        background: #d1fae5;
        color: #065f46;
    }
    
    .status-badge.completed {
        background: #dbeafe;
        color: #1e40af;
    }
    
    .completion-date {
        font-size: 11px;
        color: #6b7280;
        font-style: italic;
    }
    
    .goal-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }
    
    .goal-actions button {
        flex: 1;
        padding: 8px 12px;
        border: none;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 80px;
    }
    
    .complete-goal-btn {
        background: #10b981;
        color: white;
        flex: 2 !important;
    }
    
    .complete-goal-btn:hover {
        background: #059669;
    }
    
    .view-goal-btn {
        background: #5b4bdb;
        color: white;
    }
    
    .view-goal-btn:hover {
        background: #4f46e5;
    }
    
    .edit-goal-btn {
        background: #f3f4f6;
        color: #374151;
        border: 1px solid #d1d5db;
    }
    
    .edit-goal-btn:hover {
        background: #e5e7eb;
    }
    
    .delete-goal-btn {
        background: #fef2f2;
        color: #dc2626;
        border: 1px solid #fecaca;
    }
    
    .delete-goal-btn:hover {
        background: #fee2e2;
    }
    
    .view-active-btn {
        background: #5b4bdb;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .view-active-btn:hover {
        background: #4f46e5;
        transform: translateY(-2px);
    }

    .modal-overlay {
        display: none;
        /* Re-add core position/sizing if you want to be safe */
        position: fixed; 
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0,0,0,0.4);
        justify-content: center;
        align-items: center;
        z-index: 2000;
    }
    .modal-overlay.active {
        display: flex;
    }

    .modal-content {
        background: white;
        padding: 40px; /* Adjust as needed */
        border-radius: 12px;
        width: 450px; /* Adjust size */
        max-width: 90%;
        box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        position: relative;
        animation: slideUp 0.3s ease;
    }
    
    .modal-content h2 {
        font-size: 24px;
        margin-bottom: 30px;
        color: #1f2937;
    }

    /* Add the form-related styles too: */
    .modal-content label {
        display: block;
        font-weight: 500;
        margin-bottom: 12px;
        margin-top: 20px;
    }

    .modal-content input[type="text"],
    .modal-content textarea,
    .modal-content select {
        width: 100%;
        padding: 10px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        box-sizing: border-box;
        margin-bottom: 15px;
    }

    .modal-actions {
        display: flex;
        justify-content: flex-end; /* Keeps buttons to the right */
        gap: 12px; /* Slightly more space between buttons */
        margin-top: 30px; /* A bit more separation from inputs */
    }

    .modal-btn {
        padding: 12px 25px; /* Slightly larger padding */
        border-radius: 8px; /* Slightly more rounded corners */
        cursor: pointer;
        font-weight: 600;
        font-size: 15px; /* Slightly larger font */
        transition: all 0.2s ease-in-out; /* Smooth transitions for hover effects */
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Subtle default shadow */
        border: none; /* Remove default border to rely on background/shadow */
    }

    .modal-btn:hover {
        transform: translateY(-2px); /* Lift button slightly on hover */
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15); /* More pronounced shadow on hover */
    }

    .cancel-btn {
        background: #e5e7eb; /* Light grey */
        color: #4b5563; /* Darker grey text */
        padding: 10px;
        border-radius: 10px;
        /* No border needed as we rely on background and shadow */
    }

    .cancel-btn:hover {
        background: #d1d5db; /* Slightly darker grey on hover */
    }

    .create-btn {
        background: #5b4bdb; /* Your existing primary color */
        color: white;
        padding: 10px;
        border-radius: 10px;
        /* No border needed */
    }

    .create-btn:hover {
        background: #4f46e5; /* Slightly darker primary color on hover */
    }
    
    /* Close button for the modal (the 'x') */
    .close-btn {
        position: absolute;
        top: 20px;
        right: 20px;
        background: none;
        border: none;
        font-size: 24px; /* Make it a bit larger */
        color: #9ca3af; /* A softer grey */
        cursor: pointer;
        transition: color 0.2s ease;
        padding: 5px; /* Add padding for easier clicking */
        line-height: 1; /* Center the 'x' */
    }

    .close-btn:hover {
        color: #6b7280; /* Darken on hover */
        transform: rotate(90deg); /* Subtle rotate on hover */
    }

    /* Styles for the date input icon */
    .date-input-container {
        position: relative;
        display: flex; /* Helps align the icon with the input */
        align-items: center;
        margin-bottom: 15px; /* Match other input margins */
    }

    .date-input-container input[type="text"] {
        flex-grow: 1; /* Allows input to take up available space */
        padding-right: 40px; /* Make space for the icon */
        margin-bottom: 0; /* Remove extra margin if flexed */
    }

    .date-icon {
        position: absolute;
        right: 15px;
        color: #9ca3af;
        cursor: pointer;
        font-size: 20px; /* Adjust size if using an actual icon font */
    }
    .date-icon:hover {
        color: #6b7280;
    }

    /* Ensure textareas look good */
    textarea {
        resize: vertical; /* Allow vertical resizing */
        min-height: 80px; /* Set a minimum height */
    }

`;
document.head.appendChild(style);


let goalsManager;
document.addEventListener('DOMContentLoaded', () => {
    goalsManager = new GoalsManager();

    // 🚨 LOGOUT HANDLER 🚨
    // This is the implementation of the missing logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault(); 
            
            // 1. Clear the critical authentication key
            localStorage.removeItem('goalforgeCurrentUser'); 
            
            // 3. Redirect to the login page (index.html)
            window.location.href = 'index.html'; 
        });
    }
});