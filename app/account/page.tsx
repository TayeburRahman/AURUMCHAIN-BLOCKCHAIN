"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AccountPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) throw error;

      if (data.user) {
        // Log login event
        try {
          await fetch('/api/auth/log-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider: 'email' }),
          });
        } catch (logError) {
          console.error('Failed to log login event:', logError);
        }

        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (signupData.password !== signupData.confirmPassword) {
      setError("Passwords do not match!");
      setLoading(false);
      return;
    }

    if (!signupData.acceptTerms) {
      setError("Please accept the terms and conditions");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            first_name: signupData.firstName,
            last_name: signupData.lastName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Log signup event
        try {
          await fetch('/api/auth/log-signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider: 'email' }),
          });
        } catch (logError) {
          console.error('Failed to log signup event:', logError);
        }

        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Failed to authenticate with Google.");
    }
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

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-200">{error}</p>
              </div>
            </div>
          )}

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
                disabled={loading}
                className="w-full bg-gold hover:bg-gold-light text-navy font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </span>
                ) : (
                  "Login"
                )}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="signup-firstname" className="block text-gray-300 mb-2 text-sm font-medium">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="signup-firstname"
                    value={signupData.firstName}
                    onChange={(e) => setSignupData({ ...signupData, firstName: e.target.value })}
                    className="w-full bg-navy border border-gold/30 rounded-lg px-4 py-3 text-white focus:border-gold focus:outline-none transition-all"
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="signup-lastname" className="block text-gray-300 mb-2 text-sm font-medium">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="signup-lastname"
                    value={signupData.lastName}
                    onChange={(e) => setSignupData({ ...signupData, lastName: e.target.value })}
                    className="w-full bg-navy border border-gold/30 rounded-lg px-4 py-3 text-white focus:border-gold focus:outline-none transition-all"
                    placeholder="Doe"
                    required
                  />
                </div>
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
                disabled={loading}
                className="w-full bg-gold hover:bg-gold-light text-navy font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  "Create Account"
                )}
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
              <button 
                onClick={handleGoogleAuth}
                className="flex items-center justify-center gap-3 bg-navy border border-gold/30 hover:border-gold text-white py-3 px-4 rounded-lg transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-sm font-medium">Google</span>
              </button>

              <button 
                onClick={() => {}} // GitHub can be added later if needed
                className="flex items-center justify-center gap-3 bg-navy border border-gold/30 hover:border-gold text-white py-3 px-4 rounded-lg transition-all opacity-50 cursor-not-allowed"
              >
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
