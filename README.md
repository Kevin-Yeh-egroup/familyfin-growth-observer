# 好理家在網站偵查台

這是一個獨立於 `dbs-client` 的網站偵查與日報儀表板。

公開網址：

https://familyfin-growth-observer.vercel.app

## 這個工具在做什麼

- 用白話說明好理家在目前的 GA4、GTM、Google Ads 追蹤狀態。
- 用圖表呈現「資料源準備度」、「使用者流程漏斗」、「報表週期」。
- 說明每天日報應該回答哪些問題。
- 幫助判斷問題比較像是產品流程、頁面文案、手機版操作，還是廣告流量品質。
- 保留 `noindex`，讓搜尋引擎不要收錄。

## 目前還沒有做什麼

- 尚未讀取 GA4 真實資料。
- 尚未讀取 Google Ads 真實資料。
- 尚未匯入任何 Ads 轉換。
- 尚未修改 GTM、GA4、Ads 或好理家在網站。
- 尚未保存任何使用者資料。

## 為什麼要獨立成 repo

好理家在主站負責收集事件，這個 repo 只負責整理和呈現。

這樣可以避免把內部分析工具混進正式網站，也能讓報表、日報、偵查規則獨立更新。

## 後續要接的資料

未來如果要顯示真實數字，需要在 Vercel 設定只讀環境變數。

可能會用到：

- `GA4_PROPERTY_ID`
- `GA4_MEASUREMENT_ID`
- `GOOGLE_ADS_CUSTOMER_ID`
- `GOOGLE_ADS_LOGIN_CUSTOMER_ID`
- `GOOGLE_APPLICATION_CREDENTIALS` 或 `GOOGLE_APPLICATION_CREDENTIALS_JSON`

請不要把真實密鑰放進 repo。

## 安全規則

- 這個工具只讀資料，不寫入 GA4、GTM、Ads 或正式網站。
- 還沒有 Kevin 明確確認前，不移除 `noindex`。
- 不公開詳細廣告成本、內部決策、密鑰、帳號權限或敏感營運資訊。
- 未來接真實資料時，畫面只呈現彙整後的趨勢，不呈現個人資料。

## 本機開發

```powershell
npm install
npm run dev
```

開啟：

```text
http://localhost:3000
```
