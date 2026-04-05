/* ============================================
   AK Studio — Matrix Theme JS
   ============================================ */

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

/* ---- Matrix Floating Characters ---- */
function initMatrixRain() {
    const canvas = document.getElementById('matrixCanvas');
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:<>?';
    const greens = ['#00ff41', '#00cc33', '#00ff66', '#33ff77'];
    const blues = ['#00bfff', '#1e90ff', '#4dc9f6', '#00e5ff'];
    const allColors = [...greens, ...greens, ...greens, ...blues];

    const particles = [];
    const PARTICLE_COUNT = 250;

    function createParticle(startFromTop) {
        const size = 14 + Math.random() * 26; // 14–40px
        // Wide speed range: some crawl, some move noticeably
        const speed = 0.1 + Math.random() * Math.random() * 1.8; // 0.1–1.9, biased slow
        return {
            x: Math.random() * canvas.width,
            y: startFromTop ? -(Math.random() * canvas.height * 0.3) : Math.random() * canvas.height,
            size: size,
            char: chars[Math.floor(Math.random() * chars.length)],
            color: allColors[Math.floor(Math.random() * allColors.length)],
            baseOpacity: 0.08 + Math.random() * 0.18, // dim baseline: 0.08–0.26
            speed: speed,
            drift: (Math.random() - 0.5) * 0.15,
            phase: Math.random() * Math.PI * 2,
            life: 0,
            // Flash: short bright pulse then fade back
            flashTimer: Math.floor(Math.random() * 300),
            flashInterval: 120 + Math.floor(Math.random() * 350), // how often to flash
            flashBrightness: 0, // current flash intensity (0–1)
        };
    }

    // Fill the entire screen with particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(createParticle(false));
    }

    function draw() {
        // Full clear each frame — no trails
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            // Drift down + slight sway
            p.y += p.speed;
            p.x += Math.sin(p.phase + p.life * 0.008) * p.drift;
            p.life++;

            // Flash logic — brief bright pulse
            p.flashTimer++;
            if (p.flashTimer >= p.flashInterval) {
                p.flashBrightness = 1.0; // trigger flash
                p.flashTimer = 0;
                p.flashInterval = 120 + Math.floor(Math.random() * 350);
                p.char = chars[Math.floor(Math.random() * chars.length)]; // new char on flash
            }

            // Decay flash quickly (over ~8 frames)
            if (p.flashBrightness > 0) {
                p.flashBrightness *= 0.75;
                if (p.flashBrightness < 0.02) p.flashBrightness = 0;
            }

            // Final opacity: dim base + flash boost
            const opacity = p.baseOpacity + p.flashBrightness * (0.6 + Math.random() * 0.3);

            // Recycle when off screen
            if (p.y > canvas.height + p.size) {
                Object.assign(p, createParticle(true));
                continue;
            }

            // Draw
            ctx.globalAlpha = Math.min(1, opacity);
            ctx.fillStyle = p.color;
            ctx.font = `${p.size}px JetBrains Mono, monospace`;
            ctx.fillText(p.char, p.x, p.y);
        }

        ctx.globalAlpha = 1;
        requestAnimationFrame(draw);
    }
    draw();
}

/* ---- Text Scramble Class ---- */
class TextScramble {
    constructor(el) {
        this.el = el;
        this.chars = '!<>-_\\/[]{}—=+*^?#01';
        this.queue = [];
        this.frame = 0;
        this.frameRequest = 0;
        this.resolve = () => {};
        this.update = this.update.bind(this);
    }

    setText(newText) {
        const oldText = this.el.innerText;
        const length = Math.max(oldText.length, newText.length);
        const promise = new Promise((resolve) => this.resolve = resolve);
        this.queue = [];

        for (let i = 0; i < length; i++) {
            const from = oldText[i] || '';
            const to = newText[i] || '';
            const start = Math.floor(Math.random() * 40);
            const end = start + Math.floor(Math.random() * 40);
            this.queue.push({ from, to, start, end });
        }

        cancelAnimationFrame(this.frameRequest);
        this.frame = 0;
        this.update();
        return promise;
    }

    update() {
        let output = '';
        let complete = 0;

        for (let i = 0; i < this.queue.length; i++) {
            let { from, to, start, end, char } = this.queue[i];
            if (this.frame >= end) {
                complete++;
                output += to;
            } else if (this.frame >= start) {
                if (!char || Math.random() < 0.28) {
                    char = this.chars[Math.floor(Math.random() * this.chars.length)];
                    this.queue[i].char = char;
                }
                output += '<span class="dud">' + char + '</span>';
            } else {
                output += from;
            }
        }

        this.el.innerHTML = output;
        if (complete === this.queue.length) {
            this.resolve();
        } else {
            this.frameRequest = requestAnimationFrame(this.update);
            this.frame++;
        }
    }
}

