"use client";

import { useState } from "react";

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank" | "crypto">("card");

  // Format date consistently for SSR/CSR
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const walletData = {
    balance: 15750.00,
    goldTokens: 45.25,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
  };

  const recentActivity = [
    {
      id: 1,
      type: "deposit",
      amount: 5000,
      method: "Bank Transfer",
      status: "completed",
      date: "2024-01-15T10:30:00",
    },
    {
      id: 2,
      type: "withdraw",
      amount: 2000,
      method: "Bank Transfer",
      status: "completed",
      date: "2024-01-10T14:20:00",
    },
    {
      id: 3,
      type: "deposit",
      amount: 8000,
      method: "Credit Card",
      status: "completed",
      date: "2023-11-20T09:45:00",
    },
    {
      id: 4,
      type: "deposit",
      amount: 3500,
      method: "Cryptocurrency",
      status: "completed",
      date: "2024-03-10T16:00:00",
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle deposit/withdrawal logic
    console.log(`${activeTab}: $${amount} via ${paymentMethod}`);
  };

  const getActivityIcon = (type: string) => {
    if (type === "deposit") {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Wallet</h1>
        <p className="text-gray-400">Manage your funds and transactions</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass rounded-xl p-6 border border-gold/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Available Balance</span>
            <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-white">${walletData.balance.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">USD Balance</div>
        </div>

        <div className="glass rounded-xl p-6 border border-gold/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Gold Tokens</span>
            <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-2xl font-bold gradient-text">{walletData.goldTokens} GFT</div>
          <div className="text-xs text-gray-400 mt-1">≈ ${(walletData.goldTokens * 550).toLocaleString()}</div>
        </div>

        <div className="glass rounded-xl p-6 border border-gold/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Pending Deposits</span>
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-white">${walletData.pendingDeposits.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">0 transactions</div>
        </div>

        <div className="glass rounded-xl p-6 border border-gold/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Pending Withdrawals</span>
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-white">${walletData.pendingWithdrawals.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">0 transactions</div>
        </div>
      </div>

      {/* Transaction Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Transaction Form */}
        <div className="lg:col-span-2">
          <div className="glass rounded-xl p-6 border border-gold/20">
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab("deposit")}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "deposit"
                    ? "bg-gold text-navy"
                    : "bg-navy-dark text-gray-400 hover:text-white border border-gold/20"
                }`}
              >
                Deposit Funds
              </button>
              <button
                onClick={() => setActiveTab("withdraw")}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "withdraw"
                    ? "bg-gold text-navy"
                    : "bg-navy-dark text-gray-400 hover:text-white border border-gold/20"
                }`}
              >
                Withdraw Funds
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Amount (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-navy-dark text-white border border-gold/20 rounded-lg pl-8 pr-4 py-3 focus:outline-none focus:border-gold text-lg"
                    min="10"
                    step="0.01"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {[100, 500, 1000, 5000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset.toString())}
                      className="flex-1 py-2 bg-navy-dark hover:bg-gold/10 border border-gold/20 hover:border-gold/40 rounded-lg text-sm text-white transition-all"
                    >
                      ${preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  {activeTab === "deposit" ? "Payment Method" : "Withdrawal Method"}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`p-4 rounded-lg border transition-all ${
                      paymentMethod === "card"
                        ? "bg-gold/10 border-gold text-white"
                        : "bg-navy-dark border-gold/20 text-gray-400 hover:border-gold/40"
                    }`}
                  >
                    <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <div className="text-sm font-medium">Credit Card</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("bank")}
                    className={`p-4 rounded-lg border transition-all ${
                      paymentMethod === "bank"
                        ? "bg-gold/10 border-gold text-white"
                        : "bg-navy-dark border-gold/20 text-gray-400 hover:border-gold/40"
                    }`}
                  >
                    <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                    </svg>
                    <div className="text-sm font-medium">Bank Transfer</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("crypto")}
                    className={`p-4 rounded-lg border transition-all ${
                      paymentMethod === "crypto"
                        ? "bg-gold/10 border-gold text-white"
                        : "bg-navy-dark border-gold/20 text-gray-400 hover:border-gold/40"
                    }`}
                  >
                    <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm font-medium">Crypto</div>
                  </button>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-400/10 border border-blue-400/20 rounded-lg p-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-200">
                    {activeTab === "deposit" ? (
                      <>
                        <strong>Processing time:</strong> Bank transfers take 1-3 business days.
                        Credit card and crypto deposits are instant.
                      </>
                    ) : (
                      <>
                        <strong>Withdrawal limits:</strong> Minimum $50, maximum $50,000 per transaction.
                        Withdrawals are processed within 24-48 hours.
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-gold to-gold-light text-navy font-bold rounded-lg hover:scale-105 transition-all duration-300 shadow-lg shadow-gold/20"
              >
                {activeTab === "deposit" ? "Deposit Funds" : "Withdraw Funds"}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Quick Stats */}
        <div className="space-y-6">
          {/* Transaction Fees */}
          <div className="glass rounded-xl p-6 border border-gold/20">
            <h3 className="text-lg font-bold text-white mb-4">Transaction Fees</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Credit Card</span>
                <span className="text-sm font-medium text-white">2.9%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Bank Transfer</span>
                <span className="text-sm font-medium text-white">Free</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Cryptocurrency</span>
                <span className="text-sm font-medium text-white">1.5%</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gold/10">
                <span className="text-sm text-gray-400">Withdrawal Fee</span>
                <span className="text-sm font-medium text-white">$5</span>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="glass rounded-xl p-6 border border-gold/20">
            <div className="flex items-center gap-3 mb-3">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h3 className="text-lg font-bold text-white">Secure</h3>
            </div>
            <p className="text-sm text-gray-400">
              All transactions are encrypted with bank-level security. Your funds are protected by insurance.
            </p>
          </div>

          {/* Support */}
          <div className="glass rounded-xl p-6 border border-gold/20">
            <h3 className="text-lg font-bold text-white mb-3">Need Help?</h3>
            <p className="text-sm text-gray-400 mb-4">
              Contact our support team for assistance with deposits or withdrawals.
            </p>
            <a
              href="/support"
              className="block w-full py-3 bg-navy-dark hover:bg-gold/10 border border-gold/20 hover:border-gold/40 rounded-lg text-center text-sm font-medium text-white transition-all"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass rounded-xl p-6 border border-gold/20">
        <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-4 bg-navy-dark rounded-lg border border-gold/10 hover:border-gold/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${
                  activity.type === "deposit"
                    ? "bg-green-400/10 text-green-400"
                    : "bg-red-400/10 text-red-400"
                }`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div>
                  <div className="text-sm font-bold text-white capitalize">{activity.type}</div>
                  <div className="text-xs text-gray-400">{activity.method}</div>
                </div>
              </div>

              <div className="text-right">
                <div className={`text-sm font-bold ${
                  activity.type === "deposit" ? "text-green-400" : "text-red-400"
                }`}>
                  {activity.type === "deposit" ? "+" : "-"}${activity.amount.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">
                  {formatDate(activity.date)}
                </div>
              </div>

              <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider text-green-400 bg-green-400/10 border border-green-400/20">
                {activity.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
