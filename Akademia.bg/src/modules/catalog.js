import { supabase } from '../config/supabase.js';
import { createEl } from '../utils/dom.js';

/**
 * Generates a clean inline vector placeholder based on the teacher's initials
 */
const getAvatarFallback = (name) => {
    const initial = name ? name.trim().charAt(0).toUpperCase() : 'U';
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="%231e293b"/><text x="50%" y="55%" font-size="40" font-family="sans-serif" font-weight="bold" fill="%2394a3b8" dominant-baseline="middle" text-anchor="middle">${initial}</text></svg>`;
};

/**
 * Fetches all teacher records from the database
 */
export const fetchTeachers = async () => {
    return await supabase
        .from('teachers')
        .select('id, name, subject, rate, target_grades, bio, avatar_url')
        .order('name', { ascending: true });
};

/**
 * Renders normalized teacher showcase cards built using pure decoupled modules
 */
export const renderCatalogGrid = (container, teachers) => {
    container.innerHTML = '';

    if (teachers.length === 0) {
        container.appendChild(
            createEl('div', { className: 'catalog-empty-wrapper-layout theme-glass-card' }, [
                createEl('p', { className: 'catalog-empty-state theme-text-muted-paragraph' }, [
                    'Няма намерени преподаватели по избраните критерии.'
                ])
            ])
        );
        return;
    }

    const fragment = document.createDocumentFragment();

    teachers.forEach(teacher => {
        const rawBio = teacher.bio && teacher.bio.trim().length > 0 ? teacher.bio.trim() : '';
        const fallbackBio = 'Преподавателят все още не е въвел допълнително описание на своя учебен план.';
        const targetText = rawBio || fallbackBio;
        
        const truncatedBio = targetText.length > 100 ? `${targetText.substring(0, 100)}...` : targetText;
        const fallbackSrc = getAvatarFallback(teacher.name);

        const card = createEl('div', { className: 'card-layout theme-glass-card' }, [
            createEl('div', { className: 'card-content-wrapper-layout' }, [
                createEl('div', { className: 'card-header-row-layout theme-border-bottom-divider' }, [
                    createEl('div', { className: 'avatar-container-layout theme-avatar-border' }, [
                        createEl('img', { 
                            className: 'avatar-img-layout',
                            src: teacher.avatar_url || fallbackSrc, 
                            alt: teacher.name,
                            onerror: (e) => {
                                e.target.onerror = null;
                                e.target.src = fallbackSrc;
                            }
                        })
                    ]),
                    createEl('div', { className: 'header-meta-layout' }, [
                        createEl('h3', { className: 'card-title-layout theme-heading-text' }, [teacher.name]),
                        createEl('p', { className: 'badge-text-layout theme-text-accent-link' }, [teacher.subject || 'БЕЛ'])
                    ])
                ]),
                
                createEl('p', { className: 'card-bio-layout theme-text-muted-paragraph' }, [
                    truncatedBio
                ])
            ]),

            createEl('div', { className: 'card-action-matrix-layout' }, [
                createEl('div', { className: 'card-meta-footer theme-border-top-divider' }, [
                    createEl('div', { className: 'rate-wrapper-layout' }, [
                        createEl('span', { className: 'rate-label-layout theme-text-muted-paragraph' }, ['Цена']),
                        createEl('span', { className: 'card-rate-display theme-heading-text' }, [`${teacher.rate || 40} лв.`])
                    ]),
                    createEl('a', { 
                        className: 'btn-primary-layout theme-btn-primary', 
                        href: `profile.html?id=${teacher.id}`
                    }, ['Преглед'])
                ]),
                
                createEl('div', { className: 'qualification-vector-layout theme-tag-footer-accent' }, [
                    createEl('span', { className: 'indicator-dot-layout theme-indicator-dot' }),
                    `Класове: ${teacher.target_grades ? teacher.target_grades.map(g => g === '0' || g === 0 ? 'Университет' : `${g}.`).join(', ') : 'Всички'}`
                ])
            ])
        ]);

        fragment.appendChild(card);
    });

    container.appendChild(fragment);
};
