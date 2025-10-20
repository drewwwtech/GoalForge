// help.js

document.addEventListener('DOMContentLoaded', function() {
    initializeHelpPage();
});

function initializeHelpPage() {
    checkAuthentication(); // <-- ADDED: Check auth status on page load
    setupAuthEvents();     // <-- ADDED: Setup event listeners for auth actions (like logout)
    setupCategoryNavigation();
    setupFAQAccordion();
    setupSearchFunctionality();
    prefillContactForm();
}


// ------------------------------------------------------------------
// ADDED: Authentication and Logout Logic
// ------------------------------------------------------------------

function checkAuthentication() {
    const currentUser = JSON.parse(localStorage.getItem('goalforgeCurrentUser'));
    if (!currentUser) {
        // If no user is found, redirect to the dashboard/login page
        window.location.href = 'index.html'; 
        return;
    }
    // Return the user object for use in other functions (like prefillContactForm)
    return currentUser;
}

function setupAuthEvents() {
    // Assuming the HTML has an element with the ID 'logoutBtn'
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

function handleLogout() {
    const user = JSON.parse(localStorage.getItem('goalforgeCurrentUser'));
    if (user) {
        // Optional: Cleanup user-specific data upon logout for consistency
        if (user.email) {
            localStorage.removeItem(`goalforge-goals-${user.email}`); 
            localStorage.removeItem(`goalforge-circles-${user.email}`); 
        }
    }

    // Clear the current user session
    localStorage.removeItem('goalforgeCurrentUser');
    
    showMessage('Logged out successfully', 'success');
    
    // FIX: IMMEDIATE REDIRECT is crucial to prevent the dashboard loop
    window.location.href = 'index.html';
}

// ------------------------------------------------------------------
// EXISTING Code Continues Below
// ------------------------------------------------------------------

function setupCategoryNavigation() {
    const categoryLinks = document.querySelectorAll('.category-link');
    const helpSections = document.querySelectorAll('.help-section');
    
    categoryLinks.forEach(link => {
        link.addEventListener('click', function() {
            const targetId = this.getAttribute('href').substring(1);
            
            
            categoryLinks.forEach(l => l.classList.remove('active'));
            helpSections.forEach(s => s.classList.remove('active'));
            
            
            this.classList.add('active');
            document.getElementById(targetId).classList.add('active');
            
            
            document.querySelector('.help-content').scrollTop = 0;
        });
    });
}


function setupFAQAccordion() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const faqItem = this.parentElement;
            const isActive = faqItem.classList.contains('active');
            
            
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });
            
            
            if (!isActive) {
                faqItem.classList.add('active');
            }
        });
    });
}


function setupSearchFunctionality() {
    const searchInput = document.getElementById('helpSearch');
    const searchBtn = document.querySelector('.search-btn');
    
    
    searchBtn.addEventListener('click', performSearch);
    

    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
 
}

function performSearch() {
    const searchTerm = document.getElementById('helpSearch').value.trim().toLowerCase();
    
    if (!searchTerm) {
        resetSearch();
        return;
    }
    
    const faqItems = document.querySelectorAll('.faq-item');
    const helpSections = document.querySelectorAll('.help-section');
    let hasResults = false;
    
    helpSections.forEach(section => {
        section.classList.remove('active');
    });
    
 
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question h3').textContent.toLowerCase();
        const answer = item.querySelector('.faq-answer').textContent.toLowerCase();
        const parentSection = item.closest('.help-section');
        
        if (question.includes(searchTerm) || answer.includes(searchTerm)) {
            item.style.display = 'block';
            parentSection.classList.add('active');
            parentSection.style.display = 'block';
            hasResults = true;
            
            
            highlightText(item, searchTerm);
        } else {
            item.style.display = 'none';
        }
    });
    

    showSearchResults(hasResults, searchTerm);
}

