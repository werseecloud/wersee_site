# Wersee Shop - TikTok Style Algoritme Architectuur

Dit document beschrijft de volledige architectuur van het Wersee Shop algoritme, gebaseerd op de TikTok & YouTube ranking principes.

## 🧠 Core Principle
Het algoritme beantwoordt continu de vraag: *"Wat is de kans dat deze user klikt, blijft kijken en koopt?"*

De score per listing wordt berekend via:
`score = (CTR × 0.3) + (watch_time × 0.3) + (conversion × 0.4)`

## 🗄️ Database Schema (SQL)
De database structuur is te vinden in `src/db/wersee_algorithm.sql`. Deze bevat:
1. **`wersee_interactions`**: Trackt elke micro-interactie (impressions, clicks, views, purchases, saves, shares).
2. **`wersee_listing_stats`**: Houdt de geaggregeerde data bij (CTR, conversion rate, avg watch time) en de berekende `global_score`.
3. **`wersee_shadow_profiles`**: Slaat de interesses op van zowel ingelogde users als **gasten** (via een session_id).

## ⚙️ Backend Logic & Tracking (TypeScript)
De logica is geïmplementeerd in `src/services/algorithmService.ts`:
- **`trackInteraction`**: Slaat interacties op en update direct het shadow profile.
- **`updateShadowProfile`**: Kent punten toe op basis van de actie (Purchase = 10pt, Share = 4pt, View = 2pt, etc.).
- **`getPersonalizedFeed`**: Haalt de feed op via een SQL RPC die de `global_score` combineert met de persoonlijke `category_affinities`.

## 🎣 React Hooks
In `src/hooks/useListingTracking.ts` zit een handige hook die automatisch de **dwell time (watch time)** trackt wanneer een user een listing bekijkt en weer weg scrolt.

## 🧲 Addictive UI (TikTok Style)
In `src/components/shop/TikTokFeed.tsx` is een werkend voorbeeld gemaakt van een TikTok-style feed:
- Infinite scroll / swipe functionaliteit.
- **Dynamic Pricing Signals** ("🔥 12 mensen bekijken dit nu").
- **Viral Loop** knoppen (Share, Save, Buy) direct in de UI.
- Automatische tracking van watch time bij het swipen naar de volgende listing.

## 🚀 Volgende Stappen voor Implementatie
1. Voer de SQL code uit in je Supabase SQL Editor.
2. Integreer de `useListingTracking` hook in je bestaande listing kaarten.
3. Gebruik de `TikTokFeed` component (of een grid-variant daarvan) op de Wersee Shop homepage.
