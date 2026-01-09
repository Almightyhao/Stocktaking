# 藥品急領 PDCA 品質管理系統  
## Drug Inventory PDCA Dashboard

這是一個基於 **React** 的互動式儀表板，專為醫院藥局設計，用於分析藥品急領事件、視覺化庫存與耗用趨勢，並利用統計方法提供 **PDCA（Plan–Do–Check–Act）** 的庫存管理建議。

📦 原始碼與更新版本請見：  
👉 https://github.com/Almightyhao/Stocktaking

---

## ✨ 主要功能

- **📊 現況總覽（Check）**  
  即時統計急領事件總數，並自動分類為  
  - Type A：庫存不足  
  - Type B：突發爆量  
  - Type C：帳務 / 管理因素  

- **📈 雙軸趨勢圖**  
  將「每日庫存量」與「每日耗用量」整合於同一圖表，清楚呈現缺藥發生前後的動態變化。

- **🧮 智慧參數建議（Plan）**  
  - 自動計算建議 **安全存量（Safety Stock）**  
  - 自動計算建議 **最高庫存（Target Level）**  
  - 與醫院既有系統設定（System SS / Target）進行比較  

- **📂 彈性資料匯入**  
  - 支援上傳 CSV 格式的急領清單與每日耗用檔  
  - 自動偵測日期欄位，不限天數  

---

## 🚀 開始使用

### 1️⃣ 安裝依賴

請先確認已安裝 **Node.js**，然後在專案目錄中執行：

```bash
npm install
# 或
yarn install
