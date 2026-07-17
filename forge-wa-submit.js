// forge-wa-submit.js
// Shared helper for Forge's "Option A" form pattern: build a formatted
// WhatsApp message from the form payload, open wa.me/?text=<encoded> in
// a new tab, and POST /api/submit as fire-and-forget backup.
//
// WHATSAPP NUMBER RESOLUTION (added for v3):
//   On first interaction, this script fetches /api/wa-number (5-min cached)
//   to read WHATSAPP_NUMBER from the Vercel env. That single env var controls
//   which number every form opens, on every page. If the fetch fails or the
//   env var isn't set, we fall back to the data-wa attribute baked into
//   the <script> tag — so the page never breaks even if Vercel envs are
//   missing.
//
// Usage:
//   <form id="auditForm">...</form>
//   <script src="forge-wa-submit.js" data-form="auditForm"
//     data-source="audit" data-wa="919999999999"></script>
//   data-wa is now a FALLBACK only — the env var wins when present.

(function () {
  var me = document.currentScript;
  if (!me) return;
  var formId       = me.getAttribute('data-form');
  var source       = me.getAttribute('data-source');
  var waFallback   = me.getAttribute('data-wa');
  var required     = (me.getAttribute('data-required') || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var fieldOrder   = (me.getAttribute('data-fields')    || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var sourceLabel  = me.getAttribute('data-label') || source;

  if (!formId || !source || !waFallback) {
    console.warn('[forge-wa-submit] missing data-form/data-source/data-wa on script tag');
    return;
  }

  var form = document.getElementById(formId);
  if (!form) return;

  // Resolve the WhatsApp number: try env, fall back to data-wa.
  // Returns a Promise<string>. The submit handler awaits this.
  function resolveWaNumber() {
    // Cached resolution per page load.
    if (resolveWaNumber._cached) return Promise.resolve(resolveWaNumber._cached);
    return fetch('/api/wa-number', { credentials: 'omit' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var n = (j && j.number) ? String(j.number).replace(/[^\d]/g, '') : '';
        resolveWaNumber._cached = n || waFallback;
        return resolveWaNumber._cached;
      })
      .catch(function () {
        resolveWaNumber._cached = waFallback;
        return waFallback;
      });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // 1. Gather payload
    var payload = { source: source };
    var missing = [];
    var fields = fieldOrder.length ? fieldOrder : Array.from(form.querySelectorAll('input, select, textarea')).map(function (el) { return el.id || el.name; }).filter(Boolean);
    fields.forEach(function (id) {
      var el = document.getElementById(id);
      var val = el ? el.value.trim() : '';
      if (required.indexOf(id) !== -1 && !val) missing.push(id);
      var name = id;
      if (id.charAt(0) === 'a') name = id.charAt(1).toLowerCase() + id.slice(2);
      if (id === 'opEmail') name = 'email';
      if (id === 'opWhatsApp') name = 'whatsapp';
      payload[name] = val;
    });

    if (missing.length) {
      var stateEl = document.getElementById(formId.replace('Form', '') + 'State') ||
                    document.getElementById('opState') ||
                    null;
      if (stateEl) {
        stateEl.className = 'form-state error';
        var labels = missing.map(function (m) { return m.replace(/^a/, '').replace(/^./, function (c) { return c.toUpperCase(); }); });
        stateEl.textContent = 'Please fill in: ' + labels.join(', ') + '.';
      }
      return;
    }

    // 2. Honeypot
    var honeypot = (form.querySelector('input[name="website"]') || {}).value || '';
    payload.website = honeypot;
    if (honeypot) return; // pretend success, drop bots

    // 3. Fire-and-forget POST to /api/submit.
    //    keepalive: true so the request survives the page-leave that
    //    window.open() causes. We don't await — WhatsApp opens immediately.
    //    The browser will still complete the POST before yielding.
    try {
      fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(function () { /* durable capture is in Supabase + GitHub */ });
    } catch (e) { /* ignore */ }

    // 4. Build the WhatsApp message
    var lines = ['Hi Forge - ' + sourceLabel + '.'];
    Object.keys(payload).forEach(function (k) {
      if (k === 'source' || k === 'website' || k === 'reference') return;
      if (!payload[k]) return;
      var label = k.charAt(0).toUpperCase() + k.slice(1);
      lines.push(label + ': ' + payload[k]);
    });
    lines.push('Sent from forge.bruuhh.com/' + source);
    var message = lines.join('\n');

    // 5. Show pending state
    var submit = form.querySelector('button');
    if (submit) {
      submit.disabled = true;
      var orig = submit.innerHTML;
      submit.setAttribute('data-orig', orig);
      submit.textContent = 'Opening WhatsApp...';
      setTimeout(function () {
        if (submit) {
          submit.disabled = false;
          var stored = submit.getAttribute('data-orig');
          if (stored) submit.innerHTML = stored;
        }
      }, 3500);
    }

    // 6. Resolve the WhatsApp number (env var → fallback) and open in a new tab
    //    after a 1.5s delay — gives the user a moment to cancel.
    resolveWaNumber().then(function (waNumber) {
      var url = 'https://wa.me/' + waNumber + '?text=' + encodeURIComponent(message);
      setTimeout(function () {
        window.open(url, '_blank', 'noopener');
      }, 1500);
    });
  });
})();
