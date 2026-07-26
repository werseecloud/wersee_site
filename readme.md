<div align="center">
  <img width="1200" alt="Wersee Brand" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
  <br />
  <h1>Wersee</h1>
  <p><strong>The premium digital commerce ecosystem for creators, communities, and modern enterprises.</strong></p>
</div>

---

## About Wersee
Wersee is a proprietary platform built to power premium digital businesses with an integrated suite of commerce, community, and content tools.

This repository contains private Wersee source assets and application logic. It is not intended for public redistribution or self-service installation.

---

## What Wersee Delivers

- **Enterprise-grade storefront experiences** with high-conversion page building and product management.
- **All-in-one business operations** including CRM, payments, scheduling, and multi-channel workflows.
- **Modern commerce automation** through AI-assisted content, real-time collaboration, and performance analytics.
- **Cross-platform delivery** across web, mobile, and desktop applications.

---

## Product Highlights

- Advanced listing and storefront management for physical, digital, service, and community offerings.
- Integrated Stripe payments, subscription billing, and payout orchestration.
- Built-in affiliate and partner programs with scalable attribution tracking.
- Custom workspace modules for operations, marketing, customer support, and community engagement.
- Secure data and identity handling powered by Supabase.

---

## Platform Architecture

| Area | Technology |
| --- | --- |
| Frontend | React 19, Vite, Tailwind CSS |
| Backend | Supabase (PostgreSQL), Edge Functions |
| Mobile | Expo / React Native |
| Desktop | Electron |
| Integrations | Stripe, Firebase, Gemini AI |

---

## Supabase Passkey Setup

Passkeys must be enabled in the Supabase Dashboard before the Wersee client can register or use them.

Open **Authentication -> Passkeys** and enable Passkey authentication with:

- Relying Party Display Name: `Wersee`
- Relying Party ID: `wersee.com`
- Origins:
  - `https://wersee.com`
  - `https://www.wersee.com`
  - `http://localhost:3000`
  - `http://127.0.0.1:3000`

The Relying Party ID must be a bare domain only. Do not include a protocol, path, or port. Do not change it after users start enrolling passkeys, because existing passkeys are cryptographically bound to this value and will stop working if it changes.

The local Supabase config mirrors this setup in `supabase/config.toml`.

---

## Proprietary Notice
This repository is closed source. All code, assets, and configuration are confidential and for authorized Wersee personnel only.

Unauthorized copying, modification, or distribution is prohibited.

---

## Contact
For internal product inquiries, engineering support, or partnership requests, contact the Wersee team through the company’s private channels.

---

<div align="center">
  <p>© 2026 Wersee — All rights reserved.</p>
</div>
