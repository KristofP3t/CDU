/**
 * CDU Schwerin Website – JavaScript Functionality
 * Accessible, Performant, Vanilla JS
 */

// ============================================================================
// Gemeinsame Helfer
// ============================================================================

// Wie viele Ebenen liegen zwischen der aktuellen Seite und dem Wurzelverzeichnis?
// Der Pfad des Stylesheets verraet es zuverlaessiger als location.pathname,
// weil die Seite auf GitHub Pages unter /CDU/ liegt, lokal aber direkt im
// Wurzelverzeichnis geoeffnet wird.
const sitePrefix = () => {
    const link = document.querySelector('link[rel="stylesheet"][href*="css/styles.css"]');
    return link ? link.getAttribute('href').replace(/css\/styles\.css$/, '') : '';
};

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
// Fokusfalle fuer die Vollbild-Overlays
// ============================================================================

const FocusTrap = (() => {
    const FOCUSABLE = [
        'a[href]', 'button:not([disabled])', 'input:not([disabled])',
        'select:not([disabled])', 'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    let container = null;
    let inerted = [];

    const reachable = () => Array.from(container.querySelectorAll(FOCUSABLE))
        // offsetParent faellt bei visibility:hidden und display:none weg –
        // ausgeklappte Untermenues sollen dagegen erreichbar bleiben.
        .filter(el => el.offsetWidth > 0 || el.offsetHeight > 0);

    const onKeydown = (e) => {
        if (e.key !== 'Tab' || !container) return;
        const items = reachable();
        if (!items.length) return;

        const first = items[0];
        const last = items[items.length - 1];

        if (!container.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    };

    const activate = (el) => {
        if (!el) return;
        release();
        container = el;

        // Von el aufwaerts auf jeder Ebene die Geschwister stilllegen. inert
        // entzieht sie Fokus, Maus und Screenreader zugleich – genau das, was
        // aria-modal verspricht. Browser ohne inert ignorieren die Zuweisung,
        // dort greift weiterhin die Tab-Umlenkung unten.
        let node = el;
        while (node && node.parentElement && node !== document.body) {
            Array.from(node.parentElement.children).forEach(sibling => {
                if (sibling !== node && !sibling.inert) {
                    sibling.inert = true;
                    inerted.push(sibling);
                }
            });
            node = node.parentElement;
        }

        document.addEventListener('keydown', onKeydown, true);
    };

    const release = () => {
        if (!container) return;
        inerted.forEach(el => { el.inert = false; });
        inerted = [];
        container = null;
        document.removeEventListener('keydown', onKeydown, true);
    };

    return { activate, release };
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
        FocusTrap.release();
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
                // Der Schliessen-Button liegt ausserhalb von #nav-menu, aber
                // innerhalb von #main-nav – deshalb faengt die Falle dort.
                FocusTrap.activate(mainNav);
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
    let dots = [];
    let autoplayEnabled = true;
    let autoplayInterval = null;

    // Die Punkte entstehen aus der Zahl der Bilder, damit Markup und Slider
    // nicht auseinanderlaufen, wenn jemand ein Bild ergaenzt oder entfernt.
    const buildDots = (container) => {
        if (!container) return [];

        const fragment = document.createDocumentFragment();
        const buttons = slides.map((slide, index) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'slider-dot';
            dot.setAttribute('aria-label', `Bild ${index + 1} von ${slides.length} anzeigen`);
            dot.addEventListener('click', () => {
                stopAutoplay();
                showSlide(index);
                if (autoplayEnabled) startAutoplay();
            });
            fragment.append(dot);
            return dot;
        });

        container.append(fragment);
        return buttons;
    };

    const init = () => {
        const sliderWrapper = document.querySelector('.slider-wrapper');
        const prevBtn = document.querySelector('.slider-btn.prev');
        const nextBtn = document.querySelector('.slider-btn.next');

        if (!sliderWrapper) return;

        slides = Array.from(sliderWrapper.querySelectorAll('img'));
        if (slides.length === 0) return;

        dots = buildDots(document.getElementById('slider-dots'));

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
        // aria-current statt aria-selected: die Punkte sind Schaltflaechen,
        // keine Tabs – es gibt keine zugehoerigen Tabpanels.
        dots.forEach((dot, i) => {
            if (i === index) {
                dot.setAttribute('aria-current', 'true');
            } else {
                dot.removeAttribute('aria-current');
            }
        });
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
// Meldungen: Punkte und Pfeile zur Bildkachel-Reihe
// Das Wischen selbst macht scroll-snap im CSS. Hier kommt die Bedienung
// dazu: Punkte fuer die Position und Pfeile zum Blaettern. Geblaettert wird
// seitenweise, nicht kachelweise – wie in der Vorlage auf tk.de, wo vier
// Meldungen bei drei sichtbaren Kacheln zwei Punkte ergeben.
// ============================================================================

const NewsCarousel = (() => {
    let track = null;
    let dotBox = null;
    let cards = [];
    let dots = [];
    let prevBtn = null;
    let nextBtn = null;
    let proSeite = 1;
    let aktiv = -1;

    const PFEIL_LINKS = 'M15 5l-7 7 7 7';
    const PFEIL_RECHTS = 'M9 5l7 7-7 7';

    // Wie viele Kacheln nebeneinander in den sichtbaren Ausschnitt passen.
    // Haengt an der Fensterbreite, deshalb bei jeder Groessenaenderung neu.
    const kachelnProSeite = () => {
        if (cards.length < 2) return 1;
        const schritt = cards[1].offsetLeft - cards[0].offsetLeft;
        if (schritt <= 0) return 1;
        return Math.max(1, Math.round(track.clientWidth / schritt));
    };

    const seitenZahl = () => Math.ceil(cards.length / proSeite);

    // Die Kachel, deren linke Kante der linken Kante des sichtbaren
    // Ausschnitts am naechsten liegt – das ist die, auf die scroll-snap
    // einrastet.
    const sichtbareKachel = () => {
        let treffer = 0;
        let kleinsterAbstand = Infinity;
        cards.forEach((card, i) => {
            const abstand = Math.abs(card.offsetLeft - track.scrollLeft);
            if (abstand < kleinsterAbstand) {
                kleinsterAbstand = abstand;
                treffer = i;
            }
        });
        return treffer;
    };

    const zeigeSeite = (seite) => {
        const ziel = cards[Math.min(seite * proSeite, cards.length - 1)];
        if (ziel) track.scrollTo({ left: ziel.offsetLeft });
    };

    const markiere = () => {
        const seite = Math.min(Math.floor(sichtbareKachel() / proSeite), seitenZahl() - 1);
        if (seite === aktiv) return;
        aktiv = seite;

        dots.forEach((dot, i) => {
            if (i === seite) {
                dot.setAttribute('aria-current', 'true');
            } else {
                dot.removeAttribute('aria-current');
            }
        });

        if (prevBtn) prevBtn.disabled = seite === 0;
        if (nextBtn) nextBtn.disabled = seite >= seitenZahl() - 1;
    };

    const bauePunkte = () => {
        dotBox.textContent = '';
        aktiv = -1;

        const anzahl = seitenZahl();
        // Bei nur einer Seite gibt es nichts zu blaettern.
        if (anzahl < 2) {
            dots = [];
            markiere();
            return;
        }

        const fragment = document.createDocumentFragment();
        dots = Array.from({ length: anzahl }, (_, i) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'news-dot';
            dot.setAttribute('aria-label', `Meldungen, Seite ${i + 1} von ${anzahl}`);
            dot.addEventListener('click', () => zeigeSeite(i));
            fragment.append(dot);
            return dot;
        });
        dotBox.append(fragment);
        markiere();
    };

    const baueseitePfeil = (richtung, beschriftung, pfad) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'news-arrow';
        btn.setAttribute('aria-label', beschriftung);
        btn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${pfad}"/></svg>`;
        btn.addEventListener('click', () => {
            zeigeSeite(Math.max(0, Math.min(aktiv + richtung, seitenZahl() - 1)));
        });
        return btn;
    };

    const init = () => {
        track = document.getElementById('news-track');
        dotBox = document.getElementById('news-dots');
        const arrowBox = document.getElementById('news-arrows');
        if (!track || !dotBox) return;

        cards = Array.from(track.querySelectorAll('.news-card'));
        if (cards.length < 2) return;

        if (arrowBox) {
            prevBtn = baueseitePfeil(-1, 'Vorherige Meldungen', PFEIL_LINKS);
            nextBtn = baueseitePfeil(1, 'Weitere Meldungen', PFEIL_RECHTS);
            arrowBox.append(prevBtn, nextBtn);
        }

        proSeite = kachelnProSeite();
        bauePunkte();

        track.addEventListener('scroll', markiere, { passive: true });

        // Bei einer anderen Fensterbreite passen andere viele Kacheln
        // nebeneinander – dann stimmt auch die Zahl der Punkte nicht mehr.
        window.addEventListener('resize', () => {
            const neu = kachelnProSeite();
            if (neu !== proSeite) {
                proSeite = neu;
                bauePunkte();
            } else {
                markiere();
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

        const prefix = sitePrefix();
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
        FocusTrap.activate(overlay);
        input.focus();
        render(input.value);
    };

    const close = () => {
        if (!overlay || overlay.hidden) return;
        overlay.hidden = true;
        FocusTrap.release();
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
        // Die ganze Flaeche ist der Link – so trifft man sie auch mit dem
        // Daumen sicher, und das Hover-Bild entspricht der Funktion.
        const link = document.createElement('a');
        link.className = 'home-event';
        link.href = `${sitePrefix()}termine/#${ev.anker}`;

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
            badge.className = `home-event-badge ${ev.kategorie}`;
            badge.textContent = ev.kategorieLabel;
            details.append(badge);
        }

        // Ueberschrift statt span: Der Termin bleibt so in der
        // Dokumentgliederung auffindbar. <a> hat ein transparentes
        // Inhaltsmodell, Block-Elemente sind darin zulaessig.
        const title = document.createElement('h3');
        title.className = 'home-event-title';
        title.textContent = ev.titel;
        details.append(title);

        // Uhrzeit, Ort und Veranstalter nur zeigen, wenn gepflegt –
        // nicht jeder Termin hat alle drei Angaben.
        [[ev.zeit, ev.ort].filter(Boolean).join(' · '), ev.veranstalter]
            .filter(Boolean)
            .forEach(text => {
                const line = document.createElement('p');
                line.className = 'home-event-meta';
                line.textContent = text;
                details.append(line);
            });

        // Richtungsanzeige: macht sichtbar, dass die Zeile irgendwohin fuehrt.
        const arrow = document.createElement('span');
        arrow.className = 'home-event-arrow';
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = '→';

        link.append(date, details, arrow);
        return link;
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
// Meldungen der Startseite (aus js/news-data.js)
// ============================================================================

const HomeNews = (() => {
    // Baut die Kacheln, bevor NewsCarousel sie einsammelt. Die Meldungen
    // stehen deshalb nur einmal im Projekt – in inhalte/meldungen/ – und
    // nicht zusaetzlich im Text der Startseite.
    const kachel = (m) => {
        const item = document.createElement('li');
        item.className = 'news-card';

        const link = document.createElement('a');
        link.className = 'news-link';
        link.href = `${sitePrefix()}newsarchiv/${m.slug}/`;

        if (m.bild) {
            const img = document.createElement('img');
            img.className = 'news-image';
            img.src = `${sitePrefix()}assets/images/meldungen/${m.bild}`;
            // Leer, wenn kein Alternativtext gepflegt ist: die Schlagzeile
            // steht daneben, ein erfundener Text waere schlechter als keiner.
            img.alt = m.bildAlt || '';
            img.width = 272;
            img.height = 182;
            img.loading = 'lazy';
            link.append(img);
        }

        const caption = document.createElement('div');
        caption.className = 'news-caption';

        const kicker = document.createElement('span');
        kicker.className = 'news-kicker';
        kicker.textContent = m.kategorie;

        const title = document.createElement('h3');
        title.className = 'news-title';
        title.textContent = m.titel;

        caption.append(kicker, title);
        link.append(caption);
        item.append(link);
        return item;
    };

    const init = () => {
        const track = document.getElementById('news-track');
        if (!track) return;

        const meldungen = window.CDU_NEWS || [];
        if (!meldungen.length) {
            // Ohne Meldungen bleibt der ganze Abschnitt weg statt leer
            // stehen zu bleiben.
            track.closest('.news-section')?.remove();
            return;
        }

        const fragment = document.createDocumentFragment();
        meldungen.forEach(m => fragment.append(kachel(m)));
        track.append(fragment);
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
    // Erst die Kacheln bauen, dann das Karussell darueber legen.
    HomeNews.init();
    NewsCarousel.init();
    ImageSlider.init();
    // Kein VideoManager mehr: das Werbevideo startete per JS automatisch und
    // zog dabei rund 84 MB, ohne dass jemand auf Abspielen geklickt hatte.
    // Es laeuft jetzt mit Standbild, preload="none" und den Bedienelementen
    // des Browsers – damit ist auch prefers-reduced-motion gegenstandslos.
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
