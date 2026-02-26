import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { 
  LayoutDashboard, 
  UserPlus, 
  Users, 
  ShieldAlert, 
  Bell,
  LogOut,
  Menu
} from 'lucide-react';
import { motion } from 'motion/react';
import logo from '@/assets/logo.svg';

export function Layout({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: UserPlus, label: 'Activate Receiver', path: '/receivers/new' },
    { icon: ShieldAlert, label: 'Receiver List', path: '/receivers' },
    { icon: Users, label: 'Sender List', path: '/senders' },
  ];

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#1E3A8A] text-white flex-col shadow-xl z-20 flex-shrink-0">
        <div className="p-6 flex flex-col items-center border-b border-blue-800/50 flex-shrink-0">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-inner">
            <img 
              src={logo} 
              alt="ERBriwan Logo" 
              className="w-14 h-14 object-contain"
            />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            ERB<span className="text-red-500">riwan</span>
          </h1>
          <p className="text-xs text-blue-200 mt-1 uppercase tracking-widest font-medium">
            Admin Portal
          </p>
        </div>

        {/* Navigation - Non-scrollable content container */}
        <nav className="flex-1 p-4 space-y-2 overflow-hidden">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' 
                    : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="active-pill"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer - Always at the bottom */}
        <div className="p-4 border-t border-blue-800/50 flex-shrink-0">
          <button 
            onClick={onLogout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:bg-red-900/20 hover:text-red-100 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-8 flex-shrink-0 z-10">
          <div className="flex items-center gap-3 text-gray-500">
            {/* Mobile hamburger */}
            <button
              type="button"
              className="inline-flex md:hidden h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              onClick={() => setIsMobileNavOpen(true)}
            >
              <Menu size={20} />
              <span className="sr-only">Open navigation</span>
            </button>
            <h2 className="text-base md:text-lg font-semibold text-gray-800 capitalize">
              {location.pathname === '/' ? 'Overview' : location.pathname.split('/').pop()?.replace(/-/g, ' ')}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="hidden sm:block h-8 w-px bg-gray-200 mx-2"></div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">Admin User</p>
                <p className="text-xs text-gray-500">System Controller</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center text-blue-600 font-bold">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* Page Content - ONLY this is scrollable */}
        <section className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50/50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </section>
      </main>

      {/* Mobile navigation drawer */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-30 flex md:hidden">
          <button
            type="button"
            className="flex-1 bg-black/40"
            onClick={() => setIsMobileNavOpen(false)}
          />
          <aside className="relative w-72 max-w-[80%] bg-[#1E3A8A] text-white flex flex-col shadow-2xl">
            <div className="p-6 flex flex-col items-center border-b border-blue-800/50 flex-shrink-0">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-inner">
                <img 
                  src={logo} 
                  alt="ERBriwan Logo" 
                  className="w-14 h-14 object-contain"
                />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                ERB<span className="text-red-500">riwan</span>
              </h1>
              <p className="text-xs text-blue-200 mt-1 uppercase tracking-widest font-medium">
                Admin Portal
              </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileNavOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' 
                        : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'
                    }`}
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.label}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="active-pill"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-blue-800/50 flex-shrink-0">
              <button 
                onClick={onLogout}
                className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:bg-red-900/20 hover:text-red-100 transition-colors"
              >
                <LogOut size={20} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
