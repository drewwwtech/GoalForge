class AuthManager {
    constructor() {
        this.userData = {
            isLoggedIn: false,
            currentUser: null,
            users: []
        };
        
        const storedAppData = JSON.parse(localStorage.getItem('goalforgeAppData') || '{}');

        this.appData = {
            goals: storedAppData.goals || [], 
            friends: storedAppData.friends || ["Alex", "Sarah", "Mike", "Jessica", "David"], 
            
            activity: [
                { user: "Alex", message: "completed 'Learn Spanish' goal! 🎉", time: "2 hours ago" },
                { user: "Sarah", message: "is on a 7-day streak! 🔥", time: "1 day ago" },
                { user: "Mike", message: "checked in on 'Start a business' goal.", time: "1 day ago" },
            ],
            streak: storedAppData.streak || 0, 
            lastCheckInDate: storedAppData.lastCheckInDate || null,
            currentRecipient: null 
        };

        this.QUOTES = [
            "Keep up the great work, you're crushing it!",
            "A little progress each day adds up to big results.",
            "Success is the sum of small efforts repeated daily.",
            "You got this! Don't stop now.",
            "Cheering you on! I believe in your goals.",
        ];

        this.init();
    }

    init() {
        document.addEventListener("DOMContentLoaded", () => {
            console.log("🚀 GoalForge app initialized!");
            this.loadUsers();
            this.setupAuthSystem();
            this.checkExistingLogin();
            this.setupGlobalHandlers();
            this.setupServiceWorker();
            
            this.setupDashboard(); 
            this.setupSupportModalHandlers(); // Now called inside DOMContentLoaded
            this.setupSocialLogin();

            this.setupMobileMenu();
        });
    }

    // New method to persist the appData
    saveAppData() {
        const dataToStore = {
            goals: this.appData.goals,
            friends: this.appData.friends,
            streak: this.appData.streak,
            lastCheckInDate: this.appData.lastCheckInDate,
        };
        localStorage.setItem('goalforgeAppData', JSON.stringify(dataToStore));
    }


    // NEW: Setup handlers for the Send Support Modal elements
    setupSupportModalHandlers() {
        const friendSearch = document.getElementById('friend-search');
        const friendsList = document.getElementById('friends-list');
        const backBtn = document.getElementById('back-to-friends-btn');
        const sendBtn = document.getElementById('send-message-btn');

        // Search logic
        friendSearch?.addEventListener('input', (e) => {
            this.renderFriendsForSupport(e.target.value);
        });

        // Friend selection logic
        friendsList?.addEventListener('click', (e) => {
            const friendItem = e.target.closest('.friend-item');
            if (friendItem) {
                const friendName = friendItem.dataset.friendName;
                this.setupMessageStep(friendName);
            }
        });

        // Back button logic
        backBtn?.addEventListener('click', () => {
            document.getElementById('friend-select-step').style.display = 'block';
            document.getElementById('message-input-step').style.display = 'none';
        });

        // Send message logic
        sendBtn?.addEventListener('click', () => {
            this.handleSendSupport();
        });
        
        // 🌟 FIX: Event delegation for quote buttons 🌟
        const quoteButtonsContainer = document.getElementById('quote-buttons');
        quoteButtonsContainer?.addEventListener('click', (e) => {
            const btn = e.target.closest('.quote-btn');
            if (btn) {
                document.getElementById('support-message-text').value = btn.dataset.quote;
            }
        });
    }


    // NEW: Renders the friend list in the support modal
    renderFriendsForSupport(searchTerm = '') {
        const friendsList = document.getElementById('friends-list');
        if (!friendsList) return;

        const filteredFriends = this.appData.friends.filter(friend => 
            friend.toLowerCase().includes(searchTerm.toLowerCase())
        );

        friendsList.innerHTML = filteredFriends.map(friend => `
            <div class="friend-item" data-friend-name="${friend}">
                <div class="friend-avatar">${friend.charAt(0).toUpperCase()}</div>
                <div class="friend-name">${friend}</div>
            </div>
        `).join('');

        // If no results, show a message
        if (filteredFriends.length === 0) {
            friendsList.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">No friends found.</div>';
        }
    }
    
    // NEW: Switches the modal view to the message input step
    setupMessageStep(recipientName) {
        this.appData.currentRecipient = recipientName;

        document.getElementById('recipient-name').textContent = recipientName;
        document.getElementById('support-message-text').value = ''; 
        
        const quoteButtonsContainer = document.getElementById('quote-buttons');
        // Only render quotes once on the first time the step is viewed
        if (quoteButtonsContainer.children.length === 0) {
            quoteButtonsContainer.innerHTML = this.QUOTES.map((quote, index) => `
                <button class="quote-btn" data-quote="${quote}" id="quote-btn-${index}">${quote}</button>
            `).join('');
        }

        document.getElementById('friend-select-step').style.display = 'none';
        document.getElementById('message-input-step').style.display = 'block';
    }

    // NEW: Handles the final sending of the message
    handleSendSupport() {
        const messageText = document.getElementById('support-message-text').value.trim();
        const recipient = this.appData.currentRecipient;
        const supportModal = document.getElementById('supportModal');

        if (!messageText) {
            this.showMessage("Please enter a message or select a quote.", "error");
            return;
        }

        // 1. Simulate sending message (Update the activity feed)
        this.appData.activity.unshift({
            user: "You", 
            message: `sent support to ${recipient}: "${messageText.substring(0, 30)}..."`,
            time: "Just now"
        });
        
        // 2. Hide modal and reset
        supportModal.classList.remove('is-open');
        this.renderActivity(); // Refresh the activity feed
        
        // 3. Show success notification
        this.showMessage(`Support sent to ${recipient}!`, "success");

        // Reset state
        this.appData.currentRecipient = null;
        document.getElementById('friend-select-step').style.display = 'block';
        document.getElementById('message-input-step').style.display = 'none';
    }


    setupDashboard() {
        if (!document.getElementById('dashboard-banners')) return; 

        this.renderUserProfile();
        this.renderGoals();
        this.renderActivity();
        this.renderStreaks();
        
        document.getElementById('weekly-checkin-btn')?.addEventListener('click', () => {
            this.handleWeeklyCheckin();
        });
        
        this.updateCheckInButtonStatus();
    }

    setupMobileMenu() {
        const toggleButton = document.getElementById('landingMenuToggle');
        const mobileMenu = document.getElementById('mobileMenuLanding');
        const desktopLoginBtn = document.getElementById('login-btn');
        const mobileLoginBtn = document.querySelector('.mobile-login-btn');
    
        if (toggleButton && mobileMenu) {
            toggleButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('is-open');
                // Check if desktopLoginBtn exists before changing style
                if (desktopLoginBtn) {
                    desktopLoginBtn.style.display = mobileMenu.classList.contains('is-open') ? 'none' : 'block';
                }
            });
            
            mobileMenu.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenu.classList.remove('is-open');
                    // Check if desktopLoginBtn exists before changing style
                    if (desktopLoginBtn) {
                        desktopLoginBtn.style.display = 'block';
                    }
                });
            });
        }
    }


    updateCheckInButtonStatus() {
        const checkinBtn = document.getElementById('weekly-checkin-btn');
        if (!checkinBtn) return;
        
        const today = new Date().toDateString();

        if (this.appData.lastCheckInDate === today) {
            checkinBtn.textContent = "Checked-in Today 🎉";
            checkinBtn.disabled = true;
            checkinBtn.classList.add('checked-in'); 
        } else {
            checkinBtn.textContent = "Check-in";
            checkinBtn.disabled = false;
            checkinBtn.classList.remove('checked-in');
        }
    }

    renderUserProfile() {
        const user = JSON.parse(localStorage.getItem("goalforgeCurrentUser"));
        if (!user) return; 

        const welcomeEl = document.getElementById('welcome-message');
        if(welcomeEl) {
             welcomeEl.textContent = `Welcome back, ${user.displayName}!`;
        }

        const profileNameEl = document.getElementById('profileName');
        if(profileNameEl) profileNameEl.textContent = user.displayName;

        const profileEmailEl = document.getElementById('profileEmail');
        if(profileEmailEl) profileEmailEl.textContent = user.email;

        const profileAvatarEl = document.getElementById('profileAvatar');
        if(profileAvatarEl) profileAvatarEl.textContent = user.displayName.charAt(0).toUpperCase();
        
        const memberSinceEl = document.getElementById('memberSince');
        if(memberSinceEl) {
            const memberSince = new Date(user.createdAt).toLocaleDateString();
            memberSinceEl.textContent = memberSince;
        }
    }

    renderGoals() {
        const goalListContainer = document.getElementById('goal-lists');
        const goalsTitle = document.getElementById('goals-title');
        
        if (this.appData.goals.length === 0) {
            if(goalsTitle) goalsTitle.textContent = "My Active Goals (0)";
            if(goalListContainer) goalListContainer.innerHTML = '<div class="empty-state">No goals yet. Create your first goal!</div>';
            return;
        }

        if(goalsTitle) goalsTitle.textContent = `My Active Goals (${this.appData.goals.length})`;
        if(goalListContainer) {
            goalListContainer.innerHTML = this.appData.goals.map(goal => `
                <div class="goal-item">
                    <span class="goal-title">${goal.title}</span>
                    <span class="goal-progress">${goal.progress}% Complete</span>
                </div>
            `).join('');
        }
    }

    renderActivity() {
        const activityFeedContainer = document.getElementById('activity-feed');
        
        const friendsActivity = this.appData.activity.filter(item => 
            this.appData.friends.includes(item.user) || item.user === "You" 
        );
        
        if (friendsActivity.length === 0) {
            if(activityFeedContainer) activityFeedContainer.innerHTML = '<div class="empty-state-activity">No friend activity to show. Add friends or check back later!</div>';
            return;
        }
        
        if(activityFeedContainer) {
            activityFeedContainer.innerHTML = friendsActivity.map(item => `
                <div class="activity-item">
                    <p class="activity-message"><strong>${item.user}</strong> ${item.message}</p>
                    <p class="activity-time">${item.time}</p>
                </div>
            `).join('');
        }
    }

    renderStreaks() {
        const streakDisplayEl = document.getElementById('streakCount');
        if (streakDisplayEl) {
             streakDisplayEl.textContent = this.appData.streak;
        }
    }

    handleWeeklyCheckin() {
        const today = new Date().toDateString();

        if (this.appData.lastCheckInDate === today) {
            this.showMessage("You've already checked in today! Try again tomorrow. 😴", "info");
            return;
        }

        this.appData.streak += 1;
        this.appData.lastCheckInDate = today;
        
        this.saveAppData(); 
        
        this.renderStreaks();
        
        this.showMessage(`Weekly Check-in successful! You are now on a ${this.appData.streak} Day Streak! 🎉`, "success");
        this.updateCheckInButtonStatus(); 
    }

    // --- Start of boilerplate Auth methods (MUST be included) ---
    setupAuthSystem() {
        const authForm = document.getElementById("auth-form");
        const formTitle = document.getElementById("form-title");
        const toggleText = document.querySelector(".toggle-auth");
        const toggleLink = toggleText?.querySelector("a");

        let currentMode = "signup";
        const confirmPwField = document.getElementById("confirm-password");
        if (confirmPwField && confirmPwField.closest(".input-group").style.display === "none") {
            currentMode = "login";
        } else if (document.querySelector(".submit-button")?.textContent === "Login") {
             currentMode = "login";
        }


        if (toggleLink) {
            toggleLink.addEventListener("click", (e) => {
                e.preventDefault();
                currentMode = currentMode === "signup" ? "login" : "signup";
                this.updateFormMode(currentMode, formTitle, toggleText, toggleLink);
            });
            this.updateFormMode(currentMode, formTitle, toggleText, toggleLink, true); 
        }


        authForm?.addEventListener("submit", (e) => {
            e.preventDefault();
            this.handleFormSubmission(currentMode);
        });

        this.setupRealTimeValidation();
    }
    
    setupSocialLogin() {
        const googleBtn = document.querySelector('.google-login-btn');
        const facebookBtn = document.querySelector('.facebook-login-btn');

        googleBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showFakePopup('google');
        });

        facebookBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showFakePopup('facebook');
        });
    }

    showFakePopup(platform) {
        document.querySelectorAll('.fake-popup').forEach(p => p.remove());

        const isGoogle = platform === 'google';
        const content = isGoogle 
            ? `
                <div class="popup-content">
                    <h3 style="margin-top:0; color:#444;">Choose an account to continue to GoalForge</h3>
                    <div class="account-option">
                        <img src="images/Profile.png" alt="Profile Icon">
                        <div>
                            <p style="margin:0; font-weight:600; font-size:15px; color:#222;">John Doe</p>
                            <p style="margin:0; font-size:13px; color:#666;">john.doe@example.com</p>
                        </div>
                    </div>
                    <button class="cancel-popup">Cancel</button>
                </div>
              `
            : `
                <div class="fb-content">
                    <div class="fb-header">
                        <img src="images/facebook.svg" alt="Facebook Icon">
                        <span>facebook</span>
                    </div>
                    <h3>Continue as John Doe?</h3>
                    <p class="fb-receive">GoalForge will receive your name, profile picture, and email address.</p>
                    <button class="fb-continue">Continue</button>
                    <button class="fb-cancel">Cancel</button>
                    <p class="fb-note">You can edit what info you share with GoalForge in your app settings.</p>
                </div>
              `;

        const popupDiv = document.createElement('div');
        popupDiv.className = 'fake-popup';
        popupDiv.innerHTML = content;
        
        popupDiv.querySelector('.cancel-popup')?.addEventListener('click', () => popupDiv.remove());
        popupDiv.querySelector('.fb-cancel')?.addEventListener('click', () => popupDiv.remove());
        
        const continueBtn = popupDiv.querySelector('.fb-continue') || popupDiv.querySelector('.account-option');

        continueBtn?.addEventListener('click', () => {
             this.showMessage(`Welcome back, John Doe!`, "success");
             
             const fakeUser = {
                 id: this.generateId(),
                 email: "john.doe@example.com",
                 password: this.hashPassword("social-login-fake"),
                 displayName: "John Doe",
                 createdAt: new Date().toISOString(),
                 lastLogin: new Date().toISOString(),
             };
             this.loginUser(fakeUser);
             popupDiv.remove();
             setTimeout(() => (window.location.href = "dashboard.html"), 1000);
        });

        document.body.appendChild(popupDiv);
    }
    
    updateFormMode(mode, titleEl, toggleText, toggleLink, initial = false) {
        const confirmGroup = document.querySelector("#confirm-password")?.closest(".input-group");
        const submitBtn = document.querySelector(".submit-button");

        if (mode === "login") {
            titleEl.textContent = "Welcome Back!";
            if (confirmGroup) confirmGroup.style.display = "none";
            submitBtn.textContent = "Log In";
            if(toggleText) toggleText.firstChild.textContent = "Don’t have an account? ";
            if(toggleLink) toggleLink.textContent = "Sign Up";
        } else {
            titleEl.textContent = "Start Your Journey";
            if (confirmGroup) confirmGroup.style.display = "block";
            submitBtn.textContent = "Create Account";
            if(toggleText) toggleText.firstChild.textContent = "Already have an account? ";
            if(toggleLink) toggleLink.textContent = "Log In";
        }

        if (!initial && titleEl) {
            titleEl.style.opacity = "0";
            setTimeout(() => {
                titleEl.style.transition = "opacity 0.3s ease";
                titleEl.style.opacity = "1";
            }, 100);
        }
    }

    handleFormSubmission(mode) {
        const submitBtn = document.querySelector(".submit-button");
        const originalText = submitBtn.textContent;
        submitBtn.textContent = mode === "signup" ? "Creating Account..." : "Logging In...";
        submitBtn.disabled = true;
        submitBtn.classList.add("loading");

        this.clearFormErrors();
        if (!this.validateForm(mode)) {
            this.resetSubmitButton(submitBtn, originalText);
            return;
        }

        setTimeout(() => {
            mode === "signup" ? this.handleSignup() : this.handleLogin();
            this.resetSubmitButton(submitBtn, originalText);
        }, 1000);
    }

    resetSubmitButton(button, originalText) {
        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
            button.classList.remove("loading");
        }, 500);
    }

    validateForm(mode) {
        const email = document.getElementById("email")?.value.trim();
        const password = document.getElementById("password")?.value.trim();
        let valid = true;
        
        if (!email) {
            return true;
        }

        if (!this.isValidEmail(email)) {
            this.showFieldError("email", "Please enter a valid email");
            valid = false;
        } else this.clearFieldError("email");

        if (password.length < 6) {
            this.showFieldError("password", "Password must be at least 6 characters");
            valid = false;
        } else this.clearFieldError("password");

        if (mode === "signup") {
            const confirm = document.getElementById("confirm-password")?.value.trim();
            if (password !== confirm) {
                this.showFieldError("confirm-password", "Passwords do not match");
                valid = false;
            } else this.clearFieldError("confirm-password");
        }

        return valid;
    }

    setupRealTimeValidation() {
        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");
        const confirmInput = document.getElementById("confirm-password");

        emailInput?.addEventListener("blur", () => {
            const email = emailInput.value.trim();
            if (email && !this.isValidEmail(email)) {
                this.showFieldError("email", "Please enter a valid email");
            } else this.clearFieldError("email");
        });

        passwordInput?.addEventListener("input", () => {
            const pw = passwordInput.value;
            if (pw.length > 0 && pw.length < 6) {
                this.showFieldError("password", "Password must be at least 6 characters");
            } else this.clearFieldError("password");
        });

        confirmInput?.addEventListener("input", () => {
            const pw = passwordInput.value;
            const cf = confirmInput.value;
            if (cf && pw !== cf) {
                this.showFieldError("confirm-password", "Passwords do not match");
            } else this.clearFieldError("confirm-password");
        });
    }

    showFieldError(id, msg) {
        const input = document.getElementById(id);
        const group = input.closest(".input-group");
        group.querySelector(".field-error")?.remove();

        const el = document.createElement("div");
        el.className = "field-error";
        el.textContent = msg;
        el.style.cssText = `
            color:#ef4444;font-size:14px;margin-top:4px;
        `;
        group.appendChild(el);
        input.classList.add("error");
    }

    clearFieldError(id) {
        const input = document.getElementById(id);
        input.classList.remove("error");
        input.closest(".input-group")?.querySelector(".field-error")?.remove();
    }

    clearFormErrors() {
        document.querySelectorAll(".field-error").forEach((e) => e.remove());
    }


    handleSignup() {
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        if (this.userExists(email)) {
            this.showMessage("An account with this email already exists.", "error");
            return;
        }

        const user = {
            id: this.generateId(),
            email,
            password: this.hashPassword(password),
            displayName: email.split("@")[0],
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
        };

        this.userData.users.push(user);
        this.saveUsers();
        this.loginUser(user);
        this.showMessage("🎉 Account created successfully!", "success");
        setTimeout(() => (window.location.href = "dashboard.html"), 1200);
    }

    handleLogin() {
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();
        const user = this.userData.users.find(
            (u) => u.email === email && this.verifyPassword(password, u.password)
        );

        if (!user) return this.showMessage("Invalid email or password.", "error");

        user.lastLogin = new Date().toISOString();
        this.saveUsers();
        this.loginUser(user);
        this.showMessage(`Welcome back, ${user.displayName}!`, "success");
        setTimeout(() => (window.location.href = "dashboard.html"), 1000);
    }

    loginUser(user) {
        const safeUser = { ...user };
        delete safeUser.password;
        localStorage.setItem("goalforgeCurrentUser", JSON.stringify(safeUser));
        this.userData.currentUser = user;
        this.userData.isLoggedIn = true;
    }


    isValidEmail(e) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
    }

    userExists(e) {
        return this.userData.users.some((u) => u.email.toLowerCase() === e.toLowerCase());
    }

    hashPassword(pw) {
        return btoa(pw + "goalforge-salt");
    }

    verifyPassword(pw, hash) {
        return this.hashPassword(pw) === hash;
    }

    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    loadUsers() {
        const data = localStorage.getItem("goalforgeUsers");
        this.userData.users = data ? JSON.parse(data) : [];
    }

    saveUsers() {
        localStorage.setItem("goalforgeUsers", JSON.stringify(this.userData.users));
    }

    checkExistingLogin() {
        const currentUser = localStorage.getItem("goalforgeCurrentUser");
        const currentPath = window.location.pathname;
        const isProtectedPage = !(currentPath.includes("index.html") || currentPath.includes("login.html"));

        if (!currentUser && isProtectedPage) {
            this.showMessage("Please log in to continue", "error");
            setTimeout(() => (window.location.href = "index.html"), 1000);
            return;
        }

        if (currentUser && !isProtectedPage) {
            const message = window.location.pathname.includes("login.html")
                ? "You are already logged in."
                : "Welcome back! Ready for your dashboard?";
            this.showMessage(message, "info");
            setTimeout(() => (window.location.href = "dashboard.html"), 1000);
            return;
        }
    }

    setupGlobalHandlers() {
        // --- MODIFIED LINE 1: Link handleLogout to the proper logout() method ---
        // Instead of defining a separate handleLogout, we'll map the global
        // handler to the new, more robust logout function.
        window.handleLogout = this.logout.bind(this);
        window.showMessage = this.showMessage.bind(this);
        // We also need to attach the logout function to the button ID if it exists
        const logoutBtn = document.getElementById('logout-btn');
        logoutBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });
    }

    // --- NEW METHOD: The main logout function with history replacement ---
    logout() {
        // 1. Clear session/local storage data
        localStorage.removeItem("goalforgeCurrentUser");
        this.userData.isLoggedIn = false;
        this.userData.currentUser = null;

        // 2. Show message before redirect
        this.showMessage("Logged out successfully", "success");
        
        // 3. FORCE REDIRECTION using .replace()
        // This command removes the dashboard from the browser's history,
        // preventing the "back" button from working.
        setTimeout(() => {
            window.location.replace("index.html");
        }, 500); // Give the success message time to show
    }
    // --- END OF NEW LOGOUT METHOD ---

    // --- DELETED METHOD: The old handleLogout() is removed to prevent conflicts ---
    /*
    handleLogout() {
        localStorage.removeItem("goalforgeCurrentUser");
        this.showMessage("Logged out successfully", "success");
        setTimeout(() => (window.location.href = "index.html"), 1000);
    }
    */

    setupServiceWorker() {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js").then(
                (r) => console.log("✅ SW registered:", r),
                (e) => console.log("❌ SW failed:", e)
            );
        }
    }


    showMessage(text, type = "info") {
        document.querySelectorAll(".global-message").forEach((m) => m.remove());
        const el = document.createElement("div");
        el.className = `global-message ${type}`;
        el.textContent = text;
        el.style.cssText = `
            position:fixed
            ;top:100px;
            right:20px;
            padding:14px 22px;
            border-radius:10px;
            color:#fff;
            font-weight:600;
            z-index:9999;
            opacity:1;
            filter:none;
            background: ${type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#4f46e5"};
        `;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 4000);
    }
    // --- End of boilerplate Auth methods ---
}


