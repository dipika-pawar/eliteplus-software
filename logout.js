document.addEventListener('DOMContentLoaded', () => {
    
    // Mobile Sidebar Open/Close Toggle Mechanism
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const toggleIcon = menuToggle.querySelector('i');

    menuToggle.addEventListener('click', (e) => {
        sidebar.classList.toggle('open');
        e.stopPropagation();

        // Change icon (Bars <-> Xmark)
        if (sidebar.classList.contains('open')) {
            toggleIcon.className = 'fa-solid fa-xmark';
        } else {
            toggleIcon.className = 'fa-solid fa-bars';
        }
    });

    // Close sidebar if clicked anywhere outside the sidebar
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 991 && sidebar.classList.contains('open')) {
            if (!sidebar.contains(e.target) && e.target !== menuToggle) {
                sidebar.classList.remove('open');
                toggleIcon.className = 'fa-solid fa-bars';
            }
        }
    });
});



function logout() {
    // Asking the user to confirm the action
    if (confirm("Are you sure you want to log out?")) {
        // Redirecting to the index.html page
        window.location.href = 'index.html';
    }
}