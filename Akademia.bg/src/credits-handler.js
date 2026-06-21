import { supabase } from './config/supabase.js';
import { $ } from './utils/dom.js';

document.addEventListener('DOMContentLoaded', async () => {
    const creditsDisplay = $('#user-credits-display');
    
    // Check user auth context before mounting listeners
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    const userId = session.user.id;

    /**
     * Synchronizes and displays the user's active ledger credits balance
     */
    const updateCreditsDisplay = async () => {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .single();

        if (!error && profile && creditsDisplay) {
            creditsDisplay.textContent = `Баланс: ${profile.credits} ${profile.credits === 1 ? 'кредит' : 'кредита'}`;
        }
    };

    // Attach click events across the dynamic purchase matrix nodes
    document.querySelectorAll('.purchase-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const packageId = e.currentTarget.getAttribute('data-pack');
            
            // Map packages locally to resolve credits payload count cleanly
            let creditsToAdd = 0;
            if (packageId === 'pack_3') creditsToAdd = 3;
            else if (packageId === 'pack_6') creditsToAdd = 6;
            else if (packageId === 'pack_12') creditsToAdd = 12;

            if (creditsToAdd === 0) return;

            e.currentTarget.disabled = true;
            const originalText = e.currentTarget.textContent;
            e.currentTarget.textContent = 'Обработка...';

            try {
                // Fetch the current credit value before executing structural increments
                const { data: currentProfile, error: fetchError } = await supabase
                    .from('profiles')
                    .select('credits')
                    .eq('id', userId)
                    .single();

                if (fetchError) throw fetchError;

                const newBalance = (currentProfile.credits || 0) + creditsToAdd;

                // Fire transaction updates straight into target user profile record
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ credits: newBalance })
                    .eq('id', userId);

                if (updateError) throw updateError;

                alert(`Успешно закупихте пакет! Добавени са ${creditsToAdd} кредита към вашия профил.`);
                await updateCreditsDisplay();

            } catch (err) {
                console.error('Credits ledger assignment transaction failure:', err);
                alert('Грешка при обработка на плащането. Моля, опитайте отново.');
            } finally {
                button.disabled = false;
                button.textContent = originalText;
            }
        });
    });

    // Run primary display lifecycle loop
    await updateCreditsDisplay();
});