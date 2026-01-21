import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    LineChart, Line, BarChart, Bar, ComposedChart, XAxis, YAxis, CartesianGrid, 
    Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ReferenceLine, 
    PieChart, Pie, Cell, Sector 
} from 'recharts';
import { AlertCircle, TrendingUp, ClipboardCheck, Activity, X, FileText, Upload, Eye, AlertTriangle, Hash, FileBarChart } from 'lucide-react';

// --- 內建模擬數據 (預覽用) ---
// 1. 急領資料
const RAW_URGENT_DATA = `Jan,藥名,單位,急領量,急領日期,西元日期,2025-11-30,2025-12-01,2025-12-02,2025-12-03,2025-12-04,2025-12-05,2025-12-06,2025-12-07,2025-12-08,2025-12-09,2025-12-10,2025-12-11,2025-12-12,2025-12-13,2025-12-14,2025-12-15,2025-12-16,2025-12-17,2025-12-18,2025-12-19,2025-12-20,2025-12-21,2025-12-22,2025-12-23,2025-12-24,2025-12-25,2025-12-26,2025-12-27,2025-12-28,2025-12-29,2025-12-30,2025-12-31,2026-01-01,2026-01-02,2026-01-03,2026-01-04,2026-01-05,Sys_SS,Sys_Target,Mean,Std,Stock_Before,Cons_Day,Type,Is_Low_SS,Is_Low_Target,Review_Period
005SAP01,"SAPHNELO CONC. FOR SOLN 150 MG/ML",VIAL,2,1141231,46022,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.056,0.232,0,1,Type A (庫存不足),0,0,14
005SIL17,"SILIVERZINE CREAM 1% 500 G",BOT,10,1141231,46022,7,7,7,6,6,5,3,2,5,5,5,4,5,5,5,5,4,4,7,5,4,3,3,3,2,2,1,1,1,1,1,1,0,0,5,4,3,2,5,0.540,1.373,1,10,Type B (突發爆量),0,0,14
005ASP08,ASPIRIN PROTECT 100MG,TAB,500,1141215,46006,200,180,150,120,100,50,20,10,0,0,500,450,400,350,300,250,200,150,100,50,0,0,600,550,500,450,400,350,300,250,200,150,100,50,0,0,600,100,800,45.5,12.2,20,500,Type A (庫存不足),0,0,7
005PAN01,PANADOL EXTEND 665MG,TAB,200,1141220,46011,1000,950,900,850,800,750,700,650,600,550,500,450,400,350,300,250,200,150,100,50,0,1200,1150,1100,1050,1000,950,900,850,800,750,700,650,600,550,500,450,200,1500,60.2,15.5,50,200,Type C (帳務/管理),1,1,14`;

// 2. 耗用模擬資料 (對應上述藥品)
const RAW_CONSUMPTION_DATA = `列標籤,2025-11-30,2025-12-01,2025-12-02,2025-12-03,2025-12-04,2025-12-05,2025-12-06,2025-12-07,2025-12-08,2025-12-09,2025-12-10,2025-12-11,2025-12-12,2025-12-13,2025-12-14,2025-12-15,2025-12-16,2025-12-17,2025-12-18,2025-12-19,2025-12-20,2025-12-21,2025-12-22,2025-12-23,2025-12-24,2025-12-25,2025-12-26,2025-12-27,2025-12-28,2025-12-29,2025-12-30,2025-12-31,2026-01-01,2026-01-02,2026-01-03,2026-01-04,2026-01-05
005SAP01,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0
005SIL17,1,0,1,0,1,2,1,0,0,0,1,0,0,0,0,0,1,0,0,2,1,1,0,0,1,0,0,0,0,0,0,10,0,0,1,1,1
005ASP08,20,30,30,20,50,30,10,10,0,0,50,50,50,50,50,50,50,50,50,50,0,0,50,50,50,50,50,50,50,50,50,500,50,0,0,0,0
005PAN01,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,200,50,50,50,50,50,50,50,50,50,50,50,50,50,200,50,50,50,50,50`;

