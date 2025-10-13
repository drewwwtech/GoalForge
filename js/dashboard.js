// === PROFILE DROPDOWN FUNCTIONALITY ===
const profileTrigger = document.querySelector('.profile-trigger');
const dropdownMenu = document.querySelector('.dropdown-menu');
const profileModal = document.getElementById('profileModal');
const closeModalBtn = profileModal?.querySelector('.close-modal');

if (profileTrigger) {
    profileTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.style.display = dropdownMenu.style.display === 'flex' ? 'none' : 'flex';
    });
}

// Close dropdown if clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.profile-menu')) {
        dropdownMenu.style.display = 'none';
    }
});

// === PROFILE MODAL FUNCTIONALITY ===
document.getElementById('viewProfileBtn')?.addEventListener('click', () => {
    dropdownMenu.style.display = 'none';
    profileModal.style.display = 'flex';

    const currentUser = JSON.parse(localStorage.getItem('goalforgeCurrentUser')) || {};
    document.getElementById('profileEmail').textContent = currentUser.email || 'Unknown user';
    document.getElementById('memberSince').textContent = currentUser.createdAt
        ? new Date(currentUser.createdAt).toLocaleDateString()
        : 'N/A';
});

closeModalBtn?.addEventListener('click', () => {
    profileModal.style.display = 'none';
});

profileModal?.addEventListener('click', (e) => {
    if (e.target === profileModal) profileModal.style.display = 'none';
});

// === LOGOUT FUNCTIONALITY ===
document.getElementById('logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('goalforgeCurrentUser');
    window.location.href = 'index.html';
});