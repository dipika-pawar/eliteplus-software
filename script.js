document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const errorMessage = document.getElementById('errorMessage');

    // 1. Password Visibility Toggle Feature
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        togglePassword.classList.toggle('fa-eye');
        togglePassword.classList.toggle('fa-eye-slash');
    });

    // 2. Instant Form Submission & Redirect
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault(); // To prevent page reload
        
        // Reset previous error message (will now run safely)
        if (errorMessage) {
            errorMessage.style.display = 'none';
            errorMessage.textContent = '';
        }

        const usernameValue = usernameInput.value.trim();
        const passwordValue = passwordInput.value;

        // Strict check: If correct, redirect to dashboard immediately
        if (usernameValue === 'admin' && passwordValue === 'admin@123') {
            
            // Quickly redirect to the dashboard page
            window.location.href = 'dashboard.html'; 

        } else {
            // Show error if ID or password is wrong
            if (errorMessage) {
                errorMessage.textContent = 'Invalid username or password. Please try again.';
                errorMessage.style.display = 'block';
            }
            
            // Clear the password field and focus the cursor there
            passwordInput.value = '';
            passwordInput.focus();
        }
    });
});