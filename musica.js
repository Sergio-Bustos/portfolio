/* ============================================================
   MÚSICA DE FONDO (song.mp4)
   - Pantalla de entrada (solo la primera vez de cada visita):
     "Entrar con música" / "Entrar sin música".
   - Botón de ecualizador en la barra, en todas las páginas
     (barras animadas = sonando, puntos = en silencio).
   - Al cambiar de página guarda si estaba sonando y en qué
     segundo iba, y sigue desde ahí en la página nueva.
   Solo frontend. Si el audio falla, la página sigue normal.
   ============================================================ */
(function () {
    'use strict';
    var body = document.body, VOL = 0.6, KEY = 'pb-music', fadeT;

    // ── Botón de la barra (si la página no lo trae, se crea) ───────────
    if (!document.querySelector('link[href$="musica.css"]')) {
        var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'musica.css'; document.head.appendChild(l);
    }
    var btn = document.getElementById('musicToggle');
    if (!btn) {
        var theme = document.getElementById('themeToggle');
        if (!theme || !theme.parentNode) return;
        btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'music-toggle'; btn.id = 'musicToggle';
        btn.setAttribute('aria-label', 'Activar o silenciar música'); btn.setAttribute('aria-pressed', 'false');
        btn.innerHTML = '<span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>';
        theme.parentNode.insertBefore(btn, theme.nextSibling);
    }

    // ── Botón del sonido del mouse (click.mp4, lo reproduce script.js) ──
    // Por defecto está activado al entrar; se puede apagar y se recuerda al cambiar de página.
    var PBC = window.PBClick = window.PBClick || {};
    if (typeof PBC.on !== 'boolean') { var cv = null; try { cv = sessionStorage.getItem('pb-click'); } catch (e) { /* nada */ } PBC.on = cv !== '0'; }
    var cbtn = document.getElementById('clickToggle');
    if (!cbtn) {
        cbtn = document.createElement('button');
        cbtn.type = 'button'; cbtn.className = 'music-toggle click-toggle'; cbtn.id = 'clickToggle';
        cbtn.setAttribute('aria-label', 'Activar o silenciar sonido del mouse'); cbtn.setAttribute('aria-pressed', 'true');
        cbtn.innerHTML = '<svg class="cs-ico" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="6"></rect><path d="M12 7v4"></path><path class="cs-slash" d="M3.5 3.5l17 17"></path></svg>';
        btn.parentNode.insertBefore(cbtn, btn.nextSibling);
    }
    function paintClick() { cbtn.classList.toggle('on', PBC.on); cbtn.setAttribute('aria-pressed', String(PBC.on)); }
    paintClick();
    cbtn.addEventListener('click', function () {
        PBC.on = !PBC.on; paintClick();
        try { sessionStorage.setItem('pb-click', PBC.on ? '1' : '0'); } catch (e) { /* sin almacenamiento */ }
        if (PBC.on && PBC.play) PBC.play();      // al activarlo suena un click de confirmación
    });

    // ── Audio (prueba song.mp4 y, si no se puede, otras extensiones) ───
    var audio = null;
    try {
        audio = new Audio(); audio.loop = true; audio.preload = 'metadata'; audio.volume = 0;
        var exts = ['mp4', 'mp3', 'm4a', 'ogg', 'wav'], i = 0;
        var next = function () { if (i < exts.length) { audio.src = 'song.' + exts[i++]; audio.load(); } };
        audio.addEventListener('error', next); next();
    } catch (e) { audio = null; }

    var wanted = false;                 // la persona quiere música
    function paint(on) { btn.classList.toggle('on', on); btn.setAttribute('aria-pressed', String(on)); }

    // ── Estado guardado entre páginas (por pestaña) ────────────────────
    function read() { try { return JSON.parse(sessionStorage.getItem(KEY)); } catch (e) { return null; } }
    function save() {
        try { sessionStorage.setItem(KEY, JSON.stringify({ on: wanted, t: audio ? audio.currentTime : 0, ts: Date.now() })); } catch (e) { /* sin almacenamiento */ }
    }
    var lastSave = 0;
    if (audio) audio.addEventListener('timeupdate', function () { var n = Date.now(); if (n - lastSave > 1000) { lastSave = n; save(); } });
    window.addEventListener('pagehide', save);

    function seek(t) {
        if (!audio || !(t > 0)) return;
        var go = function () { var d = audio.duration; try { audio.currentTime = isFinite(d) && d > 0 ? t % d : t; } catch (e) { /* nada */ } };
        if (audio.readyState >= 1) go(); else audio.addEventListener('loadedmetadata', go, { once: true });
    }

    function fade(to, ms, done) {
        clearInterval(fadeT);
        if (!audio) return;
        var from = audio.volume, t0 = performance.now();
        fadeT = setInterval(function () {
            var p = Math.min(1, (performance.now() - t0) / ms);
            try { audio.volume = Math.max(0, Math.min(1, from + (to - from) * p)); } catch (e) { /* iOS ignora el volumen */ }
            if (p === 1) { clearInterval(fadeT); if (done) done(); }
        }, 40);
    }
    function start(fadeMs) {
        wanted = true;
        if (!audio) { paint(false); return; }
        var r; try { r = audio.play(); } catch (e) { r = null; }
        paint(true);                    // responde al instante
        if (r && r.then) r.then(function () { fade(VOL, fadeMs || 1400); save(); }).catch(waitForTap);
        else fade(VOL, fadeMs || 1400);
        save();
    }
    function stop() {
        wanted = false; paint(false); save();
        if (audio) fade(0, 350, function () { try { audio.pause(); } catch (e) { /* nada */ } save(); });
    }
    // Si el navegador no deja sonar sin un toque (pasa al cambiar de página), espera el primero
    function waitForTap() {
        var evs = ['pointerup', 'touchend', 'click', 'keydown'];
        var go = function () {
            evs.forEach(function (ev) { window.removeEventListener(ev, go, true); });
            if (!wanted || !audio) return;
            var r; try { r = audio.play(); } catch (e) { r = null; }
            if (r && r.then) r.then(function () { fade(VOL, 800); }).catch(function () { wanted = false; paint(false); save(); });
        };
        evs.forEach(function (ev) { window.addEventListener(ev, go, true); });
    }

    btn.addEventListener('click', function () { if (wanted) stop(); else start(); });

    // Cortesía: si se cambia de pestaña, pausa; al volver, sigue
    document.addEventListener('visibilitychange', function () {
        if (!audio || !wanted) return;
        if (document.hidden) { save(); try { audio.pause(); } catch (e) { /* nada */ } }
        else { try { var r = audio.play(); if (r && r.catch) r.catch(waitForTap); } catch (e) { /* nada */ } }
    });
    // Volver con el botón "atrás": la página puede reaparecer congelada; se re-sincroniza
    window.addEventListener('pageshow', function (e) {
        if (!e.persisted) return;
        var s = read();
        if (s && s.on && audio && audio.paused) { wanted = true; paint(true); seek(s.t + (Date.now() - s.ts) / 1000); try { audio.play().catch(waitForTap); } catch (er) { /* nada */ } }
        else if (s && !s.on) { wanted = false; paint(false); }
    });

    // ── ¿Ya eligió antes en esta visita? Entonces continúa sin preguntar ─
    var saved = read();
    if (saved) {
        if (saved.on && audio) {
            wanted = true; paint(true);
            seek(saved.t + (Date.now() - saved.ts) / 1000);
            var r; try { r = audio.play(); } catch (e) { r = null; }
            if (r && r.then) r.then(function () { fade(VOL, 700); }).catch(waitForTap); else fade(VOL, 700);
        }
        return;
    }

    // ── Primera vez: pantalla de entrada (solo en la página principal) ──
    if (!document.querySelector('.preloader')) return;
    window.PBGate = { open: true };
    body.classList.add('gate-open');
    var gate = document.createElement('div');
    gate.className = 'sound-gate'; gate.setAttribute('role', 'dialog'); gate.setAttribute('aria-modal', 'true'); gate.setAttribute('aria-label', 'Elegir sonido');
    gate.innerHTML =
        '<div class="sg-inner">' +
        '<span class="sg-logo">SB</span>' +
        '<div class="sg-eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>' +
        '<h2 class="sg-title">Bienvenido</h2>' +
        '<p class="sg-text">Elige cómo quieres explorar mi portafolio</p>' +
        '<button type="button" class="sg-btn" data-m="1"><i class="bi bi-play-fill" aria-hidden="true"></i><span>Entrar con música</span></button>' +
        '<button type="button" class="sg-skip" data-m="0">Entrar sin música</button>' +
        '<p class="sg-hint">Puedes cambiarlo cuando quieras con el botón de sonido de la barra.</p>' +
        '</div>';
    body.appendChild(gate);
    var first = gate.querySelector('.sg-btn'); if (first) { try { first.focus({ preventScroll: true }); } catch (e) { /* nada */ } }

    function enter(withMusic) {
        if (!window.PBGate.open) return;
        window.PBGate.open = false;
        if (withMusic) start(); else { wanted = false; paint(false); save(); }   // start() corre dentro del clic: el navegador permite el audio
        gate.classList.add('out');
        body.classList.remove('gate-open');
        document.dispatchEvent(new CustomEvent('pb-gate-done'));
        setTimeout(function () { if (gate.parentNode) gate.parentNode.removeChild(gate); }, 1000);
    }
    gate.addEventListener('click', function (e) {
        var b = e.target.closest && e.target.closest('[data-m]'); if (b) enter(b.getAttribute('data-m') === '1');
    });
})();
