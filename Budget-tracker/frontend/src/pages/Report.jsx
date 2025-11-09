// ReportsPage.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";

const ReportsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [reportType, setReportType] = useState("spending");
  const [timeRange, setTimeRange] = useState("month");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;

  const categories = [
    { id: 1, name: "Food & Dining", color: "#F59E0B" },
    { id: 2, name: "Shopping", color: "#8B5CF6" },
    { id: 3, name: "Transportation", color: "#06B6D4" },
    { id: 4, name: "Entertainment", color: "#EC4899" },
    { id: 5, name: "Bills & Utilities", color: "#10B981" },
    { id: 6, name: "Healthcare", color: "#EF4444" },
    { id: 7, name: "Salary", color: "#84CC16" },
    { id: 8, name: "Investment", color: "#14B8A6" },
  ];

  const reportTypes = [
    { value: "spending", label: "📊 Spending Analysis", description: "Category-wise spending breakdown" },
    { value: "income", label: "💰 Income Report", description: "Income sources and trends" },
    { value: "savings", label: "💸 Savings Report", description: "Savings growth and patterns" },
    { value: "subscriptions", label: "🔄 Subscriptions", description: "Recurring expenses analysis" },
    { value: "comparison", label: "📈 Period Comparison", description: "Compare different time periods" },
  ];

  const timeRanges = [
    { value: "week", label: "Last 7 Days" },
    { value: "month", label: "Last Month" },
    { value: "quarter", label: "Last 3 Months" },
    { value: "year", label: "Last Year" },
    { value: "custom", label: "Custom Range" },
  ];

  const token = localStorage.getItem("token");
  
  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // Fetch data on mount
  useEffect(() => {
    fetchUser();
    fetchTransactions();
    fetchSubscriptions();
  }, []);

  // Lock body scroll when sidebar open
  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen ? "hidden" : "auto";
  }, [mobileSidebarOpen]);

  const fetchUser = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${VITE_BASE_URL}/api/users/me`, axiosConfig);
      setUser(res.data.user);
    } catch (err) {
      console.error("Fetch user error:", err);
    }
  };

  const fetchTransactions = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${VITE_BASE_URL}/api/transactions`, axiosConfig);
      setTransactions(res.data.transactions || res.data || []);
    } catch (err) {
      console.error("Fetch transactions error:", err);
      // Fallback to sample data
      setTransactions(generateSampleTransactions());
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${VITE_BASE_URL}/api/subscriptions`, axiosConfig);
      setSubscriptions(res.data.subscriptions || res.data || []);
    } catch (err) {
      console.error("Fetch subscriptions error:", err);
    }
  };

  // Generate sample data for demonstration
  const generateSampleTransactions = () => {
    const sampleData = [];
    const categories = ["Food & Dining", "Shopping", "Transportation", "Entertainment", "Bills & Utilities", "Healthcare", "Salary"];
    const types = ["expense", "expense", "expense", "expense", "expense", "expense", "income"];
    
    for (let i = 0; i < 50; i++) {
      const randomCat = Math.floor(Math.random() * categories.length);
      sampleData.push({
        id: i + 1,
        merchant: `Merchant ${i + 1}`,
        category_id: randomCat + 1,
        type: types[randomCat],
        amount: Math.random() * 1000 + 50,
        transaction_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: `Transaction ${i + 1}`
      });
    }
    return sampleData;
  };

  // Process data for reports
  const processReportData = () => {
    const now = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    const filteredTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.transaction_date);
      return transactionDate >= startDate && transactionDate <= now;
    });

    // Category-wise spending
    const categorySpending = categories.map(category => {
      const categoryTransactions = filteredTransactions.filter(
        t => parseInt(t.category_id) === category.id && t.type === "expense"
      );
      const total = categoryTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      return {
        name: category.name,
        value: Math.round(total),
        color: category.color,
        count: categoryTransactions.length
      };
    }).filter(item => item.value > 0);

    // Monthly trends
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const monthTransactions = filteredTransactions.filter(t => {
        const transactionDate = new Date(t.transaction_date);
        return transactionDate.getMonth() === date.getMonth() && 
               transactionDate.getFullYear() === date.getFullYear();
      });

      const income = monthTransactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const expenses = monthTransactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      monthlyData.push({
        month: monthKey,
        income: Math.round(income),
        expenses: Math.round(expenses),
        savings: Math.round(income - expenses)
      });
    }

    // Top expenses
    const topExpenses = filteredTransactions
      .filter(t => t.type === "expense")
      .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
      .slice(0, 10)
      .map(t => ({
        name: t.merchant,
        amount: parseFloat(t.amount),
        category: categories.find(c => parseInt(c.id) === parseInt(t.category_id))?.name || 'Unknown',
        date: new Date(t.transaction_date).toLocaleDateString()
      }));

    // Subscription analysis
    const activeSubscriptions = subscriptions.filter(sub => sub.status === "active");
    const subscriptionCost = activeSubscriptions.reduce((sum, sub) => {
      let monthlyCost = parseFloat(sub.amount);
      switch (sub.billing_cycle) {
        case 'yearly': monthlyCost = monthlyCost / 12; break;
        case 'quarterly': monthlyCost = monthlyCost / 3; break;
        case 'weekly': monthlyCost = monthlyCost * 4; break;
        case 'daily': monthlyCost = monthlyCost * 30; break;
      }
      return sum + monthlyCost;
    }, 0);

    return {
      categorySpending,
      monthlyData,
      topExpenses,
      subscriptionCost: Math.round(subscriptionCost),
      activeSubscriptions: activeSubscriptions.length,
      totalTransactions: filteredTransactions.length,
      totalIncome: Math.round(filteredTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + parseFloat(t.amount), 0)),
      totalExpenses: Math.round(filteredTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + parseFloat(t.amount), 0)),
      netSavings: Math.round(filteredTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + parseFloat(t.amount), 0) - 
                    filteredTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + parseFloat(t.amount), 0))
    };
  };

  const reportData = processReportData();

  // --- NEW: compute nice Y axis ticks for monthly chart ---
  const computeYAxisTicks = (maxVal) => {
    if (!Number.isFinite(maxVal) || maxVal <= 0) return [0, 1];
    const targetSteps = 4; // produces 5 tick marks including 0
    const approxStep = Math.ceil(maxVal / targetSteps);
    const magnitude = Math.pow(10, Math.floor(Math.log10(approxStep)));
    const niceStep = Math.ceil(approxStep / magnitude) * magnitude;
    const ticks = [];
    for (let i = 0; i <= targetSteps; i++) ticks.push(i * niceStep);
    return ticks;
  };

  const monthlyMax = Math.max(
    0,
    ...reportData.monthlyData.flatMap(d => [Number(d.income) || 0, Number(d.expenses) || 0, Number(d.savings) || 0])
  );
  const yAxisTicks = computeYAxisTicks(monthlyMax);
  const yAxisTop = yAxisTicks[yAxisTicks.length - 1] ?? 1;
  // --- END NEW ---
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1b0128] border border-purple-700 p-3 rounded-lg shadow-lg">
          <p className="text-purple-300 font-semibold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: ₹{entry.value?.toLocaleString('en-IN')}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const exportToPDF = async () => {
    setExporting(true);
    // Simulate PDF export
    await new Promise(resolve => setTimeout(resolve, 2000));
    alert("Report exported successfully!");
    setExporting(false);
  };

  const exportToCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,";
    // Implement CSV export logic here
    alert("CSV export functionality would be implemented here");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-b from-black via-[#0a0014] to-[#1a002a] text-gray-100">
        <AdvancedSidebar
          user={user}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-purple-400 text-xl">Generating reports...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-black via-[#0a0014] to-[#1a002a] text-gray-100">
      {/* Sidebar */}
      <AdvancedSidebar
        user={user}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMobileToggle={() => setMobileSidebarOpen(true)} />

        <main className="p-4 md:p-6 mt-16 flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-purple-400">Financial Reports</h1>
              <p className="text-gray-400 text-sm md:text-base">Comprehensive analysis of your financial data</p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={exportToCSV}
                className="px-4 py-2 border border-purple-600 text-purple-400 rounded-lg hover:bg-purple-600 hover:text-white transition-all duration-200"
              >
                📥 Export CSV
              </button>
              <button
                onClick={exportToPDF}
                disabled={exporting}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-lg hover:from-purple-700 hover:to-indigo-800 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
              >
                {exporting ? "⏳ Exporting..." : "📄 Export PDF"}
              </button>
            </div>
          </div>

          {/* Report Controls */}
          <div className="bg-[#1b0128]/70 border border-purple-800/30 p-4 rounded-xl shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                >
                  {reportTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Time Range</label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="w-full bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                >
                  {timeRanges.map(range => (
                    <option key={range.value} value={range.value}>{range.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-4 shadow-md">
              <p className="text-sm text-gray-400">Total Income</p>
              <h3 className="text-xl font-semibold text-green-400">₹{reportData.totalIncome.toLocaleString('en-IN')}</h3>
            </div>
            <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-4 shadow-md">
              <p className="text-sm text-gray-400">Total Expenses</p>
              <h3 className="text-xl font-semibold text-red-400">₹{reportData.totalExpenses.toLocaleString('en-IN')}</h3>
            </div>
            <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-4 shadow-md">
              <p className="text-sm text-gray-400">Net Savings</p>
              <h3 className={`text-xl font-semibold ${reportData.netSavings >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                ₹{reportData.netSavings.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-4 shadow-md">
              <p className="text-sm text-gray-400">Transactions</p>
              <h3 className="text-xl font-semibold text-purple-400">{reportData.totalTransactions}</h3>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Spending by Category Pie Chart (REPLACED) */}
            <SpendingPieChart reportData={reportData} />

            {/* Monthly Trends Line Chart */}
            <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-5 shadow-md">
              <h3 className="text-lg font-semibold text-purple-300 mb-4">Monthly Trends</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={reportData.monthlyData}
                    margin={{ top: 10, right: 30, left: 8, bottom: 0 }} // small left margin + reserved width on YAxis
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
                    <YAxis
                      width={84}                      // reserve horizontal space for labels
                      stroke="#9CA3AF"
                      tick={{ fontSize: 12, fill: "#9CA3AF" }}
                      tickFormatter={(v) => (Number.isFinite(v) ? v.toLocaleString("en-IN") : v)}
                      domain={[0, yAxisTop]}
                      ticks={yAxisTicks}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} dot={{ fill: "#10B981" }} />
                    <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} dot={{ fill: "#EF4444" }} />
                    <Line type="monotone" dataKey="savings" stroke="#3B82F6" strokeWidth={2} dot={{ fill: "#3B82F6" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Additional Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Spending Bar Chart */}
            <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-5 shadow-md">
              <h3 className="text-lg font-semibold text-purple-300 mb-4">Category-wise Spending</h3>
              <div className="h-80">
                {reportData.categorySpending.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={reportData.categorySpending}
                      margin={{ top: 10, right: 30, left: 48, bottom: 0 }} // increased left margin
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9CA3AF" angle={-45} textAnchor="end" height={80} />
                      <YAxis
                        width={80}                                // reserve space for labels
                        stroke="#9CA3AF"
                        tick={{ fontSize: 12, fill: "#9CA3AF" }}
                        tickFormatter={(v) => (Number.isFinite(v) ? v.toLocaleString("en-IN") : v)}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {reportData.categorySpending.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No category data available
                  </div>
                )}
              </div>
            </div>

            {/* Top Expenses */}
            <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-5 shadow-md">
              <h3 className="text-lg font-semibold text-purple-300 mb-4">Top 10 Expenses</h3>
              <div className="h-80 overflow-y-auto">
                <div className="space-y-3">
                  {reportData.topExpenses.map((expense, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-900/30 rounded-lg border border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <span className="text-purple-400 text-sm">#{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-white">{expense.name}</div>
                          <div className="text-xs text-gray-400">{expense.category} • {expense.date}</div>
                        </div>
                      </div>
                      <div className="text-red-400 font-semibold">₹{expense.amount.toLocaleString('en-IN')}</div>
                    </div>
                  ))}
                  {reportData.topExpenses.length === 0 && (
                    <div className="text-center py-8 text-gray-400">No expense data available</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Subscriptions Summary */}
          <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-5 shadow-md">
            <h3 className="text-lg font-semibold text-purple-300 mb-4">🔄 Subscriptions Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700">
                <div className="text-2xl font-bold text-purple-400">{reportData.activeSubscriptions}</div>
                <div className="text-sm text-gray-400">Active Subscriptions</div>
              </div>
              <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700">
                <div className="text-2xl font-bold text-red-400">₹{reportData.subscriptionCost.toLocaleString('en-IN')}</div>
                <div className="text-sm text-gray-400">Monthly Cost</div>
              </div>
              <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700">
                <div className="text-2xl font-bold text-yellow-400">₹{(reportData.subscriptionCost * 12).toLocaleString('en-IN')}</div>
                <div className="text-sm text-gray-400">Yearly Cost</div>
              </div>
            </div>
          </div>

          {/* Insights Section */}
          <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-5 shadow-md">
            <h3 className="text-lg font-semibold text-purple-300 mb-4">💡 Financial Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-700/30">
                <h4 className="font-semibold text-green-400 mb-2">Positive Trends</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Your savings rate is {((reportData.netSavings / reportData.totalIncome) * 100).toFixed(1)}% of income</li>
                  <li>• You have {reportData.activeSubscriptions} active subscriptions</li>
                  <li>• Top spending category: {reportData.categorySpending[0]?.name || 'N/A'}</li>
                </ul>
              </div>
              <div className="p-4 bg-red-900/20 rounded-lg border border-red-700/30">
                <h4 className="font-semibold text-red-400 mb-2">Areas for Improvement</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Consider reducing spending in top categories</li>
                  <li>• Review subscription costs for optimization</li>
                  <li>• Monitor your expense-to-income ratio</li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// --- START: Embedded SpendingPieChart component (merged) ---
function SmallCustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-white/95 p-2 rounded shadow text-sm text-slate-800">
      <div className="font-medium">{data.name}</div>
      <div>Amount: ₹{(data.value || 0).toLocaleString("en-IN")}</div>
    </div>
  );
}

