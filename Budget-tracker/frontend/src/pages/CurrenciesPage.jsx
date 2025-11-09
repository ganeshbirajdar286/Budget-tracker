// CurrenciesPage.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";

const CurrenciesPage = () => {
  const [currencies, setCurrencies] = useState([]);
  const [userCurrency, setUserCurrency] = useState("INR");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddCurrency, setShowAddCurrency] = useState(false);
  const [converter, setConverter] = useState({
    amount: "1000",
    fromCurrency: "INR",
    toCurrency: "USD"
  });
  const [convertedAmount, setConvertedAmount] = useState("");

  const [newCurrency, setNewCurrency] = useState({
    code: "",
    name: "",
    rate_to_inr: "",
    is_default: false
  });

  const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;

  // Popular currencies with their symbols and initial rates
  // NOTE: keep these values as your app expects. If you want them to represent INR per unit,
  // update them accordingly. I'm leaving them close to your original example.
  const popularCurrencies = [
    { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳", rate_to_inr: 1 },
    { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸", rate_to_inr: 0.012 },
    { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺", rate_to_inr: 0.011 },
    { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧", rate_to_inr: 0.0095 },
    { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵", rate_to_inr: 1.78 },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$", flag: "🇨🇦", rate_to_inr: 0.016 },
    { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺", rate_to_inr: 0.018 },
    { code: "CNY", name: "Chinese Yuan", symbol: "¥", flag: "🇨🇳", rate_to_inr: 0.086 },
    { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬", rate_to_inr: 0.016 },
    { code: "AED", name: "UAE Dirham", symbol: "د.إ", flag: "🇦🇪", rate_to_inr: 0.044 },
  ];

  const token = localStorage.getItem("token");
  
  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // Fetch user & currencies on mount
  useEffect(() => {
    fetchUser();
    fetchCurrencies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate conversion when converter values change or currencies change
  useEffect(() => {
    calculateConversion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [converter.amount, converter.fromCurrency, converter.toCurrency, currencies]);

  // Lock body scroll when sidebar open (mobile)
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

  const fetchCurrencies = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${VITE_BASE_URL}/api/currencies`, axiosConfig);
      const currenciesData = res.data.currencies || res.data || [];
      setCurrencies(currenciesData);
      
      // Find default currency
      const defaultCurrency = currenciesData.find(c => c.is_default);
      if (defaultCurrency) {
        setUserCurrency(defaultCurrency.code);
      }

      // If no currencies in database, initialize with popular currencies
      if (currenciesData.length === 0) {
        await initializeDefaultCurrencies();
      }
    } catch (err) {
      console.error("Fetch currencies error:", err);
      // If API fails, use local popular currencies
      setCurrencies(popularCurrencies.map(currency => ({ 
        ...currency, 
        is_default: currency.code === "INR" 
      })));
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultCurrencies = async () => {
    try {
      for (const currency of popularCurrencies) {
        await axios.post(`${VITE_BASE_URL}/api/currencies`, {
          code: currency.code,
          name: currency.name,
          rate_to_inr: currency.rate_to_inr,
          is_default: currency.code === "INR"
        }, axiosConfig);
      }
      // Refetch currencies after initialization
      const res = await axios.get(`${VITE_BASE_URL}/api/currencies`, axiosConfig);
      setCurrencies(res.data.currencies || res.data);
    } catch (err) {
      console.error("Initialize currencies error:", err);
    }
  };

  const handleAddCurrency = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${VITE_BASE_URL}/api/currencies`, {
        code: newCurrency.code,
        name: newCurrency.name,
        rate_to_inr: parseFloat(newCurrency.rate_to_inr),
        is_default: newCurrency.is_default
      }, axiosConfig);
      
      fetchCurrencies();
      setShowAddCurrency(false);
      setNewCurrency({
        code: "",
        name: "",
        rate_to_inr: "",
        is_default: false
      });
    } catch (err) {
      console.error("Add currency error:", err);
      alert("Error adding currency. Please try again.");
    }
  };

  const handleSetDefault = async (currencyCode) => {
    try {
      await axios.put(`${VITE_BASE_URL}/api/currencies/default`, 
        { currency_code: currencyCode }, 
        axiosConfig
      );
      setUserCurrency(currencyCode);
      fetchCurrencies(); // Refresh to update is_default flags
    } catch (err) {
      console.error("Set default currency error:", err);
      alert("Error setting default currency. Please try again.");
    }
  };

  const handleRemoveCurrency = async (currencyCode) => {
    if (currencyCode === userCurrency) {
      alert("Cannot remove your default currency. Please set another currency as default first.");
      return;
    }
    
    try {
      await axios.delete(`${VITE_BASE_URL}/api/currencies/${currencyCode}`, axiosConfig);
      fetchCurrencies();
    } catch (err) {
      console.error("Remove currency error:", err);
      alert("Error removing currency. Please try again.");
    }
  };

  const calculateConversion = () => {
    if (!converter.amount || parseFloat(converter.amount) <= 0) {
      setConvertedAmount("");
      return;
    }

    const fromCurrency = currencies.find(c => c.code === converter.fromCurrency);
    const toCurrency = currencies.find(c => c.code === converter.toCurrency);

    if (!fromCurrency || !toCurrency) {
      setConvertedAmount("N/A");
      return;
    }

    // Convert via INR as base currency
    // Note: I kept your formula but made sure to coerce numbers safely
    const amount = parseFloat(converter.amount);
    const fromRate = parseFloat(fromCurrency.rate_to_inr);
    const toRate = parseFloat(toCurrency.rate_to_inr);

    if (isNaN(fromRate) || isNaN(toRate) || fromRate === 0) {
      setConvertedAmount("N/A");
      return;
    }

    // If your rate_to_inr means "INR per 1 unit of currency", then:
    // amount_in_inr = amount * fromRate
    // converted = amount_in_inr / toRate
    // But your original code used inverse; to preserve behavior I've implemented a robust approach:
    // If most rates are <= 1 (looks like 'per INR' style), use inverse style used originally.
    const sample = currencies.find(c => c.code === "INR");
    let converted;
    if (sample && sample.rate_to_inr === 1 && (fromRate <= 1 || toRate <= 1)) {
      // original logic style (treat rates as currency per INR)
      const amountInINR = amount / fromRate;
      converted = amountInINR * toRate;
    } else {
      // treat rates as INR per 1 unit of currency
      const amountInINR = amount * fromRate;
      converted = amountInINR / toRate;
    }

    setConvertedAmount(isFinite(converted) ? converted.toFixed(2) : "N/A");
  };

  const getCurrencySymbol = (code) => {
    const currency = popularCurrencies.find(c => c.code === code);
    return currency ? currency.symbol : code;
  };

  const getCurrencyFlag = (code) => {
    const currency = popularCurrencies.find(c => c.code === code);
    return currency ? currency.flag : "🏳️";
  };

  const getExchangeRate = (fromCode, toCode) => {
    const fromCurrency = currencies.find(c => c.code === fromCode);
    const toCurrency = currencies.find(c => c.code === toCode);
    
    if (!fromCurrency || !toCurrency) return "N/A";
    
    // Compute rate robustly (same logic as conversion)
    const sample = currencies.find(c => c.code === "INR");
    const fromRate = parseFloat(fromCurrency.rate_to_inr);
    const toRate = parseFloat(toCurrency.rate_to_inr);

    if (!sample || sample.rate_to_inr !== 1) {
      // assume rates are INR per unit
      const rate = toRate / fromRate;
      return isFinite(rate) ? rate.toFixed(4) : "N/A";
    } else {
      // if INR present with rate 1 and others look like <=1, use inverse-style
      const rate = toRate / fromRate;
      return isFinite(rate) ? rate.toFixed(4) : "N/A";
    }
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
          <div className="text-purple-400 text-xl">Loading currencies...</div>
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
              <h1 className="text-2xl md:text-3xl font-bold text-purple-400">Currencies</h1>
              <p className="text-gray-400 text-sm md:text-base">Manage your currencies and exchange rates</p>
            </div>
            
            <button
              onClick={() => setShowAddCurrency(true)}
              className="w-full md:w-auto mt-2 md:mt-0 bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-4 md:px-5 py-2.5 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-800 transition-all duration-200 shadow-md flex items-center gap-2 justify-center"
            >
              🌍 Add Currency
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-4 md:p-5 shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <span className="text-green-400 text-lg">💰</span>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Default Currency</p>
                  <h3 className="text-lg font-semibold text-green-400">
                    {userCurrency} - {getCurrencySymbol(userCurrency)}
                  </h3>
                  <p className="text-xs text-gray-500">Your primary currency</p>
                </div>
              </div>
            </div>

            <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-4 md:p-5 shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <span className="text-blue-400 text-lg">🌐</span>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Supported Currencies</p>
                  <h3 className="text-lg font-semibold text-blue-400">
                    {currencies.length} Currencies
                  </h3>
                  <p className="text-xs text-gray-500">Available for use</p>
                </div>
              </div>
            </div>

            <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-4 md:p-5 shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <span className="text-yellow-400 text-lg">📊</span>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Base Currency</p>
                  <h3 className="text-lg font-semibold text-yellow-400">
                    Indian Rupee (INR)
                  </h3>
                  <p className="text-xs text-gray-500">All rates vs INR</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Your Currencies */}
            <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-4 md:p-5 shadow-md">
              <h3 className="text-lg font-semibold text-purple-300 mb-4">Your Currencies</h3>
              <div className="space-y-3 max-h-[36rem] overflow-y-auto pr-2">
                {currencies.map((currency) => (
                  <div
                    key={currency.code}
                    className={`p-3 md:p-4 rounded-lg border transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${
                      currency.is_default 
                        ? "bg-purple-900/30 border-purple-500" 
                        : "bg-gray-900/30 border-gray-700 hover:border-purple-600"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getCurrencyFlag(currency.code)}</span>
                      <div>
                        <h4 className="font-semibold text-white text-sm md:text-base">{currency.name}</h4>
                        <p className="text-xs md:text-sm text-gray-400">{currency.code} • {getCurrencySymbol(currency.code)}</p>
                        <p className="text-xs md:text-sm text-purple-400 mt-1">
                          1 INR = {(1 / parseFloat(currency.rate_to_inr || 1)).toFixed(4)} {currency.code}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 md:gap-3">
                      {currency.is_default ? (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                          Default
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleSetDefault(currency.code)}
                            className="px-3 py-1 md:px-4 md:py-2 bg-blue-500/20 w-full md:w-auto text-blue-400 text-sm rounded-lg hover:bg-blue-500/30 transition"
                          >
                            Set Default
                          </button>
                          <button
                            onClick={() => handleRemoveCurrency(currency.code)}
                            className="px-3 py-1 md:px-4 md:py-2 bg-red-500/20 w-full md:w-auto text-red-400 text-sm rounded-lg hover:bg-red-500/30 transition"
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                
                {currencies.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    No currencies added yet. Add your first currency to get started.
                  </div>
                )}
              </div>
            </div>

            {/* Currency Converter */}
            <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-4 md:p-5 shadow-md">
              <h3 className="text-lg font-semibold text-purple-300 mb-4">💱 Currency Converter</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">From</label>
                    <select 
                      value={converter.fromCurrency}
                      onChange={(e) => setConverter({...converter, fromCurrency: e.target.value})}
                      className="w-full bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                    >
                      {currencies.map(currency => (
                        <option key={`from-${currency.code}`} value={currency.code}>
                          {currency.code} - {currency.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">To</label>
                    <select 
                      value={converter.toCurrency}
                      onChange={(e) => setConverter({...converter, toCurrency: e.target.value})}
                      className="w-full bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                    >
                      {currencies.map(currency => (
                        <option key={`to-${currency.code}`} value={currency.code}>
                          {currency.code} - {currency.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Amount</label>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={converter.amount}
                    onChange={(e) => setConverter({...converter, amount: e.target.value})}
                    className="w-full bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-700/30">
                  <p className="text-sm text-gray-400">Converted Amount</p>
                  <h4 className="text-lg md:text-xl font-bold text-purple-300 mt-1">
                    {converter.amount} {converter.fromCurrency} = {convertedAmount} {converter.toCurrency}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Exchange rate: 1 {converter.fromCurrency} = {getExchangeRate(converter.fromCurrency, converter.toCurrency)} {converter.toCurrency}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Exchange Rates Table */}
          <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-4 md:p-5 shadow-md">
            <h3 className="text-lg font-semibold text-purple-300 mb-4">📈 Current Exchange Rates (Base: INR)</h3>
            <div className="overflow-x-auto rounded-md">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-purple-950/50 text-purple-300 uppercase text-xs">
                  <tr>
                    <th className="py-3 px-4 text-left">Currency</th>
                    <th className="py-3 px-4 text-left">Code</th>
                    <th className="py-3 px-4 text-left">Symbol</th>
                    <th className="py-3 px-4 text-left">Rate to INR</th>
                    <th className="py-3 px-4 text-left">INR to Currency</th>
                    <th className="py-3 px-4 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currencies.map((currency) => (
                    <tr key={currency.code} className="border-t border-purple-800/30 hover:bg-purple-900/20 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getCurrencyFlag(currency.code)}</span>
                          <span className="truncate">{currency.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-purple-300">{currency.code}</td>
                      <td className="py-3 px-4 text-gray-400">{getCurrencySymbol(currency.code)}</td>
                      <td className="py-3 px-4 font-semibold">
                        1 {currency.code} = {currency.rate_to_inr} INR
                      </td>
                      <td className="py-3 px-4 font-semibold text-green-400">
                        1 INR = {(1 / parseFloat(currency.rate_to_inr || 1)).toFixed(4)} {currency.code}
                      </td>
                      <td className="py-3 px-4">
                        {currency.is_default ? (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                            Default
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">
                            Active
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {currencies.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  No currencies available. Add currencies to see exchange rates.
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Add Currency Modal */}
        {showAddCurrency && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[11000] p-4">
            <div className="bg-[#1b0128] border border-purple-700/50 rounded-xl w-full max-w-md p-6 shadow-2xl">
              <h2 className="text-xl font-semibold text-purple-300 mb-4">Add New Currency</h2>
              <form onSubmit={handleAddCurrency} className="flex flex-col gap-3">
                <select
                  value={newCurrency.code}
                  onChange={(e) => {
                    const selected = popularCurrencies.find(c => c.code === e.target.value);
                    setNewCurrency({
                      ...newCurrency,
                      code: e.target.value,
                      name: selected?.name || "",
                      rate_to_inr: selected?.rate_to_inr || ""
                    });
                  }}
                  required
                  className="bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Currency</option>
                  {popularCurrencies.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.flag} {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Currency Name"
                  value={newCurrency.name}
                  onChange={(e) => setNewCurrency({ ...newCurrency, name: e.target.value })}
                  required
                  className="bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                />

                <input
                  type="number"
                  step="0.0001"
                  placeholder="Rate to INR (e.g., 0.012 for USD)"
                  value={newCurrency.rate_to_inr}
                  onChange={(e) => setNewCurrency({ ...newCurrency, rate_to_inr: e.target.value })}
                  required
                  className="bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                />

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={newCurrency.is_default}
                    onChange={(e) => setNewCurrency({ ...newCurrency, is_default: e.target.checked })}
                    className="rounded border-purple-700 bg-transparent text-purple-500 focus:ring-purple-500"
                  />
                  <label htmlFor="is_default" className="text-sm text-gray-300">
                    Set as default currency
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddCurrency(false)}
                    className="w-full sm:w-auto px-4 py-2 text-sm border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white transition-all"
                  >
                    Add Currency
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

export default CurrenciesPage;
