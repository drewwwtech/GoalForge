// js/help.js - Help & FAQ Functionality

document.addEventListener('DOMContentLoaded', function() {
    initializeHelpPage();
});

function initializeHelpPage() {
    setupCategoryNavigation();
    setupFAQAccordion();
    setupSearchFunctionality();
    prefillContactForm();
}

// Set up category navigation
function setupCategoryNavigation() {
    const categoryLinks = document.querySelectorAll('.category-link');
    const helpSections = document.querySelectorAll('.help-section');
    
    categoryLinks.forEach(link => {
        link.addEventListener('click', function() {
            const targetId = this.getAttribute('href').substring(1);
            
            // Remove active class from all links and sections
            categoryLinks.forEach(l => l.classList.remove('active'));
            helpSections.forEach(s => s.classList.remove('active'));
            
            // Add active class to clicked link and target section
            this.classList.add('active');
            document.getElementById(targetId).classList.add('active');
            
            // Scroll to top of content
            document.querySelector('.help-content').scrollTop = 0;
        });
    });
}

// Set up FAQ accordion functionality
function setupFAQAccordion() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const faqItem = this.parentElement;
            const isActive = faqItem.classList.contains('active');
            
            // Close all other FAQ items
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Toggle current item
            if (!isActive) {
                faqItem.classList.add('active');
            }
        });
    });
}

// Set up search functionality
function setupSearchFunctionality() {
    const searchInput = document.getElementById('helpSearch');
    const searchBtn = document.querySelector('.search-btn');
    
    // Search on button click
    searchBtn.addEventListener('click', performSearch);
    
    // Search on Enter key
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Real-time search (optional - can be intensive)
    // searchInput.addEventListener('input', performSearch);
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
    
    // Hide all sections and show only those with results
    helpSections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Search through all FAQ items
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question h3').textContent.toLowerCase();
        const answer = item.querySelector('.faq-answer').textContent.toLowerCase();
        const parentSection = item.closest('.help-section');
        
        if (question.includes(searchTerm) || answer.includes(searchTerm)) {
            item.style.display = 'block';
            parentSection.classList.add('active');
            parentSection.style.display = 'block';
            hasResults = true;
            
            // Highlight matching text
            highlightText(item, searchTerm);
        } else {
            item.style.display = 'none';
        }
    });
    
    // Show no results message if no matches found
    showSearchResults(hasResults, searchTerm);
}

function highlightText(element, searchTerm) {
    const question = element.querySelector('.faq-question h3');
    const answer = element.querySelector('.faq-answer');
    
    // Remove existing highlights
    question.innerHTML = question.textContent;
    answer.innerHTML = answer.textContent;
    
    // Highlight in question
    highlightInElement(question, searchTerm);
    
    // Highlight in answer
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
    
    // Show all FAQ items
    faqItems.forEach(item => {
        item.style.display = 'block';
        item.classList.remove('active');
        
        // Remove highlights
        const question = item.querySelector('.faq-question h3');
        const answer = item.querySelector('.faq-answer');
        question.innerHTML = question.textContent;
        answer.innerHTML = answer.textContent;
    });
    
    // Reset to first section
    helpSections.forEach((section, index) => {
        section.style.display = '';
        section.classList.remove('active');
        if (index === 0) {
            section.classList.add('active');
        }
    });
    
    // Reset category navigation
    document.querySelectorAll('.category-link').forEach((link, index) => {
        link.classList.remove('active');
        if (index === 0) {
            link.classList.add('active');
        }
    });
    
    // Hide no results message
    const noResults = document.querySelector('.no-results');
    if (noResults) {
        noResults.remove();
    }
}

function showSearchResults(hasResults, searchTerm) {
    // Remove existing no results message
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

// Contact form functionality
function showContactForm() {
    const modal = document.getElementById('contactModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeContactForm() {
    const modal = document.getElementById('contactModal');
    modal.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
}

function prefillContactForm() {
    const currentUser = JSON.parse(localStorage.getItem('goalforgeCurrentUser'));
    if (currentUser) {
        document.getElementById('supportName').value = currentUser.displayName || '';
        document.getElementById('supportEmail').value = currentUser.email || '';
    }
}

// Handle contact form submission
document.getElementById('supportForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('supportName').value,
        email: document.getElementById('supportEmail').value,
        topic: document.getElementById('supportTopic').value,
        message: document.getElementById('supportMessage').value,
        timestamp: new Date().toISOString()
    };
    
    // In a real app, this would send to a server
    // For now, we'll simulate sending and show success message
    
    // Save to localStorage (simulated)
    const supportRequests = JSON.parse(localStorage.getItem('goalforgeSupportRequests')) || [];
    supportRequests.push(formData);
    localStorage.setItem('goalforgeSupportRequests', JSON.stringify(supportRequests));
    
    // Show success message
    showMessage('Your message has been sent! We\'ll get back to you within 24 hours.', 'success');
    
    // Close modal and reset form
    closeContactForm();
    this.reset();
    prefillContactForm();
});

// Live chat simulation
function startLiveChat() {
    showMessage('Live chat feature would be implemented here. For now, please use the contact form.', 'info');
}

// Close modal when clicking outside
document.getElementById('contactModal')?.addEventListener('click', function(e) {
    if (e.target === this) {
        closeContactForm();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeContactForm();
    }
});

// Reuse message function
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

// Add slideIn animation to CSS if not already present
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