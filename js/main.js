/**
 * CDU Schwerin Website – JavaScript Functionality
 * Accessible, Performant, Vanilla JS
 */

// ============================================================================
// Cookie Consent Management
// ============================================================================

const ConsentManager = (() => {
    const STORAGE_KEY = 'cdu-consent';
    const GA_ID = 'G-3L54P95RC8';

    const init = () => {
        const consentBanner = document.getElementById('consent-banner');
        const acceptBtn = document.getElementById('consent-accept');
        const declineBtn = document.getElementById('consent-decline');

        if (!consentBanner || !acceptBtn || !declineBtn) return;

        // Check if user has already made a choice
        if (!hasConsent()) {
            setTimeout(() => {
                consentBanner.classList.add('show');
            }, 500);
        } else {
            consentBanner.classList.add('hidden');
            if (getConsent()) {
                loadGoogleAnalytics();
            }
        }

        acceptBtn.addEventListener('click', () => {
            setConsent(true);
            consentBanner.classList.remove('show');
            consentBanner.classList.add('hidden');
            loadGoogleAnalytics();
        });

        declineBtn.addEventListener('click', () => {
            setConsent(false);
            consentBanner.classList.remove('show');
            consentBanner.classList.add('hidden');
        });
    };

    const hasConsent = () => {
        return localStorage.getItem(STORAGE_KEY) !== null;
    };

    const getConsent = () => {
        const value = localStorage.getItem(STORAGE_KEY);
        return value === 'true';
    };

    const setConsent = (value) => {
        localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
    };

    const loadGoogleAnalytics = () => {
        // Load GA4 script conditionally
        const script = document.getElementById('ga-script');
        if (!script) return;

        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        function gtag() {
            window.dataLayer.push(arguments);
        }
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', GA_ID, {
            'anonymize_ip': true,
            'allow_google_signals': false
        });
    };

    return { init };
})();

// ============================================================================
// Navigation Menu Toggle & Keyboard Control
// ============================================================================

const Navigation = (() => {
    const closeMenu = () => {
        const menuToggle = document.getElementById('menu-toggle');
        const navMenu = document.getElementById('nav-menu');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Navigation öffnen');
        navMenu.classList.remove('show');
    };

    const init = () => {
        const menuToggle = document.getElementById('menu-toggle');
        const navMenu = document.getElementById('nav-menu');
        const mainNav = document.getElementById('main-nav');

        if (!menuToggle || !navMenu) return;

        // Toggle menu on button click
        menuToggle.addEventListener('click', () => {
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-expanded', !isExpanded);
            menuToggle.setAttribute('aria-label', isExpanded ? 'Navigation öffnen' : 'Navigation schließen');
            navMenu.classList.toggle('show');

            if (!isExpanded) {
                // Menue und Suche sind beide Vollbild-Overlays und duerfen
                // sich nicht ueberlagern.
                SearchManager.close();
                // Focus first menu item when opening
                const firstItem = navMenu.querySelector('a');
                if (firstItem) firstItem.focus();
            }
        });

        // Close the fullscreen menu when a link actually navigates. Submenu
        // parents only expand their submenu on mobile, so they must keep it open.
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (link.matches('.has-submenu > .nav-link')) return;
                closeMenu();
            });
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu.classList.contains('show')) {
                closeMenu();
                menuToggle.focus();
            }
        });

        // Handle dropdown menus
        // Die Navigation ist in jeder Breite ein Overlay-Menue, deshalb
        // klappen die Untermenues immer per Klick auf – es gibt keine
        // Breite mehr, in der sie als Hover-Dropdown erscheinen.
        const dropdownItems = navMenu.querySelectorAll('.has-submenu > .nav-link');
        dropdownItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const parent = item.closest('.has-submenu');
                const submenu = parent.querySelector('.submenu');
                const isExpanded = item.getAttribute('aria-expanded') === 'true';

                item.setAttribute('aria-expanded', !isExpanded);
                submenu.classList.toggle('show');
            });

            // Keyboard navigation for dropdowns
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    item.click();
                }
            });
        });

        // Close menus when clicking outside
        document.addEventListener('click', (e) => {
            if (!mainNav.contains(e.target) && e.target !== menuToggle) {
                menuToggle.setAttribute('aria-expanded', 'false');
                navMenu.classList.remove('show');
            }
        });

        // Close submenus on blur
        const allNavLinks = navMenu.querySelectorAll('a');
        allNavLinks.forEach(link => {
            link.addEventListener('blur', (e) => {
                // Check if focus moved outside the nav
                setTimeout(() => {
                    if (!mainNav.contains(document.activeElement)) {
                        dropdownItems.forEach(item => {
                            item.setAttribute('aria-expanded', 'false');
                            const submenu = item.closest('.has-submenu').querySelector('.submenu');
                            if (submenu) submenu.classList.remove('show');
                        });
                    }
                }, 0);
            });
        });
    };

    return { init, closeMenu };
})();

