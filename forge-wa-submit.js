// forge-wa-submit.js
// Shared helper for Forge's "Option A" form pattern: build a formatted
// WhatsApp message from the form payload, open wa.me/?text=<encoded> in
// a new tab, and POST /api/submit as fire-and-forget backup.
//
// Usage:
//   <form id="auditForm">...</form>
//   <script src="forge-wa-submit.js" data-form="auditForm"
//     data-source="audit" data-wa="919999999999"></script>
//
// Any <script> loaded this way scans the DOM for forms that match it.
// If you want the form to use the include list of fields rendered into
// the WhatsApp text, add `data-fields="biz,wa,name,link"` to the
// <script> tag (comma-separated names matching input IDs).
//
// Behaviour:
//   1. On submit, read every named field. Validate required fields
//      (declared via data-required="name,email,biz,...").
//   2. Build a 1-line per-field WhatsApp message.
//   3. POST /api/submit with the payload (fire-and-forget; we don't
//      await it - if Resend is down, the customer still converts).
//   4. Open wa.me/?text=<message> in a new tab after a 1.5s delay so
//      the customer can see the success state and cancel if accidental.

(function () {
  // Self-attach: this IIFE loads as a one-off <script>, finds its own
  // <script data-form="..." data-source="..."> tag, and binds the handler.
  var me = document.currentScript;
  if (!me) return;
  var formId     = me.getAttribute('data-form');
  var source     = me.getAttribute('data-source');           // 'audit' | 'preview' | 'waitlist' | 'operator'
  var waNumber   = me.getAttribute('data-wa');               // e.g. '919999999999'
  var required   = (me.getAttribute('data-required') || '').split(',').map(function(s){ return s.trim(); }).filter(Boolean);
  var fieldOrder = (me.getAttribute('data-fields') || '').split(',').map(function(s){ return s.trim(); }).filter(Boolean);
  var sourceLabel = me.getAttribute('data-label') || source;

  if (!formId || !source || !waNumber) {
    console.warn('[forge-wa-submit] missing data-form/data-source/data-wa on script tag');
    return;
  }

  var form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // 1. Gather payload
    var payload = { source: source };
    var missing = [];
    var fields = fieldOrder.length ? fieldOrder : Array.from(form.querySelectorAll('input, select, textarea')).map(function(el){ return el.id || el.name; }).filter(Boolean);
    fields.forEach(function (id) {
      var el = document.getElementById(id);
      var val = el ? el.value.trim() : '';
      if (required.indexOf(id) !== -1 && !val) missing.push(id);
      // Map id -> payload field name (strip "a" prefix for audit form: aBiz -> biz)
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
        var labels = missing.map(function(m){ return m.replace(/^a/, '').replace(/^./, function(c){ return c.toUpperCase(); }); });
        stateEl.textContent = 'Please fill in: ' + labels.join(', ') + '.';
      }
      return;
    }

    // 2. Honeypot - drop bots without blocking
    var honeypot = (form.querySelector('input[name="website"]') || {}).value || '';
    payload.website = honeypot;
    if (honeypot) {
      // Pretend success - return immediately without opening WhatsApp
      return;
    }

    // 3. Fire-and-forget POST to /api/submit (Resend/email backup)
    try {
      fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        // don't await - we want WhatsApp to open immediately
        keepalive: true,
      }).catch(function() { /* swallow - email is backup, WA is primary */ });
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

    var url = 'https://wa.me/' + waNumber + '?text=' + encodeURIComponent(message);

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

    // 6. Open WhatsApp in a new tab after a 1.5s delay - gives the
    // customer a moment to cancel if they clicked by accident
    setTimeout(function () {
      window.open(url, '_blank', 'noopener');
    }, 1500);
  });
})();
