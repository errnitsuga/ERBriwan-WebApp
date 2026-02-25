import React, { useState } from 'react';
import { Shield, Lock, User, Mail, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import logo from "@/assets/logo.png";

export function Login({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1: Input, 2: Success

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin123') {
      onLogin();
    } else {
      setError('Invalid username or password');
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotStep(2);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-50 rounded-full blur-3xl opacity-50" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/10 overflow-hidden border border-gray-100">
          <div className="p-8 md:p-12">
            <div className="flex flex-col items-center mb-10">
              <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center mb-6 border border-gray-50">
                <img src={logo} alt="ERBriwan Logo" className="w-16 h-16 object-contain" />
              </div>
              <h1 className="text-3xl font-black text-[#1E3A8A] tracking-tight text-center">
                ERB<span className="text-red-600">riwan</span>
              </h1>
              <p className="text-gray-500 mt-2 font-medium">Administrator Access</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700 ml-1">Username</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-bold text-gray-700">Password</label>
                  <button 
                    type="button" 
                    onClick={() => setShowForgot(true)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-50 text-red-600 text-sm py-3 px-4 rounded-xl font-bold flex items-center gap-2 border border-red-100"
                >
                  <Shield size={16} />
                  {error}
                </motion.div>
              )}

              <button 
                type="submit"
                className="w-full py-4 bg-[#1E3A8A] text-white rounded-2xl font-bold text-lg hover:bg-blue-800 shadow-xl shadow-blue-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
              >
                Sign In
                <ArrowRight size={20} />
              </button>
            </form>
        </div>
      </div>
    </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgot(false)}
              className="absolute inset-0 bg-blue-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-8"
            >
              <button 
                onClick={() => setShowForgot(false)}
                className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
              >
                <X size={20} />
              </button>

              {forgotStep === 1 ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                      <Mail size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Forgot Password?</h3>
                    <p className="text-sm text-gray-500 mt-2">Enter your email and we'll send you reset instructions.</p>
                  </div>

                  <form onSubmit={handleForgotSubmit} className="space-y-4">
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                      <input 
                        type="email" 
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="admin@erbriwan.com"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                      />
                    </div>
                    <button className="w-full py-4 bg-[#1E3A8A] text-white rounded-2xl font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/10">
                      Send Reset Link
                    </button>
                  </form>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                    <Shield size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Email Sent!</h3>
                  <p className="text-sm text-gray-600 mt-4 leading-relaxed">
                    Please check your email for confirmation and login again.
                  </p>
                  <button 
                    onClick={() => {
                      setShowForgot(false);
                      setForgotStep(1);
                    }}
                    className="mt-8 w-full py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all"
                  >
                    Back to Login
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
