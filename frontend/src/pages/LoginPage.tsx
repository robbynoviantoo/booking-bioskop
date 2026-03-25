import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Film } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast("success", "Selamat datang kembali!");
      navigate("/");
    } catch (err: any) {
      toast("error", err.response?.data?.error || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-10 relative">
      {/* Background glow */}
      <div
        className="absolute -top-48 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)",
        }}
      />

      <div className="bg-white dark:bg-[#16161f] border border-black/5 dark:border-white/10 rounded-[18px] p-6 sm:p-8 shadow-xl dark:shadow-[0_4px_32px_rgba(0,0,0,0.4)] w-full max-w-[420px] relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 text-center mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-[0_4px_12px_rgba(124,58,237,0.3)] bg-gradient-to-br from-violet-600 to-violet-500">
            <Film size={26} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-[#f0f0ff]">
            CineBook
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Masuk ke akun Anda
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="block text-[0.85rem] font-medium text-slate-600 dark:text-[#9090aa]">
              Email
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="email"
                required
                className="w-full pl-[42px] pr-4 py-3 bg-slate-100 dark:bg-[#1e1e2a] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm transition-all focus:border-violet-600 focus:ring-3 focus:ring-violet-600/20 outline-none"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="block text-[0.85rem] font-medium text-slate-600 dark:text-[#9090aa]">
              Password
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type={showPass ? "text" : "password"}
                required
                className="w-full pl-[42px] pr-[42px] py-3 bg-slate-100 dark:bg-[#1e1e2a] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm transition-all focus:border-violet-600 focus:ring-3 focus:ring-violet-600/20 outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3.5 inline-flex flex-wrap items-center justify-center gap-2 rounded-xl text-[0.9rem] font-semibold transition-all bg-gradient-to-br from-violet-600 to-violet-500 text-white shadow-[0_4px_20px_rgba(124,58,237,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(124,58,237,0.35)] disabled:opacity-50 disabled:hover:translate-y-0"
            disabled={loading}
          >
            {loading ? "Masuk..." : "Masuk"}
          </button>
        </form>

        <div className="text-center mt-6 text-[0.85rem] text-slate-500 dark:text-slate-400">
          Belum punya akun?{" "}
          <Link
            to="/register"
            className="font-semibold text-violet-600 dark:text-violet-400 hover:underline"
          >
            Daftar sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}