// ============================================================================
// Image Slider
// ============================================================================

const ImageSlider = (() => {
    let currentIndex = 0;
    let slides = [];
    let autoplayEnabled = true;
    let autoplayInterval = null;

    const init = () => {
        const sliderWrapper = document.querySelector('.slider-wrapper');
        const prevBtn = document.querySelector('.slider-btn.prev');
        const nextBtn = document.querySelector('.slider-btn.next');

        if (!sliderWrapper) return;

        slides = Array.from(sliderWrapper.querySelectorAll('img'));
        if (slides.length === 0) return;

        // Check for reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        autoplayEnabled = !prefersReducedMotion;

        // Show first slide
        showSlide(0);

        // Event listeners
        if (prevBtn) prevBtn.addEventListener('click', () => previousSlide());
        if (nextBtn) nextBtn.addEventListener('click', () => nextSlide());

        // Listen for motion preference change
        window.matchMedia('(prefers-reduced-motion: reduce)').addListener((e) => {
            autoplayEnabled = !e.matches;
            if (autoplayEnabled) {
                startAutoplay();
            } else {
                stopAutoplay();
            }
        });

        // Start autoplay
        if (autoplayEnabled) {
            startAutoplay();
        }

        // Stop autoplay on user interaction
        sliderWrapper.addEventListener('mouseenter', stopAutoplay);
        sliderWrapper.addEventListener('mouseleave', () => {
            if (autoplayEnabled) startAutoplay();
        });
    };

    const showSlide = (index) => {
        slides.forEach(slide => slide.classList.remove('active'));
        slides[index].classList.add('active');
        currentIndex = index;
    };

    const nextSlide = () => {
        stopAutoplay();
        currentIndex = (currentIndex + 1) % slides.length;
        showSlide(currentIndex);
        if (autoplayEnabled) startAutoplay();
    };

    const previousSlide = () => {
        stopAutoplay();
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        showSlide(currentIndex);
        if (autoplayEnabled) startAutoplay();
    };

    const startAutoplay = () => {
        if (autoplayInterval) clearInterval(autoplayInterval);
        autoplayInterval = setInterval(nextSlide, 5000);
    };

    const stopAutoplay = () => {
        if (autoplayInterval) clearInterval(autoplayInterval);
    };

    return { init };
})();

// ============================================================================
// Video Autoplay Based on Motion Preference
// ============================================================================

const VideoManager = (() => {
    const init = () => {
        const video = document.querySelector('.membership-video');
        if (!video) return;

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Only autoplay if user hasn't disabled motion
        if (!prefersReducedMotion) {
            video.autoplay = true;
        }

        // Listen for changes to motion preference
        window.matchMedia('(prefers-reduced-motion: reduce)').addListener((e) => {
            if (e.matches) {
                video.autoplay = false;
            } else {
                video.autoplay = true;
            }
        });
    };

    return { init };
})();

// ============================================================================
// Suche (clientseitig)
// ============================================================================

const SearchManager = (() => {
    let overlay, toggle, input, results, status, lastFocused;

    // Der Index haelt wurzelrelative Pfade ("kontakt/"). Wie viele Ebenen
    // vor die aktuelle Seite gehoeren, verraet der Pfad des Stylesheets –
    // das ist zuverlaessiger als location.pathname, weil die Seite auf
    // GitHub Pages unter /CDU/ liegt und lokal direkt im Wurzelverzeichnis.
    const basePrefix = () => {
        const link = document.querySelector('link[rel="stylesheet"][href*="css/styles.css"]');
        return link ? link.getAttribute('href').replace(/css\/styles\.css$/, '') : '';
    };

    const shortTitle = (title) => title.split('–')[0].trim() || title;

    const search = (query) => {
        const index = window.CDU_SEARCH_INDEX || [];
        const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
        if (!terms.length) return [];

        return index
            .map(entry => {
                // Nur Treffer, die alle Suchbegriffe enthalten.
                if (!terms.every(t => entry.k.includes(t))) return null;
                const title = entry.t.toLowerCase();
                let score = 0;
                terms.forEach(t => {
                    if (title.includes(t)) score += 10;
                    score += entry.k.split(t).length - 1;
                });
                return { entry, score };
            })
            .filter(Boolean)
            .sort((a, b) => b.score - a.score)
            .map(hit => hit.entry);
    };

    const render = (query) => {
        results.textContent = '';

        if (query.trim().length < 2) {
            status.textContent = 'Mindestens zwei Zeichen eingeben.';
            return;
        }

        const hits = search(query);
        if (!hits.length) {
            status.textContent = `Keine Treffer für „${query}“.`;
            return;
        }

        status.textContent = hits.length === 1 ? '1 Treffer' : `${hits.length} Treffer`;

        const prefix = basePrefix();
        const fragment = document.createDocumentFragment();
        hits.forEach(entry => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            // href zusammensetzen statt innerHTML: Titel und Beschreibung
            // stammen zwar aus eigenen Seiten, aber textContent macht
            // Sonderzeichen ohnehin unschaedlich.
            a.href = prefix + entry.u;

            const title = document.createElement('span');
            title.className = 'search-result-title';
            title.textContent = shortTitle(entry.t);

            const text = document.createElement('span');
            text.className = 'search-result-text';
            text.textContent = entry.d;

            a.append(title, text);
            li.append(a);
            fragment.append(li);
        });
        results.append(fragment);
    };

    const open = () => {
        if (!overlay) return;
        lastFocused = document.activeElement;
        overlay.hidden = false;
        toggle.setAttribute('aria-expanded', 'true');
        input.focus();
        render(input.value);
    };

    const close = () => {
        if (!overlay || overlay.hidden) return;
        overlay.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
        if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
    };

    const init = () => {
        overlay = document.getElementById('search-overlay');
        toggle = document.getElementById('search-toggle');
        input = document.getElementById('search-input');
        results = document.getElementById('search-results');
        status = document.getElementById('search-status');
        const closeBtn = document.getElementById('search-close');

        if (!overlay || !toggle || !input || !results || !status) return;

        toggle.addEventListener('click', () => {
            if (overlay.hidden) {
                Navigation.closeMenu();
                open();
            } else {
                close();
            }
        });

        if (closeBtn) closeBtn.addEventListener('click', close);

        input.addEventListener('input', () => render(input.value));

        // Enter soll nicht die Seite neu laden, sondern den ersten Treffer oeffnen.
        input.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            const first = results.querySelector('a');
            if (first) first.click();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !overlay.hidden) close();
        });
    };

    return { init, close };
})();

