// TransactionPage.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";

const TransactionPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    merchant: "",
    category_id: "",
    type: "expense",
    amount: "",
    currency: "INR",
    transaction_date: "",
    description: "",
  });
  const [user, setUser] = useState(null);

  const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;
  const token = localStorage.getItem("token");

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
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

  const getCategoryName = (id) => {
    const cat = categories.find((c) => parseInt(c.id) === parseInt(id));
    return cat ? cat.name : "Unknown";
  };

  // Fetch data
  useEffect(() => {
    fetchUser();
    fetchTransactions();
  }, []);

  // Disable body scroll when sidebar/modal open
  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen || showModal ? "hidden" : "auto";
  }, [mobileSidebarOpen, showModal]);

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
      setTransactions(res.data.transactions || res.data);
    } catch (err) {
      console.error("Fetch transactions error:", err);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${VITE_BASE_URL}/api/transactions`, newTransaction, axiosConfig);
      fetchTransactions();
      setShowModal(false);
      setNewTransaction({
        merchant: "",
        category_id: "",
        type: "expense",
        amount: "",
        currency: "INR",
        transaction_date: "",
        description: "",
      });
    } catch (err) {
      console.error("Add transaction error:", err);
    }
  };

  const filteredTransactions = transactions
    .filter((t) => filter === "all" || t.type.toLowerCase() === filter)
    .filter((t) => categoryFilter === "all" || parseInt(t.category_id) === parseInt(categoryFilter))
    .filter((t) => t.merchant.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-black via-[#0a0014] to-[#1a002a] text-gray-100 overflow-hidden">
      {/* Sidebar */}
      <AdvancedSidebar
        user={user}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMobileToggle={() => setMobileSidebarOpen(true)} />

        <main className="p-3 sm:p-4 md:p-6 mt-16 flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-purple-400">Transactions</h1>
              <p className="text-gray-400 text-sm md:text-base">
                Manage your income and expenses efficiently
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-800 transition-all duration-200 shadow-md"
            >
              + Add Transaction
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "Total Balance",
                color: "text-purple-300",
                value: transactions
                  .reduce(
                    (sum, t) =>
                      t.type === "income"
                        ? sum + parseFloat(t.amount)
                        : sum - parseFloat(t.amount),
                    0
                  )
                  .toLocaleString("en-IN"),
              },
              {
                title: "Total Income",
                color: "text-green-400",
                value: transactions
                  .filter((t) => t.type === "income")
                  .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                  .toLocaleString("en-IN"),
              },
              {
                title: "Total Expenses",
                color: "text-red-400",
                value: transactions
                  .filter((t) => t.type === "expense")
                  .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                  .toLocaleString("en-IN"),
              },
              {
                title: "Total Transactions",
                color: "text-indigo-400",
                value: transactions.length,
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-4 sm:p-5 shadow-md flex flex-col justify-center"
              >
                <p className="text-sm text-gray-400">{item.title}</p>
                <h2 className={`text-xl sm:text-2xl font-semibold mt-1 ${item.color}`}>
                  ₹{item.value}
                </h2>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-[#1b0128]/70 border border-purple-800/30 p-4 rounded-xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
            <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 flex-1 sm:flex-none"
              >
                <option value="all">All</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 flex-1 sm:flex-none"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Search merchant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm placeholder-gray-500 focus:ring-2 focus:ring-purple-500 flex-1 min-w-[150px]"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl overflow-x-auto shadow-md">
            <table className="min-w-full text-sm">
              <thead className="bg-purple-950/50 text-purple-300 uppercase text-xs sm:text-sm">
                <tr>
                  <th className="py-2 px-3 text-left whitespace-nowrap">Merchant</th>
                  <th className="py-2 px-3 text-left whitespace-nowrap">Category</th>
                  <th className="py-2 px-3 text-left whitespace-nowrap">Date</th>
                  <th className="py-2 px-3 text-left whitespace-nowrap">Type</th>
                  <th className="py-2 px-3 text-left whitespace-nowrap">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((t) => (
                  <tr
                    key={t.transaction_id}
                    className="border-t border-purple-800/30 hover:bg-purple-900/20 transition"
                  >
                    <td className="py-2 px-3 break-words">{t.merchant}</td>
                    <td className="py-2 px-3 text-purple-300">
                      {getCategoryName(t.category_id)}
                    </td>
                    <td className="py-2 px-3 text-gray-400 whitespace-nowrap">
                      {new Date(t.transaction_date).toLocaleDateString()}
                    </td>
                    <td
                      className={`py-2 px-3 ${
                        t.type === "income" ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {t.type}
                    </td>
                    <td className="py-2 px-3 font-semibold whitespace-nowrap">
                      {t.type === "income" ? "+" : "-"}₹
                      {parseFloat(t.amount).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTransactions.length === 0 && (
              <div className="text-center py-6 text-gray-400">
                No transactions found.
              </div>
            )}
          </div>
        </main>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[11000] p-3 sm:p-4">
            <div className="bg-[#1b0128] border border-purple-700/50 rounded-xl w-full max-w-md p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
              <h2 className="text-lg sm:text-xl font-semibold text-purple-300 mb-4">
                Add New Transaction
              </h2>
              <form onSubmit={handleAddTransaction} className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Merchant"
                  value={newTransaction.merchant}
                  onChange={(e) =>
                    setNewTransaction({ ...newTransaction, merchant: e.target.value })
                  }
                  required
                  className="bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={newTransaction.amount}
                  onChange={(e) =>
                    setNewTransaction({ ...newTransaction, amount: e.target.value })
                  }
                  required
                  className="bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                />
                <select
                  value={newTransaction.type}
                  onChange={(e) =>
                    setNewTransaction({ ...newTransaction, type: e.target.value })
                  }
                  className="bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
                <input
                  type="date"
                  value={newTransaction.transaction_date}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      transaction_date: e.target.value,
                    })
                  }
                  required
                  className="bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                />
                <select
                  value={newTransaction.category_id}
                  onChange={(e) =>
                    setNewTransaction({ ...newTransaction, category_id: e.target.value })
                  }
                  required
                  className="bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <textarea
                  placeholder="Description"
                  value={newTransaction.description}
                  onChange={(e) =>
                    setNewTransaction({ ...newTransaction, description: e.target.value })
                  }
                  className="bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 resize-none"
                  rows={3}
                ></textarea>

                <div className="flex flex-col sm:flex-row justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white transition-all"
                  >
                    Add Transaction
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

export default TransactionPage;
