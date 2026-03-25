import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Film,
  LogOut,
  User,
  Ticket,
  Settings,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Only handle 'dark' class on HTML document directly.
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <nav className="sticky top-0 z-[100] border-b border-black/5 dark:border-white/10 bg-white/80 dark:bg-[#16161f]/80 backdrop-blur-[20px]">
      <div className="w-full max-w-[1200px] mx-auto px-6 flex items-center justify-between h-16">
        <Link
          to="/"
          className="flex items-center gap-2.5 text-[1.2rem] font-extrabold text-slate-900 dark:text-[#f0f0ff] tracking-[-0.02em]"
        >
          <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-violet-500 rounded-lg flex items-center justify-center text-white shadow-[0_4px_12px_rgba(124,58,237,0.35)]">
            <Film size={22} />
          </div>
          <span>CineBook</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-[#1e1e2a] rounded-full text-[0.85rem] text-slate-600 dark:text-[#9090aa] border border-black/5 dark:border-white/10">
                <User size={15} />
                {user?.name}
              </span>
              <Link
                to="/bookings"
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 border rounded-xl text-[0.85rem] font-semibold transition-all ${
                  isActive("/bookings")
                    ? "text-violet-500 border-violet-600/40 bg-violet-600/5 dark:bg-violet-600/10"
                    : "text-slate-600 dark:text-[#9090aa] border-transparent hover:bg-slate-100 dark:hover:bg-[#22222f] hover:text-slate-900 dark:hover:text-[#f0f0ff]"
                }`}
              >
                <Ticket size={16} /> Tiket Saya
              </Link>
              <button
                className="inline-flex items-center justify-center gap-2 p-2 rounded-xl text-[0.85rem] font-semibold transition-all text-slate-600 dark:text-[#9090aa] border border-transparent hover:bg-slate-100 dark:hover:bg-[#22222f] hover:text-slate-900 dark:hover:text-[#f0f0ff]"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              {user?.role === "admin" && (
                <Link
                  to="/admin"
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2 border rounded-xl text-[0.85rem] font-semibold transition-all ${
                    isActive("/admin")
                      ? "text-violet-500 border-violet-600/40 bg-violet-600/5 dark:bg-violet-600/10"
                      : "text-slate-600 dark:text-[#9090aa] border-transparent hover:bg-slate-100 dark:hover:bg-[#22222f] hover:text-slate-900 dark:hover:text-[#f0f0ff]"
                  }`}
                >
                  <Settings size={16} /> Admin
                </Link>
              )}
              <button
                className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent rounded-xl text-[0.85rem] font-semibold transition-all text-slate-600 dark:text-[#9090aa] hover:bg-slate-100 dark:hover:bg-[#22222f] hover:text-slate-900 dark:hover:text-[#f0f0ff]"
                onClick={handleLogout}
              >
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-black/5 dark:border-white/10 rounded-xl text-[0.85rem] font-semibold transition-all bg-transparent text-slate-600 dark:text-[#9090aa] hover:bg-slate-100 dark:hover:bg-[#22222f] hover:text-slate-900 dark:hover:text-[#f0f0ff] hover:border-black/10 dark:hover:border-violet-600/40"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[0.85rem] font-semibold transition-all bg-gradient-to-br from-violet-600 to-violet-500 text-white shadow-[0_4px_20px_rgba(124,58,237,0.35)] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(124,58,237,0.35)]"
              >
                Daftar
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            className="p-2 rounded-xl transition-all text-slate-600 dark:text-[#9090aa] hover:bg-slate-100 dark:hover:bg-[#22222f]"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            className="p-2 rounded-xl transition-all text-slate-600 dark:text-[#9090aa] hover:bg-slate-100 dark:hover:bg-[#22222f]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          {isAuthenticated ? (
            <div className="fixed inset-0 top-16 z-50 bg-slate-50 dark:bg-[#0a0a0f] flex flex-col p-4 border-t border-black/5 dark:border-white/10 overflow-y-auto">
              {/* HEADER USER */}
              <div className="flex items-center gap-3 px-2 py-3 border-b border-black/5 dark:border-white/10">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#1e1e2a] flex items-center justify-center text-slate-600 dark:text-[#9090aa]">
                  <User size={18} />
                </div>
                <span className="font-semibold text-slate-900 dark:text-[#f0f0ff]">
                  {user?.name}
                </span>
              </div>

              {/* MENU */}
              <div className="flex flex-col gap-2 mt-4">
                <Link
                  to="/bookings"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-semibold ${
                    isActive("/bookings")
                      ? "bg-violet-600/10 text-violet-500"
                      : "text-slate-600 dark:text-[#9090aa] hover:bg-slate-100 dark:hover:bg-[#22222f] hover:text-slate-900 dark:hover:text-[#f0f0ff]"
                  }`}
                >
                  <Ticket size={18} /> Tiket Saya
                </Link>

                {user?.role === "admin" && (
                  <Link
                    to="/admin"
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-semibold ${
                      isActive("/admin")
                        ? "bg-violet-600/10 text-violet-500"
                        : "text-slate-600 dark:text-[#9090aa] hover:bg-slate-100 dark:hover:bg-[#22222f] hover:text-slate-900 dark:hover:text-[#f0f0ff]"
                    }`}
                  >
                    <Settings size={18} /> Admin
                  </Link>
                )}

                <button
                  className="flex items-center gap-3 px-4 py-3 mt-4 rounded-xl text-red-500 hover:bg-red-50 text-left transition-colors font-semibold"
                  onClick={handleLogout}
                >
                  <LogOut size={18} /> Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="fixed inset-0 top-16 z-50 bg-slate-50 dark:bg-[#0a0a0f] flex flex-col gap-4 p-5 border-t border-black/5 dark:border-white/10">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-3.5 border border-black/5 dark:border-white/10 rounded-xl font-semibold transition-all bg-transparent text-slate-600 dark:text-[#9090aa] hover:bg-slate-100 dark:hover:bg-[#22222f] hover:text-slate-900 dark:hover:text-[#f0f0ff]"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold transition-all bg-gradient-to-br from-violet-600 to-violet-500 text-white shadow-[0_4px_20px_rgba(124,58,237,0.35)] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(124,58,237,0.35)]"
              >
                Daftar
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
