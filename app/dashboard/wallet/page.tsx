"use client";

import { useState, useMemo } from "react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletService } from "@/lib/web3/services/walletService";

export default function WalletPage() {
  const { user, stats, transactions, loading, refresh } = useDashboardData();
  const { connection } = useConnection();
  const wallet = useWallet();
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank" | "crypto">("card");
  const [isSyncing, setIsSyncing] = useState(false);

  const walletData = useMemo(() => ({
    balance: stats.usdBalance || 0,
    goldTokens: stats.goldTokens,
    pendingDeposits: transactions.filter(t => t.type === 'deposit' && t.status === 'pending').reduce((sum, t) => sum + Number(t.amount), 0),
    pendingWithdrawals: transactions.filter(t => t.type === 'withdrawal' && t.status === 'pending').reduce((sum, t) => sum + Number(t.amount), 0),
  }), [user, stats, transactions]);

  const recentActivity = useMemo(() => {
    return transactions
      .filter(t => t.type === 'deposit' || t.type === 'withdrawal' || t.type === 'withdraw')
      .slice(0, 10)
      .map(t => ({
        id: t.id,
        type: t.type === 'withdraw' ? 'withdrawal' : t.type,
        amount: Number(t.amount),
        method: t.description || "System",
        status: t.status,
        date: t.created_at || t.initiated_at,
      }));
  }, [transactions]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const handleCryptoDeposit = async () => {
    if (!wallet.publicKey || !connection) {
      alert("Please connect your wallet first.");
      return;
    }

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    setIsSyncing(true);
    try {
      const walletService = new WalletService(connection, wallet);
      const signature = await walletService.depositUSDC(depositAmount);
      
      console.log("Deposit confirmed on-chain:", signature);

      // Sync with Supabase
      const res = await fetch('/api/wallet/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'deposit',
          amount: depositAmount,
          blockchainHash: signature,
          description: 'USDC Deposit via Solana'
        })
      });

      if (!res.ok) throw new Error("Failed to sync with database");

      alert("Deposit successful and synced with your account!");
      setAmount("");
      refresh(); // Refresh dashboard data
    } catch (err: any) {
      console.error("Deposit error:", err);
      alert(err.message || "Failed to process deposit");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === 'crypto' && activeTab === 'deposit') {
      handleCryptoDeposit();
      return;
    }
    console.log(`${activeTab}: $${amount} via ${paymentMethod}`);
    alert("This feature (non-crypto) is currently in demonstration mode. Integration coming soon.");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white text-xl">Loading wallet...</div>
      </div>
    );
  }

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
          <div className="text-2xl font-bold gradient-text">{walletData.goldTokens.toFixed(2)} oz</div>
          <div className="text-xs text-gray-400 mt-1">Managed on Solana</div>
        </div>

        <div className="glass rounded-xl p-6 border border-gold/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Pending Deposits</span>
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-white">${walletData.pendingDeposits.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">Processing...</div>
        </div>

        <div className="glass rounded-xl p-6 border border-gold/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Pending Withdrawals</span>
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-white">${walletData.pendingWithdrawals.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">Queued</div>
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
                <div className="flex flex-wrap gap-2 mt-2">
                  {[100, 500, 1000, 5000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset.toString())}
                      className="flex-1 min-w-[80px] py-2 bg-navy-dark hover:bg-gold/10 border border-gold/20 hover:border-gold/40 rounded-lg text-sm text-white transition-all"
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
                disabled={isSyncing || !amount}
                className="w-full py-4 bg-gradient-to-r from-gold to-gold-light text-navy font-bold rounded-lg hover:scale-105 transition-all duration-300 shadow-lg shadow-gold/20 disabled:opacity-50"
              >
                {isSyncing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-navy" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  activeTab === "deposit" ? "Deposit Funds" : "Withdraw Funds"
                )}
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
          {recentActivity.map((activity: any) => (
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

              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${
                activity.status === 'completed' ? 'text-green-400 bg-green-400/10 border-green-400/20' :
                activity.status === 'pending' ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' :
                'text-red-400 bg-red-400/10 border-red-400/20'
              }`}>
                {activity.status}
              </span>
            </div>
          ))}
          {recentActivity.length === 0 && (
            <div className="text-center py-8 text-gray-500 italic">
              No recent wallet activity found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
