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
        e.preventDefault(); // Page reload रोखण्यासाठी
        
        // आधीचा एरर मेसेज रिसेट करा (आता सुरक्षितपणे चालेल)
        if (errorMessage) {
            errorMessage.style.display = 'none';
            errorMessage.textContent = '';
        }

        const usernameValue = usernameInput.value.trim();
        const passwordValue = passwordInput.value;

        // कडक तपासणी: जर बरोबर असेल तर लगेच डॅशबोर्डवर पाठवा
        if (usernameValue === 'admin' && passwordValue === 'admin@123') {
            
            // झटकन डॅशबोर्ड पेजवर रीडायरेक्ट करा
            window.location.href = 'dashboard.html'; 

        } else {
            // आयडी किंवा पासवर्ड चुकीचा असल्यास एरर दाखवा
            if (errorMessage) {
                errorMessage.textContent = 'Invalid username or password. Please try again.';
                errorMessage.style.display = 'block';
            }
            
            // पासवर्ड फिल्ड क्लियर करा आणि कर्सर तिथे आणा
            passwordInput.value = '';
            passwordInput.focus();
        }
    });
});