import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  FiHome,
  FiBarChart2,
  FiDollarSign,
  FiBell,
  FiSettings,
  FiX,
  FiFileText,
  FiUsers,
  FiBookOpen,
  FiLogOut,
  FiTrendingUp,
  FiRepeat,
  FiGlobe,
  FiClock,
  FiSearch,
  FiMenu,
} from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";

const DEFAULT_COLLAPSED_KEY = "app.sidebar.collapsed";

// Build menu based on role
const buildMenu = (role, notificationsCount = 0) => [
  {
    id: "main",
    label: "Main",
    items: [
      { id: "dashboard", label: "Dashboard", icon: <FiHome />, route: "/dashboard" },
      { id: "analytics", label: "Analytics", icon: <FiBarChart2 />, route: "/analytics" },
      { id: "trends", label: "Trends", icon: <FiTrendingUp />, route: "/trends" },
    ],
  },
  {
    id: "money",
    label: "Money",
    items: [
      { id: "transactions", label: "Transactions", icon: <FiDollarSign />, route: "/transactions" },
      { id: "budgets", label: "Budgets", icon: <FiRepeat />, route: "/budgets" },
      { id: "subscriptions", label: "Subscriptions", icon: <FiClock />, route: "/subscriptions" },
      { id: "currencies", label: "Currencies", icon: <FiGlobe />, route: "/currencies" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    items: [
      { id: "reports", label: "Reports", icon: <FiFileText />, route: "/reports" },
      ...(role === "admin"
        ? [{ id: "manage", label: "Admin Panel", icon: <FiUsers />, route: "/admin" }]
        : []),
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      {
        id: "notifications",
        label: "Notifications",
        icon: <FiBell />,
        route: "/notifications",
        badge: notificationsCount,
      },
      { id: "settings", label: "Settings", icon: <FiSettings />, route: "/settings" },
    ],
  },
];

export default function AdvancedSidebar({
  user = { username: "Guest", avatarUrl: "" },
  role = "user",
  collapsed: collapsedProp = false,
  onNavigate = () => {},
  notificationsCount = 0,
  mobileOpen = false,
  onMobileClose = () => {},
}) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const v = localStorage.getItem(DEFAULT_COLLAPSED_KEY);
      return v ? JSON.parse(v) : collapsedProp;
    } catch {
      return collapsedProp;
    }
  });
  const [query, setQuery] = useState("");
  const [internalMobileOpen, setInternalMobileOpen] = useState(mobileOpen);

  useEffect(() => setInternalMobileOpen(mobileOpen), [mobileOpen]);

  useEffect(() => {
    try {
      localStorage.setItem(DEFAULT_COLLAPSED_KEY, JSON.stringify(collapsed));
    } catch {}
  }, [collapsed]);

  const avatar = user?.avatarUrl || "/default-avatar.png";
  const username = user?.username || "Guest";

  const menus = useMemo(() => buildMenu(role, notificationsCount), [role, notificationsCount]);

  const filteredMenus = useMemo(
    () =>
      menus.map((group) => ({
        ...group,
        items: group.items.filter((it) =>
          query.trim() === "" ? true : it.label.toLowerCase().includes(query.toLowerCase())
        ),
      })),
    [menus, query]
  );

  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = useCallback(
    (route) => {
      onNavigate(route);
      navigate(route);
      // close mobile drawer when navigating
      setInternalMobileOpen(false);
      onMobileClose();
      document.body.style.overflow = "auto";
    },
    [navigate, onNavigate, onMobileClose]
  );

  const isActive = useCallback(
    (route) => {
      if (!route) return false;
      // exact or prefix match for route groups
      return location.pathname === route || location.pathname.startsWith(route + "/");
    },
    [location.pathname]
  );

  return (
    <>
      {/* MOBILE DRAWER */}
      <div
        className={`fixed inset-0 z-[9999] flex md:hidden transition-transform duration-300 ease-in-out ${
          internalMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!internalMobileOpen}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => {
            setInternalMobileOpen(false);
            onMobileClose();
          }}
        />
        <aside className="relative w-72 h-full bg-gradient-to-b from-black via-[#1b0128] to-[#2e014d] text-white p-4 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img src={avatar} alt={username} className="w-10 h-10 rounded-full object-cover" />
              <div>
                <div className="font-semibold text-white">{username}</div>
                <div className="text-xs text-purple-300 capitalize">{role}</div>
              </div>
            </div>
            <button onClick={() => { setInternalMobileOpen(false); onMobileClose(); }} className="p-2 rounded-md hover:bg-purple-600/40 transition" aria-label="Close menu">
              <FiX size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2 bg-purple-950/40 rounded-lg p-2 mb-4">
            <FiSearch className="text-purple-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="flex-1 bg-transparent outline-none text-sm text-purple-200 placeholder-purple-400"
              aria-label="Search menu"
            />
          </div>

          <div className="flex-1 overflow-y-auto sidebar-scrollbar">
            <nav aria-label="Main navigation">
              {filteredMenus.map((group) => (
                <div key={group.id} className="mb-5">
                  <div className="uppercase text-xs text-purple-400 mb-2 tracking-wide">{group.label}</div>
                  <ul className="flex flex-col gap-2">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={() => handleNav(item.route)}
                          className={`flex items-center gap-3 w-full p-2 rounded-md hover:bg-purple-600/30 transition-all duration-200 text-left ${isActive(item.route) ? "bg-purple-700/40" : ""}`}
                          aria-current={isActive(item.route) ? "page" : undefined}
                          title={item.label}
                        >
                          <span className="text-lg text-purple-300">{item.icon}</span>
                          <span className="flex-1">{item.label}</span>
                          {item.badge ? (
                            <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-red-600 text-white">
                              {item.badge}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>

          {/* Footer - removed Settings & Logout for mobile */}
        </aside>
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside className={`hidden md:flex md:flex-col h-screen transition-all duration-300 ${collapsed ? "w-20" : "w-64"} bg-gradient-to-b from-black via-[#1b0128] to-[#2e014d] text-white border-r border-purple-900/40`} aria-label="Sidebar">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => setCollapsed((c) => !c)} className="p-2 rounded-md hover:bg-purple-600/30" aria-pressed={collapsed} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {collapsed ? <FiMenu /> : <FiX />}
          </button>
          {!collapsed && <h1 className="font-semibold text-xl text-purple-400">Finance Pro</h1>}
        </div>

        <div className="px-3">
          <div className="flex items-center gap-2 bg-purple-950/50 rounded-lg p-2 mb-4">
            <FiSearch />
            {!collapsed && (
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="flex-1 bg-transparent outline-none text-sm text-purple-200"
                aria-label="Search menu"
              />
            )}
          </div>
        </div>

        <nav className="px-2 space-y-5 overflow-y-auto sidebar-scrollbar" aria-label="Main navigation">
          {filteredMenus.map((group) => (
            <div key={group.id}>
              {!collapsed && <div className="text-xs uppercase text-purple-400 mb-2 tracking-widest">{group.label}</div>}
              <ul className="flex flex-col gap-2">
                {group.items.map((item) => {
                  const active = isActive(item.route);
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => handleNav(item.route)}
                        className={`group flex items-center gap-3 w-full p-2 rounded-md hover:bg-purple-600/30 transition-all duration-200 ${active ? "bg-purple-700/40" : ""}`}
                        title={collapsed ? item.label : undefined}
                        aria-current={active ? "page" : undefined}
                      >
                        <span className="text-lg text-purple-300 group-hover:text-purple-100">
                          {item.icon}
                        </span>
                        {!collapsed && <span className="text-sm group-hover:text-white">{item.label}</span>}
                        {!collapsed && item.badge ? (
                          <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-red-600 text-white">
                            {item.badge}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer removed */}
      </aside>
    </>
  );
}
