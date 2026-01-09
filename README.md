# 藥品急領 PDCA 品質管理系統  
## Drug Inventory PDCA Dashboard

這是一個基於 **React** 的互動式儀表板，專為醫院藥局設計，用於分析藥品急領事件、視覺化庫存與耗用趨勢，並利用統計方法提供 **PDCA（Plan–Do–Check–Act）** 的庫存管理建議。

📦 原始碼與更新版本：  
👉 https://github.com/Almightyhao/Stocktaking

---

## ✨ 主要功能

- **📊 現況總覽（Check）**  
  即時統計急領事件總數，並自動分類為：  
  - Type A：庫存不足  
  - Type B：突發爆量  
  - Type C：帳務／管理因素  

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
2️⃣ 啟動專案
bash
複製程式碼
npm start
# 或
yarn start
完成後，開啟瀏覽器並前往：

arduino
複製程式碼
http://localhost:3000
📄 資料格式說明
本系統需上傳 兩個 CSV 檔案 進行分析，請參考專案中的範例檔：

0108.csv

每日耗用.csv

📌 1. 急領清單主檔（例如：0108.csv）
主要分析檔，包含藥品基本資料、統計參數與每日庫存歷史。

必要欄位
藥碼

藥名

急領量

急領日期

統計欄位
Mean：平均日耗用量

Std：標準差

Stock_Before：急領前庫存

日期欄位
系統會自動掃描標題列（Header）

請使用 YYYY-MM-DD 格式（例如 2025-12-01）

天數不限：可上傳 30 天、60 天或任何天數資料

分類欄位
Type：標記 Type A / Type B / Type C

CSV 範例
csv
複製程式碼
Jan,藥名,單位,急領量,急領日期,...,Mean,Std,Stock_Before,Type,2025-12-01,2025-12-02,2025-12-03
005SAP01,SAPHNELO,VIAL,2,1141231,...,0.056,0.232,0,Type A,1,1,1
📌 2. 每日耗用檔（例如：每日耗用.csv）
用於輔助繪製長條圖，顯示每日的實際消耗量。

格式說明
第一欄為 藥碼

後續欄位為日期（YYYY-MM-DD）

系統會根據藥碼自動將耗用數據對應到主檔的趨勢圖中

CSV 範例
csv
複製程式碼
列標籤,2025-12-01,2025-12-02,2025-12-03,2025-12-04
005SAP01,0,0,0,1
005SIL17,1,0,1,0
💡 小技巧：如果上傳後出現亂碼，請在介面上切換編碼格式（支援 Big5 / UTF-8）。

📐 庫存管理公式
建議安全存量（Safety Stock）
text
複製程式碼
SS = Z × Std × √LT
Z：1.645（95% 服務水準）

Std：每日耗用標準差

LT：前置時間（Lead Time，預設 1 天）

建議最高庫存（Target Level）
text
複製程式碼
Target = Mean × (R + LT) + SS
Mean：平均日耗用量

R：檢視週期（Review Period，常用 7 或 14 天）

🛠️ 技術棧
Frontend：React.js

Visualization：Recharts

Styling：Tailwind CSS

Icons：Lucide React

Data Parsing：Custom CSV Parser（Dynamic Date Detection）

📝 License
本專案僅供 學術研究 與 醫院內部品質管理 使用。
