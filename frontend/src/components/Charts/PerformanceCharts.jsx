import { useState } from 'react';
import { FileCheck } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { ExplainabilityModal } from '../ExplainabilityModal';

export function PerformanceCharts({ 
  revenueTrend, 
  epsTrend, 
  confidence, 
  supportingSources 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const hasRevenue = revenueTrend && revenueTrend.length > 0;
  const hasEps = epsTrend && epsTrend.length > 0;

  // Clean conditional rendering: If no trend data exists, hide section completely
  if (!hasRevenue && !hasEps) return null;

  // Format Large Currencies
  const formatCurrency = (value) => {
    if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(1)}B`;
    }
    if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(1)}M`;
    }
    return `$${value}`;
  };

  const chartTheme = {
    gridColor: 'rgba(51, 65, 85, 0.15)',
    tooltipBg: 'rgba(15, 23, 42, 0.95)',
    tooltipBorder: 'rgba(51, 65, 85, 0.8)',
    textFill: '#94a3b8',
    font: '10px monospace'
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Revenue Trend Chart */}
      <div id="tour-revenue-trend" className="glass-panel p-5 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                Financial Statement Analysis
              </span>
              <h4 className="font-bold text-sm text-white font-outfit mt-0.5">
                Annual Revenue Trend
              </h4>
            </div>
            {supportingSources && supportingSources.length > 0 && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-[10px] font-mono text-emerald-400 hover:text-emerald-350 transition flex items-center gap-1 px-2.5 py-1 bg-slate-950/85 rounded border border-slate-850/80"
              >
                <FileCheck size={11} />
                <span>Verify Evidence</span>
              </button>
            )}
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueTrend} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                <XAxis dataKey="year" stroke={chartTheme.textFill} style={{ fontSize: chartTheme.font }} tickLine={false} />
                <YAxis stroke={chartTheme.textFill} style={{ fontSize: chartTheme.font }} tickFormatter={formatCurrency} tickLine={false} />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value || 0)), 'Revenue']}
                  contentStyle={{
                    backgroundColor: chartTheme.tooltipBg,
                    borderColor: chartTheme.tooltipBorder,
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* EPS Trend Chart */}
      <div id="tour-eps-trend" className="glass-panel p-5 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                Diluted Earnings Per Share
              </span>
              <h4 className="font-bold text-sm text-white font-outfit mt-0.5">
                Annual EPS Performance
              </h4>
            </div>
            {supportingSources && supportingSources.length > 0 && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-[10px] font-mono text-emerald-400 hover:text-emerald-350 transition flex items-center gap-1 px-2.5 py-1 bg-slate-950/85 rounded border border-slate-850/80"
              >
                <FileCheck size={11} />
                <span>Verify Evidence</span>
              </button>
            )}
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={epsTrend} margin={{ top: 10, right: 15, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                <XAxis dataKey="year" stroke={chartTheme.textFill} style={{ fontSize: chartTheme.font }} tickLine={false} />
                <YAxis stroke={chartTheme.textFill} style={{ fontSize: chartTheme.font }} tickFormatter={(val) => `$${val}`} tickLine={false} />
                <Tooltip
                  formatter={(value) => [`$${Number(value || 0).toFixed(2)}`, 'EPS']}
                  contentStyle={{
                    backgroundColor: chartTheme.tooltipBg,
                    borderColor: chartTheme.tooltipBorder,
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="eps"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  activeDot={{ r: 6 }}
                  dot={{ stroke: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <ExplainabilityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Annual Financial Trends Evidence"
        claim="Revenue and Diluted EPS performance charts mapped from audited annual SEC income statement disclosures."
        persona="Financial Analyst"
        confidence={confidence || 88}
        sources={supportingSources || []}
      />
    </div>
  );
}
export default PerformanceCharts;
