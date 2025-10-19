class AuthManager {
    constructor() {
        this.userData = {
            isLoggedIn: false,
            currentUser: null,
            users: []
        };
        // *** START: Dashboard Data (MODIFIED FOR PERSISTENCE) ***
        // Load persistent data or use defaults
        const storedAppData = JSON.parse(localStorage.getItem('goalforgeAppData') || '{}');

        this.appData = {
            // Load from storage or default to empty arrays/0
            goals: storedAppData.goals || [], 
            friends: storedAppData.friends || ["Alex", "Sarah", "Mike"], // Pre-populate friends for activity demo
            
            activity: [
                { user: "Alex", message: "completed 'Learn Spanish' goal! 🎉", time: "2 hours ago" },
                { user: "Sarah", message: "is on a 7-day streak! 🔥", time: "1 day ago" },
                { user: "Mike", message: "checked in on 'Start a business' goal.", time: "1 day ago" },
            ],
            // Use stored values for streak and lastCheckInDate (CRUCIAL)
            streak: storedAppData.streak || 0, 
            lastCheckInDate: storedAppData.lastCheckInDate || null 
        };
        // *** END: Dashboard Data ***
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
            
            // --- ADDED: Start dashboard setup ---
            this.setupDashboard(); 
            // ------------------------------------
        });
    }

    // New method to persist the appData (streak and date)
    saveAppData() {
        const dataToStore = {
            goals: this.appData.goals,
            friends: this.appData.friends,
            streak: this.appData.streak,
            lastCheckInDate: this.appData.lastCheckInDate,
        };
        localStorage.setItem('goalforgeAppData', JSON.stringify(dataToStore));
    }


    setupAuthSystem() {
        const authForm = document.getElementById("auth-form");
        const formTitle = document.getElementById("form-title");
        const toggleText = document.querySelector(".toggle-auth");
        const toggleLink = toggleText?.querySelector("a");

        // Determine initial mode: If on login.html and the form has a confirm-password field, assume signup mode is possible
        // Otherwise, look for the 'Log In' button text to infer login mode.
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
            // Run updateFormMode once to ensure the initial form state matches the mode
            this.updateFormMode(currentMode, formTitle, toggleText, toggleLink, true); 
        }


        authForm?.addEventListener("submit", (e) => {
            e.preventDefault();
            this.handleFormSubmission(currentMode);
        });

        this.setupSocialLogin();
        this.setupRealTimeValidation();
    }

    // ===================================================================
    // Social Login Functionality (Updated Selectors for both pages)
    // ===================================================================

    setupSocialLogin() {
        // **FIXED SELECTORS**: Search broadly for social buttons within the main document.
        const googleBtn = document.querySelector('.google-btn');
        const facebookBtn = document.querySelector('.facebook-btn');

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
    
    // ===================================================================
    // END: Social Login Functionality
    // ===================================================================


    updateFormMode(mode, titleEl, toggleText, toggleLink, initial = false) {
        const confirmGroup = document.querySelector("#confirm-password")?.closest(".input-group");
        const submitBtn = document.querySelector(".submit-button");

        if (mode === "login") {
            titleEl.textContent = "Welcome Back!";
            // Ensure confirm group is hidden in login mode
            if (confirmGroup) confirmGroup.style.display = "none";
            submitBtn.textContent = "Log In";
            if(toggleText) toggleText.firstChild.textContent = "Don’t have an account? ";
            if(toggleLink) toggleLink.textContent = "Sign Up";
        } else {
            titleEl.textContent = "Start Your Journey";
            // Ensure confirm group is visible in signup mode
            if (confirmGroup) confirmGroup.style.display = "block";
            submitBtn.textContent = "Create Account";
            if(toggleText) toggleText.firstChild.textContent = "Already have an account? ";
            if(toggleLink) toggleLink.textContent = "Log In";
        }

        // Only use transition animation after the initial load
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
            // This is likely a non-auth page, skip validation
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

    // ===================================================================
    // START: Dynamic Dashboard Logic (MODIFIED)
    // ===================================================================

    setupDashboard() {
        // Only run dashboard logic on the dashboard page
        if (!document.getElementById('dashboard-banners')) return; 

        console.log("Setting up Dashboard content...");
        this.renderUserProfile();
        this.renderGoals();
        this.renderActivity();
        this.renderStreaks();
        
        // Setup listener for the check-in button
        document.getElementById('weekly-checkin-btn')?.addEventListener('click', () => {
            this.handleWeeklyCheckin();
        });
        
        // NEW: Check and update button status on page load
        this.updateCheckInButtonStatus();
    }

    // NEW: Handles the button state on load/render
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


    // 2. Renders the user's name and profile data (Restored to match structure)
    renderUserProfile() {
        const user = JSON.parse(localStorage.getItem("goalforgeCurrentUser"));
        if (!user) return; 

        // Welcome Banner
        const welcomeEl = document.getElementById('welcome-message');
        if(welcomeEl) {
             welcomeEl.textContent = `Welcome back, ${user.displayName}!`;
        }

        // Profile Modal
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

    // 3. Renders the Goals list (UPDATED for empty state)
    renderGoals() {
        const goalListContainer = document.getElementById('goal-lists');
        const goalsTitle = document.getElementById('goals-title');
        
        // The goals array is now empty by default (as requested)
        if (this.appData.goals.length === 0) {
            if(goalsTitle) goalsTitle.textContent = "My Active Goals (0)";
            // Display message when goals are empty
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

    // 4. Renders the Friends Activity Feed (UPDATED to filter by friends)
    renderActivity() {
        const activityFeedContainer = document.getElementById('activity-feed');
        
        // --- NEW FILTER LOGIC ---
        // Filter the raw activity list to only include users in the 'friends' array
        const friendsActivity = this.appData.activity.filter(item => 
            this.appData.friends.includes(item.user)
        );
        // --- END NEW FILTER LOGIC ---
        
        // Check if the filtered list is empty
        if (friendsActivity.length === 0) {
            // Display message when the filtered activity is empty
            if(activityFeedContainer) activityFeedContainer.innerHTML = '<div class="empty-state-activity">No friend activity to show. Add friends or check back later!</div>';
            return;
        }
        
        // Map over the FILTERED list to generate HTML
        if(activityFeedContainer) {
            activityFeedContainer.innerHTML = friendsActivity.map(item => `
                <div class="activity-item">
                    <p class="activity-message"><strong>${item.user}</strong> ${item.message}</p>
                    <p class="activity-time">${item.time}</p>
                </div>
            `).join('');
        }
    }


    // 5. Renders Streak and Quote (MODIFIED to target the new span)
    renderStreaks() {
        const streakDisplayEl = document.getElementById('streakCount');
        if (streakDisplayEl) {
             streakDisplayEl.textContent = this.appData.streak;
        }
        // The quote is static for now, but the framework is set for dynamic updates
    }


    // 6. Handles the Check-in button click (MODIFIED)
    handleWeeklyCheckin() {
        const today = new Date().toDateString();

        // 1. Check for once-per-day restriction
        if (this.appData.lastCheckInDate === today) {
            // Use the custom sidebar notification
            this.showMessage("You've already checked in today! Try again tomorrow. 😴", "info");
            return;
        }

        // 2. Process Check-in
        this.appData.streak += 1;
        this.appData.lastCheckInDate = today;
        
        // 3. Save the updated data (Crucial for persistence)
        this.saveAppData(); 
        
        // 4. Update UI with the new streak
        this.renderStreaks();
        
        // 5. Update the button state and send non-alert notification
        this.showMessage(`Weekly Check-in successful! You are now on a ${this.appData.streak} Day Streak! 🎉`, "success");
        this.updateCheckInButtonStatus(); // Disable the button and change text
    }


    // ===================================================================
    // END: Dynamic Dashboard Logic
    // ===================================================================


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

        // CASE 1: NOT LOGGED IN and on a PROTECTED page -> Redirect to index/login
        if (!currentUser && isProtectedPage) {
            this.showMessage("Please log in to continue", "error");
            setTimeout(() => (window.location.href = "index.html"), 1000);
            return;
        }

        // CASE 2: LOGGED IN and on the LOGIN/INDEX page -> Redirect to dashboard
        if (currentUser && !isProtectedPage) {
            // Prevent user from sitting on the dedicated login page if already signed in
            const message = window.location.pathname.includes("login.html")
                ? "You are already logged in."
                : "Welcome back! Ready for your dashboard?";
            this.showMessage(message, "info");
            setTimeout(() => (window.location.href = "dashboard.html"), 1000);
            return;
        }
    }

    setupGlobalHandlers() {
        window.handleLogout = this.handleLogout.bind(this);
        window.showMessage = this.showMessage.bind(this);
    }

    handleLogout() {
        localStorage.removeItem("goalforgeCurrentUser");
        this.showMessage("Logged out successfully", "success");
        setTimeout(() => (window.location.href = "index.html"), 1000);
    }

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
}


const style = document.createElement("style");
style.textContent = `
/* ... (CSS styles for auth, errors, and popup remain unchanged) ... */

/* Simplified CSS block for brevity, ensure all previous styles are included */
@keyframes shake {
    0%,100%{transform:translateX(0);}
    25%{transform:translateX(-5px);}
    75%{transform:translateX(5px);}
}
.field-error{color:#ef4444;font-size:14px;}
.error{border-color:#ef4444!important;background:#fef2f2!important;}
.fake-popup {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    backdrop-filter: blur(3px);
    font-family: "Segoe UI", Roboto, Arial, sans-serif;
}
.popup-content, .fb-content {
    background: #fff;
    border-radius: 10px;
    width: 340px;
    max-width: calc(100% - 40px);
    padding: 18px;
    text-align: center;
    box-shadow: 0 8px 30px rgba(0,0,0,0.3);
    animation: popin .16s ease;
}
@keyframes popin { from {opacity:0; transform:scale(0.95);} to {opacity:1; transform:scale(1);} }

.account-option {
    display:flex;
    align-items:center;
    gap:10px;
    padding:12px;
    margin:8px 0;
    background:#fafafa;
    border-radius:8px;
    cursor:pointer;
    border: 1px solid #eee;
    transition: background 0.1s ease;
}
.account-option:hover {
    background: #f1f1f1;
}
.account-option img { width:36px; height:36px; border-radius:50%; }
.cancel-popup { 
    margin-top:15px; 
    padding:8px 12px; 
    background:#eee; 
    border:1px solid #ddd; 
    border-radius:6px; 
    cursor:pointer; 
    font-size: 14px;
    font-weight: 500;
    color: #444;
}
.cancel-popup:hover {
    background: #e0e0e0;
}

.fb-header { display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:8px; }
.fb-header img { width:28px; height:28px; }
.fb-header span { color:#1877f2; font-weight:700; font-size:18px; }
.fb-content h3 { font-size:15px; margin:6px 0; font-weight:600; color:#111; }
.fb-receive { color:#444; margin-bottom:15px; font-size:14px; }
.fb-continue {
    background:#1877f2; color:#fff; border:none; padding:10px; width:100%; border-radius:6px; cursor:pointer; font-weight:600;
}
.fb-continue:hover {
    background:#166fe5;
}
.fb-cancel { 
    background:none; 
    border:none; 
    color:#555; 
    margin-top:10px; 
    cursor:pointer; 
    font-weight: 500;
    font-size: 14px;
}
.fb-note { margin-top:12px; color:#777; font-size:12px; }
`;
document.head.appendChild(style);

let authManager;
try {
    authManager = new AuthManager();
    window.authManager = authManager;
} catch (e) {
    console.error("AuthManager init failed:", e);
}
console.log("🎯 GoalForge Auth System Ready!");