// ============================================================
// SCRIPT PRINCIPAL — PORTAFOLIO PERSONAL
// Animaciones e interacciones. Todo es progresivo: si algo falla,
// el contenido sigue visible gracias al CSS.
// ============================================================

(function () {
    'use strict';

    const root = document.documentElement;
    const body = document.body;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const lerp = (a, b, t) => a + (b - a) * t;
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => [...c.querySelectorAll(s)];


    // ── 1. Capas de fondo (aurora + cuadrícula + red de partículas) ─────

    const fx = document.createElement('div');
    fx.className = 'bg-fx';
    fx.setAttribute('aria-hidden', 'true');
    fx.innerHTML = '<div class="aurora"><i></i><i></i><i></i></div><div class="bg-grid"></div>' +
                   '<canvas></canvas><div class="cursor-glow"></div>';
    body.prepend(fx);

    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    body.prepend(progressBar);

    const aurora = $('.aurora', fx);
    const cursorGlow = $('.cursor-glow', fx);


    // ── 2. Red de partículas con "corriente eléctrica" ──────────────────

    const net = (function () {
        const canvas = $('canvas', fx);
        const ctx = canvas.getContext('2d');
        let w = 0, h = 0, dpr = 1, pts = [], pulses = [], colors = {};
        const mouse = { x: -9999, y: -9999 };
        let last = 0, running = true, lastPulse = 0;

        function readColors() {
            const cs = getComputedStyle(body);
            colors = {
                a: cs.getPropertyValue('--accent').trim() || '#22d3ee',
                b: cs.getPropertyValue('--accent2').trim() || '#8b5cf6',
                s: cs.getPropertyValue('--accent3').trim() || '#fbbf24',
                k: body.classList.contains('light-mode') ? 0.5 : 0.38
            };
        }

        function resize() {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = window.innerWidth; h = window.innerHeight;
            canvas.width = w * dpr; canvas.height = h * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const n = Math.min(w < 700 ? 38 : 96, Math.floor((w * h) / 17000));
            pts = Array.from({ length: n }, () => ({
                x: Math.random() * w, y: Math.random() * h,
                vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
                r: Math.random() * 1.4 + .9
            }));
            pulses = [];
        }

        function frame(t) {
            if (!running) return;
            const dt = Math.min(48, t - last) / 16.7; last = t;
            ctx.clearRect(0, 0, w, h);
            const LINK = w < 700 ? 110 : 150;

            for (const p of pts) {
                p.x += p.vx * dt; p.y += p.vy * dt;
                if (p.x < -20) p.x = w + 20; else if (p.x > w + 20) p.x = -20;
                if (p.y < -20) p.y = h + 20; else if (p.y > h + 20) p.y = -20;
                const dx = mouse.x - p.x, dy = mouse.y - p.y, d2 = dx * dx + dy * dy;
                if (d2 < 190 * 190 && d2 > 1) { const f = (1 - Math.sqrt(d2) / 190) * .02 * dt; p.vx += dx * f * .05; p.vy += dy * f * .05; }
                p.vx = clamp(p.vx, -.9, .9); p.vy = clamp(p.vy, -.9, .9);
            }

            ctx.lineWidth = 1;
            ctx.strokeStyle = colors.a;
            for (let i = 0; i < pts.length; i++) {
                const a = pts[i];
                for (let j = i + 1; j < pts.length; j++) {
                    const b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
                    if (d < LINK * LINK) {
                        ctx.globalAlpha = (1 - Math.sqrt(d) / LINK) * colors.k;
                        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
                    }
                }
                const mx = a.x - mouse.x, my = a.y - mouse.y, md = Math.sqrt(mx * mx + my * my);
                if (md < 200) {
                    ctx.globalAlpha = (1 - md / 200) * .75;
                    ctx.strokeStyle = colors.b;
                    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
                    ctx.strokeStyle = colors.a;
                }
            }

            ctx.fillStyle = colors.a;
            ctx.globalAlpha = .75;
            for (const p of pts) { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); }

            // Pulsos de energía viajando por las conexiones
            if (t - lastPulse > 260 && pts.length) {
                lastPulse = t;
                const a = pts[(Math.random() * pts.length) | 0];
                let best = null, bd = LINK * LINK;
                for (const b of pts) { if (b === a) continue; const dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy; if (d < bd && Math.random() < .5) { bd = d; best = b; } }
                if (best && pulses.length < 14) pulses.push({ a, b: best, t: 0 });
            }
            pulses = pulses.filter(p => (p.t += .028 * dt) < 1);
            for (const p of pulses) {
                const x = lerp(p.a.x, p.b.x, p.t), y = lerp(p.a.y, p.b.y, p.t);
                ctx.fillStyle = colors.s;
                ctx.globalAlpha = .22; ctx.beginPath(); ctx.arc(x, y, 7, 0, 6.283); ctx.fill();
                ctx.globalAlpha = 1;   ctx.beginPath(); ctx.arc(x, y, 2.2, 0, 6.283); ctx.fill();
            }
            ctx.globalAlpha = 1;
            requestAnimationFrame(frame);
        }

        function start() { if (!running) { running = true; requestAnimationFrame(frame); } }
        readColors(); resize();
        if (reduced) { running = true; frame(0); running = false; }
        else requestAnimationFrame(frame);

        let rt;
        window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 200); });
        window.addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
        document.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) running = false; else if (!reduced) start();
        });
        return { readColors };
    })();


    // ── 3. Tema oscuro/claro con transición circular ────────────────────

    const themeToggle = $('#themeToggle');
    const themeIcon = $('#themeIcon');

    function paintThemeIcon() {
        if (!themeIcon) return;
        const light = body.classList.contains('light-mode');
        themeIcon.classList.toggle('bi-moon-fill', light);
        themeIcon.classList.toggle('bi-sun-fill', !light);
    }

    function setTheme(light) {
        body.classList.toggle('light-mode', light);
        try { localStorage.setItem('theme', light ? 'light' : 'dark'); } catch (e) { /* sin storage */ }
        paintThemeIcon();
        net.readColors();
    }

    try { if (localStorage.getItem('theme') === 'light') body.classList.add('light-mode'); } catch (e) { /* sin storage */ }
    paintThemeIcon();
    net.readColors();

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const next = !body.classList.contains('light-mode');
            themeToggle.classList.remove('spin'); void themeToggle.offsetWidth; themeToggle.classList.add('spin');
            if (!document.startViewTransition || reduced) { setTheme(next); return; }
            const r = themeToggle.getBoundingClientRect();
            const x = r.left + r.width / 2, y = r.top + r.height / 2;
            const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
            root.classList.add('switching');
            const vt = document.startViewTransition(() => setTheme(next));
            vt.ready.then(() => {
                root.animate(
                    { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${R}px at ${x}px ${y}px)`] },
                    { duration: 900, easing: 'cubic-bezier(.77,0,.18,1)', pseudoElement: '::view-transition-new(root)' }
                );
            }).catch(() => {});
            vt.finished.finally(() => root.classList.remove('switching'));
        });
    }


    // ── 4. Preloader ────────────────────────────────────────────────────

    const pre = $('.preloader');
    if (pre) {
        const t0 = performance.now();
        const finish = () => {
            setTimeout(() => {
                pre.classList.add('done');
                setTimeout(() => pre.remove(), 1400);
            }, Math.max(0, 1250 - (performance.now() - t0)));
        };
        if (document.readyState === 'complete') finish(); else window.addEventListener('load', finish);
    }


    // ── 5. Texto del hero: letras, roles, scramble ──────────────────────

    const heroTitle = $('.hero-title');
    if (heroTitle) {
        heroTitle.setAttribute('aria-label', heroTitle.textContent.replace(/\s+/g, ' ').trim());
        const hl = heroTitle.querySelector(':scope > span');
        if (hl) hl.classList.add('hl');
        let ci = 0;
        (function split(node) {
            [...node.childNodes].forEach(n => {
                if (n.nodeType === 3) {
                    const word = document.createElement('span');
                    word.className = 'word'; word.setAttribute('aria-hidden', 'true');
                    [...n.textContent].forEach(c => {
                        const s = document.createElement('span');
                        s.className = 'char'; s.style.setProperty('--ci', ci++); s.textContent = c;
                        word.appendChild(s);
                    });
                    n.replaceWith(word);
                } else if (n.nodeType === 1 && n.tagName !== 'BR') split(n);
            });
        })(heroTitle);
    }

    // Máquina de escribir con los roles
    const roleEl = $('.role-text');
    if (roleEl && !reduced) {
        const roles = [
            'Técnico en Programación de Software',
            'En la meta final del SENA',
            'Pronto Ingeniero Eléctrico',
            'Desarrollador Python & Flask'
        ];
        let ri = 0, ci = roles[0].length, deleting = false;
        const tick = () => {
            const word = roles[ri];
            roleEl.textContent = word.slice(0, ci);
            let delay = deleting ? 28 : 62;
            if (!deleting && ci === word.length) { deleting = true; delay = 1900; }
            else if (deleting && ci === 0) { deleting = false; ri = (ri + 1) % roles.length; delay = 350; }
            else ci += deleting ? -1 : 1;
            setTimeout(tick, delay);
        };
        setTimeout(tick, pre ? 4200 : 3000);
    }

    // Efecto "decodificar" en las etiquetas
    function scramble(el) {
        if (reduced || el.dataset.scrambled) return;
        el.dataset.scrambled = '1';
        const final = el.textContent, chars = '01<>/\\_{}[]#$%&*';
        let f = 0; const total = 22;
        const id = setInterval(() => {
            el.textContent = [...final].map((c, i) =>
                c === ' ' ? ' ' : (i < (f / total) * final.length ? c : chars[(Math.random() * chars.length) | 0])).join('');
            if (++f > total) { clearInterval(id); el.textContent = final; }
        }, 34);
    }
    const heroLabel = $('.hero-label');
    if (heroLabel) setTimeout(() => scramble(heroLabel), pre ? 1900 : 700);


    // ── 6. Scroll reveal con variantes ──────────────────────────────────

    const variants = ['rv-up', 'rv-zoom', 'rv-flip'];
    $$('.reveal').forEach(el => {
        const sibs = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
        const i = Math.max(0, sibs.indexOf(el));
        let v;
        if (el.classList.contains('exp-item')) v = 'rv-flip';
        else if (el.classList.contains('text-center') || el.classList.contains('contact-inner')) v = 'rv-up';
        else if (el.closest('.contact-section')) v = 'rv-zoom';
        else if (sibs.length === 2) v = i === 0 ? 'rv-left' : 'rv-right';
        else v = variants[i % variants.length];
        el.classList.add(v);
        el.style.setProperty('--rd', ((i % 3) * 0.13).toFixed(2) + 's');
    });

    function countUp(el) {
        const target = parseFloat(el.dataset.count), suf = el.dataset.suffix || '';
        if (isNaN(target) || reduced) return;
        const t0 = performance.now(), dur = 1800;
        (function step(t) {
            const p = clamp((t - t0) / dur, 0, 1), e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
            el.textContent = Math.round(target * e) + suf;
            if (p < 1) requestAnimationFrame(step);
        })(t0);
    }

    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            el.classList.add('visible');
            $$('.section-label', el).forEach(scramble);
            $$('[data-count]', el).forEach(countUp);
            revealObserver.unobserve(el);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(el => revealObserver.observe(el));

    // Etiquetas fuera de .reveal (páginas de certificados)
    const labelObserver = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { scramble(e.target); labelObserver.unobserve(e.target); } });
    }, { threshold: 0.6 });
    $$('.section-label').forEach(l => { if (!l.closest('.reveal')) labelObserver.observe(l); });


    // ── 7. Scroll: progreso, navbar, nav activo, timeline, parallax ─────

    const navbar = $('.navbar');
    const sections = $$('section[id]');
    const navLinks = $$('.nav-link');
    const timeline = $('.exp-timeline');
    const heroContent = $('.hero-content');
    let ticking = false;

    function update() {
        ticking = false;
        const y = window.scrollY;
        const max = root.scrollHeight - innerHeight;
        progressBar.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
        if (navbar) navbar.classList.toggle('scrolled', y > 30);

        const sy = Math.min(y, 1200);
        if (heroContent) heroContent.style.setProperty('--sy', sy);
        if (aurora) aurora.style.setProperty('--sy', sy);

        if (timeline) {
            const r = timeline.getBoundingClientRect();
            timeline.style.setProperty('--tp', clamp((innerHeight * .62 - r.top) / r.height, 0, 1).toFixed(4));
        }

        let currentId = null;
        sections.forEach(s => { if (s.getBoundingClientRect().top <= innerHeight * 0.4) currentId = s.id; });
        navLinks.forEach(l => l.classList.toggle('active', !!currentId && l.getAttribute('href') === '#' + currentId));
    }
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();

    // Cierra el menú móvil al elegir una sección
    navLinks.forEach(l => l.addEventListener('click', () => {
        const c = $('#navbarNav');
        if (c && c.classList.contains('show') && window.bootstrap) bootstrap.Collapse.getOrCreateInstance(c).hide();
    }));


    // ── 8. Tilt 3D + foco de luz en cards ───────────────────────────────

    function bindCard(el) {
        const tilt = el.matches('.card-hover, .stat-card, .cert-image-wrapper') && finePointer && !reduced;
        el.addEventListener('pointermove', e => {
            if (e.pointerType === 'touch') return;
            const r = el.getBoundingClientRect();
            const x = e.clientX - r.left, y = e.clientY - r.top;
            el.style.setProperty('--mx', x + 'px');
            el.style.setProperty('--my', y + 'px');
            if (tilt) {
                const max = r.width > 560 ? 3.2 : 7;
                el.classList.add('tilting');
                el.style.setProperty('--rx', ((0.5 - y / r.height) * max * 2).toFixed(2) + 'deg');
                el.style.setProperty('--ry', ((x / r.width - 0.5) * max * 2).toFixed(2) + 'deg');
            }
        });
        el.addEventListener('pointerleave', () => {
            el.classList.remove('tilting');
            el.style.setProperty('--rx', '0deg');
            el.style.setProperty('--ry', '0deg');
        });
    }
    $$('.card, .stat-card, .cert-image-wrapper').forEach(bindCard);


    // ── 9. Botones: magnético + ripple ──────────────────────────────────

    if (finePointer && !reduced) {
        $$('.contact-btn, .btn-cv, .hero-section .btn-primary').forEach(b => {
            b.addEventListener('pointermove', e => {
                const r = b.getBoundingClientRect();
                b.style.setProperty('--bx', ((e.clientX - r.left - r.width / 2) * .28).toFixed(1) + 'px');
                b.style.setProperty('--by', ((e.clientY - r.top - r.height / 2) * .38).toFixed(1) + 'px');
            });
            b.addEventListener('pointerleave', () => { b.style.setProperty('--bx', '0px'); b.style.setProperty('--by', '0px'); });
        });
    }
    document.addEventListener('pointerdown', e => {
        const b = e.target.closest('.btn');
        if (!b || reduced) return;
        const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height);
        const rip = document.createElement('span');
        rip.className = 'ripple';
        rip.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
        b.appendChild(rip);
        setTimeout(() => rip.remove(), 750);
    });


    // ── 10. Cursor personalizado, chispas y parallax del hero ───────────

    const heroVisual = $('.hero-visual');
    let tx = innerWidth / 2, ty = innerHeight / 2;

    if (finePointer && !reduced) {
        const ring = document.createElement('div'); ring.className = 'cursor-ring';
        const dot = document.createElement('div'); dot.className = 'cursor-dot';
        body.append(ring, dot);
        let rx = tx, ry = ty, gx = tx, gy = ty, lastSpark = { x: 0, y: 0 };

        window.addEventListener('pointermove', e => {
            tx = e.clientX; ty = e.clientY;
            ring.classList.add('on'); dot.classList.add('on'); cursorGlow.classList.add('on');
            dot.style.transform = `translate(${tx}px, ${ty}px)`;

            if (Math.hypot(tx - lastSpark.x, ty - lastSpark.y) > 34) {
                lastSpark = { x: tx, y: ty };
                const s = document.createElement('i');
                s.className = 'spark';
                s.style.left = tx + 'px'; s.style.top = ty + 'px';
                s.style.setProperty('--sx', (Math.random() * 60 - 30) + 'px');
                s.style.setProperty('--sy2', (Math.random() * 60 - 10) + 'px');
                body.appendChild(s);
                setTimeout(() => s.remove(), 800);
            }
            if (heroVisual) {
                heroVisual.style.setProperty('--mx', ((e.clientX / innerWidth - .5) * 2).toFixed(3));
                heroVisual.style.setProperty('--my', ((e.clientY / innerHeight - .5) * 2).toFixed(3));
            }
        }, { passive: true });
        document.addEventListener('pointerleave', () => {
            ring.classList.remove('on'); dot.classList.remove('on'); cursorGlow.classList.remove('on');
        });
        document.addEventListener('pointerover', e => {
            ring.classList.toggle('hover', !!e.target.closest('a, button, .btn, .tech-chip, .hero-badge, .theme-toggle'));
        });
        (function loop() {
            rx = lerp(rx, tx, .18); ry = lerp(ry, ty, .18);
            gx = lerp(gx, tx, .08); gy = lerp(gy, ty, .08);
            ring.style.transform = `translate(${rx}px, ${ry}px)`;
            cursorGlow.style.transform = `translate(${gx}px, ${gy}px)`;
            requestAnimationFrame(loop);
        })();
    }
})();
