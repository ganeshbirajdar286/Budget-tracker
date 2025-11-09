import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";

const BudgetPage = () => {
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [user, setUser] = useState(null);
  const [newBudget, setNewBudget] = useState({
    category_id: "",
    amount: "",
    month: new Date().toISOString().slice(0, 7),
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;
  const token = localStorage.getItem("token");

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const categories = [
    { id: 1, name: "Food & Dining" },
    { id: 2, name: "Shopping" },
    { id: 3, name: "Transportation" },
    { id: 4, name: "Entertainment" },
    { id: 5, name: "Bills & Utilities" },
    { id: 6, name: "Healthcare" },
    { id: 7, name: "Salary" },
    { id: 8, name: "Investment" },
  ];

  const getCategoryName = (id) =>
    categories.find((c) => +c.id === +id)?.name || "Unknown";

  // 🚀 Fetch all data (user, budgets, transactions)
  const fetchAllData = async () => {
    setLoading(true);
    setError("");
    try {
      await Promise.all([fetchUser(), fetchBudgets(), fetchTransactions()]);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${VITE_BASE_URL}/api/users/me`, axiosConfig);
      if (res.data?.user) setUser(res.data.user);
    } catch (err) {
      console.error("❌ Fetch user error:", err.response?.data || err.message);
      throw err;
    }
  };

  const fetchBudgets = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${VITE_BASE_URL}/api/budgets`, axiosConfig);
      const data = res.data.budgets || res.data || [];
      setBudgets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Fetch budgets error:", err.response?.data || err.message);
      setBudgets([]);
      throw err;
    }
  };

  const fetchTransactions = async () => {
    if (!token) return;
    try {
      const res = await axios.get(
        `${VITE_BASE_URL}/api/transactions`,
        axiosConfig
      );
      const data = res.data.transactions || res.data || [];
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Fetch transactions error:", err.response?.data || err.message);
      setTransactions([]);
      throw err;
    }
  };

  // 🟢 Add New Budget
  const handleAddBudget = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post(
        `${VITE_BASE_URL}/api/budgets`,
        newBudget,
        axiosConfig
      );
      console.log("✅ Budget added:", res.data);
      await fetchBudgets();
      setShowModal(false);
      setNewBudget({
        category_id: "",
        amount: "",
        month: new Date().toISOString().slice(0, 7),
        description: "",
      });
    } catch (err) {
      console.error("❌ Add budget error:", err.response?.data || err.message);
      const msg = err.response?.data?.error || "Failed to add budget.";
      setError(msg);
      alert(msg);
    }
  };

  // 🔴 Delete Budget
  const handleDeleteBudget = async (id) => {
    if (!window.confirm("Are you sure you want to delete this budget?")) return;
    try {
      await axios.delete(`${VITE_BASE_URL}/api/budgets/${id}`, axiosConfig);
      await fetchBudgets();
    } catch (err) {
      console.error("❌ Delete budget error:", err.response?.data || err.message);
      alert(err.response?.data?.error || "Failed to delete budget");
    }
  };

  // 📊 Utility Calculations
  const calculateSpentAmount = (categoryId, month) =>
    transactions
      .filter(
        (t) =>
          t.transaction_date?.slice(0, 7) === month &&
          +t.category_id === +categoryId &&
          t.type === "expense"
      )
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const calculateProgress = (budget, spent) =>
    !budget ? 0 : Math.min((spent / budget) * 100, 100);

  const getProgressColor = (p) =>
    p < 70 ? "bg-green-500" : p < 90 ? "bg-yellow-500" : "bg-red-500";

  const formatCurrency = (a) =>
    `₹${parseFloat(a || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
    })}`;

  const totalBudget = budgets.reduce((s, b) => s + +b.amount, 0);
  const totalSpent = budgets.reduce(
    (s, b) => s + calculateSpentAmount(b.category_id, b.month),
    0
  );
  const remainingBudget = totalBudget - totalSpent;

  // ⚙️ Mount Logic
  useEffect(() => {
    if (!token) {
      setError("No authentication token found.");
      setLoading(false);
    } else {
      fetchAllData();
    }
  }, []);

  // Disable body scroll when modal/sidebar open
  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen || showModal ? "hidden" : "auto";
  }, [mobileSidebarOpen, showModal]);

  // 🌀 Loader
  if (loading)
    return (
      <div className="flex min-h-screen bg-gradient-to-b from-black via-[#0a0014] to-[#1a002a] text-gray-100">
        <AdvancedSidebar user={user} mobileOpen={mobileSidebarOpen} />
        <div className="flex-1 flex flex-col min-h-screen">
          <Header onMobileToggle={() => setMobileSidebarOpen(true)} />
          <main className="p-4 mt-16 flex justify-center items-center">
            <div className="text-center">
              <div className="animate-spin h-12 w-12 border-b-2 border-purple-500 rounded-full mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading budgets...</p>
            </div>
          </main>
        </div>
      </div>
    );

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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-purple-400">
                Budget Management
              </h1>
              <p className="text-gray-400 text-sm md:text-base">
                Track and manage your monthly budgets
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchAllData}
                className="px-4 py-2 border border-purple-600 text-purple-300 rounded-lg hover:bg-purple-900/30 transition-all"
              >
                Refresh
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-800 shadow-md"
              >
                + Add Budget
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-xl p-4">
              <div className="flex justify-between">
                <div>
                  <p className="text-red-300 font-medium">Error</p>
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
                <button
                  onClick={() => setError("")}
                  className="text-red-400 hover:text-red-300"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Budget", value: totalBudget, color: "purple-300" },
              { label: "Total Spent", value: totalSpent, color: "red-400" },
              {
                label: "Remaining",
                value: remainingBudget,
                color: remainingBudget >= 0 ? "green-400" : "red-400",
              },
              { label: "Active Budgets", value: budgets.length, color: "indigo-400" },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-4 md:p-5 shadow-md"
              >
                <p className="text-sm text-gray-400">{stat.label}</p>
                <h2 className={`text-xl md:text-2xl font-semibold text-${stat.color} mt-1`}>
                  {typeof stat.value === "number"
                    ? formatCurrency(stat.value)
                    : stat.value}
                </h2>
              </div>
            ))}
          </div>

          {/* Budget Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((b) => {
              const spent = calculateSpentAmount(b.category_id, b.month);
              const progress = calculateProgress(b.amount, spent);
              const remaining = b.amount - spent;

              return (
                <div
                  key={b.budget_id || b.id}
                  className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-4 shadow-md hover:border-purple-600/50 transition-all"
                >
                  <div className="flex justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-purple-300">
                        {getCategoryName(b.category_id)}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {new Date(b.month + "-01").toLocaleDateString("en-IN", {
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handleDeleteBudget(b.budget_id || b.id)
                      }
                      className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-red-900/20 transition-colors"
                    >
                      Delete
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">
                        {formatCurrency(spent)} of {formatCurrency(b.amount)}
                      </span>
                      <span
                        className={`font-medium ${
                          progress < 70
                            ? "text-green-400"
                            : progress < 90
                            ? "text-yellow-400"
                            : "text-red-400"
                        }`}
                      >
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getProgressColor(progress)}`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-gray-400">
                      <span>Budget:</span>
                      <span className="text-purple-300">{formatCurrency(b.amount)}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Spent:</span>
                      <span className="text-red-400">{formatCurrency(spent)}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Remaining:</span>
                      <span
                        className={
                          remaining >= 0 ? "text-green-400" : "text-red-400"
                        }
                      >
                        {formatCurrency(Math.abs(remaining))}
                        {remaining < 0 && " (Over)"}
                      </span>
                    </div>
                  </div>

                  {b.description && (
                    <p className="text-xs text-gray-500 mt-2">{b.description}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {budgets.length === 0 && !error && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg mb-2">
                No budgets set yet
              </p>
              <p className="text-gray-500 text-sm mb-4">
                Create your first budget to start tracking your expenses
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-800 transition-all"
              >
                Create Your First Budget
              </button>
            </div>
          )}
        </main>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[11000] p-4">
            <div className="bg-[#1b0128] border border-purple-700/50 rounded-xl w-full max-w-md p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
              <h2 className="text-xl font-semibold text-purple-300 mb-4">
                Create New Budget
              </h2>
              <form onSubmit={handleAddBudget} className="flex flex-col gap-3">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Category
                  </label>
                  <select
                    value={newBudget.category_id}
                    onChange={(e) =>
                      setNewBudget({
                        ...newBudget,
                        category_id: e.target.value,
                      })
                    }
                    required
                    className="w-full bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Amount
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={newBudget.amount}
                    onChange={(e) =>
                      setNewBudget({
                        ...newBudget,
                        amount: e.target.value,
                      })
                    }
                    required
                    min="0"
                    step="0.01"
                    className="w-full bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Month
                  </label>
                  <input
                    type="month"
                    value={newBudget.month}
                    onChange={(e) =>
                      setNewBudget({ ...newBudget, month: e.target.value })
                    }
                    required
                    className="w-full bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newBudget.description}
                    onChange={(e) =>
                      setNewBudget({
                        ...newBudget,
                        description: e.target.value,
                      })
                    }
                    placeholder="Add a short description..."
                    rows={3}
                    className="w-full bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 resize-none"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white"
                  >
                    Create Budget
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetPage;