/* ---- Hero Scramble Title ---- */
function initHeroScramble() {
    const el = document.getElementById('heroScramble');
    if (!el) return;

    const scrambler = new TextScramble(el);

    // Default EN phrases; lang.js may override via window.heroScramblePhrases
    window.heroScramblePhrases = [
        'Websites that move people.',
        'Clean code. Sharp design.',
        'Built different.',
        'AK Studio.'
    ];

    // If LT was saved, use LT phrases immediately
    if (localStorage.getItem('ak-lang') === 'lt' && typeof translations !== 'undefined') {
        window.heroScramblePhrases = translations.lt['hero.phrases'];
    }

    let counter = 0;
    function next() {
        scrambler.setText(window.heroScramblePhrases[counter]).then(() => {
            setTimeout(next, 2500);
        });
        counter = (counter + 1) % window.heroScramblePhrases.length;
    }

    // Start after hero entrance animation
    setTimeout(next, 800);
}

/* ---- Hero Entrance ---- */
function initHero() {
    const tl = gsap.timeline({ delay: 0.3 });

    tl.to('.hero-tag', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out'
    })
    .to('.hero-sub', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out'
    }, '-=0.3')
    .to('.hero-actions', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out'
    }, '-=0.4');
}

/* ---- Mobile Nav ---- */
function initMobileNav() {
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navLinks.classList.toggle('open');
    });

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navLinks.classList.remove('open');
        });
    });
}

/* ---- Nav Scroll State ---- */
function initNavScroll() {
    window.addEventListener('scroll', () => {
        document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 80);
    });
}

/* ---- Spotlight Glow Cards ---- */
function initGlowCards() {
    const cards = document.querySelectorAll('.glow-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            card.style.setProperty('--glow-x', x + '%');
            card.style.setProperty('--glow-y', y + '%');
        });
    });
}

/* ---- Scroll Reveals ---- */
function initScrollReveals() {
    const revealEls = document.querySelectorAll(
        '.section-label, .section-title:not(.scramble-on-scroll), .section-sub, .about-text p, .contact-text p, .contact-links'
    );

    revealEls.forEach((el) => {
        gsap.from(el, {
            scrollTrigger: {
                trigger: el,
                start: 'top 88%',
                toggleActions: 'play none none none'
            },
            opacity: 0,
            y: 40,
            duration: 0.8,
            ease: 'power3.out'
        });
    });

    // Work cards
    document.querySelectorAll('.work-grid .glow-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 90%',
                toggleActions: 'play none none none'
            },
            opacity: 0,
            y: 60,
            duration: 0.8,
            delay: i * 0.1,
            ease: 'power3.out'
        });
    });

    // Service cards
    document.querySelectorAll('.service-glow').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 90%',
                toggleActions: 'play none none none'
            },
            opacity: 0,
            y: 50,
            scale: 0.95,
            duration: 0.8,
            delay: i * 0.12,
            ease: 'power3.out'
        });
    });

    // Pricing cards
    document.querySelectorAll('.pricing-glow').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 90%',
                toggleActions: 'play none none none'
            },
            opacity: 0,
            y: 50,
            duration: 0.8,
            delay: i * 0.12,
            ease: 'power3.out'
        });
    });

    // Contact form
    gsap.from('.contact-form', {
        scrollTrigger: {
            trigger: '.contact-form',
            start: 'top 88%',
            toggleActions: 'play none none none'
        },
        opacity: 0,
        x: 40,
        duration: 0.8,
        ease: 'power3.out'
    });
}

/* ---- Scramble on Scroll ---- */
function initScrambleOnScroll() {
    const scrambleEls = document.querySelectorAll('.scramble-on-scroll');

    scrambleEls.forEach(el => {
        const originalText = el.textContent;
        const scrambler = new TextScramble(el);

        ScrollTrigger.create({
            trigger: el,
            start: 'top 85%',
            once: true,
            onEnter: () => {
                scrambler.setText(originalText);
            }
        });
    });
}

