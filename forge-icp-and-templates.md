# Forge — ICP & Industry Templates

> Internal document. Not for the public site.
> Save as `forge-icp-and-templates.md` in the repo root, or anywhere inside `~/Documents/forge/`.

---

## The ICP (Ideal Customer Profile)

**Name:** *"Anita, the Salon Owner Who Googled Her Competition Last Tuesday"*

### Demographics

| Attribute | Value |
|---|---|
| **Age** | 32–50 |
| **City tier** | Tier 1 (Mumbai, Bangalore, Delhi, Pune) — Tier 2 (Indore, Nagpur, Jaipur, Lucknow) |
| **Business age** | 2–10 years operating |
| **Revenue** | ₹8L – ₹80L/year |
| **Team size** | 1–8 people |
| **Education** | Doesn't matter — they're a practitioner, not a tech person |
| **Tech comfort** | Uses WhatsApp, Instagram, Google Maps. **Does not** use Notion, GitHub, Vercel, Figma, or PWA tooling |

### Psychographics

| Attribute | What they actually think |
|---|---|
| **Core fear** | "I'm losing customers to a competitor who looks more professional online." |
| **Core desire** | "I want customers to take me seriously without spending ₹2L or learning web design." |
| **Trigger event** | (a) Customer said "I checked your website but..."; (b) saw a competitor's site; (c) lost a deal because they looked unestablished; (d) Google Maps photo showed a competitor's nicer setup. |
| **Objection** | "I don't have time for a website project." (real) / "₹10K is a lot for a website" (real for some, fake for most). |
| **Buying trigger** | "How fast can it be live?" |
| **Decision-maker** | Always the owner. No procurement. No committees. |

### The 4 ICPs (psychographic segments)

| ICP | % of revenue | Pain | Pitch | Template | Ticket |
|---|---|---|---|---|---|
| **ICP-1: Local Practitioner** | 60% | "People search on Google, see my GBP, but trust the next person with a real website." | "Stop losing customers to the salon across the street with a website." | salon, clinic, fitness, coach, service | ₹9,999 → ₹14,999 |
| **ICP-2: Growing Café / Studio** | 15% | "Our Instagram is great but the website Google shows is embarrassing." | "Match your Instagram quality with a website that converts browsers to bookers." | cafe, studio, fitness | ₹14,999 → ₹24,999 |
| **ICP-3: B2B Service** | 15% | "When I send a proposal, my website doesn't match my pitch." | "Your proposal deserves a website that backs it up." | service, contractor, other | ₹24,999 (bespoke) |
| **ICP-4: Auto / Trade** | 10% | "Customer wants me to come NOW, but they can't find my number without calling my competitor." | "One tap to call. One tap to WhatsApp. Found in 30 seconds." | auto, contractor | ₹9,999 |

### Anti-ICP (do NOT sell to these)

- **The startup founder** — wants custom features, will scope-creep you to death
- **The agency owner** — knows enough to be annoying, not enough to do it themselves
- **The non-Indian SMB** — payment friction, timezone friction, building site 3x hourly
- **The "I have a friend who codes" person** — will ghost after the Loom
- **The enterprise procurement team** — will ghost after 3 calls

### The One-Liner ICP

> *"Founders of 1–10-person service businesses in Tier 1–2 Indian cities, 2–10 years old, ₹8L–₹80L/year, who lose customers to competitors who look better online — but don't have the time or money for a real website project."*

---

## The 6 Industry Templates (₹9,999 / 48-Hour Website)

Each template specifies: **palette, fonts, hero copy, 6 service cards, primary/secondary CTA, social proof angle, the 1 thing that makes it look bespoke, the conversion element.**

> 4 of these already exist in the builder (`salon`, `clinic`, `restaurant`, `fitness`). 2 need to be created (`coach`, `service`).

---

### 1. 💇 SALON & BEAUTY → existing `salon`

**ICP-1 match.** Highest volume.