// --- 工具函數 ---
const excelDateToJSDate = (serial) => {
   if (!serial) return new Date();
   const knownSerial = 46022; // 2025-12-31
   const knownDate = new Date(2025, 11, 31); 
   const diff = serial - knownSerial;
   const result = new Date(knownDate);
   result.setDate(knownDate.getDate() + diff);
   return result;
};

// 修正日期格式化函數：使用本地時間方法避免時區轉換導致日期減一
const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const parseCSVLine = (text) => {
    const result = [];
    let start = 0;
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '"') {
            inQuotes = !inQuotes;
        } else if (text[i] === ',' && !inQuotes) {
            let field = text.substring(start, i);
            if (field.startsWith('"') && field.endsWith('"')) {
                field = field.slice(1, -1).replace(/""/g, '"');
            }
            result.push(field);
            start = i + 1;
        }
    }
    let field = text.substring(start);
    if (field.startsWith('"') && field.endsWith('"')) {
        field = field.slice(1, -1).replace(/""/g, '"');
    }
    result.push(field);
    return result;
};

// 解析每日耗用 CSV
// 加入一個輔助函數：標準化日期字串 (強制補零)
const standardizeDateStr = (dateStr) => {
    if (!dateStr) return "";
    // 將 / 或 - 切割
    const parts = dateStr.split(/[\/\-]/);
    if (parts.length === 3) {
        const year = parts[0];
        // padStart(2, '0') 確保 1 變成 01
        const month = parts[1].padStart(2, '0'); 
        const day = parts[2].padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    return dateStr;
};

// 解析每日耗用 CSV (修正版)
const parseConsumptionCSV = (csvText) => {
    const lines = csvText.trim().split(/\r\n|\n|\r/);
    if (lines.length < 2) return new Map();

    const parseLine = parseCSVLine;
    const headers = parseLine(lines[0]);
    
    // 找出日期欄位
    const datePattern = /^\d{4}-\d{1,2}-\d{1,2}$/; // 寬鬆匹配
    const datePatternSlash = /^\d{4}\/\d{1,2}\/\d{1,2}$/; // 寬鬆匹配
    const dateMapping = []; 
    
    headers.forEach((h, idx) => {
        const clean = h ? h.trim() : "";
        if (datePattern.test(clean) || datePatternSlash.test(clean)) {
            // 重點修正：使用標準化函數強制補零
            let dStr = standardizeDateStr(clean);
            dateMapping.push({ index: idx, date: dStr });
        }
    });

    // Map: DrugCode -> Array of { date, value }
    const consumptionMap = new Map();

    lines.slice(1).forEach(line => {
        if (!line.trim()) return;
        const row = parseLine(line);
        if (row.length < 2) return;

        const drugCode = row[0] ? row[0].trim() : "";
        if (!drugCode) return;

        const dailyData = {};
        dateMapping.forEach(dm => {
            const val = parseFloat(row[dm.index]);
            dailyData[dm.date] = isNaN(val) ? 0 : val;
        });

        consumptionMap.set(drugCode, dailyData);
    });

    return consumptionMap;
};

    // Map: DrugCode -> Array of { date, value }
    const consumptionMap = new Map();

    lines.slice(1).forEach(line => {
        if (!line.trim()) return;
        const row = parseLine(line);
        if (row.length < 2) return;

        const drugCode = row[0] ? row[0].trim() : "";
        if (!drugCode) return;

        const dailyData = {};
        dateMapping.forEach(dm => {
            const val = parseFloat(row[dm.index]);
            dailyData[dm.date] = isNaN(val) ? 0 : val;
        });

        consumptionMap.set(drugCode, dailyData);
    });

    return consumptionMap;
};

