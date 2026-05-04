/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Loader2, 
  BarChart3, 
  Clock, 
  Globe,
  RefreshCw,
  LayoutDashboard,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getStockAnalysis } from './services/geminiService';

const DEFAULT_PROMPT = `搜尋今日（${new Date().toLocaleDateString('zh-TW')}）全球股市（包含美股、台股、歐股等）最新的盤後數據、財經新聞與法人/大戶動態。
請找出 3 個技術面強勢且基本面/籌碼面看好的標的（做多），以及 3 個技術面轉弱或利空頻傳的標的（做空）。
最後請輸出一個 Markdown 表格，欄位包含：市場、標的名稱、代號、方向、分析理由、關鍵價位。`;

const MARKETS = [
  { id: 'global', label: '全球市場', icon: Globe, zones: ['美股科技股', '台股半導體', '加密貨幣趨勢', '日本股市', '高股息ETF'] },
  { id: 'tw', label: '台股市場', icon: TrendingUp, zones: ['法人買超TOP', '高股息ETF', '半導體', '航運股', 'AI概念股'] },
  { id: 'us', label: '美股市場', icon: BarChart3, zones: ['標普500', '那斯達克', '半導體板塊', '中概股', '能源股'] },
  { id: 'crypto', label: '加密貨幣', icon: Search, zones: ['比特幣', '以太坊', '迷因幣', 'DeFi板塊', 'L2擴充'] },
  { id: 'jp', label: '日本股市', icon: LayoutDashboard, zones: ['日經225', '汽車板塊', '電子機械', '商社股'] },
];

const DIRECTIONS = [
  { id: 'both', label: '多空並行', desc: '找出強勢與弱勢標的' },
  { id: 'long', label: '僅看多', desc: '鎖定買超與技術強勢' },
  { id: 'short', label: '僅看空', desc: '尋找賣壓與弱勢標的' },
];

