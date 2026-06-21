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
 * Renders normalized teacher showcase cards built using pure flexbox internals
 */
export const renderCatalogGrid = (container, teachers) => {
    container.innerHTML = '';

    if (teachers.length === 0) {
        container.innerHTML = `
            <div class="card-layout theme-glass-card" style="grid-column: 1/-1; padding: 48px; text-align: center; min-height: auto;">
                <p class="theme-text-muted-paragraph" style="margin: 0; font-size: 15px;">
                    Няма намерени преподаватели по избраните критерии.
                </p>
            </div>`;
        return;
    }

    // Process batch mutations using a document fragment to prevent layout jumping
    const fragment = document.createDocumentFragment();

    teachers.forEach(teacher => {
        const rawBio = teacher.bio && teacher.bio.trim().length > 0 ? teacher.bio.trim() : '';
        const fallbackBio = 'Преподавателят все още не е въвел допълнително описание на своя учебен план.';
        const targetText = rawBio || fallbackBio;
        
        const truncatedBio = targetText.length > 100 ? `${targetText.substring(0, 100)}...` : targetText;
        const fallbackSrc = getAvatarFallback(teacher.name);

        const card = createEl('div', { 
            className: 'card-layout theme-glass-card',
            style: 'display: flex; flex-direction: column; justify-content: space-between; height: 340px; padding: 24px; box-sizing: border-box; overflow: hidden;'
        }, [
            createEl('div', { style: 'display: flex; flex-direction: column; width: 100%;' }, [
                // Card Header Row Configuration
                createEl('div', { style: 'display: flex; align-items: center; gap: 16px; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.04); padding-bottom: 12px;' }, [
                    createEl('div', { style: 'width: 48px; height: 48px; border-radius: 50%; overflow: hidden; border: 2px solid var(--theme-accent, #3b82f6); flex-shrink: 0;' }, [
                        createEl('img', { 
                            src: teacher.avatar_url || fallbackSrc, 
                            alt: teacher.name,
                            style: 'width: 100%; height: 100%; object-fit: cover;',
                            onerror: (e) => {
                                e.target.onerror = null;
                                e.target.src = fallbackSrc;
                            }
                        })
                    ]),
                    createEl('div', { style: 'overflow: hidden;' }, [
                        createEl('h3', { className: 'theme-heading-text', style: 'font-size: 18px; margin: 0 0 2px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.01em;' }, [teacher.name]),
                        createEl('p', { class: 'badge-text', style: 'font-size: 11px; margin: 0; color: #3b82f6; font-weight: 700; text-transform: uppercase;' }, [teacher.subject || 'БЕЛ'])
                    ])
                ]),
                
                // Content Segment Box Definition
                createEl('p', { className: 'theme-text-muted-paragraph', style: 'font-size: 13.5px; margin: 0 0 20px 0; line-height: 1.6; color: #94a3b8;' }, [
                    truncatedBio
                ])
            ]),

            // Interactive Base Action Matrix
            createEl('div', { style: 'display: flex; flex-direction: column; gap: 12px; margin-top: auto;' }, [
                createEl('div', { style: 'display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.04); padding-top: 12px;' }, [
                    createEl('div', { style: 'display: flex; flex-direction: column;' }, [
                        createEl('span', { style: 'font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 700;' }, ['Цена']),
                        createEl('span', { style: 'font-weight: 800; color: #3b82f6; font-size: 18px;' }, [`${teacher.rate || 40} лв.`])
                    ]),
                    createEl('a', { 
                        className: 'btn-primary-layout theme-btn-primary', 
                        href: `profile.html?id=${teacher.id}`,
                        style: 'padding: 10px 18px; font-size: 12px; border-radius: 8px; text-decoration: none; width: auto; font-weight: 700;'
                    }, ['Преглед'])
                ]),
                
                // Footer Qualification Vector Group
                createEl('div', { style: 'font-size: 11px; color: #10b981; font-weight: 700; display: flex; align-items: center; gap: 6px;' }, [
                    createEl('span', { style: 'width: 6px; height: 6px; border-radius: 50%; background-color: #10b981; display: inline-block;' }),
                    `Класове: ${teacher.target_grades ? teacher.target_grades.map(g => g === '0' || g === 0 ? 'Университет' : `${g}.`).join(', ') : 'Всички'}`
                ])
            ])
        ]);

        fragment.appendChild(card);
    });

    // Commit elements to the DOM in a single transaction
    container.appendChild(fragment);
};