// 解析急領事件 CSV (主檔)
const parseUrgentCSV = (csvText) => {
    const lines = csvText.trim().split(/\r\n|\n|\r/);
    if (lines.length < 2) return [];

    const firstLine = lines[0];
    const isTabDelimited = firstLine.includes('\t');
    const parseLine = isTabDelimited ? (line) => line.split('\t') : parseCSVLine;
    
    const headers = parseLine(lines[0]);
    
    // 找出日期欄位
    const dateColumns = [];
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    
    // 尋找特殊欄位索引：Sys_SS (衛材系統安全量), Sys_Target (衛材系統基準量)
    let sysSSIndex = -1;
    let sysTargetIndex = -1;
    
    headers.forEach((header, index) => {
        const cleanHeader = header ? header.trim() : "";
        
        // 日期欄位偵測
        if (datePattern.test(cleanHeader)) {
            dateColumns.push({ index, date: cleanHeader });
        }
        
        // 衛材系統設定欄位偵測
        if (cleanHeader.toLowerCase() === 'sys_ss' || cleanHeader.includes('Sys_SS')) {
            sysSSIndex = index;
        }
        if (cleanHeader.toLowerCase() === 'sys_target' || cleanHeader.includes('Sys_Target')) {
            sysTargetIndex = index;
        }
    });
    
    // Fallback
    if (sysSSIndex === -1 && headers.length > 43) sysSSIndex = 43;
    if (sysTargetIndex === -1 && headers.length > 44) sysTargetIndex = 44;

    // Fallback Date Columns
    if (dateColumns.length < 10) {
        dateColumns.length = 0;
        let startDate = new Date(2025, 10, 30); // Nov 30
        for (let i = 6; i <= 42; i++) {
            dateColumns.push({ 
                index: i, 
                date: formatDate(startDate) 
            });
            startDate.setDate(startDate.getDate() + 1);
        }
    }

    const parsedRows = lines.slice(1).map((line, idx) => {
        if (!line.trim()) return null;
        const row = parseLine(line);
        if (row.length < 5) return null;

        const drugCode = row[0] ? row[0].trim() : ""; 
        const drugName = row[1] ? row[1].trim() : "Unknown";
        const unit = row[2];
        const urgentQty = parseFloat(row[3]) || 0; 
        
        const urgentDateSerial = parseInt(row[5]); 
        let urgentDateStr = "";
        if (urgentDateSerial > 40000) {
             const urgentDateObj = excelDateToJSDate(urgentDateSerial);
             urgentDateStr = formatDate(urgentDateObj);
        } else {
             urgentDateStr = row[5] || row[4] || "Unknown";
             if(urgentDateStr && urgentDateStr.length > 10) urgentDateStr = urgentDateStr.substring(0, 10);
        }

        const len = row.length;
        
        let typeIndex = -1;
        for (let i = 0; i < len; i++) {
             if (row[i] && typeof row[i] === 'string' && (row[i].includes("Type A") || row[i].includes("Type B") || row[i].includes("Type C"))) {
                 typeIndex = i;
                 break;
             }
        }

        let typeRaw = "Type C";
        let mean = 0, std = 0, stockBefore = 0, consDay = 0, reviewPeriod = 14;

        if (typeIndex > -1) {
            typeRaw = row[typeIndex];
            consDay = parseFloat(row[typeIndex - 1]) || 0; 
            stockBefore = parseFloat(row[typeIndex - 2]) || 0; 
            std = parseFloat(row[typeIndex - 3]) || 0; 
            mean = parseFloat(row[typeIndex - 4]) || 0; 
             const lastVal = parseFloat(row[len - 1]);
             if (!isNaN(lastVal)) reviewPeriod = lastVal;
        } else {
             reviewPeriod = parseFloat(row[len - 1]) || 14;
             typeRaw = row[len - 4] || "Type C";
             consDay = parseFloat(row[len - 5]) || 0;
             stockBefore = parseFloat(row[len - 6]) || 0;
             std = parseFloat(row[len - 7]) || 0;
             mean = parseFloat(row[len - 8]) || 0;
        }
        
        const sysSS = sysSSIndex > -1 ? (parseFloat(row[sysSSIndex]) || 0) : 0;
        const sysTarget = sysTargetIndex > -1 ? (parseFloat(row[sysTargetIndex]) || 0) : 0;

        const type = (typeRaw || "").includes("Type A") ? "Type A (庫存不足)" :
                     (typeRaw || "").includes("Type B") ? "Type B (突發爆量)" : 
                     "Type C (帳務/管理)";
        
        const dailyStock = dateColumns.map(col => {
            let val = 0;
            if (row[col.index] !== undefined && row[col.index] !== "") {
                val = parseFloat(row[col.index]);
            }
            return {
                date: col.date,
                stock: isNaN(val) ? 0 : val
            };
        });

        const LT = 1;
        const Z = 1.645;
        const calculatedSS = Z * std * Math.sqrt(LT);
        const calculatedTarget = (mean * (reviewPeriod + LT)) + calculatedSS;

        return {
            id: idx,
            drugCode,
            drugName,
            unit,
            urgentQty,
            urgentDate: urgentDateStr,
            dailyStock,
            mean,
            std,
            stockBefore,
            consDay,
            type,
            reviewPeriod,
            calculatedSS,
            calculatedTarget,
            sysSS,
            sysTarget
        };
    }).filter(item => item !== null);

    const drugCounts = {};
    parsedRows.forEach(row => {
        const code = row.drugCode;
        if (code) drugCounts[code] = (drugCounts[code] || 0) + 1;
    });

    return parsedRows.map(row => ({
        ...row,
        urgentCount: drugCounts[row.drugCode] || 1
    }));
};