| Element | Value |
|---|---|
| **Palette** | Warm copper `#c97f3a` on cream `#faf6f1` |
| **Font pair** | Fraunces (display) + Inter (body) |
| **Hero headline** | *"Good hair days start here."* |
| **Hero subhead** | "From a quick trim to bridal-ready — the closest [City] salon for [service]. Walk-ins welcome, online booking faster." |
| **6 services** | Haircuts, Hair Colour, Skincare & Facials, Nail Services, Bridal & Event Makeup, Spa & Body |
| **Primary CTA** | **WhatsApp to Book** |
| **Secondary CTA** | **Call Now** |
| **CRO engine** | **Service picker** — click a service, get a quote + book |
| **Bespoke tell** | "Booked by [X] people this month" + stylist names with photos |
| **Anti-patterns** | Pink CTAs, 💅 emoji, stock photos of people with arms in the air |
| **Operator upsell** | ₹1,999/mo: weekly stylist schedule updates, monthly promo banner, replacement for bridal season |

---

### 2. 🩺 CLINIC & MEDICAL → existing `clinic`

**ICP-1 match.** Highest trust bar.

| Element | Value |
|---|---|
| **Palette** | Soft teal `#2c7a7b` on white `#fdfcf9` (wellness ≠ cold white) |
| **Font pair** | Source Serif 4 (display) + Inter (body) |
| **Hero headline** | *"Care that explains itself."* |
| **Hero subhead** | "Pathology, diagnostics, and preventive health checks in [City]. NABL certified. Reports in [X] hours. Walk-in or home collection." |
| **6 services** | Blood Tests, Preventive Health Checks, Sample Collection, Test Prep, Report Timelines, 24-Hour Enquiries |
| **Primary CTA** | **WhatsApp to Enquire** |
| **Secondary CTA** | **Call Now** |
| **CRO engine** | **Test-finder wizard** — "I need [X] test" → recommended package + price + home-collection toggle |
| **Bespoke tell** | Real certifications (NABL, ISO) with logos + doctor names with photos |
| **Anti-patterns** | Red CTAs, dollar-sign pricing, "Cure" claims |
| **Operator upsell** | ₹2,999/mo: new test additions, monthly health-checkup banner, doctor schedule updates |

---

### 3. ☕ CAFÉ & RESTAURANT → existing `restaurant`

**ICP-2 match.** Most visual.

| Element | Value |
|---|---|
| **Palette** | Warm espresso `#6b3410` on cream `#f7f1e8` |
| **Font pair** | Playfair Display (display) + Inter (body) |
| **Hero headline** | *"The corner your week keeps coming back to."* |
| **Hero subhead** | "Brunch, dinner, and [signature dish] in [City]. Reserve a table for 2 or 12. Delivery on Swiggy, Zomato, and direct on WhatsApp (10% off)." |
| **6 services** | Today's Menu, Reservations, Home Delivery, Private Dining, Catering, Sunday Brunch |
| **Primary CTA** | **Reserve a Table** |
| **Secondary CTA** | **Get Directions** |
| **CRO engine** | **Menu QR + delivery toggle** — scan QR → see menu + order on WhatsApp with 10% discount |
| **Bespoke tell** | Real menu photos (not stock) + chef name + "Made by [chef]" tagline |
| **Anti-patterns** | Yellow-on-black menus, "AUTHENTIC" all-caps, stock pancakes |
| **Operator upsell** | ₹2,999/mo: weekly menu update, seasonal photo reshoots, festive offerings |

---

### 4. 🧘 STUDIO (Yoga / Photography / Art / Music) → extends `fitness`

**ICP-2 match.** Most aesthetic.

