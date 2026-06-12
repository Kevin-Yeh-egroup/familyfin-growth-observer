"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  approvalGates,
  dailyMetrics,
  dailyReportIndicators,
  dailyReportMeta,
  dailyReportQuestions,
  dailyReportSections,
  decisionRules,
  funnels,
  glossary,
  mailAutomationRules,
  readinessProgress,
  rollups,
  sourceSummary,
  statusLabels,
  type StatusTone
} from "@/lib/observer-config";

type SourceStatus = {
  generatedAt: string;
  mode: string;
  environment: string;
  noExternalWrites: boolean;
  sources: Record<string, boolean>;
  readiness: string;
  ga4?: {
    status: "connected" | "missing_config" | "error";
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
  ads?: {
    status: "connected" | "missing_config" | "error";
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
  };
  missing?: string[];
};

const readinessText: Record<string, string> = {
  draft_no_live_api_credentials: "尚未接正式資料源",
  ready_for_read_only_ga4_adapter: "可接 GA4 只讀資料",
  live_read_only_sources_connected: "GA4 / Ads 已接只讀資料",
  ga4_connected_ads_pending: "GA4 已接上，Ads 待補設定",
  ads_connected_ga4_pending: "Ads 已接上，GA4 待補設定",
  read_only_adapter_configured_with_errors: "只讀資料源讀取錯誤",
  checking_source_status: "正在確認",
  unknown: "狀態未知"
};

const toneDescriptions: Record<StatusTone, string> = {
  pass: "目前正常，可以持續觀察。",
  watch: "可以看方向，但還不能下成效結論。",
  revise: "已看到問題，需要修正或補資料。",
  block: "資料不足或設定有阻塞，先不要做決策。"
};

function percentStyle(value: number): CSSProperties {
  return { "--bar-value": `${value}%` } as CSSProperties;
}

function formatNumber(value: number | undefined) {
  return new Intl.NumberFormat("zh-TW").format(value ?? 0);
}

function formatPercent(value: number | undefined) {
  return `${(((value ?? 0) * 100)).toFixed(2)}%`;
}

function formatCurrency(value: number | undefined, currencyCode?: string) {
  try {
    return new Intl.NumberFormat("zh-TW", {
      style: "currency",
      currency: currencyCode ?? "TWD",
      maximumFractionDigits: 0
    }).format(value ?? 0);
  } catch {
    return `${formatNumber(value)} ${currencyCode ?? ""}`.trim();
  }
}

function statusTone(status: string | undefined): StatusTone {
  if (status === "connected") {
    return "pass";
  }

  if (status === "error") {
    return "revise";
  }

  return "watch";
}

export function ObserverDashboard() {
  const [activeFunnel, setActiveFunnel] = useState(funnels[0].name);
  const [sourceStatus, setSourceStatus] = useState<SourceStatus | null>(null);
  const [copyState, setCopyState] = useState("複製日報文字");

  useEffect(() => {
    let mounted = true;

    fetch("/api/source-status", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: SourceStatus) => {
        if (mounted) {
          setSourceStatus(payload);
        }
      })
      .catch(() => {
        if (mounted) {
          setSourceStatus(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const selectedFunnel = useMemo(
    () => funnels.find((funnel) => funnel.name === activeFunnel) ?? funnels[0],
    [activeFunnel]
  );

  const readiness =
    readinessText[sourceStatus?.readiness ?? "checking_source_status"] ??
    sourceStatus?.readiness ??
    readinessText.unknown;
  const ga4 = sourceStatus?.ga4;
  const ads = sourceStatus?.ads;
  const hasAnyLiveSource = ga4?.status === "connected" || ads?.status === "connected";
  const sourceCaveat = hasAnyLiveSource
    ? "已接入至少一個只讀資料源。下方數字來自 API 彙總資料，只用來做趨勢判斷，不含個人資料，也不會修改 GA4、GTM 或 Ads。"
    : dailyReportMeta.caveat;

  const reportDate = useMemo(() => {
    const baseDate = sourceStatus?.generatedAt
      ? new Date(sourceStatus.generatedAt)
      : new Date();

    return new Intl.DateTimeFormat("zh-TW", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(baseDate);
  }, [sourceStatus?.generatedAt]);

  const dailyReportText = useMemo(
    () =>
      [
        "好理家在行銷與產品每日報告",
        `產生時間：${reportDate}`,
        `報告週期：${dailyReportMeta.period}`,
        `今日結論：${dailyReportMeta.conclusion}`,
        "",
        "資料限制：",
        sourceCaveat,
        "",
        "資料源入帳狀態：",
        `GA4：${ga4?.label ?? "尚未檢查"}`,
        `Ads：${ads?.label ?? "尚未檢查"}`,
        ...(ga4?.totals
          ? [
              `GA4 近 7 天：活躍使用者 ${formatNumber(ga4.totals.activeUsers)}、工作階段 ${formatNumber(ga4.totals.sessions)}、事件 ${formatNumber(ga4.totals.eventCount)}。`
            ]
          : []),
        ...(ads?.totals
          ? [
              `Ads 近 7 天：曝光 ${formatNumber(ads.totals.impressions)}、點擊 ${formatNumber(ads.totals.clicks)}、花費 ${formatCurrency(ads.totals.cost, ads.currencyCode)}、轉換 ${formatNumber(ads.totals.conversions)}。`
            ]
          : []),
        "",
        ...dailyReportSections.flatMap((section) => [
          section.title,
          `摘要：${section.summary}`,
          ...section.points.map((point) => `- ${point}`),
          ""
        ]),
        "自動化校準規則：",
        ...mailAutomationRules.map((rule) => `- ${rule.title}：${rule.rule}`)
      ].join("\n"),
    [ads, ga4, reportDate, sourceCaveat]
  );

  function copyDailyReport() {
    navigator.clipboard
      .writeText(dailyReportText)
      .then(() => {
        setCopyState("已複製");
        window.setTimeout(() => setCopyState("複製日報文字"), 1600);
      })
      .catch(() => {
        setCopyState("請手動選取文字");
        window.setTimeout(() => setCopyState("複製日報文字"), 2200);
      });
  }

  return (
    <main>
      <section className="top-band">
        <div className="top-copy">
          <p className="eyebrow">好理家在網站偵查台</p>
          <h1>把網站數據變成看得懂的每日判斷</h1>
          <p className="lede">
            這個頁面是給你看的管理儀表板，不是工程文件。它會用白話和圖表說明：
            網站有沒有收資料、使用者卡在哪裡、該修產品流程還是先檢查廣告。
          </p>
        </div>
        <div className="status-strip" aria-label="目前保護狀態">
          <span>公開網址</span>
          <span>不給搜尋引擎收錄</span>
          <span>只讀不修改</span>
        </div>
      </section>

      <section className="surface answer-panel">
        <div>
          <p className="section-kicker">目前這頁先幫你看三件事</p>
          <h2>先知道有沒有收數，再判斷要修哪裡</h2>
        </div>
        <div className="answer-grid">
          {dailyReportQuestions.map((question) => (
            <div className="answer-item" key={question}>
              <span aria-hidden="true" />
              <p>{question}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="surface daily-report" aria-labelledby="daily-report-title">
        <div className="daily-report-head">
          <div>
            <p className="section-kicker">每日報告</p>
            <h2 id="daily-report-title">{dailyReportMeta.title}</h2>
            <p>{dailyReportMeta.conclusion}</p>
          </div>
          <div className="report-meta" aria-label="每日報告狀態">
            <span>{dailyReportMeta.status}</span>
            <strong>{reportDate}</strong>
            <small>{dailyReportMeta.period}</small>
          </div>
        </div>

        <div className="report-warning">
          <strong>目前怎麼解讀</strong>
          <p>{sourceCaveat}</p>
        </div>

        <div className="live-source-grid" aria-label="GA4 與 Ads 只讀資料源">
          <article data-tone={statusTone(ga4?.status)}>
            <div className="tile-head">
              <p>GA4 只讀資料</p>
              <span>{ga4?.label ?? "尚未檢查"}</span>
            </div>
            <p>{ga4?.message ?? "正在等待 API 狀態。"}</p>
            {ga4?.totals ? (
              <div className="live-metrics">
                <div>
                  <span>近 7 天活躍使用者</span>
                  <strong>{formatNumber(ga4.totals.activeUsers)}</strong>
                </div>
                <div>
                  <span>近 7 天工作階段</span>
                  <strong>{formatNumber(ga4.totals.sessions)}</strong>
                </div>
                <div>
                  <span>近 7 天事件數</span>
                  <strong>{formatNumber(ga4.totals.eventCount)}</strong>
                </div>
                <div>
                  <span>昨天事件數</span>
                  <strong>{formatNumber(ga4.yesterday?.eventCount)}</strong>
                </div>
              </div>
            ) : (
              <ul className="missing-list">
                {(ga4?.missing?.length ? ga4.missing : ["等待 GA4 只讀設定"]).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {ga4?.keyEvents && (
              <details>
                <summary>關鍵事件近 7 天</summary>
                <div className="event-pill-grid">
                  {Object.entries(ga4.keyEvents).map(([eventName, count]) => (
                    <span key={eventName}>
                      <code>{eventName}</code>
                      {formatNumber(count)}
                    </span>
                  ))}
                </div>
              </details>
            )}
          </article>

          <article data-tone={statusTone(ads?.status)}>
            <div className="tile-head">
              <p>Ads 只讀資料</p>
              <span>{ads?.label ?? "尚未檢查"}</span>
            </div>
            <p>{ads?.message ?? "正在等待 API 狀態。"}</p>
            {ads?.totals ? (
              <div className="live-metrics">
                <div>
                  <span>近 7 天曝光</span>
                  <strong>{formatNumber(ads.totals.impressions)}</strong>
                </div>
                <div>
                  <span>近 7 天點擊</span>
                  <strong>{formatNumber(ads.totals.clicks)}</strong>
                </div>
                <div>
                  <span>近 7 天 CTR</span>
                  <strong>{formatPercent(ads.totals.ctr)}</strong>
                </div>
                <div>
                  <span>近 7 天花費</span>
                  <strong>{formatCurrency(ads.totals.cost, ads.currencyCode)}</strong>
                </div>
              </div>
            ) : (
              <ul className="missing-list">
                {(ads?.missing?.length ? ads.missing : ["等待 Ads 只讀設定"]).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </article>
        </div>

        <div className="report-indicators" aria-label="每日報告準備度圖表">
          {dailyReportIndicators.map((indicator) => (
            <div className="mini-chart" data-tone={indicator.tone} key={indicator.label}>
              <div>
                <strong>{indicator.label}</strong>
                <span>{indicator.value}%</span>
              </div>
              <div className="bar-track">
                <span className="bar-fill" style={percentStyle(indicator.value)} />
              </div>
              <p>{indicator.meaning}</p>
            </div>
          ))}
        </div>

        <div className="report-sections">
          {dailyReportSections.map((section) => (
            <article className="report-section" data-tone={section.tone} key={section.title}>
              <div className="tile-head">
                <p>{section.title}</p>
                <span>{statusLabels[section.tone]}</span>
              </div>
              <strong>{section.summary}</strong>
              <ul>
                {section.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="automation-panel">
          <div>
            <p className="section-kicker">接到既有 Gmail 自動化</p>
            <h3>讓 Email 建議先被 GA4 / Ads 校準</h3>
            <p>
              原本自動化會讀信箱報表與建議；這次加入 GA4 / Ads 後，日報會先判斷資料是否支持建議，
              再決定要改功能、改文案、檢查追蹤，或暫時不動廣告。
            </p>
          </div>
          <div className="automation-rules">
            {mailAutomationRules.map((rule) => (
              <article key={rule.title}>
                <strong>{rule.title}</strong>
                <p>{rule.rule}</p>
                <small>{rule.output}</small>
              </article>
            ))}
          </div>
        </div>

        <div className="copy-panel">
          <div className="copy-head">
            <div>
              <p className="section-kicker">可放進日報的文字</p>
              <h3>今天先用這段做紀錄</h3>
            </div>
            <button onClick={copyDailyReport} type="button">
              {copyState}
            </button>
          </div>
          <pre>{dailyReportText}</pre>
        </div>
      </section>

      <section className="section-heading">
        <p className="section-kicker">資料源總覽</p>
        <h2>這些工具各自負責什麼</h2>
      </section>

      <section className="section-grid source-grid" aria-label="資料源總覽">
        {sourceSummary.map((source) => (
          <article className="source-tile" data-tone={source.tone} key={source.title}>
            <div className="tile-head">
              <p>{source.title}</p>
              <span>{statusLabels[source.tone]}</span>
            </div>
            <strong>{source.state}</strong>
            <p>{source.plainMeaning}</p>
            <details>
              <summary>技術名稱</summary>
              <code>{source.technicalName}</code>
              <small>{source.detail}</small>
            </details>
          </article>
        ))}
      </section>

      <section className="surface split">
        <div>
          <p className="section-kicker">資料源狀態</p>
          <h2>{readiness}</h2>
          <p>
            {hasAnyLiveSource
              ? "目前這個偵查台已開始讀取只讀資料源。若只接上其中一個來源，日報會標示另一個資料缺口。"
              : "目前這個偵查台已經可以公開查看，但還沒有接入 GA4 或 Ads 的只讀資料。所以下方圖表是「報表結構與觀察順序」，不是即時成效數字。"}
          </p>
        </div>
        <dl className="status-list">
          <div>
            <dt>目前環境</dt>
            <dd>{sourceStatus?.environment === "production" ? "正式部署" : "本機或檢查中"}</dd>
          </div>
          <div>
            <dt>是否會修改外部系統</dt>
            <dd>{sourceStatus?.noExternalWrites ? "不會，只讀" : "不會，只讀"}</dd>
          </div>
          <div>
            <dt>下一步</dt>
            <dd>
              {sourceStatus?.missing?.length
                ? `待補：${sourceStatus.missing.join("、")}`
                : "GA4 / Ads 只讀資料已可供日報判斷。"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="surface">
        <div className="section-heading inline">
          <div>
            <p className="section-kicker">圖表一</p>
            <h2>整體準備度</h2>
          </div>
          <p>橫條越長代表該階段越接近可用。這裡顯示的是建置狀態，不是流量成效。</p>
        </div>
        <div className="readiness-chart" aria-label="整體準備度圖表">
          {readinessProgress.map((item) => (
            <div className="progress-row" data-tone={item.tone} key={item.label}>
              <div className="progress-label">
                <strong>{item.label}</strong>
                <span>{statusLabels[item.tone]}</span>
              </div>
              <div className="bar-track">
                <span className="bar-fill" style={percentStyle(item.value)} />
              </div>
              <p>{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-heading">
        <p className="section-kicker">日報核心狀態</p>
        <h2>每天先看這四個判斷</h2>
      </section>

      <section className="section-grid metric-grid" aria-label="日報核心狀態">
        {dailyMetrics.map((metric) => (
          <article className="metric-tile" data-tone={metric.tone} key={metric.title}>
            <div className="tile-head">
              <p>{metric.title}</p>
              <span>{statusLabels[metric.tone]}</span>
            </div>
            <strong>{metric.state}</strong>
            <p>{metric.question}</p>
            <small>{metric.meaning}</small>
          </article>
        ))}
      </section>

      <section className="surface">
        <div className="section-heading inline">
          <div>
            <p className="section-kicker">圖表二</p>
            <h2>使用者流程漏斗</h2>
          </div>
          <p>這張圖是在說「要看哪幾段」。真正數字要等接上只讀資料源後才會出現。</p>
        </div>
        <div className="funnel-toolbar" aria-label="漏斗切換">
          {funnels.map((funnel) => (
            <button
              aria-pressed={activeFunnel === funnel.name}
              key={funnel.name}
              onClick={() => setActiveFunnel(funnel.name)}
              type="button"
            >
              {funnel.plainName}
            </button>
          ))}
        </div>
        <div className="funnel-body">
          <div>
            <h3>{selectedFunnel.plainName}</h3>
            <p>{selectedFunnel.purpose}</p>
            <div className="legend-box">
              <strong>讀圖方式</strong>
              <span>每一格都是一個使用者行為。哪一格掉很多人，就優先查那一段。</span>
            </div>
          </div>
          <ol className="funnel-flow">
            {selectedFunnel.steps.map((step, index) => (
              <li key={step.code}>
                <span className="step-number">{index + 1}</span>
                <div>
                  <strong>{step.label}</strong>
                  <p>{step.question}</p>
                  <small>{step.meaning}</small>
                  <details>
                    <summary>事件代碼</summary>
                    <code>{step.code}</code>
                  </details>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="surface">
        <div className="section-heading inline">
          <div>
            <p className="section-kicker">圖表三</p>
            <h2>報表週期時間軸</h2>
          </div>
          <p>週、月、季、半年、年都用自然年度，不把跨年的資料混在一起。</p>
        </div>
        <div className="timeline" aria-label="報表週期時間軸">
          {rollups.map((rollup) => (
            <article key={rollup.period}>
              <strong>{rollup.period}</strong>
              <span>{rollup.boundary}</span>
              <p>{rollup.question}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-grid two-column">
        <section className="surface compact">
          <p className="section-kicker">判斷規則</p>
          <h2>先分清楚是產品問題，還是廣告問題</h2>
          <div className="rule-list">
            {decisionRules.map((rule) => (
              <article key={rule.signal}>
                <strong>{rule.signal}</strong>
                <p>可能原因：{rule.likelyReason}</p>
                <span>第一步：{rule.firstMove}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="surface compact">
          <p className="section-kicker">安全界線</p>
          <h2>這些事不能自動做</h2>
          <ul className="gate-list">
            {approvalGates.map((gate) => (
              <li key={gate}>{gate}</li>
            ))}
          </ul>
        </section>
      </section>

      <section className="surface">
        <div className="section-heading inline">
          <div>
            <p className="section-kicker">名詞解釋</p>
            <h2>把技術字翻成白話</h2>
          </div>
          <p>如果之後還有看不懂的詞，我會把它加進這裡。</p>
        </div>
        <div className="glossary-grid">
          {glossary.map((item) => (
            <article key={item.term}>
              <strong>{item.term}</strong>
              <p>{item.plain}</p>
              <small>{item.example}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="note-band">
        <strong>目前狀態提醒</strong>
        <p>{toneDescriptions.watch} 這一版重點是讓你看得懂偵查邏輯；接上只讀 API 後，才會開始顯示正式趨勢數字。</p>
      </section>
    </main>
  );
}
