import { supabase } from './config/supabase.js';
import { $ } from './utils/dom.js';

document.addEventListener('DOMContentLoaded', async () => {
    const form = $('#teacher-onboarding-form');
    const submitBtn = $('#onboarding-submit-btn');
    const errorMsg = $('#onboarding-error-msg');
    const successMsg = $('#onboarding-success-msg');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMsg.style.display = 'none';
        successMsg.style.display = 'none';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Обработка и запис...';

        // Extract runtime session context
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
            errorMsg.textContent = 'Трябва да сте влезли в профила си, за да се регистрирате като учител.';
            errorMsg.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Изпрати кандидатстване';
            return;
        }

        const userId = session.user.id;
        const name = $('#teacher-name').value.trim();
        const subject = $('#teacher-subject').value;
        const bio = $('#teacher-bio').value.trim();
        
        // System-enforced flat fee equivalent to €20
        const flatRateBGN = 40.00; 

        // Extract checkbox node tokens
        const rawGrades = Array.from(document.querySelectorAll('input[name="grades"]:checked'))
            .map(checkbox => checkbox.value);

        if (rawGrades.length === 0) {
            errorMsg.textContent = 'Моля, изберете поне един целеви клас.';
            errorMsg.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Изпрати кандидатстване';
            return;
        }

        // Defensive Type-Cast Pipeline: Parsed safely to integers if backend expects int[] arrays
        // Converts "Uni" to 0 (flag constant) and standard grades to integers
        const checkedGrades = rawGrades.map(val => val === 'Uni' ? 0 : parseInt(val, 10));

        try {
            // Transaction Unit 1: Write into public.teachers context
            const { error: teacherError } = await supabase
                .from('teachers')
                .insert([{
                    id: userId,
                    name,
                    subject,
                    rate: flatRateBGN,
                    target_grades: checkedGrades, // Passes array of integers [5, 6, 7]
                    bio,
                    avatar_url: session.user.user_metadata?.avatar_url || null
                }]);

            if (teacherError) throw teacherError;

            // Transaction Unit 2: Update platform metadata permissions role mapping
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ role: 'teacher', full_name: name })
                .eq('id', userId);

            if (profileError) throw profileError;

            // Handle successful profile generation loop
            successMsg.textContent = 'Профилът ви е създаден успешно! Пренасочване към таблото...';
            successMsg.style.display = 'block';
            form.reset();

            setTimeout(() => {
                window.location.href = 'catalog.html';
            }, 2000);

        } catch (err) {
            // Unpack full error parameters to isolate exact database violations
            console.error('PostgreSQL Constraint Violation Debug Logs:', err);
            
            let messageToDisplay = 'Възникна системна грешка при запис в базата данни.';
            
            if (err.message) {
                messageToDisplay = `${err.message}`;
            } else if (typeof err === 'object') {
                messageToDisplay = JSON.stringify(err);
            }
            
            errorMsg.textContent = messageToDisplay;
            errorMsg.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Изпрати кандидатстване';
        }
    });
});