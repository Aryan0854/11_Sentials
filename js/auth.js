// Authentication module
export function initAuth() {
    const loginForm = document.getElementById('loginForm');
    const toggleSignUp = document.getElementById('toggleSignUp');
    const loginSubtext = document.getElementById('loginSubtext');
    let isSignUp = false;

    toggleSignUp.addEventListener('click', () => {
        isSignUp = !isSignUp;
        loginSubtext.textContent = isSignUp ? 'Create your account' : 'Sign in to your account';
        toggleSignUp.textContent = isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up';
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (email === 'a@gmail.com' && password === '12345') {
            document.getElementById('loginPage').classList.add('hidden');
            document.getElementById('dashboardPage').classList.remove('hidden');
        } else {
            alert('Invalid credentials');
        }
    });
}