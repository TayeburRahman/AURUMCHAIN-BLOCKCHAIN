"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useDashboardData } from "@/hooks/useDashboardData";
import PayoutsTab from "./PayoutsTab";

export default function TransactionsPage() {
  const { transactions: dbTransactions, loading } = useDashboardData();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"activity" | "payouts">("activity");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "payouts") {
      setActiveTab("payouts");
    } else {
      setActiveTab("activity");
    }
  }, [searchParams]);

  const handleTabChange = (tab: "activity" | "payouts") => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`/dashboard/transactions?${params.toString()}`);
  };
  const [filterType, setFilterType] = useState<"all" | "investment" | "withdrawal" | "dividend" | "deposit" | "refund">("all");
  const [dateRange, setDateRange] = useState<"all" | "week" | "month" | "year">("all");

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const filteredTransactions = useMemo(() => {
    return dbTransactions.filter(tx => {
      // Filter by type
      if (filterType !== "all" && tx.type !== filterType) return false;

      // Filter by date range
      if (dateRange !== "all") {
        const txDate = new Date(tx.created_at || tx.initiated_at);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - txDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (dateRange === "week" && diffDays > 7) return false;
        if (dateRange === "month" && diffDays > 30) return false;
        if (dateRange === "year" && diffDays > 365) return false;
      }

      return true;
    });
  }, [dbTransactions, filterType, dateRange]);

  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort(
      (a, b) => new Date(b.created_at || b.initiated_at).getTime() - new Date(a.created_at || a.initiated_at).getTime()
    );
  }, [filteredTransactions]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "investment":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
          </svg>
        );
      case "withdrawal":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
          </svg>
        );
      case "dividend":
      case "deposit":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "investment":
        return "text-blue-400 bg-blue-400/10";
      case "withdrawal":
        return "text-red-400 bg-red-400/10";
      case "dividend":
      case "deposit":
        return "text-green-400 bg-green-400/10";
      default:
        return "text-gray-400 bg-gray-400/10";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-400 bg-green-400/10 border-green-400/20";
      case "pending":
      case "processing":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      case "failed":
      case "cancelled":
        return "text-red-400 bg-red-400/10 border-red-400/20";
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    }
  };

  const stats = useMemo(() => {
    const completed = dbTransactions.filter(tx => tx.status === "completed");
    return {
      totalInvested: completed.filter(tx => tx.type === "investment").reduce((sum, tx) => sum + Number(tx.amount), 0),
      totalDividends: completed.filter(tx => tx.type === "dividend").reduce((sum, tx) => sum + Number(tx.amount), 0),
      totalWithdrawals: completed.filter(tx => tx.type === "withdrawal").reduce((sum, tx) => sum + Number(tx.amount), 0),
      pendingTransactions: dbTransactions.filter(tx => tx.status === "pending" || tx.status === "processing").length,
    };
  }, [dbTransactions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white text-xl">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Transactions</h1>
          <p className="text-gray-400">Manage your investments, dividends, and payout history</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-navy-dark border border-gold/20 rounded-xl">
          <button
            onClick={() => handleTabChange("activity")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "activity"
                ? "bg-gold text-navy shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Activity
          </button>
          <button
            onClick={() => handleTabChange("payouts")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "payouts"
                ? "bg-gold text-navy shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Payouts
          </button>
        </div>
      </div>

      {activeTab === "activity" ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass rounded-xl p-6 border border-gold/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Total Invested</span>
                <div className="p-2 rounded-lg bg-blue-400/10">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-bold text-white">${stats.totalInvested.toLocaleString()}</div>
            </div>

            <div className="glass rounded-xl p-6 border border-gold/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Total Dividends</span>
                <div className="p-2 rounded-lg bg-green-400/10">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-bold gradient-text">+${stats.totalDividends.toLocaleString()}</div>
            </div>

            <div className="glass rounded-xl p-6 border border-gold/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Total Withdrawals</span>
                <div className="p-2 rounded-lg bg-red-400/10">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-bold text-white">${stats.totalWithdrawals.toLocaleString()}</div>
            </div>

            <div className="glass rounded-xl p-6 border border-gold/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Pending</span>
                <div className="p-2 rounded-lg bg-yellow-400/10">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-bold text-white">{stats.pendingTransactions}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="glass rounded-xl p-6 border border-gold/20">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              {/* Type Filter */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Transaction Type</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterType("all")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filterType === "all"
                        ? "bg-gold text-navy"
                        : "bg-navy-dark text-gray-400 hover:text-white border border-gold/20"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterType("investment")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filterType === "investment"
                        ? "bg-gold text-navy"
                        : "bg-navy-dark text-gray-400 hover:text-white border border-gold/20"
                    }`}
                  >
                    Investments
                  </button>
                  <button
                    onClick={() => setFilterType("dividend")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filterType === "dividend"
                        ? "bg-gold text-navy"
                        : "bg-navy-dark text-gray-400 hover:text-white border border-gold/20"
                    }`}
                  >
                    Dividends
                  </button>
                  <button
                    onClick={() => setFilterType("withdrawal")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filterType === "withdrawal"
                        ? "bg-gold text-navy"
                        : "bg-navy-dark text-gray-400 hover:text-white border border-gold/20"
                    }`}
                  >
                    Withdrawals
                  </button>
                </div>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Date Range</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  className="bg-navy-dark text-white border border-gold/20 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-gold"
                >
                  <option value="all">All Time</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="year">Last Year</option>
                </select>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="glass rounded-xl border border-gold/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-navy-dark border-b border-gold/20">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Transaction
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/10">
                  {sortedTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gold/5 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">
                              {transaction.id.slice(0, 10)}...
                            </span>
                            {transaction.id.length > 30 && (
                              <a 
                                href={`https://solscan.io/tx/${transaction.id}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gold hover:text-white transition-colors"
                                title="View on Solscan"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">{transaction.description || "No description"}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">{transaction.projects?.name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(transaction.type)}`}>
                          {getTypeIcon(transaction.type)}
                          <span className="capitalize">{transaction.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className={`text-sm font-bold ${
                          transaction.type === "investment"
                            ? "text-blue-400"
                            : (transaction.type === "dividend" || transaction.type === "deposit")
                            ? "text-green-400"
                            : "text-red-400"
                        }`}>
                          {(transaction.type === "withdrawal" || transaction.type === "investment") ? "-" : "+"}
                          ${Number(transaction.amount).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full border text-xs font-medium uppercase tracking-wider ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">
                          {formatDate(transaction.created_at || transaction.initiated_at)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatTime(transaction.created_at || transaction.initiated_at)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Empty State */}
          {sortedTransactions.length === 0 && (
            <div className="glass rounded-xl p-12 border border-gold/20 text-center">
              <svg className="w-16 h-16 text-gold/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-xl font-bold text-white mb-2">No transactions found</h3>
              <p className="text-gray-400">Try adjusting your filters</p>
            </div>
          )}
        </>
      ) : (
        <PayoutsTab />
      )}
    </div>
  );
}