| Element | Value |
|---|---|
| **Palette** | Sage green `#7a8471` on linen `#f5f1ea` (calm, not earthy) |
| **Font pair** | Cormorant Garamond (display) + Inter (body) |
| **Hero headline** | *"Practice that doesn't perform."* |
| **Hero subhead** | "Small-group yoga (max 8) and breathwork in [City]. First class free. Monthly memberships from ₹2,000. Studio at [Address]." |
| **6 services** | Drop-in Class, Class Pack (5/10/20), Monthly Membership, Private 1-on-1, Workshops & Retreats, Teacher Training |
| **Primary CTA** | **Book First Class Free** |
| **Secondary CTA** | **View Schedule** |
| **CRO engine** | **Class-booking calendar** — pick a class, see availability, book + pay |
| **Bespoke tell** | Teacher bio + real class photos + "Why this style" manifesto |
| **Anti-patterns** | Generic "wellness" stock photos, OM symbols, purple gradients |
| **Operator upsell** | ₹2,499/mo: schedule sync, monthly retreat banner, instructor additions |

---

### 5. 🛠️ SERVICE (Plumber / Electrician / AC Repair / Mechanic) → extends `auto`

**ICP-4 match.** Highest urgency.

| Element | Value |
|---|---|
| **Palette** | Industrial blue `#1e3a5f` on off-white `#fbfaf8` ⚠️ collides with `coworking` token — pass `--industry service` explicitly |
| **Font pair** | Inter only (display + body — bold weights) — no serifs, no flourishes |
| **Hero headline** | *"Fixed today. Not next week."* |
| **Hero subhead** | "[Service] in [City]. Same-day visits across [area]. Free quote, transparent pricing, 1-year warranty on every job." |
| **6 services** | Free Site Visit, [Top Service], [Top Service 2], Emergency Calls, Annual Maintenance, Service Area Map |
| **Primary CTA** | **Get a Free Quote** |
| **Secondary CTA** | **Call Now** |
| **CRO engine** | **Service-area finder** — "Pin your location" → see if covered + ETA |
| **Bespoke tell** | "On the job within 4 hours, average across [X] jobs last month" + real before/after photos |
| **Anti-patterns** | Generic stock photos, "Family-owned since 1985", testimonials with no last name |
| **Operator upsell** | ₹1,999/mo: emergency-call priority routing, monthly maintenance reminder SMS |

---

### 6. 🎓 COACH / TUTOR / CONSULTANT → **new template needed**

**ICP-3 match.** Highest per-ticket.

| Element | Value |
|---|---|
| **Palette** | Deep navy `#1a2332` on warm white `#fafaf7` (authority, not corporate) |
| **Font pair** | Fraunces (display) + Inter (body) |
| **Hero headline** | *"Coaching that ends when you don't need it."* |
| **Hero subhead** | "1-on-1 [coaching type] for [audience]. [X] clients coached. [Y] minute discovery call to see if we're a fit." |
| **6 services** | 1-on-1 Coaching (₹X/session), Group Program (₹X/month), Discovery Call (free), Resource Library (free), Corporate Workshops, Speaking & Keynotes |
| **Primary CTA** | **Book a Free Discovery Call** |
| **Secondary CTA** | **See Client Results** |
| **CRO engine** | **Audience picker** — "I'm a [type]" → see the right program + testimonials from that audience |
| **Bespoke tell** | Client transformations with real names + photos + "before/after in [timeframe]" |
| **Anti-patterns** | Generic "transform your life", "Guru" energy, no proof of named clients |
| **Operator upsell** | ₹3,999/mo: testimonial collection, monthly workshop promo, podcast/blog syndication |

---

## The at-a-glance comparison

| # | Template | ICP | Palette Anchor | Font Display | Primary CTA | CRO Engine | Price |
|---|---|---|---|---|---|---|---|
| 1 | Salon | ICP-1 | `#c97f3a` copper | Fraunces | WhatsApp to Book | Service picker | ₹9,999 |
| 2 | Clinic | ICP-1 | `#2c7a7b` teal | Source Serif 4 | WhatsApp to Enquire | Test-finder wizard | ₹9,999 |
| 3 | Café | ICP-2 | `#6b3410` espresso | Playfair Display | Reserve a Table | Menu QR + delivery | ₹9,999 |
| 4 | Studio | ICP-2 | `#7a8471` sage | Cormorant Garamond | Book First Class Free | Class calendar | ₹9,999 |
| 5 | Service | ICP-4 | `#1e3a5f` steel | Inter (only) | Get a Free Quote | Service-area finder | ₹9,999 |
| 6 | Coach | ICP-3 | `#1a2332` navy | Fraunces | Book Free Discovery Call | Audience picker | ₹9,999 |