export default function App() {
  const [selectedMarket, setSelectedMarket] = useState(MARKETS[0]);
  const [selectedDirection, setSelectedDirection] = useState(DIRECTIONS[0]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const contentEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (analysis && contentEndRef.current) {
      contentEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [analysis]);

  const handleSearch = async (overridePrompt?: string) => {
    setLoading(true);
    setError(null);

    const dateStr = new Date().toLocaleDateString('zh-TW');
    const directionInstruction = selectedDirection.id === 'long' 
      ? '找出 3-5 個技術面強勢且基本面/籌碼面看好的標的（做多）。'
      : selectedDirection.id === 'short'
      ? '找出 3-5 個技術面轉弱或利空頻傳的標的（做空）。'
      : '找出 3 個技術面強勢且基本面/籌碼面看好的標的（做多），以及 3 個技術面轉弱或利空頻傳的標的（做空）。';

    const finalPrompt = `搜尋今日（${dateStr}） ${selectedMarket.label} 最新的盤後數據、財經新聞與法人/大戶動態。
${directionInstruction}
${overridePrompt || customPrompt ? `特別關注：${overridePrompt || customPrompt}` : ""}
最後請輸出一個 Markdown 表格，欄位包含：市場、標的名稱、代號、方向、分析理由、關鍵價位。`;

    try {
      const result = await getStockAnalysis(finalPrompt);
      setAnalysis(result.text);
    } catch (err: any) {
      setError(err?.message || "分析過程中發生錯誤，請稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#F5F5F0]">
      {/* Top Navigation Bar */}
      <nav className="border-b border-[#141414]/10 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#141414] rounded-xl flex items-center justify-center text-[#F5F5F0]">
              <LayoutDashboard size={22} />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">全球股市航海王</h1>
              <p className="text-[10px] uppercase tracking-widest text-[#141414]/50 font-medium">Global Stock Navigator</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1 bg-[#141414]/5 rounded-full border border-[#141414]/5">
              <Clock size={14} className="text-[#141414]/60" />
              <span className="text-xs font-mono font-medium">{currentTime}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#141414]/40">
              <Globe size={14} />
              <span>市場狀態: 全球追蹤中</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Sidebar / Controls */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#141414]/10 rounded-3xl p-6 shadow-sm flex flex-col gap-5"
            >
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Globe size={16} className="text-[#141414]/60" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">市場選擇</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {MARKETS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMarket(m)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-xs font-semibold ${
                        selectedMarket.id === m.id 
                        ? 'bg-[#141414] text-white border-[#141414]' 
                        : 'bg-gray-50 border-gray-100 text-[#141414]/60 hover:bg-gray-100'
                      }`}
                    >
                      <m.icon size={14} />
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={16} className="text-[#141414]/60" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">分析方向</h3>
                </div>
                <div className="flex flex-col gap-2">
                  {DIRECTIONS.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDirection(d)}
                      className={`flex flex-col items-start px-4 py-2.5 rounded-xl border transition-all ${
                        selectedDirection.id === d.id 
                        ? 'bg-[#141414] text-white border-[#141414]' 
                        : 'bg-gray-50 border-gray-100 text-[#141414]/60 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-xs font-bold">{d.label}</span>
                      <span className={`text-[10px] opacity-60`}>{d.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Search size={16} className="text-[#141414]/60" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">額外指令 (選填)</h3>
                </div>
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="例如：半導體龍頭股..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#141414]/5"
                />
              </div>

              <button
                onClick={() => handleSearch()}
                disabled={loading}
                className="w-full mt-2 bg-[#141414] hover:bg-black text-[#F5F5F0] font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg shadow-black/10 active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>分析中...</span>
                  </>
                ) : (
                  <>
                    <BarChart3 size={18} className="group-hover:rotate-12 transition-transform" />
                    <span>啟動 {selectedMarket.label} 分析</span>
                  </>
                )}
              </button>

              <div className="mt-2 flex flex-col gap-3">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">{selectedMarket.label} 熱門板塊</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedMarket.zones.map((tag) => (
                    <button 
                      key={tag}
                      onClick={() => handleSearch(tag)}
                      className="px-3 py-1.5 bg-white border border-[#141414]/5 rounded-xl text-[11px] font-semibold hover:border-[#141414]/20 transition-colors shadow-sm flex items-center gap-1.5 group font-mono"
                    >
                      <div className="w-1 h-1 bg-[#141414]/20 rounded-full group-hover:bg-[#141414]" />
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#141414] text-[#F5F5F0] rounded-3xl p-6 overflow-hidden relative"
            >
              <div className="relative z-10">
                <h3 className="text-sm font-bold uppercase tracking-widest opacity-60 mb-2">Google Grounding</h3>
                <p className="text-xs leading-relaxed opacity-80">
                  本系統與 Google 搜尋同步，分析結果包含全球即時財經新聞、數據公佈與大戶資金動態。
                </p>
                <div className="mt-6 flex items-center gap-4">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full border border-white/10">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold tracking-tighter">GLOBAL LIVE SEARCH ON</span>
                  </div>
                </div>
              </div>
              <Globe className="absolute -bottom-10 -right-10 opacity-10" size={160} />
            </motion.div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-red-50 border border-red-100 rounded-3xl p-6 flex items-start gap-4 mb-6"
                >
                  <ShieldAlert className="text-red-500 shrink-0" size={24} />
                  <div>
                    <h3 className="font-bold text-red-900 text-sm">系統分析中斷</h3>
                    <p className="text-red-700 text-xs mt-1 font-medium">{error}</p>
                  </div>
                </motion.div>
              )}

              {!analysis && !loading ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 bg-white/40 border-2 border-dashed border-[#141414]/10 rounded-[40px]"
                >
                  <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-6">
                    <BarChart3 className="text-[#141414]/20" size={40} />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#141414]">準備好進行精準分析了嗎？</h2>
                  <p className="text-[#141414]/50 max-w-sm mt-2 font-medium">點擊左側「啟動全球分析」按鈕，Gemini 將為您搜尋全球市場最即時的數據資訊。</p>
                </motion.div>
              ) : loading ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 bg-white border border-[#141414]/10 rounded-[40px]"
                >
                  <div className="relative">
                    <RefreshCw className="text-[#141414] animate-spin mb-8" size={64} strokeWidth={1} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-4 bg-blue-500 rounded-full animate-ping" />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-[#141414]">正在深度分析全球市場情緒...</h2>
                  <div className="mt-8 flex flex-col gap-2 max-w-xs">
                    {[
                      '正在調用 Google 搜尋引擎數據',
                      '解析全球各大財經官網、新聞快訊',
                      '彙整技術指標與法人進出',
                      '產出最終分析報告表格'
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-3 text-left">
                        <div className={`w-1.5 h-1.5 rounded-full bg-[#141414]/20 animation-delay-${i*200} animate-pulse`} />
                        <span className="text-[11px] font-bold text-[#141414]/40 uppercase tracking-widest">{step}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-[#141414]/10 rounded-[40px] shadow-sm overflow-hidden"
                >
                  <div className="p-8 border-b border-[#141414]/5 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                        <ArrowUpRight className="text-white" size={16} />
                      </div>
                      <h2 className="font-bold text-sm uppercase tracking-widest">市場分析報告</h2>
                    </div>
                    <button 
                      onClick={() => handleSearch()}
                      className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 hover:text-[#141414] transition-colors flex items-center gap-1"
                    >
                      重新整理內容 <RefreshCw size={12} />
                    </button>
                  </div>
                  
                  <div className="p-8 lg:p-12 prose prose-sm max-w-none prose-table:border prose-table:rounded-xl prose-th:bg-gray-50 prose-th:px-4 prose-th:py-3 prose-td:px-4 prose-td:py-3 prose-headings:font-bold prose-headings:tracking-tight prose-p:text-[#141414]/80 prose-p:leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {analysis || ""}
                    </ReactMarkdown>
                  </div>
                  <div ref={contentEndRef} />
                  
                  <div className="p-8 border-t border-[#141414]/5 bg-gray-50/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/30">
                      投資涉及風險，分析結果僅供參考，不構成投資建議。
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-green-600">強勢多頭</span>
                        <ArrowUpRight size={14} className="text-green-600" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-red-600">弱勢空頭</span>
                        <ArrowDownRight size={14} className="text-red-600" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#141414]/5 py-12 px-6 bg-white flex flex-col items-center">
        <div className="max-w-7xl w-full flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3 opacity-50">
            <LayoutDashboard size={20} />
            <span className="font-bold text-sm tracking-tight">全球股市航海王 BY AI NAVIGATOR</span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#141414]/40">
            Powered by Gemini 2.0 Flash & Google Search Grounding
          </p>
        </div>
      </footer>
    </div>
  );
}
