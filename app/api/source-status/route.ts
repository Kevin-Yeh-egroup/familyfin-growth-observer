import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const configured = (value: string | undefined) => Boolean(value && value.trim());

export function GET() {
  const hasGa4Property = configured(process.env.GA4_PROPERTY_ID);
  const hasGa4MeasurementId = configured(process.env.GA4_MEASUREMENT_ID);
  const hasAdsCustomer = configured(process.env.GOOGLE_ADS_CUSTOMER_ID);
  const hasServiceAccount =
    configured(process.env.GOOGLE_APPLICATION_CREDENTIALS) ||
    configured(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    mode: "read_only_observer",
    environment: process.env.VERCEL_ENV ?? "local",
    noExternalWrites: true,
    sources: {
      ga4Property: hasGa4Property,
      ga4MeasurementId: hasGa4MeasurementId,
      googleAdsCustomer: hasAdsCustomer,
      serviceAccount: hasServiceAccount
    },
    readiness:
      hasGa4Property && hasGa4MeasurementId && hasServiceAccount
        ? "ready_for_read_only_ga4_adapter"
        : "draft_no_live_api_credentials"
  });
}