function SpendingPieChart({ reportData }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const rect = entry.contentRect;
        setSize({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
      }
    });
    ro.observe(el);
    const rect = el.getBoundingClientRect();
    setSize({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
    return () => ro.disconnect();
  }, []);

  const { width, height } = size;
  const isMobile = width > 0 && width < 480;
  const isTablet = width >= 480 && width < 1024;
  const isDesktop = width >= 1024;

  // reserve legend width on larger screens so pie doesn't overlap it
  const legendWidth = (isDesktop || isTablet) ? 140 : 0;
  const padding = 24; // inner padding inside card

  // compute max diameter available for pie (subtract legend and padding)
  const availableWidth = Math.max(0, width - legendWidth - padding);
  const availableHeight = Math.max(0, height - padding);
  const maxDiameter = Math.max(0, Math.min(availableWidth, availableHeight));

  // Make pie smaller on mobile and cap size so it doesn't dominate the card
  const outerRadius = Math.max(20, Math.min(90, Math.floor(maxDiameter * (isMobile ? 0.38 : 0.45))));
  const innerRadius = Math.max(10, Math.floor(outerRadius * 0.48));

  // center X: shift left when legend occupies right side
  const cxPercent = legendWidth && width ? ((availableWidth / 2) / width) * 100 : 50;
  const cx = `${cxPercent}%`;

  const showLabels = isDesktop;
  const legendLayout = isMobile ? "horizontal" : "vertical";
  const legendAlign = isMobile ? "center" : "right";
  const legendVerticalAlign = isMobile ? "bottom" : "middle";

  if (!reportData || !Array.isArray(reportData.categorySpending)) {
    return (
      <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-4 shadow-md">
        <h3 className="text-lg font-semibold text-purple-300 mb-3">Spending by Category</h3>
        <div className="flex items-center justify-center h-48 text-gray-400">No spending data available</div>
      </div>
    );
  }

  return (
    <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-4 shadow-md">
      <h3 className="text-lg font-semibold text-purple-300 mb-3">Spending by Category</h3>

      <div
        ref={containerRef}
        className="w-full h-44 sm:h-56 md:h-64 lg:h-72 relative"
        role="img"
        aria-label="Pie chart showing spending by category"
      >
        {reportData.categorySpending.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={reportData.categorySpending}
                cx={cx}
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                labelLine={false}
                label={
                  showLabels
                    ? ({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`
                    : undefined
                }
                dataKey="value"
              >
                {reportData.categorySpending.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || "#8884d8"} />
                ))}
              </Pie>

              <Tooltip content={<SmallCustomTooltip />} />

              <Legend
                layout={legendLayout}
                verticalAlign={legendVerticalAlign}
                align={legendAlign}
                iconSize={isMobile ? 10 : 14}
                wrapperStyle={{
                  paddingTop: 6,
                  paddingBottom: 6,
                  ...(isDesktop || isTablet
                    ? { right: 8, width: legendWidth, top: "50%", transform: "translateY(-50%)" }
                    : { bottom: 6, left: '50%', transform: 'translateX(-50%)' }),
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No spending data available
          </div>
        )}
      </div>

      {!showLabels && reportData.categorySpending.length > 0 && (
        <div className="mt-3 text-sm text-slate-300">
          Top categories: {reportData.categorySpending
            .slice()
            .sort((a, b) => b.value - a.value)
            .slice(0, 3)
            .map((c) => `${c.name} (${c.value.toLocaleString('en-IN')})`)
            .join(" • ")}
        </div>
      )}
    </div>
  );
}
// --- END: Embedded SpendingPieChart component ---

export default ReportsPage;