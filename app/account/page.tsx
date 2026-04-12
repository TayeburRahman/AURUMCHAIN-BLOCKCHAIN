"use client";

import { useState } from "react";
import Image from "next/image";

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Login functionality will be implemented with backend integration");
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (signupData.password !== signupData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    if (!signupData.acceptTerms) {
      alert("Please accept the terms and conditions");
      return;
    }
    alert("Signup functionality will be implemented with backend integration");
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-6 pt-20 pb-20">
      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden md:block">
          <div className="text-center mb-8">
            <Image src="/logo.png" alt="GoldenFleece" width={150} height={150} className="mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-3">
              Welcome to <span className="text-gold">GoldenFleece</span>
            </h2>
            <p className="text-gray-400">Own Your Own Gold Mine</p>
          </div>

          <div className="space-y-6">
            {[
              {
                icon: "💰",
                title: "Invest in Real Gold Mines",
                description: "Access vetted small-scale gold mining operations",
              },
              {
                icon: "🪙",
                title: "Earn Gold-Backed Returns",
                description: "Receive Golden Fleece Tokens pegged to real gold",
              },
              {
                icon: "🔒",
                title: "Blockchain Transparency",
                description: "Track investments with complete transparency",
              },
            ].map((feature, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="text-3xl">{feature.icon}</div>
                <div>
                  <h3 className="text-gold font-bold mb-1">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Auth Forms */}
        <div className="bg-navy-dark border border-gold/30 rounded-xl p-8">
          {/* Tabs */}
          <div className="flex gap-2 mb-8 bg-navy rounded-lg p-1">
            <button
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-3 px-6 rounded-lg font-bold transition-all ${
                activeTab === "login" ? "bg-gold text-navy" : "text-gray-400 hover:text-gold"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab("signup")}
              className={`flex-1 py-3 px-6 rounded-lg font-bold transition-all ${
                activeTab === "signup" ? "bg-gold text-navy" : "text-gray-400 hover:text-gold"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Login Form */}
          {activeTab === "login" && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="login-email" className="block text-gray-300 mb-2 text-sm font-medium">
                  Email Address
                </label>
                <input
                  type="email"
                  id="login-email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="w-full bg-navy border border-gold/30 rounded-lg px-4 py-3 text-white focus:border-gold focus:outline-none transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="login-password" className="block text-gray-300 mb-2 text-sm font-medium">
                  Password
                </label>
                <input
                  type="password"
                  id="login-password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="w-full bg-navy border border-gold/30 rounded-lg px-4 py-3 text-white focus:border-gold focus:outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-gold" />
                  <span className="text-gray-400 text-sm">Remember me</span>
                </label>
                <a href="#" className="text-gold hover:text-gold-light text-sm font-medium transition-colors">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                className="w-full bg-gold hover:bg-gold-light text-navy font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105"
              >
                Login
              </button>

              <div className="text-center">
                <p className="text-gray-400 text-sm">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("signup")}
                    className="text-gold hover:text-gold-light font-medium"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* Signup Form */}
          {activeTab === "signup" && (
            <form onSubmit={handleSignup} className="space-y-6">
              <div>
                <label htmlFor="signup-name" className="block text-gray-300 mb-2 text-sm font-medium">
                  Full Name
                </label>
                <input
                  type="text"
                  id="signup-name"
                  value={signupData.name}
                  onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                  className="w-full bg-navy border border-gold/30 rounded-lg px-4 py-3 text-white focus:border-gold focus:outline-none transition-all"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label htmlFor="signup-email" className="block text-gray-300 mb-2 text-sm font-medium">
                  Email Address
                </label>
                <input
                  type="email"
                  id="signup-email"
                  value={signupData.email}
                  onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                  className="w-full bg-navy border border-gold/30 rounded-lg px-4 py-3 text-white focus:border-gold focus:outline-none transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="signup-password" className="block text-gray-300 mb-2 text-sm font-medium">
                  Password
                </label>
                <input
                  type="password"
                  id="signup-password"
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  className="w-full bg-navy border border-gold/30 rounded-lg px-4 py-3 text-white focus:border-gold focus:outline-none transition-all"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label htmlFor="signup-confirm" className="block text-gray-300 mb-2 text-sm font-medium">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="signup-confirm"
                  value={signupData.confirmPassword}
                  onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                  className="w-full bg-navy border border-gold/30 rounded-lg px-4 py-3 text-white focus:border-gold focus:outline-none transition-all"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={signupData.acceptTerms}
                  onChange={(e) => setSignupData({ ...signupData, acceptTerms: e.target.checked })}
                  className="w-4 h-4 mt-1 accent-gold"
                  required
                />
                <span className="text-gray-400 text-sm">
                  I agree to the{" "}
                  <a href="#" className="text-gold hover:text-gold-light">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-gold hover:text-gold-light">
                    Privacy Policy
                  </a>
                </span>
              </label>

              <button
                type="submit"
                className="w-full bg-gold hover:bg-gold-light text-navy font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105"
              >
                Create Account
              </button>

              <div className="text-center">
                <p className="text-gray-400 text-sm">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("login")}
                    className="text-gold hover:text-gold-light font-medium"
                  >
                    Login
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* Social Login Options */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gold/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-navy-dark text-gray-400">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-3 bg-navy border border-gold/30 hover:border-gold text-white py-3 px-4 rounded-lg transition-all">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-sm font-medium">Google</span>
              </button>

              <button className="flex items-center justify-center gap-3 bg-navy border border-gold/30 hover:border-gold text-white py-3 px-4 rounded-lg transition-all">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                <span className="text-sm font-medium">GitHub</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
