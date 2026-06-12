import { createSign } from "node:crypto";
import { readFileSync } from "node:fs";

type ServiceAccountCredentials = {
  client_email?: string;
  private_key?: string;
  token_uri?: string;
};

type TokenSuccess = {
  ok: true;
  accessToken: string;
  expiresAt: number;
  clientEmail: string;
};

type TokenFailure = {
  ok: false;
  code: string;
  message: string;
  missing: string[];
};

type TokenResult = TokenSuccess | TokenFailure;

const tokenCache = new Map<string, TokenSuccess>();

function configured(value: string | undefined) {
  return Boolean(value && value.trim());
}

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function parseCredentialJson(rawValue: string) {
  const trimmed = rawValue.trim();
  const jsonText = trimmed.startsWith("{")
    ? trimmed
    : Buffer.from(trimmed, "base64").toString("utf8");

  return JSON.parse(jsonText) as ServiceAccountCredentials;
}

function loadServiceAccountCredentials(): TokenFailure | { ok: true; credentials: ServiceAccountCredentials } {
  const jsonValue = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  const filePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (configured(jsonValue)) {
    try {
      return { ok: true, credentials: parseCredentialJson(jsonValue as string) };
    } catch {
      return {
        ok: false,
        code: "invalid_service_account_json",
        message: "GOOGLE_APPLICATION_CREDENTIALS_JSON 不是有效的 service account JSON 或 base64 JSON。",
        missing: []
      };
    }
  }

  if (configured(filePath)) {
    try {
      const fileText = readFileSync(filePath as string, "utf8");
      return { ok: true, credentials: JSON.parse(fileText) as ServiceAccountCredentials };
    } catch {
      return {
        ok: false,
        code: "invalid_service_account_file",
        message: "GOOGLE_APPLICATION_CREDENTIALS 指向的檔案無法讀取或不是有效 JSON。",
        missing: []
      };
    }
  }

  return {
    ok: false,
    code: "missing_service_account",
    message: "尚未設定 Google service account 只讀憑證。",
    missing: ["GOOGLE_APPLICATION_CREDENTIALS_JSON 或 GOOGLE_APPLICATION_CREDENTIALS"]
  };
}

export function hasGoogleServiceAccountConfig() {
  return configured(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) ||
    configured(process.env.GOOGLE_APPLICATION_CREDENTIALS);
}

export async function getGoogleAccessToken(scopes: string[]): Promise<TokenResult> {
  const loaded = loadServiceAccountCredentials();

  if (!loaded.ok) {
    return loaded;
  }

  const { credentials } = loaded;
  const clientEmail = credentials.client_email;
  const privateKey = credentials.private_key?.replace(/\\n/g, "\n");

  const missing = [
    !clientEmail ? "service_account.client_email" : null,
    !privateKey ? "service_account.private_key" : null
  ].filter(Boolean) as string[];

  if (missing.length > 0) {
    return {
      ok: false,
      code: "incomplete_service_account",
      message: "Google service account 憑證缺少必要欄位。",
      missing
    };
  }

  const scopeKey = scopes.slice().sort().join(" ");
  const cacheKey = `${clientEmail}:${scopeKey}`;
  const cached = tokenCache.get(cacheKey);
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (cached && cached.expiresAt - 60 > nowSeconds) {
    return cached;
  }

  const tokenUri = credentials.token_uri ?? "https://oauth2.googleapis.com/token";
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      iss: clientEmail,
      scope: scopeKey,
      aud: tokenUri,
      iat: nowSeconds,
      exp: nowSeconds + 3600
    })
  );
  const unsignedJwt = `${header}.${payload}`;

  let signature: string;
  try {
    const signer = createSign("RSA-SHA256");
    signer.update(unsignedJwt);
    signature = base64Url(signer.sign(privateKey as string));
  } catch {
    return {
      ok: false,
      code: "service_account_sign_failed",
      message: "Google service account private_key 無法用來簽署只讀 token。",
      missing: []
    };
  }

  const response = await fetch(tokenUri, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsignedJwt}.${signature}`
    })
  });

  const payloadJson = (await response.json().catch(() => null)) as
    | { access_token?: string; expires_in?: number; error?: string; error_description?: string }
    | null;

  if (!response.ok || !payloadJson?.access_token) {
    return {
      ok: false,
      code: payloadJson?.error ?? `token_http_${response.status}`,
      message: payloadJson?.error_description ?? "Google OAuth token 換取失敗。",
      missing: []
    };
  }

  const token: TokenSuccess = {
    ok: true,
    accessToken: payloadJson.access_token,
    expiresAt: nowSeconds + (payloadJson.expires_in ?? 3600),
    clientEmail: clientEmail as string
  };

  tokenCache.set(cacheKey, token);
  return token;
}
