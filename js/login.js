
class AuthManager {
    constructor() {
        this.userData = {
            isLoggedIn: false,
            currentUser: null,
            users: []
        };
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
        });
    }


    setupAuthSystem() {
        const authForm = document.getElementById("auth-form");
        const formTitle = document.getElementById("form-title");
        const toggleText = document.querySelector(".toggle-auth");
        const toggleLink = toggleText?.querySelector("a");

        let currentMode = "login";

        const confirmGroup = document.querySelector("#confirm-password")?.closest(".input-group");
        if (confirmGroup) confirmGroup.style.display = "none";

        if (toggleLink) {
            toggleLink.addEventListener("click", (e) => {
                e.preventDefault();
                currentMode = currentMode === "login" ? "signup" : "login";
                this.updateFormMode(currentMode, formTitle, toggleText, toggleLink);
            });
        }

 
        authForm?.addEventListener("submit", (e) => {
            e.preventDefault();
            this.handleFormSubmission(currentMode);
        });

        this.setupSocialLogin();
        this.setupRealTimeValidation();
    }

    updateFormMode(mode, titleEl, toggleText, toggleLink) {
        const confirmGroup = document.querySelector("#confirm-password")?.closest(".input-group");
        const submitBtn = document.querySelector(".submit-button");

        if (mode === "login") {
            titleEl.textContent = "Welcome Back!";
            if (confirmGroup) confirmGroup.style.display = "none";
            submitBtn.textContent = "Log In";
            toggleText.firstChild.textContent = "Don’t have an account? ";
            toggleLink.textContent = "Sign Up";
        } else {
            titleEl.textContent = "Start Your Journey";
            if (confirmGroup) confirmGroup.style.display = "block";
            submitBtn.textContent = "Create Account";
            toggleText.firstChild.textContent = "Already have an account? ";
            toggleLink.textContent = "Log In";
        }


        titleEl.style.opacity = "0";
        setTimeout(() => {
            titleEl.style.transition = "opacity 0.3s ease";
            titleEl.style.opacity = "1";
        }, 100);
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
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();
        let valid = true;

        if (!this.isValidEmail(email)) {
            this.showFieldError("email", "Please enter a valid email");
            valid = false;
        } else this.clearFieldError("email");

        if (password.length < 6) {
            this.showFieldError("password", "Password must be at least 6 characters");
            valid = false;
        } else this.clearFieldError("password");

        if (mode === "signup") {
            const confirm = document.getElementById("confirm-password").value.trim();
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
        if (currentUser && window.location.pathname.includes("index.html")) {
            this.showMessage("Redirecting to your dashboard...", "info");
            setTimeout(() => (window.location.href = "dashboard.html"), 500);
        } else if (!currentUser && !window.location.pathname.includes("index.html")) {
            this.showMessage("Please log in to continue", "error");
            setTimeout(() => (window.location.href = "index.html"), 1000);
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
            position:fixed;top:100px;right:20px;
            padding:14px 22px;border-radius:10px;
            color:#fff;font-weight:600;z-index:9999;
        `;
        const colors = {
            success: "#10b981",
            error: "#ef4444",
            info: "#4f46e5",
        };
        el.style.background = colors[type] || colors.info;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 4000);
    }
}

const style = document.createElement("style");
style.textContent = `
@keyframes shake {
  0%,100%{transform:translateX(0);}
  25%{transform:translateX(-5px);}
  75%{transform:translateX(5px);}
}
.field-error{color:#ef4444;font-size:14px;}
.error{border-color:#ef4444!important;background:#fef2f2!important;}
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