// ============================================================================
// Terminvorschau auf der Startseite
// ============================================================================

const HomeEvents = (() => {
    const MAX = 3;

    const dayFormat = new Intl.DateTimeFormat('de-DE', { day: '2-digit' });
    const monthFormat = new Intl.DateTimeFormat('de-DE', { month: 'short' });

    const parse = (iso) => {
        // Ortszeit-Mitternacht statt UTC – sonst kippt das Datum in
        // westlichen Zeitzonen auf den Vortag.
        const d = new Date(`${iso}T00:00:00`);
        return Number.isNaN(d.getTime()) ? null : d;
    };

    const upcoming = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return (window.CDU_EVENTS || [])
            .map(ev => ({ ...ev, date: parse(ev.datum) }))
            .filter(ev => ev.date && ev.date >= today)
            .sort((a, b) => a.date - b.date)
            .slice(0, MAX);
    };

    const card = (ev) => {
        const article = document.createElement('article');
        article.className = 'home-event';

        const date = document.createElement('div');
        date.className = 'home-event-date';
        const day = document.createElement('span');
        day.className = 'home-event-day';
        day.textContent = dayFormat.format(ev.date);
        const month = document.createElement('span');
        month.className = 'home-event-month';
        month.textContent = monthFormat.format(ev.date).replace('.', '');
        date.append(day, month);

        const details = document.createElement('div');
        details.className = 'home-event-details';

        if (ev.kategorieLabel) {
            const badge = document.createElement('span');
            badge.className = 'home-event-badge';
            badge.textContent = ev.kategorieLabel;
            details.append(badge);
        }

        const title = document.createElement('h3');
        title.className = 'home-event-title';
        title.textContent = ev.titel;
        details.append(title);

        // Uhrzeit und Ort nur zeigen, wenn gepflegt – nicht jeder Termin hat beides.
        const meta = [ev.zeit, ev.ort].filter(Boolean).join(' · ');
        if (meta) {
            const p = document.createElement('p');
            p.className = 'home-event-meta';
            p.textContent = meta;
            details.append(p);
        }

        article.append(date, details);
        return article;
    };

    const init = () => {
        const container = document.getElementById('home-events');
        if (!container) return;

        const events = upcoming();
        container.textContent = '';

        if (!events.length) {
            const p = document.createElement('p');
            p.className = 'home-events-empty';
            p.textContent = 'Zurzeit sind keine Termine angekündigt.';
            container.append(p);
            return;
        }

        const fragment = document.createDocumentFragment();
        events.forEach(ev => fragment.append(card(ev)));
        container.append(fragment);
    };

    return { init };
})();

// ============================================================================
// Initialize All Modules on DOM Ready
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    ConsentManager.init();
    Navigation.init();
    SearchManager.init();
    HomeEvents.init();
    ImageSlider.init();
    VideoManager.init();
});

// ============================================================================
// Utility: Smooth Scroll for Anchor Links (for older browsers)
// ============================================================================

document.addEventListener('click', (e) => {
    if (e.target.tagName === 'A' && e.target.getAttribute('href').startsWith('#')) {
        const targetId = e.target.getAttribute('href').substring(1);
        const target = document.getElementById(targetId);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Focus the target for keyboard users
            target.tabIndex = -1;
            target.focus();
        }
    }
});