function highlightText(element, searchTerm) {
    const question = element.querySelector('.faq-question h3');
    const answer = element.querySelector('.faq-answer');
    
    question.innerHTML = question.textContent;
    answer.innerHTML = answer.textContent;
    

    highlightInElement(question, searchTerm);
    

    highlightInElement(answer, searchTerm);
}

function highlightInElement(element, searchTerm) {
    const text = element.textContent;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const highlighted = text.replace(regex, '<span class="highlight">$1</span>');
    element.innerHTML = highlighted;
}

function resetSearch() {
    const searchInput = document.getElementById('helpSearch');
    const faqItems = document.querySelectorAll('.faq-item');
    const helpSections = document.querySelectorAll('.help-section');
    
    searchInput.value = '';
    

    faqItems.forEach(item => {
        item.style.display = 'block';
        item.classList.remove('active');
        
 
        const question = item.querySelector('.faq-question h3');
        const answer = item.querySelector('.faq-answer');
        question.innerHTML = question.textContent;
        answer.innerHTML = answer.textContent;
    });
    
 
    helpSections.forEach((section, index) => {
        section.style.display = '';
        section.classList.remove('active');
        if (index === 0) {
            section.classList.add('active');
        }
    });
    
 
    document.querySelectorAll('.category-link').forEach((link, index) => {
        link.classList.remove('active');
        if (index === 0) {
            link.classList.add('active');
        }
    });
    
 
    const noResults = document.querySelector('.no-results');
    if (noResults) {
        noResults.remove();
    }
}

function showSearchResults(hasResults, searchTerm) {
    
    const existingNoResults = document.querySelector('.no-results');
    if (existingNoResults) {
        existingNoResults.remove();
    }
    
    if (!hasResults) {
        const noResultsHtml = `
            <div class="no-results">
                <h3>No results found for "${searchTerm}"</h3>
                <p>Try searching with different keywords or browse the categories below.</p>
                <button class="secondary-btn" onclick="resetSearch()">Clear Search</button>
            </div>
        `;
        document.querySelector('.help-content').insertAdjacentHTML('beforeend', noResultsHtml);
    }
}


function showContactForm() {
    const modal = document.getElementById('contactModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; 
}

function closeContactForm() {
    const modal = document.getElementById('contactModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function prefillContactForm() {
    const currentUser = JSON.parse(localStorage.getItem('goalforgeCurrentUser'));
    if (currentUser) {
        document.getElementById('supportName').value = currentUser.displayName || '';
        document.getElementById('supportEmail').value = currentUser.email || '';
    }
}

document.getElementById('supportForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('supportName').value,
        email: document.getElementById('supportEmail').value,
        topic: document.getElementById('supportTopic').value,
        message: document.getElementById('supportMessage').value,
        timestamp: new Date().toISOString()
    };
    
    const supportRequests = JSON.parse(localStorage.getItem('goalforgeSupportRequests')) || [];
    supportRequests.push(formData);
    localStorage.setItem('goalforgeSupportRequests', JSON.stringify(supportRequests));
    

    showMessage('Your message has been sent! We\'ll get back to you within 24 hours.', 'success');
    
    closeContactForm();
    this.reset();
    prefillContactForm();
});


function startLiveChat() {
    showMessage('Live chat feature would be implemented here. For now, please use the contact form.', 'info');
}


document.getElementById('contactModal')?.addEventListener('click', function(e) {
    if (e.target === this) {
        closeContactForm();
    }
});


document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeContactForm();
    }
});


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
        z-index: 10001;
        animation: slideIn 0.3s ease;
    `;
    
    if (type === 'error') messageEl.style.background = '#ef4444';
    else if (type === 'success') messageEl.style.background = '#10b981';
    else messageEl.style.background = '#667eea';
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        messageEl.remove();
    }, 4000);
}

if (!document.querySelector('style[data-help-animations]')) {
    const style = document.createElement('style');
    style.setAttribute('data-help-animations', 'true');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
}