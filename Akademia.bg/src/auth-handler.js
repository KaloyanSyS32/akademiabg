import { supabase } from './config/supabase.js';
import { $ } from './utils/dom.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Session Interceptor: Route users directly away from login if active
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        window.location.href = 'dashboard.html';
        return;
    }

    // Pipeline operational states: 'login' | 'signup' | 'recovery'
    let currentMode = 'login';

    // Core DOM Node Bindings
    const form = $('#auth-form');
    const title = $('#auth-title');
    const subtitle = $('#auth-subtitle');
    const submitBtn = $('#auth-submit-btn');
    const toggleLink = $('#auth-toggle-link');
    const toggleMsg = $('#auth-toggle-msg');
    const forgotLink = $('#auth-forgot-link');
    
    const nameField = $('#name-field-group');
    const passwordField = $('#password-field-group');
    const errorMsg = $('#auth-error-msg');
    const successMsg = $('#auth-success-msg');
    
    const nameInput = $('#auth-name');
    const passwordInput = $('#auth-password');

    /**
     * Toggles interface inputs, validation constraints, and accessibility 
     * metadata attributes dynamically relative to the structural state machine.
     */
    const updateUIState = () => {
        errorMsg.style.display = 'none';
        successMsg.style.display = 'none';

        if (currentMode === 'signup') {
            title.textContent = 'Регистрация';
            subtitle.textContent = 'Създайте своя безплатен акаунт за минута.';
            submitBtn.textContent = 'Регистриране на профил';
            toggleMsg.innerHTML = 'Вече имате профил? <a href="#" id="auth-toggle-link" style="color: #3b82f6; font-weight: 700; text-decoration: none;">Влезте оттук</a>';
            nameField.setAttribute('data-state', 'visible');
            passwordField.style.display = 'flex';
            
            nameInput.required = true;
            passwordInput.required = true;
            passwordInput.setAttribute('autocomplete', 'new-password');
        } else if (currentMode === 'login') {
            title.textContent = 'Вход';
            subtitle.textContent = 'Добре дошли отново! Влезте в профила си.';
            submitBtn.textContent = 'Влез в профила';
            toggleMsg.innerHTML = 'Нямате профил? <a href="#" id="auth-toggle-link" style="color: #3b82f6; font-weight: 700; text-decoration: none;">Регистрирайте се тук</a>';
            nameField.setAttribute('data-state', 'hidden');
            passwordField.style.display = 'flex';
            
            nameInput.required = false;
            passwordInput.required = true;
            passwordInput.setAttribute('autocomplete', 'current-password');
        } else if (currentMode === 'recovery') {
            title.textContent = 'Възстановяване';
            subtitle.textContent = 'Въведете вашия имейл, за да изпратим еднократен 6-цифрен код за достъп.';
            submitBtn.textContent = 'Изпрати код';
            toggleMsg.innerHTML = 'Върни се към <a href="#" id="auth-toggle-link" style="color: #3b82f6; font-weight: 700; text-decoration: none;">Вход</a>';
            nameField.setAttribute('data-state', 'hidden');
            passwordField.style.display = 'none';
            
            nameInput.required = false;
            passwordInput.required = false;
        }

        // Re-bind the event listeners onto elements rewritten via innerHTML string injection
        $('#auth-toggle-link').addEventListener('click', (e) => {
            e.preventDefault();
            currentMode = currentMode === 'signup' || currentMode === 'recovery' ? 'login' : 'signup';
            updateUIState();
        });
    };

    // Attach listener to trigger recovery configuration state
    forgotLink.addEventListener('click', (e) => {
        e.preventDefault();
        currentMode = 'recovery';
        updateUIState();
    });

    // Form submission processing network thread
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMsg.style.display = 'none';
        successMsg.style.display = 'none';
        submitBtn.disabled = true;
        
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Обработка...';

        const email = $('#auth-email').value.trim();

        try {
            if (currentMode === 'recovery') {
                // Use OTP to bypass backend SMTP/Link tracking template bugs causing 500 errors
                const { error } = await supabase.auth.signInWithOtp({
                    email: email,
                    options: {
                        shouldCreateUser: false // Disallow new user generation on typo submittals
                    }
                });
                if (error) throw error;

                successMsg.textContent = 'Изпратихме 6-цифрен временен код за достъп на пощата ви.';
                successMsg.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            } else if (currentMode === 'signup') {
                const fullName = nameInput.value.trim();
                const password = passwordInput.value;

                // Fire register routine defaulting explicitly to 'student' metadata parameters
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                            role: 'student'
                        }
                    }
                });
                if (error) throw error;

                // Instantly authenticate and transition routes if provider email confirmation is disabled
                if (data.session || data.user) {
                    const loginIntent = await supabase.auth.signInWithPassword({ email, password });
                    if (loginIntent.error) throw loginIntent.error;
                    window.location.href = 'index.html';
                }
            } else if (currentMode === 'login') {
                const password = passwordInput.value;
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                
                window.location.href = 'index.html';
            }
        } catch (err) {
            console.error('Auth handler connection fault exceptions tracker:', err);
            errorMsg.textContent = err.message === 'Invalid login credentials' 
                ? 'Грешен имейл адрес или парола.' 
                : err.message || 'Възникна неочаквана грешка при обработка на заявката.';
            errorMsg.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });

    // Fire initial state rendering loop
    updateUIState();
});