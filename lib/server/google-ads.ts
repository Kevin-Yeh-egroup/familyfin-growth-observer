import { getGoogleAccessToken, hasGoogleServiceAccountConfig } from "./google-auth";

type SourceStatus = "connected" | "missing_config" | "error";

export type AdsSummary = {
  status: SourceStatus;
  label: string;
  message: string;
  checkedAt: string;
  customerId?: string;
  loginCustomerId?: string;
  apiVersion: string;
  missing: string[];
  errorCode?: string;
  currencyCode?: string;
  totals?: {
    impressions: number;
    clicks: number;
    costMicros: number;
    cost: number;
    conversions: number;
    ctr: number;
  };
  daily?: Array<{
    date: string;
    impressions: number;
    clicks: number;
    costMicros: number;
    cost: number;
    conversions: number;
  }>;
};

type AdsSearchStreamBatch = {
  results?: Array<{
    customer?: {
      currencyCode?: string;
    };
    segments?: {
      date?: string;
    };
    metrics?: {
      impressions?: string | number;
      clicks?: string | number;
      costMicros?: string | number;
      conversions?: string | number;
      ctr?: number;
    };
  }>;
};

const ADS_SCOPE = "https://www.googleapis.com/auth/adwords";

function configured(value: string | undefined) {
  return Boolean(value && value.trim());
}

function normalizeCustomerId(value: string | undefined) {
  return value?.replace(/-/g, "").trim();
}

function toNumber(value: string | number | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function summarizeDaily(batches: AdsSearchStreamBatch[]) {
  const rows = batches.flatMap((batch) => batch.results ?? []);
  const dailyMap = new Map<
    string,
    {
      date: string;
      impressions: number;
      clicks: number;
      costMicros: number;
      cost: number;
      conversions: number;
    }
  >();

  for (const row of rows) {
    const date = row.segments?.date ?? "unknown";
    const existing =
      dailyMap.get(date) ??
      {
        date,
        impressions: 0,
        clicks: 0,
        costMicros: 0,
        cost: 0,
        conversions: 0
      };

    const costMicros = toNumber(row.metrics?.costMicros);
    existing.impressions += toNumber(row.metrics?.impressions);
    existing.clicks += toNumber(row.metrics?.clicks);
    existing.costMicros += costMicros;
    existing.cost += costMicros / 1_000_000;
    existing.conversions += toNumber(row.metrics?.conversions);
    dailyMap.set(date, existing);
  }

  const daily = [...dailyMap.values()].sort((a, b) => b.date.localeCompare(a.date));
  const totals = daily.reduce(
    (accumulator, row) => {
      accumulator.impressions += row.impressions;
      accumulator.clicks += row.clicks;
      accumulator.costMicros += row.costMicros;
      accumulator.cost += row.cost;
      accumulator.conversions += row.conversions;
      return accumulator;
    },
    {
      impressions: 0,
      clicks: 0,
      costMicros: 0,
      cost: 0,
      conversions: 0,
      ctr: 0
    }
  );

  totals.ctr = totals.impressions > 0 ? totals.clicks / totals.impressions : 0;

  return {
    currencyCode: rows.find((row) => row.customer?.currencyCode)?.customer?.currencyCode,
    totals,
    daily
  };
}

export async function getAdsSummary(): Promise<AdsSummary> {
  const customerId = normalizeCustomerId(process.env.GOOGLE_ADS_CUSTOMER_ID);
  const loginCustomerId = normalizeCustomerId(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID);
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN?.trim();
  const apiVersion = process.env.GOOGLE_ADS_API_VERSION?.trim() || "v24";
  const checkedAt = new Date().toISOString();
  const missing = [
    !configured(customerId) ? "GOOGLE_ADS_CUSTOMER_ID" : null,
    !configured(developerToken) ? "GOOGLE_ADS_DEVELOPER_TOKEN" : null,
    !hasGoogleServiceAccountConfig()
      ? "GOOGLE_APPLICATION_CREDENTIALS_JSON 或 GOOGLE_APPLICATION_CREDENTIALS"
      : null
  ].filter(Boolean) as string[];

  if (missing.length > 0) {
    return {
      status: "missing_config",
      label: "Ads 尚未接上",
      message: "尚未設定 Google Ads Customer ID、developer token 或 Google 只讀憑證。",
      checkedAt,
      customerId,
      loginCustomerId,
      apiVersion,
      missing
    };
  }

  const token = await getGoogleAccessToken([ADS_SCOPE]);

  if (!token.ok) {
    return {
      status: "error",
      label: "Ads 憑證錯誤",
      message: token.message,
      checkedAt,
      customerId,
      loginCustomerId,
      apiVersion,
      missing: token.missing,
      errorCode: token.code
    };
  }

  try {
    const response = await fetch(
      `https://googleads.googleapis.com/${apiVersion}/customers/${customerId}/googleAds:searchStream`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${token.accessToken}`,
          "content-type": "application/json",
          "developer-token": developerToken as string,
          ...(loginCustomerId ? { "login-customer-id": loginCustomerId } : {})
        },
        body: JSON.stringify({
          query: `
            SELECT
              customer.currency_code,
              segments.date,
              metrics.impressions,
              metrics.clicks,
              metrics.cost_micros,
              metrics.conversions
            FROM customer
            WHERE segments.date DURING LAST_7_DAYS
            ORDER BY segments.date DESC
          `
        })
      }
    );

    const payload = (await response.json().catch(() => null)) as
      | (AdsSearchStreamBatch[] & { error?: { status?: string; message?: string } })
      | null;

    if (!response.ok || !Array.isArray(payload)) {
      const errorPayload = payload as { error?: { status?: string; message?: string } } | null;
      return {
        status: "error",
        label: "Ads 讀取失敗",
        message: errorPayload?.error?.message ?? `Google Ads API HTTP ${response.status}`,
        checkedAt,
        customerId,
        loginCustomerId,
        apiVersion,
        missing: [],
        errorCode: errorPayload?.error?.status ?? `ads_http_${response.status}`
      };
    }

    const summary = summarizeDaily(payload);

    return {
      status: "connected",
      label: "Ads 已接上只讀資料",
      message: "已成功讀取近 7 天廣告彙總資料。",
      checkedAt,
      customerId,
      loginCustomerId,
      apiVersion,
      missing: [],
      currencyCode: summary.currencyCode,
      totals: summary.totals,
      daily: summary.daily
    };
  } catch (error) {
    return {
      status: "error",
      label: "Ads 讀取失敗",
      message: error instanceof Error ? error.message : "Google Ads API 回傳未知錯誤。",
      checkedAt,
      customerId,
      loginCustomerId,
      apiVersion,
      missing: [],
      errorCode: "ads_search_stream_failed"
    };
  }
}
