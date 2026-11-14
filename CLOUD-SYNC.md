# 全站雲端同步

將 `firestore-site.rules` 完整貼至 Firebase Console 的 Firestore Database → 規則並發布。此檔保留原先漫畫、書籍等集合權限，新增管理員自己的 `users/{uid}/siteData` 權限。前端限制不能替代資料庫規則。

執行 `npm run deploy` 發布 GitHub Pages。程式建置完成不代表網站已更新，也不代表 Firebase 規則已發布。

只有 UID `K6DbALyBPVdX8SkUf36TnyF20433` 可進入新版網站。讀取雲端資料成功後才初始化網站；登出會重新載入並隱藏私人頁面。

同步包含首頁分區、順序、釘選、影片分區、影片、封面、最愛、備註、看診紀錄及地圖。同步位置為 `users/K6DbALyBPVdX8SkUf36TnyF20433/siteData`。字串分塊儲存，避免封面使單份文件超過限制。

首次登入：雲端沒有對應資料類型時上傳現有瀏覽器資料；雲端已有時優先載入雲端。既有本機資料保留在 `yozulife:backup:` 前綴的 localStorage 項目；不會自動合併其他瀏覽器的舊收藏。請先從已有收藏的瀏覽器登入。

寫入先存本機待傳佇列，伺服器確認後才清除；失敗會顯示錯誤並重試。未成功同步前不要清除網站資料。初次開啟網站需要連線才能確認權限及載入雲端資料。

其他裝置更新會顯示重新載入按鈕，並停止本頁儲存以避免舊頁面覆蓋更新。以資料類型為單位同步；同時編輯同一類資料仍可能由最後一次寫入覆蓋，並非多人協作合併。

驗證：`node --test tests/cloud-storage.test.mjs`、`npm run build`。實際登入、讀寫與跨裝置驗證需在發布規則和網站後進行。
