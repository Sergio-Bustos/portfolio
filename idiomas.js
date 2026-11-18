/* ============================================================
   Idioma ES / EN — botón en la barra + traducción de toda la página
   Carga el diccionario según la página (traduccion-inicio.js o
   traduccion-certificados.js). El texto original en español queda
   en el HTML; el inglés se aplica al vuelo y se recuerda la elección.
   ============================================================ */
(function () {
    'use strict';
    var root = document.documentElement, KEY = 'pb-lang';
    var DICT = {}, REV = {}, map = new WeakMap(), started = false, fx = 0;
    var ATTRS = ['aria-label', 'alt', 'placeholder', 'title'];
    var has = function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); };
    var norm = function (s) { return String(s).replace(/\s+/g, ' ').trim(); };
    var wrap = function (orig, txt) { var m = orig.match(/^(\s*)[\s\S]*?(\s*)$/); return m[1] + txt + m[2]; };

    var saved = null; try { saved = localStorage.getItem(KEY); } catch (e) { /* sin almacenamiento */ }
    var api = window.PBI18n = {
        lang: saved === 'en' ? 'en' : 'es',
        t: function (es) { var k = norm(es); return api.lang === 'en' && has(DICT, k) ? DICT[k] : es; },
        roles: {
            es: ['Técnico en Programación de Software', 'En la meta final del SENA', 'Pronto Ingeniero Eléctrico', 'Desarrollador Python & Flask'],
            en: ['Software Programming Technician', 'Almost done with my SENA degree', 'Soon-to-be Electrical Engineer', 'Python & Flask Developer']
        },
        set: set
    };

    // ── Botón ES | EN (se coloca junto al botón de tema) ───────────────
    var css = document.createElement('style');
    css.textContent =
        '.lang-toggle{position:relative;display:inline-grid;grid-template-columns:1fr 1fr;align-items:center;padding:3px;border-radius:999px;background:var(--glass-flat);border:1px solid var(--border);isolation:isolate}' +
        '.lang-toggle button{position:relative;z-index:1;min-width:38px;height:32px;padding:0 .55rem;border:0;background:none;border-radius:999px;font:700 .72rem/1 var(--font-mono,monospace);letter-spacing:.06em;color:var(--text2);cursor:pointer;transition:color .35s}' +
        '.lang-toggle button[aria-pressed="true"]{color:#fff;text-shadow:0 1px 6px rgba(0,0,0,.35)}' +
        '.lang-toggle button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}' +
        '.lang-pill{position:absolute;z-index:0;top:3px;bottom:3px;left:3px;width:calc(50% - 3px);border-radius:999px;background:var(--grad);box-shadow:0 4px 16px -4px var(--glow);transition:transform .5s cubic-bezier(.34,1.56,.64,1)}' +
        '.lang-toggle[data-lang="en"] .lang-pill{transform:translateX(100%)}' +
        '.lang-toggle.pop{animation:langPop .55s cubic-bezier(.34,1.56,.64,1)}' +
        '@keyframes langPop{40%{transform:scale(1.12)}}' +
        '@media (max-width:380px){.lang-toggle button{min-width:32px;padding:0 .4rem}}';
    document.head.appendChild(css);

    var tg = document.createElement('div');
    tg.className = 'lang-toggle'; tg.setAttribute('role', 'group'); tg.setAttribute('aria-label', 'Idioma / Language');
    tg.innerHTML = '<span class="lang-pill"></span><button type="button" data-lang="es">ES</button><button type="button" data-lang="en">EN</button>';
    var themeBtn = document.getElementById('themeToggle');
    if (themeBtn && themeBtn.parentNode) themeBtn.parentNode.insertBefore(tg, themeBtn);
    else document.querySelector('.navbar .container') && document.querySelector('.navbar .container').appendChild(tg);
    tg.addEventListener('click', function (e) {
        var b = e.target.closest && e.target.closest('button[data-lang]'); if (b) set(b.getAttribute('data-lang'), true);
    });

    function mark() {
        tg.setAttribute('data-lang', api.lang);
        Array.prototype.forEach.call(tg.querySelectorAll('button'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === api.lang)); });
    }

    // ── Aplicar idioma ─────────────────────────────────────────────────
    function apply() {
        var en = api.lang === 'en', list = [], n;
        var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
        while ((n = w.nextNode())) list.push(n);
        list.forEach(function (n) {
            var p = n.parentNode; if (!p || /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA)$/.test(p.nodeName)) return;
            var rec = map.get(n), txt = n.nodeValue;
            if (!rec) {
                var k = norm(txt); if (!k) return;
                if (has(DICT, k)) rec = { es: txt };
                else if (started && has(REV, k)) rec = { es: wrap(txt, REV[k]) };   // texto nuevo creado por scripts (ya en inglés)
                else return;
                map.set(n, rec);
            }
            var target = en ? wrap(rec.es, DICT[norm(rec.es)] || norm(rec.es)) : rec.es;
            if (txt !== target) n.nodeValue = target;
        });
        Array.prototype.forEach.call(document.querySelectorAll('[aria-label],[alt],[placeholder],[title]'), function (el) {
            ATTRS.forEach(function (a) {
                if (!el.hasAttribute(a) || el.closest('.lang-toggle')) return;
                var orig = el.getAttribute('data-es-' + a);
                if (orig === null) { var v = el.getAttribute(a); if (!has(DICT, norm(v))) return; orig = v; el.setAttribute('data-es-' + a, v); }
                el.setAttribute(a, en ? DICT[norm(orig)] : orig);
            });
        });
        if (document.documentElement.getAttribute('data-es-title') === null) document.documentElement.setAttribute('data-es-title', document.title);
        var t0 = document.documentElement.getAttribute('data-es-title');
        document.title = en && has(DICT, norm(t0)) ? DICT[norm(t0)] : t0;
        root.lang = api.lang; started = true; mark();
    }

    function set(lang, user) {
        api.lang = lang === 'en' ? 'en' : 'es';
        try { localStorage.setItem(KEY, api.lang); } catch (e) { /* sin almacenamiento */ }
        apply();
        if (user) {
            tg.classList.remove('pop'); void tg.offsetWidth; tg.classList.add('pop');
            // Si algún efecto de texto (decodificado) estaba en curso, se reaplica al terminar
            clearTimeout(fx); fx = setTimeout(apply, 900);
        }
        document.dispatchEvent(new CustomEvent('pb-lang', { detail: api.lang }));
    }

    // ── Cargar el diccionario de esta página ───────────────────────────
    mark();
    var isHome = !!document.getElementById('inicio');
    var s = document.createElement('script');
    s.src = isHome ? 'traduccion-inicio.js' : 'traduccion-certificados.js';
    s.onload = function () {
        DICT = window.PB_DICT || {};
        Object.keys(DICT).forEach(function (k) { if (!has(REV, DICT[k])) REV[DICT[k]] = k; });
        apply();
        setTimeout(apply, 2600);   // por si algún efecto de entrada reescribió textos
    };
    document.head.appendChild(s);
})();
