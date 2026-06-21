import { createEl, $ } from '../utils/dom.js';
import { updateBookingStatus } from './auth.js';

export const initMobileMenu = (triggerSel, menuSel) => {
    const trigger = $(triggerSel);
    const menu = $(menuSel);
    if (!trigger || !menu) return;
    trigger.addEventListener('click', () => {
        menu.classList.toggle('is-visible');
    });
};

export const renderDashboardShell = (container, profile) => {
    if (!container) return;
    container.innerHTML = '';
    const view = createEl('div', { className: 'dashboard-wrapper-layout' }, [
        createEl('section', { className: 'hero-section-layout' }, [
            createEl('h1', { className: 'hero-title-layout theme-heading-text' }, [
                `Добре дошли, `, createEl('span', {}, [profile.full_name])
            ]),
            createEl('p', { className: 'hero-subtitle-layout theme-text-muted-paragraph' }, [
                `Тип профил: ${profile.role === 'teacher' ? 'Преподавател' : 'Ученик'}`
            ])
        ]),
        createEl('section', { className: 'catalog-grid-layout', id: 'dashboard-bookings-grid' }, [])
    ]);
    container.appendChild(view);
};

export const renderBookingsList = (container, bookings, role) => {
    if (!container) return;
    container.innerHTML = '';

    if (bookings.length === 0) {
        container.appendChild(
            createEl('p', { className: 'catalog-empty-state theme-text-muted-paragraph' }, ['Няма намерени часове.'])
        );
        return;
    }

    const fragment = document.createDocumentFragment();

    bookings.forEach(booking => {
        const dateObj = new Date(booking.booking_date);
        const formattedDate = dateObj.toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const counterPartyName = role === 'teacher' ? booking.profiles?.full_name : booking.teacher_profiles?.full_name;

        const actionButtons = [];
        if (role === 'teacher' && booking.status === 'pending') {
            actionButtons.push(
                createEl('button', { 
                    className: 'btn-primary-layout theme-btn-primary',
                    style: 'padding: 8px 16px; margin-right: 8px; font-size: 10px;',
                    onclick: async () => { await updateBookingStatus(booking.id, 'confirmed'); window.location.reload(); }
                }, ['Потвърди']),
                createEl('button', { 
                    className: 'btn-secondary-layout theme-glass-card',
                    style: 'padding: 8px 16px; font-size: 10px;',
                    onclick: async () => { await updateBookingStatus(booking.id, 'cancelled'); window.location.reload(); }
                }, ['Откажи'])
            );
        }

        const card = createEl('div', { className: 'card-layout theme-glass-card' }, [
            createEl('div', { className: 'card-body-layout' }, [
                createEl('h3', { className: 'card-title-layout theme-heading-text' }, [counterPartyName || 'Потребител']),
                createEl('p', { className: 'card-text-layout theme-text-muted-paragraph' }, [formattedDate]),
                createEl('p', { className: 'card-subject-layout theme-brand-title', style: 'font-size: 11px;' }, [`Статус: ${booking.status}`])
            ]),
            createEl('div', { className: 'card-meta-footer' }, [
                createEl('span', { className: 'card-rate-display theme-heading-text' }, [`${booking.rate} лв`]),
                createEl('div', { className: 'action-group-layout' }, actionButtons)
            ])
        ]);
        fragment.appendChild(card);
    });

    container.appendChild(fragment);
};