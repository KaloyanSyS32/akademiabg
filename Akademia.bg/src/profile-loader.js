import { supabase } from './config/supabase.js';
import { $ } from './utils/dom.js';

document.addEventListener('DOMContentLoaded', async () => {
    const loader = $('#profile-loading-state');
    const contentWrapper = $('#profile-root-wrapper');

    const urlParams = new URLSearchParams(window.location.search);
    const teacherId = urlParams.get('id');

    if (!teacherId) {
        window.location.href = 'catalog.html';
        return;
    }

    try {
        const { data: teacher, error } = await supabase
            .from('teachers')
            .select('id, name, subject, rate, target_grades, bio, avatar_url')
            .eq('id', teacherId)
            .single();

        if (error || !teacher) throw new Error('Преподавателят не бе намерен.');

        // DOM Text Hydration with hardcoded structural fallback verification loops
        $('#view-name').textContent = teacher.name || 'Преподавател';
        $('#view-subject').textContent = teacher.subject || 'Български език и Литература (БЕЛ)';
        
        // Defensive String Verification block checking for white space voids or null fields
        const processedBio = teacher.bio && teacher.bio.trim().length > 0 
            ? teacher.bio 
            : 'Преподавателят все още не е въвел своята автобиография и описание на методите за обучение.';
        $('#view-bio').textContent = processedBio;

        $('#view-rate').textContent = `${teacher.rate || 40} лв.`;
        
        const formattedGrades = teacher.target_grades && teacher.target_grades.length > 0
            ? teacher.target_grades.map(g => g === '0' || g === 0 ? 'Университет' : `${g}. клас`).join(', ')
            : 'Всички класове';
        $('#view-grades').textContent = formattedGrades;
        
        // Avatar asset pipeline routing
        const avatarImg = $('#view-avatar');
        const initial = teacher.name ? teacher.name.trim().charAt(0).toUpperCase() : 'U';
        const fallbackSrc = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="%231e293b"/><text x="50%" y="55%" font-size="40" font-family="sans-serif" font-weight="bold" fill="%2394a3b8" dominant-baseline="middle" text-anchor="middle">${initial}</text></svg>`;

        avatarImg.src = teacher.avatar_url || fallbackSrc;
        avatarImg.onerror = (e) => {
            e.target.onerror = null;
            e.target.src = fallbackSrc;
        };

        // Render layout grid explicitly when processing completes
        if (contentWrapper) {
            contentWrapper.style.display = 'grid';
        }
        if (loader) {
            loader.style.display = 'none';
        }

        $('#booking-trigger-btn').addEventListener('click', () => {
            alert(`Интеграция на график за ${teacher.name || 'преподавателя'} предстои в следващия модул.`);
        });

    } catch (err) {
        console.error('Profile parsing exception resolution tracker:', err);
        if (loader) {
            loader.innerHTML = `
                <div style="text-align: center; padding: 64px 24px;">
                    <p class="theme-text-muted-paragraph" style="font-size: 16px; font-weight: 700; color: #ef4444; margin: 0;">
                        Грешка при зареждане на преподавателския профил.
                    </p>
                    <a href="catalog.html" class="btn-secondary-layout" style="display: inline-block; margin-top: 20px; text-decoration: none;">Обратно към каталога</a>
                </div>`;
            loader.classList.remove('theme-skeleton-loader');
        }
    }
});