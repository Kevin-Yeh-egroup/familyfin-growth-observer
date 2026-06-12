import { NextResponse } from "next/server";
import { getGa4Summary } from "@/lib/server/ga4";
import { getAdsSummary } from "@/lib/server/google-ads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const configured = (value: string | undefined) => Boolean(value && value.trim());

function inferReadiness(ga4Status: string, adsStatus: string) {
  if (ga4Status === "connected" && adsStatus === "connected") {
    return "live_read_only_sources_connected";
  }

  if (ga4Status === "connected" && adsStatus !== "connected") {
    return "ga4_connected_ads_pending";
  }

  if (adsStatus === "connected" && ga4Status !== "connected") {
    return "ads_connected_ga4_pending";
  }

  if (ga4Status === "error" || adsStatus === "error") {
    return "read_only_adapter_configured_with_errors";
  }

  return "draft_no_live_api_credentials";
}

export async function GET() {
  const hasGa4Property = configured(process.env.GA4_PROPERTY_ID);
  const hasGa4MeasurementId = configured(process.env.GA4_MEASUREMENT_ID);
  const hasAdsCustomer = configured(process.env.GOOGLE_ADS_CUSTOMER_ID);
  const hasAdsDeveloperToken = configured(process.env.GOOGLE_ADS_DEVELOPER_TOKEN);
  const hasServiceAccount =
    configured(process.env.GOOGLE_APPLICATION_CREDENTIALS) ||
    configured(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
  const [ga4, ads] = await Promise.all([getGa4Summary(), getAdsSummary()]);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    mode: "read_only_observer",
    environment: process.env.VERCEL_ENV ?? "local",
    noExternalWrites: true,
    sources: {
      ga4Property: hasGa4Property,
      ga4MeasurementId: hasGa4MeasurementId,
      ga4Connected: ga4.status === "connected",
      googleAdsCustomer: hasAdsCustomer,
      googleAdsDeveloperToken: hasAdsDeveloperToken,
      googleAdsConnected: ads.status === "connected",
      serviceAccount: hasServiceAccount
    },
    readiness: inferReadiness(ga4.status, ads.status),
    ga4,
    ads,
    missing: [...new Set([...ga4.missing, ...ads.missing])]
  });
}
