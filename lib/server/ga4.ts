import { getGoogleAccessToken, hasGoogleServiceAccountConfig } from "./google-auth";

type SourceStatus = "connected" | "missing_config" | "error";

export type Ga4Summary = {
  status: SourceStatus;
  label: string;
  message: string;
  propertyId?: string;
  measurementId?: string;
  checkedAt: string;
  missing: string[];
  errorCode?: string;
  totals?: {
    activeUsers: number;
    sessions: number;
    eventCount: number;
  };
  yesterday?: {
    activeUsers: number;
    sessions: number;
    eventCount: number;
  };
  keyEvents?: Record<string, number>;
  topEvents?: Array<{
    eventName: string;
    eventCount: number;
  }>;
};

type RunReportResponse = {
  rows?: Array<{
    dimensionValues?: Array<{ value?: string }>;
    metricValues?: Array<{ value?: string }>;
  }>;
};

const GA4_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const KEY_EVENTS = [
  "landing_view",
  "start_assessment",
  "assessment_step_view",
  "assessment_step_answer",
  "complete_assessment",
  "view_assessment_result",
  "assessment_result_cta_click",
  "ask_ivy_start",
  "ask_ivy_message_submit",
  "ask_ivy_message_success",
  "consultation_start",
  "consultation_submit",
  "tool_start",
  "tool_complete"
];

function configured(value: string | undefined) {
  return Boolean(value && value.trim());
}

function toNumber(value: string | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function totalFromRow(response: RunReportResponse) {
  const values = response.rows?.[0]?.metricValues ?? [];

  return {
    activeUsers: toNumber(values[0]?.value),
    sessions: toNumber(values[1]?.value),
    eventCount: toNumber(values[2]?.value)
  };
}

async function runGa4Report(
  propertyId: string,
  accessToken: string,
  body: Record<string, unknown>
): Promise<RunReportResponse> {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(body)
    }
  );

  const payload = (await response.json().catch(() => null)) as
    | (RunReportResponse & { error?: { status?: string; message?: string } })
    | null;

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? `GA4 Data API HTTP ${response.status}`);
  }

  return payload ?? {};
}

export async function getGa4Summary(): Promise<Ga4Summary> {
  const propertyId = process.env.GA4_PROPERTY_ID?.trim();
  const measurementId = process.env.GA4_MEASUREMENT_ID?.trim();
  const checkedAt = new Date().toISOString();
  const missing = [
    !configured(propertyId) ? "GA4_PROPERTY_ID" : null,
    !hasGoogleServiceAccountConfig()
      ? "GOOGLE_APPLICATION_CREDENTIALS_JSON 或 GOOGLE_APPLICATION_CREDENTIALS"
      : null
  ].filter(Boolean) as string[];

  if (missing.length > 0) {
    return {
      status: "missing_config",
      label: "GA4 尚未接上",
      message: "尚未設定 GA4 Property ID 或 Google 只讀憑證。",
      propertyId,
      measurementId,
      checkedAt,
      missing
    };
  }

  const token = await getGoogleAccessToken([GA4_SCOPE]);

  if (!token.ok) {
    return {
      status: "error",
      label: "GA4 憑證錯誤",
      message: token.message,
      propertyId,
      measurementId,
      checkedAt,
      missing: token.missing,
      errorCode: token.code
    };
  }

  try {
    const metricBody = {
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "eventCount" }]
    };
    const yesterdayBody = {
      dateRanges: [{ startDate: "yesterday", endDate: "yesterday" }],
      metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "eventCount" }]
    };
    const eventsBody = {
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
      limit: 50
    };

    const [totalsResponse, yesterdayResponse, eventsResponse] = await Promise.all([
      runGa4Report(propertyId as string, token.accessToken, metricBody),
      runGa4Report(propertyId as string, token.accessToken, yesterdayBody),
      runGa4Report(propertyId as string, token.accessToken, eventsBody)
    ]);

    const topEvents =
      eventsResponse.rows?.slice(0, 12).map((row) => ({
        eventName: row.dimensionValues?.[0]?.value ?? "(not set)",
        eventCount: toNumber(row.metricValues?.[0]?.value)
      })) ?? [];

    const keyEvents = KEY_EVENTS.reduce<Record<string, number>>((accumulator, eventName) => {
      accumulator[eventName] =
        eventsResponse.rows?.reduce((total, row) => {
          const rowName = row.dimensionValues?.[0]?.value;
          return rowName === eventName ? total + toNumber(row.metricValues?.[0]?.value) : total;
        }, 0) ?? 0;
      return accumulator;
    }, {});

    return {
      status: "connected",
      label: "GA4 已接上只讀資料",
      message: "已成功讀取近 7 天彙總事件資料。",
      propertyId,
      measurementId,
      checkedAt,
      missing: [],
      totals: totalFromRow(totalsResponse),
      yesterday: totalFromRow(yesterdayResponse),
      keyEvents,
      topEvents
    };
  } catch (error) {
    return {
      status: "error",
      label: "GA4 讀取失敗",
      message: error instanceof Error ? error.message : "GA4 Data API 回傳未知錯誤。",
      propertyId,
      measurementId,
      checkedAt,
      missing: [],
      errorCode: "ga4_run_report_failed"
    };
  }
}
