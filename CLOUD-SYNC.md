# 全站雲端同步

將 `firestore-site.rules` 完整貼至 Firebase Console 的 Firestore Database → 規則並發布。此檔保留原先漫畫、書籍等集合權限，新增管理員自己的 `users/{uid}/siteData` 權限。前端限制不能替代資料庫規則。

執行 `npm run deploy` 發布 GitHub Pages。程式建置完成不代表網站已更新，也不代表 Firebase 規則已發布。

只有 UID `K6DbALyBPVdX8SkUf36TnyF20433` 可進入新版網站。讀取雲端資料成功後才初始化網站；登出會重新載入並隱藏私人頁面。

同步包含首頁分區、順序、釘選、影片分區、影片、封面、最愛、備註、看診紀錄及地圖。同步位置為 `users/K6DbALyBPVdX8SkUf36TnyF20433/siteData`。字串分塊儲存，避免封面使單份文件超過限制。

個人設定也會同步：登入背景、自訂大頭貼、網站 favicon、背景焦點與日夜色調。登入後點大頭貼或「個人設定」開啟；手機使用底部「我的」。大頭貼預設採 Google 帳號圖片，可恢復預設。圖片限 JPG、PNG、WebP 且小於 15 MB，儲存前縮圖壓縮；大頭貼及圖示採中央正方形裁切。

登入前沒有權限讀取雲端私人設定，因此登入風景與 favicon 使用目前瀏覽器的外觀快取；新裝置首次顯示預設風景，成功登入後才取得帳號設定。清除瀏覽器資料後亦同。登出前會確認同步已完成；確認彈窗取消時不會離開網站。

`src/v2/ui.js` 提供 `createDialog`、非同步 `confirmDialog`、`notify` 和 `loader` 共用元件。確認彈窗使用原生 dialog 的焦點限制與背景 inert，支援 Esc、背景點擊關閉及回復焦點；動畫支援 prefers-reduced-motion。

首次登入：雲端沒有對應資料類型時上傳現有瀏覽器資料；雲端已有時優先載入雲端。既有本機資料保留在 `yozulife:backup:` 前綴的 localStorage 項目；不會自動合併其他瀏覽器的舊收藏。請先從已有收藏的瀏覽器登入。

寫入先存本機待傳佇列，伺服器確認後才清除；失敗會顯示錯誤並重試。未成功同步前不要清除網站資料。初次開啟網站需要連線才能確認權限及載入雲端資料。

其他裝置更新會顯示重新載入按鈕，並停止本頁儲存以避免舊頁面覆蓋更新。以資料類型為單位同步；同時編輯同一類資料仍可能由最後一次寫入覆蓋，並非多人協作合併。

驗證：`node --test tests/cloud-storage.test.mjs`、`npm run build`。實際登入、讀寫與跨裝置驗證需在發布規則和網站後進行。

介面瀏覽器測試：安裝可用的 Playwright 後執行 `node tests/experience.browser.mjs`。可用 `YOZU_PLAYWRIGHT` 指向外部安裝的模組、`YOZU_PREVIEW` 指定 Vite 預覽網址、`YOZU_SCREENSHOTS` 指定截圖目錄。測試使用 Chrome，登入與資料庫透過測試請求攔截替代；不會接觸正式資料。涵蓋響應式、上傳、取消/儲存、設定保留、主題、減少動態、巢狀確認、焦點與登出流程；不代表正式 Firebase 登入與同步已經實測。