**Bespoke tell across all 6:** real domain name, real photos, real names, real numbers. No "lorem ipsum" testimonials, no filler copy, no stock photos that don't match the business.

---

## The sales script for when a customer asks "what's the difference?"

```
"The ₹9,999 is a 48-Hour Website — built from a proven template for your
industry, your GBP, your colors. Live in 48 hours.

The ₹24,999 Made-For-You Website is built from scratch for your business.
Custom design, custom copy, a real interactive conversion engine (like a
booking calendar or service picker). Takes 5-7 days.

Most people start with the 48-Hour Website. If you want it to feel
specifically yours — not just a great template — go Made-For-You."
```

---

## Anti-patterns in the word "bespoke"

Use these instead, in this order:

1. **Custom** — the most universal Indian-English word
2. **Made-for-you** — matches your homepage language
3. **Tailored** — slightly more formal, fine for B2B
4. **Bespoke** — *avoid* — British, signals high-end without explaining what you get
5. **Premium** — *avoid* — sounds like you're charging extra for nothing
6. **Template** — *avoid* — sounds cheap, sounds like WIX

---

## The 6 conversion engines (one per template + add-ons)

| Engine | Best for | Adds |
|---|---|---|
| **Service picker** | Salon, café, repair | ₹4,999 |
| **Real booking calendar** | Studio, clinic, fitness | ₹4,999 |
| **Test or quote wizard** | Clinic, coach, service | ₹4,999 |
| **Audience picker** | Coach, consultant | ₹4,999 |
| **Menu QR + delivery** | Café, restaurant | ₹4,999 |
| **Service-area finder** | Plumber, AC, garage | ₹4,999 |

All 6 are in the calculator (`bespoke-quote.html`). One is included in the ₹24,999 base; extras are +₹4,999 each.

---

## The 5 add-ons (calculator)

| Add-on | What it adds | When to recommend |
|---|---|---|
| **Custom branding** | Custom palette + custom font pair + logo polish | To customers who said "I want it to look different" |
| **Custom copywriting** | Written fresh, not generated from GBP | To B2B / coach / consultant customers |
| **Hindi or regional page** | Mirror the home page in a second language | To all customers in non-English metros |
| **Blog with 3 starter posts** | CMS included, you write after launch | To coach / consultant / clinic |
| **48-hour delivery** | Skip queue, ship in 48 hours instead of 5–7 | To customers who say "I need it this week" |

---

## Decision tree: which tier to pitch which customer?

```
Is the customer budget-flexible?
├── YES (₹25K+ feels easy)
│   ├── Does their business depend on a conversion engine?
│   │   ├── YES → Made-For-You Website (₹24,999+)
│   │   └── NO  → 48-Hour Website (₹9,999) + Operator plan
│   └── Universal pitch: "A made-for-you website, designed for your business."
│
└── NO (₹10K is the cap)
    ├── Is the customer repeat/local/walk-in?
    │   ├── YES → 48-Hour Website (₹9,999)
    │   └── NO  → 48-Hour Website + 3-month Operator plan (₹15,996)
    └── Universal pitch: "A 48-hour website, on a proven template for your industry."
```

---

## What this doc is NOT

- Not a marketing plan — that's the 85-day sprint in `forge-5lakh-85-days.md`
- Not a website plan — that's the Forge builder at `~/.hermes/skills/forge/website/`
- Not a delivery checklist — that's the per-site build automation

**This doc is the sales playbook.** Pin it to your Loom script. Re-read it before every sales call.
