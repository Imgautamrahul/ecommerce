// Check if user is logged in
function checkAuth() {
    return localStorage.getItem('userToken') !== null;
}

// Toggle between sign in and sign up forms
function toggleForms(formType) {
    const signUpForm = document.getElementById('signUpForm');
    const signInForm = document.getElementById('signInForm');
    
    if (formType === 'signin') {
        signUpForm.style.display = 'none';
        signInForm.style.display = 'block';
    } else {
        signUpForm.style.display = 'block';
        signInForm.style.display = 'none';
    }
}

// Handle admin checkbox
document.getElementById('adminCheckbox')?.addEventListener('change', function(e) {
    const adminInfo = document.getElementById('adminInfo');
    if (e.target.checked) {
        adminInfo.style.display = 'block';
    } else {
        adminInfo.style.display = 'none';
    }
});

// Handle sign up
async function handleSignUp(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const userData = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        role: 'user'  // Explicitly set role as user
    };
    
    try {
        const response = await fetch('http://localhost:5506/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok) {
            showSuccess('Registration successful! Please login.');
            toggleForms('signin');
            
            // Clear the form
            event.target.reset();
        } else {
            showError(data.error || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showError('Connection error. Please try again.');
    }
}

// Add message handling functions
function showMessage(message, type) {
    if (type === 'error') {
        showError(message);
    } else if (type === 'success') {
        showSuccess(message);
    }
}

// Handle admin sign in
async function handleAdminSignIn(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const isAdmin = document.getElementById('adminCheckbox').checked;
    const isVendor = document.getElementById('vendorCheckbox').checked;

    const data = {
        email: formData.get('email'),
        password: formData.get('password'),
        role: isAdmin ? 'admin' : (isVendor ? 'vendor' : 'user')
    };

    try {
        console.log('Attempting login with:', data); // Debug log

        const response = await fetch('http://localhost:5506/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        console.log('Login response:', result); // Debug log

        if (response.ok) {
            // Store the token and user info
            localStorage.setItem('token', result.token);
            localStorage.setItem('userRole', result.user.role);
            localStorage.setItem('userName', result.user.name);
            localStorage.setItem('userEmail', result.user.email);
            
            // Clear any previous vendor email
            localStorage.removeItem('vendorEmail');
            
            // Show success message before redirect
            showSuccess('Login successful! Redirecting...');
            
            // Redirect based on role after a short delay
            setTimeout(() => {
                if (isAdmin && result.user.role === 'admin') {
                    window.location.href = 'admin-dashboard.html';
                } else if (isVendor && result.user.role === 'vendor') {
                    window.location.href = 'vendor-dashboard.html';
                } else {
                    window.location.href = 'index.html';
                }
            }, 1000);
        } else {
            showError(result.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Connection error. Please try again.');
    }
}

// Validate admin credentials (example)
function validateAdminCredentials(email, password) {
    // This is just an example. In a real application, you would validate against your backend
    return email === 'admin@example.com' && password === 'admin123';
}

// Validate user credentials (example)
function validateUserCredentials(email, password) {
    // This is just an example. In a real application, you would validate against your backend
    return email.length > 0 && password.length > 0;
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const form = document.querySelector('.form-container:not([style*="display: none"]) form');
    form.insertBefore(errorDiv, form.firstChild);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// Add success message function
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    const form = document.querySelector('.form-container:not([style*="display: none"]) form');
    form.insertBefore(successDiv, form.firstChild);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// Add success message style
const successStyle = document.createElement('style');
successStyle.textContent = `
    .success-message {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 16px;
        text-align: center;
        font-size: 14px;
    }
`;
document.head.appendChild(successStyle);

// Add to app.js
function openProfile() {
    const userRole = localStorage.getItem('userRole');
    if (checkAuth()) {
        if (userRole === 'admin') {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'profile.html#dashboard';
        }
    } else {
        window.location.href = 'profile.html';
    }
}

// Add CSS for error message
const style = document.createElement('style');
style.textContent = `
    .error-message {
        background: rgba(220, 38, 38, 0.1);
        color: #dc2626;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 16px;
        text-align: center;
        font-size: 14px;
    }
`;
document.head.appendChild(style);

// Add vendor checkbox handler
document.getElementById('vendorCheckbox')?.addEventListener('change', function() {
    const adminCheckbox = document.getElementById('adminCheckbox');
    if (this.checked) {
        adminCheckbox.checked = false;
    }
});

document.getElementById('adminCheckbox')?.addEventListener('change', function() {
    const vendorCheckbox = document.getElementById('vendorCheckbox');
    if (this.checked) {
        vendorCheckbox.checked = false;
    }
}); 