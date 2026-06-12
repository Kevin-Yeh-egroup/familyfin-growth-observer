# FamilyFin Growth Observer

Public, noindex Vercel dashboard scaffold for 好理家在 GA4 / GTM / Ads growth
observation.

This repository is intentionally separate from `dbs-client`. It does not install
tags on the FamilyFin site and does not write to GA4, GTM, Google Ads, GitHub,
Vercel, or production systems.

## What This Does

- Shows the daily detection structure for GA4 / GTM / Ads reporting.
- Documents calendar-year rollups for weekly, monthly, quarterly, half-year, and
  annual reports.
- Explains funnel meanings and product-vs-Ads decision rules.
- Shows read-only data source readiness without exposing secrets.
- Keeps deployment public but blocked from search indexing with `noindex`.

## What This Does Not Do Yet

- It does not call GA4 Data API.
- It does not call Google Ads API.
- It does not import Ads conversions.
- It does not change GTM, GA4, Ads, or FamilyFin site code.
- It does not store real user data.

## Local Development

```powershell
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Environment Variables

Use Vercel environment variables for future read-only API integration. Do not
commit real credentials.

- `GA4_PROPERTY_ID`
- `GA4_MEASUREMENT_ID`
- `GOOGLE_ADS_CUSTOMER_ID`
- `GOOGLE_ADS_LOGIN_CUSTOMER_ID`
- `GOOGLE_APPLICATION_CREDENTIALS` or `GOOGLE_APPLICATION_CREDENTIALS_JSON`

## Safety Rules

- Public access is not privacy protection.
- Keep `noindex` on until Kevin explicitly approves discoverability.
- Do not place campaign costs, detailed conversion rates, credentials, account
  IDs beyond approved public placeholders, or sensitive operating notes in the
  repository unless Kevin explicitly approves.
- If live data is added later, aggregate and redact before rendering.
