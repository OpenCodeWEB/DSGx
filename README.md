# DSGx — Decentralized Support Gateway
> `dsgx.pages.dev/<username>` — Support any developer with crypto or card. Funds go directly to developer's Web3 wallet.

**Repo:** `github.com/OpenCodeWEB/DSGx`  
**Live:** `https://dsgx.pages.dev`

## Architecture (from Gemini consultation)

```
GDBx (auth+keys) ──► DSGx (/ABsUP) ──► GDMx (payment engine)
```

- **Auth:** Hybrid Web3 — SIWE (EVM) primary + GDBx ECDSA P-256 ephemeral for fast delta sync (bound to SIWE session)
- **GitHub OAuth:** Cloudflare Worker + DO (state in KV TTL 10m, token encrypted in DO, never in browser)
- **API Keys:** `GDBx<24B-entropy-hex>AB` (prefix GDBx, suffix AB checksum). 3 max for Web3-only, unlimited after GitHub verify (quota in UserDO storage)
- **Routing:** `dsgx.pages.dev/<username>` → KV `DSGX_ROUTES_KV` → SSR profile with `window.DSGX_PROFILE` + GDMx embed `<script src="https://gdmx.pages.dev/sdk/v1/gdmx.js">`
- **Donation:** Crypto → direct on-chain to Web3 address; Card → MoonPay | Transak | Ramp | Stripe → USDC to Web3 address (multi-provider, no single limitation — one fails → next tries)

## Dev
```bash
npm i
npm run dev      # wrangler pages dev public --compatibility-date=2024-01-01
npm run deploy   # wrangler pages deploy public --project-name dsgx
```
