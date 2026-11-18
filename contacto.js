/* ============================================================
   Formulario de contacto → te llega al correo (servicio Web3Forms).
   Solo frontend: no hay servidor propio. La clave va en el HTML
   (campo access_key); es pública por diseño y solo permite ENVIAR.
   ============================================================ */
(function () {
    'use strict';
    var form = document.getElementById('contactForm');
    if (!form) return;
    var btn = form.querySelector('.cf-send'), label = btn.querySelector('.cf-label'), status = form.querySelector('.cf-status');
    var tr = function (es) { return window.PBI18n ? window.PBI18n.t(es) : es; };
    var lastKey = '';           // texto (en español) del mensaje actual, para traducirlo si cambia el idioma
    function say(es, type) { lastKey = es; status.textContent = tr(es); status.className = 'cf-status' + (type ? ' ' + type : ''); }
    document.addEventListener('pb-lang', function () { if (lastKey) status.textContent = tr(lastKey); });

    var emailOk = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); };
    var busy = false;

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (busy) return;
        var f = form.elements, name = f.name.value.trim(), email = f.email.value.trim(), msg = f.message.value.trim();
        Array.prototype.forEach.call(form.querySelectorAll('.cf-field'), function (el) { el.classList.remove('bad'); });
        var bad = [];
        if (!name) bad.push(f.name); if (!emailOk(email)) bad.push(f.email); if (msg.length < 5) bad.push(f.message);
        if (bad.length) {
            bad.forEach(function (i) { i.closest('.cf-field').classList.add('bad'); });
            bad[0].focus(); say('Completa todos los campos con un correo válido.', 'err'); return;
        }
        if (f.botcheck && f.botcheck.checked) return;   // trampa para bots
        if (/PEGA_AQUI/.test(f.access_key.value)) { say('Falta configurar la clave del formulario.', 'err'); return; }

        busy = true; btn.disabled = true; btn.classList.add('sending');
        var original = label.textContent; label.textContent = tr('Enviando…'); status.textContent = ''; status.className = 'cf-status';
        var data = {
            access_key: f.access_key.value, subject: f.subject.value + ' — ' + name, from_name: f.from_name.value,
            name: name, email: email, message: msg
        };
        fetch('https://api.web3forms.com/submit', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(data)
        }).then(function (r) { return r.json(); }).then(function (j) {
            if (j && j.success) { say('¡Mensaje enviado! Te responderé pronto.', 'ok'); form.reset(); }
            else say('No se pudo enviar. Intenta de nuevo o escríbeme por WhatsApp.', 'err');
        }).catch(function () {
            say('No se pudo enviar. Intenta de nuevo o escríbeme por WhatsApp.', 'err');
        }).then(function () {
            busy = false; btn.disabled = false; btn.classList.remove('sending');
            label.textContent = tr('Enviar mensaje'); void original;
        });
    });
})();