/* ---- Stat Counter Animation ---- */
function initCounters() {
    document.querySelectorAll('.stat-number[data-count]').forEach((stat) => {
        const target = parseInt(stat.dataset.count, 10);

        ScrollTrigger.create({
            trigger: stat,
            start: 'top 85%',
            once: true,
            onEnter: () => {
                gsap.to(stat, {
                    innerText: target,
                    duration: 1.5,
                    ease: 'power2.out',
                    snap: { innerText: 1 },
                    onUpdate: function () {
                        stat.textContent = Math.round(parseFloat(stat.textContent));
                    }
                });
            }
        });
    });
}

/* ---- Pinned Process Section ---- */
function initPinnedProcess() {
    const steps = document.querySelectorAll('.process-step');
    const progressFill = document.getElementById('processProgressFill');
    if (!steps.length) return;

    // Activate steps based on scroll
    steps.forEach((step, i) => {
        ScrollTrigger.create({
            trigger: step,
            start: 'top 70%',
            end: 'bottom 30%',
            onEnter: () => {
                step.classList.add('active');
                if (progressFill) {
                    progressFill.style.width = ((i + 1) / steps.length * 100) + '%';
                }
            },
            onLeaveBack: () => {
                step.classList.remove('active');
                if (progressFill) {
                    progressFill.style.width = (i / steps.length * 100) + '%';
                }
            }
        });
    });
}

/* ---- Stagger Hover (Nav Links) ---- */
function initStaggerHover() {
    document.querySelectorAll('.stagger-hover').forEach(link => {
        const text = link.textContent;

        link.addEventListener('mouseenter', () => {
            // Wrap each char in a span if not already
            if (!link.querySelector('.char-span')) {
                link.innerHTML = text.split('').map((char, i) =>
                    `<span class="char-span" style="display:inline-block;transition:transform 0.3s cubic-bezier(0.22,1,0.36,1) ${i * 0.03}s, color 0.3s ease ${i * 0.03}s;">${char}</span>`
                ).join('');
            }

            link.querySelectorAll('.char-span').forEach(span => {
                span.style.transform = 'translateY(-2px)';
                span.style.color = 'var(--accent)';
            });

            // Uppercase stays permanently after hover
            link.style.textTransform = 'uppercase';
        });

        link.addEventListener('mouseleave', () => {
            link.querySelectorAll('.char-span').forEach(span => {
                span.style.transform = 'translateY(0)';
                span.style.color = '';
            });
            // text-transform stays uppercase — don't reset it
        });
    });
}

/* ---- Smooth Scroll Anchors ---- */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                gsap.to(window, {
                    duration: 1,
                    scrollTo: { y: target, offsetY: 80 },
                    ease: 'power3.inOut'
                });
            }
        });
    });
}

/* ---- Contact Form Handler ---- */
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = form.querySelector('.btn');
        const originalText = btn.textContent;

        btn.textContent = '> Sent!';
        btn.style.background = 'var(--accent)';
        btn.style.color = 'var(--bg)';
        btn.style.boxShadow = '0 0 30px var(--accent-glow)';

        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
            btn.style.color = '';
            btn.style.boxShadow = '';
            form.reset();
        }, 2000);
    });
}

/* ---- Matrix Button Rain ---- */
function initMatrixButtons() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*';

    document.querySelectorAll('.btn').forEach(btn => {
        // Wrap existing text in a span for z-index layering
        if (!btn.querySelector('.btn-text')) {
            btn.innerHTML = `<span class="btn-text">${btn.innerHTML}</span>`;
        }

        // Create mini canvas for rain
        const rain = document.createElement('canvas');
        rain.classList.add('btn-rain');
        btn.insertBefore(rain, btn.firstChild);

        const ctx = rain.getContext('2d');
        let animId = null;

        function startRain() {
            const rect = btn.getBoundingClientRect();
            rain.width = rect.width;
            rain.height = rect.height;

            const isGhost = btn.classList.contains('btn-ghost');
            const headColor = isGhost ? [10, 10, 10] : [0, 255, 65];
            const clearColor = isGhost ? 'rgba(0, 255, 65, 0.25)' : 'rgba(10, 10, 10, 0.25)';

            const fontSize = 10;
            const colCount = Math.floor(rain.width / fontSize);
            const drops = Array.from({length: colCount}, () => Math.random() * -10);

            function draw() {
                ctx.fillStyle = clearColor;
                ctx.fillRect(0, 0, rain.width, rain.height);

                ctx.font = `${fontSize}px JetBrains Mono, monospace`;

                for (let i = 0; i < drops.length; i++) {
                    if (drops[i] < 0) {
                        drops[i] += 0.5;
                        continue;
                    }

                    const char = chars[Math.floor(Math.random() * chars.length)];

                    ctx.fillStyle = `rgba(${headColor.join(',')}, ${0.6 + Math.random() * 0.4})`;
                    ctx.fillText(char, i * fontSize, drops[i] * fontSize);

                    if (drops[i] > 1) {
                        const trailChar = chars[Math.floor(Math.random() * chars.length)];
                        ctx.fillStyle = `rgba(${headColor.join(',')}, 0.15)`;
                        ctx.fillText(trailChar, i * fontSize, (drops[i] - 1) * fontSize);
                    }

                    if (drops[i] * fontSize > rain.height && Math.random() > 0.9) {
                        drops[i] = Math.random() * -5;
                    }
                    drops[i] += 0.4 + Math.random() * 0.3;
                }

                animId = requestAnimationFrame(draw);
            }
            draw();
        }

        function stopRain() {
            if (animId) {
                cancelAnimationFrame(animId);
                animId = null;
            }
            ctx.clearRect(0, 0, rain.width, rain.height);
        }

        btn.addEventListener('mouseenter', startRain);
        btn.addEventListener('mouseleave', stopRain);
    });
}

