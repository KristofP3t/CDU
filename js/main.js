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
    let overlay = null;

    const createOverlay = () => {
        if (overlay) return overlay;
        overlay = document.createElement('div');
        overlay.className = 'nav-overlay';
        overlay.addEventListener('click', closeMenu);
        document.body.appendChild(overlay);
        return overlay;
    };

    const removeOverlay = () => {
        if (overlay) {
            overlay.remove();
            overlay = null;
        }
    };

    const closeMenu = () => {
        const menuToggle = document.getElementById('menu-toggle');
        const navMenu = document.getElementById('nav-menu');
        menuToggle.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('show');
        removeOverlay();
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
            navMenu.classList.toggle('show');

            if (!isExpanded) {
                // Show overlay when menu opens
                createOverlay();
                // Focus first menu item when opening
                const firstItem = navMenu.querySelector('a');
                if (firstItem) firstItem.focus();
            } else {
                // Remove overlay when menu closes
                removeOverlay();
            }
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu.classList.contains('show')) {
                closeMenu();
                menuToggle.focus();
            }
        });

        // Handle dropdown menus
        const dropdownItems = navMenu.querySelectorAll('.has-submenu > .nav-link');
        dropdownItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // Only handle if on mobile
                if (window.innerWidth <= 1024) {
                    e.preventDefault();
                    const parent = item.closest('.has-submenu');
                    const submenu = parent.querySelector('.submenu');
                    const isExpanded = item.getAttribute('aria-expanded') === 'true';

                    item.setAttribute('aria-expanded', !isExpanded);
                    submenu.classList.toggle('show');
                }
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

    return { init };
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
// Initialize All Modules on DOM Ready
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    ConsentManager.init();
    Navigation.init();
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
