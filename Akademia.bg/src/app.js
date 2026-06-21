import { initMobileMenu, renderDashboardShell, renderBookingsList } from './modules/ui.js';
import { fetchTeachers, renderCatalogGrid } from './modules/catalog.js';
import { getCurrentUser, fetchUserProfile, fetchUserBookings } from './modules/auth.js';
import { $, createEl } from './utils/dom.js';

/**
 * Initializes the Lenis smooth scrolling engine with premium kinetic curves
 */
const initScrollEngine = () => {
    if (typeof Lenis === 'undefined') return;

    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
        infinite: false
    });

    const raf = (time) => {
        lenis.raf(time);
        requestAnimationFrame(raf);
    };

    requestAnimationFrame(raf);
};

/**
 * Main application execution lifecycle hook bound to DOM preparation
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize systemic UX engines
    initScrollEngine();
    initMobileMenu('#mobile-trigger', '#mobile-navigation');

    // ==========================================================================
    // 1. GLOBAL NAVIGATION AUTH CORRELATION
    // ==========================================================================
    const authWrapper = $('#auth-container');
    const activeUser = await getCurrentUser();

    if (authWrapper) {
        authWrapper.innerHTML = ''; // Safely purge the initialization skeleton loader
        authWrapper.classList.remove('theme-skeleton-loader'); // Remove pulse animation parameters
        
        if (activeUser) {
            // Secure Session Detected -> Render contextual link directly to Dashboard panel
            authWrapper.appendChild(
                createEl('a', { 
                    className: 'nav-link-secondary theme-text-accent-link',
                    href: 'dashboard.html'
                }, ['Табло'])
            );
        } else {
            // Guest Lifecycle -> Render responsive premium theme authorization anchor button
            authWrapper.appendChild(
                createEl('a', { 
                    className: 'btn-primary-layout theme-btn-primary',
                    style: 'padding: 10px 20px; font-size: 10px; border-radius: 8px; text-decoration: none; width: auto;',
                    href: 'login.html'
                }, ['Вход'])
            );
        }
    }

    // ==========================================================================
    // 2. CONTEXT ROUTE: LANDING INDEX PAGE PREVIEW GRID
    // ==========================================================================
    const featuredGrid = $('#featured-catalog-grid');
    if (featuredGrid) {
        const { data: teachers, error } = await fetchTeachers();
        if (!error && teachers) {
            // Slice structural dataset to project a clean 4-card maximum summary grid
            renderCatalogGrid(featuredGrid, teachers.slice(0, 4));
        }
    }

    // ==========================================================================
    // 3. CONTEXT ROUTE: EXPLORATION CATALOG SEARCH HUB
    // ==========================================================================
    const catalogGrid = $('#catalog-grid');
    if (catalogGrid) {
        const searchInput = $('#search-teacher');
        const filterSelect = $('#filter-target');
        
        const { data: teachers, error } = await fetchTeachers();
        if (error) {
            const statusNode = $('#catalog-status');
            if (statusNode) {
                statusNode.textContent = 'Грешка при комуникация със сървъра. Опитайте отново.';
            }
            return;
        }

        let cache = teachers || [];
        renderCatalogGrid(catalogGrid, cache);

        // Reactive filter execution layer bound safely inside data closure scope
        const filterPipeline = () => {
            const query = searchInput.value.toLowerCase().trim();
            const targetGrade = filterSelect.value;

            const processed = cache.filter(t => {
                const matchesSearch = t.name.toLowerCase().includes(query);
                const matchesGrade = targetGrade === 'all' || 
                    (t.target_grades && t.target_grades.map(String).includes(targetGrade));
                return matchesSearch && matchesGrade;
            });
            renderCatalogGrid(catalogGrid, processed);
        };

        searchInput.addEventListener('input', filterPipeline);
        filterSelect.addEventListener('change', filterPipeline);
    }

    // ==========================================================================
    // 4. CONTEXT ROUTE: MANAGEMENT PROFILE DASHBOARD PANEL
    // ==========================================================================
    const dashboardContainer = $('#dashboard-root');
    if (dashboardContainer) {
        // Enforce route shielding architecture for non-authenticated execution threads
        if (!activeUser) {
            window.location.href = 'login.html';
            return;
        }

        const profile = await fetchUserProfile(activeUser.id);
        if (!profile) {
            dashboardContainer.innerHTML = `
                <p class="catalog-empty-state theme-text-muted-paragraph">
                    Грешка при извличане на потребителския ви профил от базата данни.
                </p>`;
            return;
        }

        // Render dashboard skeleton structure
        renderDashboardShell(dashboardContainer, profile);

        // Populate inner relational booking entities reactively via the secondary grid hook
        const bookingsTarget = $('#dashboard-bookings-grid');
        if (bookingsTarget) {
            const bookings = await fetchUserBookings(profile.id, profile.role);
            renderBookingsList(bookingsTarget, bookings, profile.role);
        }
    }
});