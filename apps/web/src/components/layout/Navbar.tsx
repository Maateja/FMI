import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Sparkles, LogOut, User, LayoutDashboard, BookOpen } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-emerald-400 p-0.5 shadow-md shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300">
            <div className="h-full w-full rounded-[10px] bg-slate-950 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              FMI
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                AI Voice
              </span>
            </span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center space-x-6">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                to="/questions"
                className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
              >
                <BookOpen className="h-4 w-4" />
                Question Bank
              </Link>
            </>
          ) : (
            <>
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                How It Works
              </a>
              <a href="#curriculum" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Interview Rounds
              </a>
            </>
          )}
        </nav>

        {/* Auth Actions */}
        <div className="flex items-center space-x-3">
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex flex-col items-end text-xs">
                <span className="font-semibold text-white">{user.fullName || user.email.split('@')[0]}</span>
                <span className="text-cyan-400 text-[11px] font-mono">{user.targetRole}</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-300">
                <User className="h-4 w-4" />
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="text-sm font-medium px-3.5 py-1.5 text-muted-foreground hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="text-sm font-semibold px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20 hover:opacity-90 transition-all"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