/* ---- Page Transition (Matrix Rain Curtain) ---- */
function initPageTransitions() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*';
    const fontSize = 14;

    function createRainCanvas(parent) {
        const canvas = document.createElement('canvas');
        canvas.className = 'transition-canvas';
        parent.appendChild(canvas);
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        return { canvas, ctx: canvas.getContext('2d') };
    }

    function startRainLoop(ctx, canvas) {
        const columns = Math.floor(canvas.width / fontSize);
        const drops = Array.from({length: columns}, () => Math.random() * (canvas.height / fontSize));
        let frame = 0;

        function draw() {
            const alpha = Math.min(0.3, 0.06 + frame * 0.012);
            ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.font = `${fontSize}px JetBrains Mono, monospace`;

            for (let i = 0; i < drops.length; i++) {
                const char = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillStyle = `rgba(0, 255, 65, ${0.7 + Math.random() * 0.3})`;
                ctx.fillText(char, i * fontSize, drops[i] * fontSize);

                if (drops[i] * fontSize > canvas.height) {
                    drops[i] = Math.random() * -3;
                }
                drops[i] += 1.2 + Math.random() * 1.5;
            }
            frame++;
        }

        return setInterval(draw, 30);
    }

    // --- Click: rain covers screen, then navigate ---
    document.querySelectorAll('a[href="contact.html"], a[href="index.html"]').forEach(link => {
        link.addEventListener('click', (e) => {
            if (document.querySelector('.page-transition')) return;
            e.preventDefault();
            const href = link.href;

            sessionStorage.setItem('ak-transition', '1');

            const overlay = document.createElement('div');
            overlay.className = 'page-transition';
            document.body.appendChild(overlay);

            const { canvas, ctx } = createRainCanvas(overlay);
            const animId = startRainLoop(ctx, canvas);

            setTimeout(() => {
                clearInterval(animId);
                window.location.href = href;
            }, 600);
        });
    });

    // --- Entrance: same rain running, then fades out ---
    function playEntrance() {
        if (sessionStorage.getItem('ak-transition') !== '1') return;
        sessionStorage.removeItem('ak-transition');

        // Remove any stuck overlays first
        document.querySelectorAll('.page-transition').forEach(el => el.remove());

        const overlay = document.createElement('div');
        overlay.className = 'page-transition';
        document.body.prepend(overlay);

        const { canvas, ctx } = createRainCanvas(overlay);
        const animId = startRainLoop(ctx, canvas);

        setTimeout(() => {
            clearInterval(animId);
            overlay.classList.add('exit');
            setTimeout(() => overlay.remove(), 900);
        }, 400);
    }

    playEntrance();

    // Handle browser back/forward — clean up any stuck overlays
    window.addEventListener('pageshow', (e) => {
        if (e.persisted) {
            // Page was loaded from bfcache (back button)
            sessionStorage.removeItem('ak-transition');
            document.querySelectorAll('.page-transition').forEach(el => el.remove());
        }
    });
}

/* ---- Init Everything ---- */
document.addEventListener('DOMContentLoaded', () => {
    initMatrixRain();
    initHero();
    initHeroScramble();
    initMobileNav();
    initNavScroll();
    initGlowCards();
    initScrollReveals();
    initScrambleOnScroll();
    initCounters();
    initPinnedProcess();
    initStaggerHover();
    initSmoothScroll();
    initContactForm();
    initMatrixButtons();
    initPageTransitions();
});