const style = document.createElement('style');
style.textContent = `
    /* 1. Modal Container and Overlay Styles (As before) */
    .modal-overlay {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        background: rgba(0, 0, 0, 0.4) !important;
        display: none !important;
        align-items: center !important;
        justify-content: center !important;
        z-index: 2000 !important;
        opacity: 0 !important;
        transition: opacity 0.3s ease !important;
        visibility: hidden !important; 
    }
    .modal-overlay.is-open {
        display: flex !important;
        opacity: 1 !important;
        visibility: visible !important;
    }
    .modal-content-support {
        background: white;
        border-radius: 12px;
        padding: 32px; 
        width: 100%;
        max-width: 480px; 
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
        animation: scaleIn 0.25s ease;
    }
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }
    .modal-body {
        /* Basic structure for the body */
    }

    /* 2. Styles for Modal Components (THE MISSING STYLES) */
    .friend-selection-step {
        /* Ensures elements stack correctly */
    }
    
    #friend-search {
        width: 100%;
        padding: 10px 15px;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-sizing: border-box;
        margin-bottom: 20px;
    }
    
    .friend-list-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 15px; /* Spacing between friend items */
        max-height: 250px;
        overflow-y: auto;
        padding-right: 10px; /* Space for scrollbar */
        margin-bottom: 20px;
    }
    
    .friend-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        padding: 10px;
        border-radius: 8px;
        transition: background-color 0.2s;
        flex: 0 0 calc(25% - 15px); /* Allows 4 items per row */
        max-width: calc(25% - 15px);
        text-align: center;
    }
    
    .friend-item:hover {
        background-color: #f0f4f8;
    }

    .friend-avatar {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background-color: #6a1b9a; /* Deep Purple */
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 20px;
        margin-bottom: 5px;
    }

    .friend-name {
        font-size: 14px;
        color: #333;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 100%;
    }

    /* 3. Button Styles (for Cancel/Action buttons) */
    .modal-action-btn {
        padding: 10px 20px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s;
        width: 100%;
        box-sizing: border-box;
        margin-top: 10px;
        text-align: center; /* Ensure text is centered on Cancel button */
    }
    
    .cancel-btn {
        background-color: #ccc;
        color: #333;
        border: none;
    }
    .cancel-btn:hover {
        background-color: #bbb;
    }

    /* 4. Animation (As before) */
    @keyframes scaleIn {
        from { transform: scale(0.95); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
    }

        /* 1. Quote Prompts Container */
    .quote-prompts {
        margin-bottom: 20px;
    }

    /* 2. Quick Quotes Buttons Container */
    #quote-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 8px; /* Spacing between the quote buttons */
        margin-top: 10px;
    }

    /* 3. Individual Quote Buttons */
    .quote-btn {
        padding: 8px 12px;
        border: 1px solid #cceeff; /* Light blue border */
        background-color: #f0f8ff; /* Very light blue background */
        color: #0056b3; /* Darker blue text */
        border-radius: 20px;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s, border-color 0.2s;
    }

    .quote-btn:hover {
        background-color: #e0f0ff;
        border-color: #007bff;
    }

    /* 4. Text Area */
    #support-message-text {
        width: 100%;
        min-height: 120px; /* Gives it vertical space */
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 8px;
        box-sizing: border-box; /* Includes padding in width */
        font-size: 16px;
        resize: vertical; /* Allows user to resize vertically */
        margin-top: 15px;
    }

    /* 5. Message Actions (Button container) */
    .message-actions {
        display: flex;
        flex-direction: column; /* Stack buttons vertically */
        gap: 10px;
        margin-top: 20px;
    }

    /* 6. Action Button Appearance (Refining the modal-action-btn style) */
    .modal-action-btn {
        padding: 12px 20px; /* Slightly larger padding */
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s, opacity 0.2s;
        width: 100%;
        box-sizing: border-box;
        border: 1px solid transparent;
    }

    .primary-btn {
        background-color: #007bff; /* Blue for Send Message */
        color: white;
        border: none;
    }
    .primary-btn:hover {
        background-color: #0056b3;
    }

    .secondary-btn {
        background-color: #f8f9fa; /* Light grey for Back */
        color: #333;
        border-color: #ccc;
    }
    .secondary-btn:hover {
        background-color: #e2e6ea;
    }

    .fake-popup {
        position: fixed !important; 
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: rgba(0, 0, 0, 0.6) !important; /* Dark semi-transparent background */
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        z-index: 5000 !important; /* Extremely high z-index to cover everything */
        opacity: 1 !important;
        animation: fadeIn 0.3s ease;
    }
    
    .fake-popup .popup-content,
    .fake-popup .fb-content {
        background: white;
        border-radius: 12px;
        padding: 30px 40px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        width: 90%;
        max-width: 400px;
        text-align: center;
        transform: scale(1);
        animation: scaleIn 0.3s ease;
    }
    
    /* Optional: Add the animation if it's not already defined */
    @keyframes scaleIn {
        from { transform: scale(0.9); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    /* Add basic styles for Google/Facebook content inside the popup if they are missing */
    .fake-popup .account-option {
        display: flex;
        align-items: center;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 8px;
        margin: 15px 0 20px;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    
    .fake-popup .account-option:hover {
        background-color: #f5f5f5;
    }
    
    .fake-popup img {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        margin-right: 15px;
    }

    /* In js/app.js, inside the style.textContent block */

    /* --- STYLES FOR POPUP BUTTONS (Google/Facebook) --- */
    
    .fake-popup button {
        /* Base style for all buttons in the popup */
        padding: 10px 20px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        margin: 5px;
        transition: background-color 0.2s, color 0.2s;
        width: 100%; /* Make buttons full-width for modern modal feel */
        box-sizing: border-box; 
        text-align: center;
    }
    
    /* Primary/Continue Button (Facebook Continue) */
    .fake-popup .fb-continue {
        background-color: #4f46e5; /* Primary App Color */
        color: white;
        border: none;
        margin-top: 20px;
        margin-bottom: 10px;
    }
    .fake-popup .fb-continue:hover {
        background-color: #3b33b0;
    }
    
    /* Secondary/Cancel Button (Google Cancel, Facebook Cancel) */
    .fake-popup .cancel-popup, 
    .fake-popup .fb-cancel {
        background-color: transparent;
        color: #666; /* Dark gray text */
        border: 1px solid #ccc; 
    }
    .fake-popup .cancel-popup:hover, 
    .fake-popup .fb-cancel:hover {
        background-color: #f0f0f0;
    }
    
    /* Style for the Google Account Option (which acts as the "Continue" button) */
    .fake-popup .account-option {
        border: 2px solid #4f46e5; /* Highlight the selectable account */
        background-color: #f0f0ff; /* Very light background to make it stand out */
    }
    .fake-popup .account-option:hover {
        background-color: #e0e0ff;
    }

`;
document.head.appendChild(style);

let authManager;
try {
    const authManager = new AuthManager();
    window.authManager = authManager;
} catch (e) {
    console.error("AuthManager init failed:", e);
}
console.log("🎯 GoalForge Auth System Ready!");