// --- 組件 ---

const Card = ({ title, value, subtext, icon: Icon, colorClass }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start space-x-4">
        <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10`}>
            <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
        <div>
            <p className="text-gray-500 text-sm font-medium">{title}</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{value}</h3>
            {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
    </div>
);

// 修改後的外部標籤渲染函數 (拉線用)
const renderExternalLabel = ({ x, y, cx, percent }) => {
  // 只顯示 > 0 的數值
  if (percent <= 0) return null;

  return (
    <text 
      x={x} 
      y={y} 
      fill="#374151" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central" 
      fontSize="12"
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

const DetailModal = ({ item, allEvents, consumptionMap, onClose }) => {
    if (!item) return null;

    const relatedEvents = allEvents.filter(e => e.drugCode === item.drugCode);
    const urgentDates = relatedEvents.map(e => e.urgentDate);
    const consumptionData = consumptionMap.get(item.drugCode) || {};

    // 整合圖表資料 - 庫存日使用前一日結餘
    const chartData = item.dailyStock.map((d, index) => {
        const prevDayStock = index > 0 ? item.dailyStock[index - 1].stock : d.stock;

        return {
            date: d.date,
            stock: prevDayStock, 
            rawStock: d.stock,
            consumption: consumptionData[d.date] !== undefined ? consumptionData[d.date] : 0,
            
            建議SS: item.calculatedSS,
            建議Target: item.calculatedTarget,
            系統SS: item.sysSS,
            系統Target: item.sysTarget
        };
    });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex justify-between items-start sticky top-0 bg-white z-10">
                    <div>
                        <div className="flex items-center space-x-3">
                            <h2 className="text-2xl font-bold text-gray-800">{item.drugName}</h2>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold 
                                ${item.type.includes('Type A') ? 'bg-red-100 text-red-700' : 
                                  item.type.includes('Type B') ? 'bg-orange-100 text-orange-700' : 
                                  'bg-blue-100 text-blue-700'}`}>
                                {item.type}
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm mt-1">
                            院內碼: {item.drugCode} | 單位: {item.unit} | 
                            <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-bold">
                                期間急領總次數: {item.urgentCount}
                            </span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center">
                                <Activity className="w-4 h-4 mr-2" /> 
                                基礎統計 (12/1-1/5)
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">平均日耗用 (Mean):</span>
                                    <span className="font-mono font-medium">{item.mean.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">標準差 (Std):</span>
                                    <span className="font-mono font-medium">{item.std.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">急領前庫存:</span>
                                    <span className="font-mono font-medium text-red-600">{item.stockBefore}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">當日耗用:</span>
                                    <span className="font-mono font-medium">{item.consDay}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                            <h3 className="text-sm font-bold text-green-800 mb-3 flex items-center">
                                <ClipboardCheck className="w-4 h-4 mr-2" /> 
                                PDCA 建議 vs 系統設定
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="pb-2 border-b border-green-200">
                                    <p className="text-xs text-green-600 mb-1">安全存量 (SS)</p>
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-400">PDCA建議</span>
                                            <span className="text-xl font-bold text-green-700">{Math.ceil(item.calculatedSS)}</span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-xs text-gray-400">目前系統(AR)</span>
                                            <span className="text-xl font-bold text-purple-600">{Math.ceil(item.sysSS)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-green-600 mb-1">最高庫存 (Target)</p>
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-400">PDCA建議</span>
                                            <span className="text-xl font-bold text-green-700">{Math.ceil(item.calculatedTarget)}</span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-xs text-gray-400">目前系統(AS)</span>
                                            <span className="text-xl font-bold text-purple-600">{Math.ceil(item.sysTarget)}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2 text-right">R值 (檢視週期): {item.reviewPeriod} 天</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <h3 className="text-sm font-bold text-gray-800 mb-2">Act (行動建議)</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                {item.type.includes('Type A') && "目前庫存參數過低。建議立即將安全存量 (SS) 上調至建議值，並縮短請購週期。"}
                                {item.type.includes('Type B') && "偵測到突發性大量消耗。建議暫不調整常規庫存，但需標記為季節性或專案性藥品，設立預警機制。"}
                                {item.type.includes('Type C') && "庫存數據與實際消耗不符，可能存在帳務落差。建議進行盤點並檢查扣帳系統邏輯。"}
                            </p>
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-gray-100 flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-700">庫存與耗用雙軸趨勢圖</h3>
                            <div className="text-xs text-gray-500">
                                期間急領次數: <span className="font-bold text-red-500">{relatedEvents.length}</span>
                            </div>
                        </div>
                        <div className="flex-1 min-h-[400px] w-full">
                           {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis 
                                        dataKey="date" 
                                        tick={{fontSize: 10}} 
                                        tickFormatter={(str) => str.slice(5)} 
                                        interval="preserveStartEnd"
                                        minTickGap={20}
                                        padding={{ left: 10, right: 10 }}
                                    />
                                    <YAxis 
                                        yAxisId="left" 
                                        label={{ value: '數量', angle: -90, position: 'insideLeft' }} 
                                    />
                                    
                                    <RechartsTooltip 
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend verticalAlign="top" height={36} wrapperStyle={{fontSize: '11px'}}/>
                                    
                                    <ReferenceLine yAxisId="left" y={item.calculatedSS} stroke="red" strokeDasharray="3 3" label={{ value: '建議SS', position: 'insideTopRight', fill: 'red', fontSize: 10 }} />
                                    <ReferenceLine yAxisId="left" y={item.calculatedTarget} stroke="green" strokeDasharray="3 3" label={{ value: '建議Target', position: 'insideTopRight', fill: 'green', fontSize: 10 }} />
                                    
                                    <ReferenceLine yAxisId="left" y={item.sysSS} stroke="#9333ea" strokeWidth={1} label={{ value: '系統SS', position: 'insideLeft', fill: '#9333ea', fontSize: 10 }} />
                                    <ReferenceLine yAxisId="left" y={item.sysTarget} stroke="#7e22ce" strokeWidth={1} label={{ value: '系統Target', position: 'insideLeft', fill: '#7e22ce', fontSize: 10 }} />

                                    {urgentDates.map((date, i) => (
                                         <ReferenceLine key={i} yAxisId="left" x={date} stroke="orange" label={{ value: '急領', position: 'insideTopLeft', fill: 'orange', fontSize: 10 }} />
                                    ))}

                                    <Bar yAxisId="left" dataKey="consumption" name="每日耗用" fill="#93c5fd" barSize={20} opacity={0.6} />
                                    <Line yAxisId="left" type="monotone" dataKey="stock" name="每日庫存(期初)" stroke="#2563eb" strokeWidth={2} dot={false} activeDot={{ r: 6 }} connectNulls={true} />
                                </ComposedChart>
                            </ResponsiveContainer>
                           ) : (
                               <div className="h-full flex items-center justify-center text-gray-400">
                                   無法讀取趨勢資料
                               </div>
                           )}
                        </div>
                        <div className="mt-4 text-xs text-gray-400 text-center">
                            * 藍色折線: 庫存量 (顯示前一日結餘作為當日可用) | 紫色線: 系統目前設定 | 紅綠虛線: PDCA建議值
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function App() {
    const [data, setData] = useState([]);
    const [consumptionMap, setConsumptionMap] = useState(new Map());
    const [selectedDrug, setSelectedDrug] = useState(null);
    const [filterType, setFilterType] = useState('All');
    const [viewMode, setViewMode] = useState('top100');
    
    // File 1: Urgent
    const [urgentFileName, setUrgentFileName] = useState('');
    const [urgentEncoding, setUrgentEncoding] = useState('Big5');
    const [urgentFile, setUrgentFile] = useState(null);
    const [urgentPreview, setUrgentPreview] = useState("");

    // File 2: Consumption
    const [consFileName, setConsFileName] = useState('');
    const [consEncoding, setConsEncoding] = useState('Big5');
    const [consFile, setConsFile] = useState(null);

    // Init Mock Data
    useEffect(() => {
        const parsedData = parseUrgentCSV(RAW_URGENT_DATA);
        setData(parsedData);
        setUrgentPreview(RAW_URGENT_DATA.split('\n').slice(0, 3).join('\n'));
        const parsedCons = parseConsumptionCSV(RAW_CONSUMPTION_DATA);
        setConsumptionMap(parsedCons);
    }, []);

    // --- Handlers for Urgent CSV ---
    const processUrgentFile = (file, encodingType) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            setUrgentPreview(text.substring(0, 200) + "...");
            try {
                const parsedData = parseUrgentCSV(text);
                setData(parsedData);
                if (parsedData.length > 100) setViewMode('all');
            } catch (error) {
                console.error(error);
                alert("急領檔解析失敗");
            }
        };
        reader.readAsText(file, encodingType);
    };

    const handleUrgentUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUrgentFileName(file.name);
        setUrgentFile(file);
        processUrgentFile(file, urgentEncoding);
    };

    const handleUrgentEncodingChange = (newEnc) => {
        setUrgentEncoding(newEnc);
        if (urgentFile) processUrgentFile(urgentFile, newEnc);
    };

    // --- Handlers for Consumption CSV ---
    const processConsFile = (file, encodingType) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            try {
                const parsedMap = parseConsumptionCSV(text);
                setConsumptionMap(parsedMap);
                console.log("Consumption Map Size:", parsedMap.size);
            } catch (error) {
                console.error(error);
                alert("耗用檔解析失敗");
            }
        };
        reader.readAsText(file, encodingType);
    };

    const handleConsUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setConsFileName(file.name);
        setConsFile(file);
        processConsFile(file, consEncoding);
    };

    const stats = useMemo(() => {
        const total = data.length;
        const typeA = data.filter(d => d.type.includes('Type A')).length;
        const typeB = data.filter(d => d.type.includes('Type B')).length;
        const typeC = data.filter(d => d.type.includes('Type C')).length;
        return { total, typeA, typeB, typeC };
    }, [data]);

    const pieData = [
        { name: 'Type A (庫存不足)', value: stats.typeA, color: '#ef4444' },
        { name: 'Type B (突發爆量)', value: stats.typeB, color: '#f97316' },
        { name: 'Type C (帳務/管理)', value: stats.typeC, color: '#3b82f6' },
    ];

    const filteredData = useMemo(() => {
        let res = data;
        if (filterType !== 'All') {
            res = res.filter(d => d.type.includes(filterType));
        }
        if (viewMode === 'top100') {
            // 改為依據急領次數 (urgentCount) 排序
            return [...res].sort((a, b) => b.urgentCount - a.urgentCount).slice(0, 100);
        }
        return res;
    }, [data, filterType, viewMode]);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-20">
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="bg-blue-600 text-white p-2 rounded-lg">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">
                                    12/1-1/5 急領事件 PDCA 品質管理系統
                                </h1>
                            </div>
                        </div>
                    </div>
                    
                    {/* 上傳區域 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                        {/* 1. 急領檔上傳 */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-gray-700 flex items-center">
                                    <FileText className="w-4 h-4 mr-1 text-blue-600"/> 1. 上傳急領清單 (0108.xlsx)
                                </span>
                                <div className="flex bg-white rounded border border-gray-300 overflow-hidden text-xs">
                                    <button onClick={() => handleUrgentEncodingChange('Big5')} className={`px-2 py-1 ${urgentEncoding==='Big5'?'bg-blue-100 text-blue-700':''}`}>Big5</button>
                                    <button onClick={() => handleUrgentEncodingChange('UTF-8')} className={`px-2 py-1 ${urgentEncoding==='UTF-8'?'bg-blue-100 text-blue-700':''}`}>UTF-8</button>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <label className="flex-1 flex items-center justify-center px-4 py-2 bg-white border border-blue-500 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-50 text-sm">
                                    <Upload className="w-4 h-4 mr-2" />
                                    {urgentFileName || '選擇急領 CSV'}
                                    <input type="file" accept=".csv" onChange={handleUrgentUpload} className="hidden" />
                                </label>
                            </div>
                            <div className="text-xs text-gray-400 truncate h-4">{urgentPreview}</div>
                        </div>

                        {/* 2. 耗用檔上傳 */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-gray-700 flex items-center">
                                    <FileBarChart className="w-4 h-4 mr-1 text-orange-600"/> 2. 上傳每日耗用 (每日耗用.xlsx)
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <label className="flex-1 flex items-center justify-center px-4 py-2 bg-white border border-orange-500 text-orange-600 rounded-lg cursor-pointer hover:bg-orange-50 text-sm">
                                    <Upload className="w-4 h-4 mr-2" />
                                    {consFileName || '選擇耗用 CSV'}
                                    <input type="file" accept=".csv" onChange={handleConsUpload} className="hidden" />
                                </label>
                            </div>
                             <div className="text-xs text-gray-400">
                                {consumptionMap.size > 0 ? `已載入 ${consumptionMap.size} 筆耗用資料` : '尚未載入耗用資料'}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                <section>
                    <div className="flex items-center space-x-2 mb-4">
                        <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                        <h2 className="text-lg font-bold text-gray-800">現況總覽 (Check)</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card title="急領事件總數" value={stats.total} subtext={urgentFileName ? "完整資料載入" : "目前為預覽模式"} icon={FileText} colorClass="bg-gray-500 text-gray-500" />
                        <Card title="Type A (庫存不足)" value={stats.typeA} subtext={`${stats.total > 0 ? ((stats.typeA/stats.total)*100).toFixed(1) : 0}%`} icon={AlertCircle} colorClass="bg-red-500 text-red-500" />
                        <Card title="Type B (突發爆量)" value={stats.typeB} subtext={`${stats.total > 0 ? ((stats.typeB/stats.total)*100).toFixed(1) : 0}%`} icon={Activity} colorClass="bg-orange-500 text-orange-500" />
                        <Card title="Type C (帳務/管理)" value={stats.typeC} subtext={`${stats.total > 0 ? ((stats.typeC/stats.total)*100).toFixed(1) : 0}%`} icon={ClipboardCheck} colorClass="bg-blue-500 text-blue-500" />
                    </div>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1">
                        <h3 className="font-bold text-gray-700 mb-8 text-center">急領原因類別佔比</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={35} // 縮小內徑
                                        outerRadius={70} // 縮小外徑以容納外部拉線
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={renderExternalLabel} // 使用外部標籤
                                        labelLine={true} // 啟用拉線
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={60} 
                                        layout="horizontal"
                                        iconType="circle"
                                        formatter={(value) => <span className="text-sm font-medium ml-1 text-gray-600">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
                        <h3 className="font-bold text-gray-700 mb-4">PDCA 管理參數設定 (Plan)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-indigo-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-indigo-900 mb-2">建議安全存量 (SS) 公式</h4>
                                <code className="block bg-white p-3 rounded border border-indigo-100 text-sm font-mono text-indigo-700">
                                    SS = 1.645 × Std × √LT
                                </code>
                                <ul className="mt-2 text-xs text-indigo-600 space-y-1">
                                    <li>• Std: 每日消耗標準差 (資料來源: 欄位AU)</li>
                                    <li>• LT (Lead Time): 1 天</li>
                                    <li>• 1.645: 95% 信心水準係數</li>
                                </ul>
                            </div>
                            <div className="bg-teal-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-teal-900 mb-2">建議最高庫存 (Target) 公式</h4>
                                <code className="block bg-white p-3 rounded border border-teal-100 text-sm font-mono text-teal-700">
                                    Target = Mean × (R + LT) + SS
                                </code>
                                <ul className="mt-2 text-xs text-teal-600 space-y-1">
                                    <li>• Mean: 平均日消耗量 (資料來源: 欄位AT)</li>
                                    <li>• R: 檢視週期 (資料來源: 檔案末欄)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 space-y-4 md:space-y-0">
                        <div className="flex items-center space-x-2">
                            <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                            <h2 className="text-lg font-bold text-gray-800">急領排行與清單 (Do)</h2>
                        </div>
                        
                        <div className="flex space-x-2">
                            <select 
                                className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                            >
                                <option value="All">所有類別</option>
                                <option value="Type A">Type A (庫存不足)</option>
                                <option value="Type B">Type B (突發爆量)</option>
                                <option value="Type C">Type C (帳務/管理)</option>
                            </select>

                            <div className="inline-flex rounded-md shadow-sm" role="group">
                                <button 
                                    type="button" 
                                    onClick={() => setViewMode('top100')}
                                    className={`px-4 py-2 text-sm font-medium border border-gray-200 rounded-l-lg hover:bg-gray-100 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700
                                    ${viewMode === 'top100' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white text-gray-900'}`}
                                >
                                    Top 100 (依急領次數)
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setViewMode('all')}
                                    className={`px-4 py-2 text-sm font-medium border border-gray-200 rounded-r-lg hover:bg-gray-100 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700
                                    ${viewMode === 'all' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white text-gray-900'}`}
                                >
                                    全部總表 ({data.length})
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3">排行</th>
                                        <th className="px-6 py-3">院內碼</th>
                                        <th className="px-6 py-3">藥名</th>
                                        <th className="px-6 py-3">類別</th>
                                        <th className="px-6 py-3 text-right">急領量</th>
                                        <th className="px-6 py-3 text-right">急領次數</th>
                                        <th className="px-6 py-3 text-center">急領日期</th>
                                        <th className="px-6 py-3 text-right">Mean</th>
                                        <th className="px-6 py-3 text-right">建議SS</th>
                                        <th className="px-6 py-3 text-center">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((item, index) => (
                                        <tr key={item.id} className="bg-white border-b hover:bg-blue-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">{index + 1}</td>
                                            <td className="px-6 py-4">{item.drugCode}</td>
                                            <td className="px-6 py-4 font-medium text-gray-800">{item.drugName}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold
                                                    ${item.type.includes('Type A') ? 'bg-red-100 text-red-600' : 
                                                      item.type.includes('Type B') ? 'bg-orange-100 text-orange-600' : 
                                                      'bg-blue-100 text-blue-600'}`}>
                                                    {item.type.split(' ')[1]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-gray-800">{item.urgentQty}</td>
                                            <td className="px-6 py-4 text-right font-medium text-blue-600">{item.urgentCount}</td>
                                            <td className="px-6 py-4 text-center">{item.urgentDate}</td>
                                            <td className="px-6 py-4 text-right">{item.mean.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-right">{Math.ceil(item.calculatedSS)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <button 
                                                    onClick={() => setSelectedDrug(item)}
                                                    className="font-medium text-blue-600 hover:underline"
                                                >
                                                    詳細評估
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredData.length === 0 && (
                                        <tr>
                                            <td colSpan="10" className="px-6 py-10 text-center text-gray-400">
                                                {urgentFileName ? "無符合條件的資料" : "請點擊右上角「上傳急領清單」"}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </main>
            {/* --- 新增頁尾 (Footer) 開始 --- */}
            <footer className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-500 border-t border-gray-200 mt-8">
                <p>
                    本工具原始碼與更新版可於{' '}
                    <a 
                        href="https://github.com/Almightyhao/Stocktaking" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                        https://github.com/Almightyhao/Stocktaking
                    </a>
                    {' '}查找。
                </p>
            </footer>
            {/* --- 新增頁尾 (Footer) 結束 --- */}

            {selectedDrug && (
                <DetailModal 
                    item={selectedDrug} 
                    allEvents={data}
                    consumptionMap={consumptionMap}
                    onClose={() => setSelectedDrug(null)} 
                />
            )}
        </div>
    );
}
