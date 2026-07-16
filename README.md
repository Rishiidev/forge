# Forge

Conversion-strong, honest landing page and supporting funnel for the **Google Business Profile -> professional website** product.

Brand: Forge
Mark: the double-chevron from the logo (olive + warm pale green)
Capacity mechanism: real monthly launch cap, 6 websites per month, with a real waitlist for the months the cap is full

## Pages

- `index.html` - main conversion page, with the live capacity strip and a hidden waitlist form that only shows when the cap is full
- `audit.html` - lead magnet. A free 7-point website audit in exchange for an email
- `operator.html` - Operator Prospectus. The ongoing-management plan for businesses that have outgrown a one-time website
- `thanks.html` - follow-up funnel. Confirmation page that adapts its message based on the source (preview, audit, waitlist, operator)

## Run locally

```bash
cd ~/Documents/forge
python3 -m http.server 4174
```

Then:

- http://127.0.0.1:4174/ - main page
- http://127.0.0.1:4174/audit.html - lead magnet
- http://127.0.0.1:4174/operator.html - operator prospectus
- http://127.0.0.1:4174/thanks.html - confirmation page

## The cap is the single source of truth

Open `index.html` and find this line near the bottom of the script:

```js
const CAP = { total: 6, remaining: 4, nextReset: '1 August', waitlistSize: 12 };
```

That one constant drives the hero capacity strip, the pricing capacity block, and the entire page's behaviour when the cap is full. When `remaining` is zero, the waitlist form appears, every CTA flips to "Join the waitlist", and the final section rewrites itself.

## The honest line

Every claim on every page is defensible in a customer DM. There is no fake scarcity, no shame copy, no "your business is losing X daily", no fabricated testimonials, no decorative countdown timers, and no em-dashes. The monthly cap is real, the waitlist cap is real, and the operator plan client cap is real.

See the README in this folder for the full build brief and what to wire up before launch.
