"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function InvestmentsPage() {
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "funded" | "completed">("all");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "returns">("date");

  // Format date consistently for SSR/CSR
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const investments = [
    {
      id: 1,
      projectName: "Obuasi Gold Mine",
      location: "Ghana",
      investedAmount: 5000,
      currentValue: 5750,
      returns: 750,
      returnPercentage: 15.0,
      shares: 250,
      status: "active",
      investmentDate: "2024-01-15",
      expectedCompletion: "2025-06-30",
      fundingProgress: 85,
      image: "/projects/ghana.jpg",
    },
    {
      id: 2,
      projectName: "Super Pit",
      location: "Australia",
      investedAmount: 8000,
      currentValue: 9200,
      returns: 1200,
      returnPercentage: 15.0,
      shares: 400,
      status: "active",
      investmentDate: "2023-11-20",
      expectedCompletion: "2025-03-15",
      fundingProgress: 92,
      image: "/projects/australia.jpg",
    },
    {
      id: 3,
      projectName: "Kumtor Mine",
      location: "Kyrgyzstan",
      investedAmount: 3500,
      currentValue: 3850,
      returns: 350,
      returnPercentage: 10.0,
      shares: 175,
      status: "active",
      investmentDate: "2024-03-10",
      expectedCompletion: "2025-09-20",
      fundingProgress: 78,
      image: "/projects/kyrgyzstan.jpg",
    },
    {
      id: 4,
      projectName: "Grasberg Mine",
      location: "Papua New Guinea",
      investedAmount: 6000,
      currentValue: 7500,
      returns: 1500,
      returnPercentage: 25.0,
      shares: 300,
      status: "completed",
      investmentDate: "2023-06-05",
      expectedCompletion: "2024-12-01",
      fundingProgress: 100,
      image: "/projects/png.jpg",
    },
    {
      id: 5,
      projectName: "Pueblo Viejo",
      location: "Dominican Republic",
      investedAmount: 2500,
      currentValue: 2500,
      returns: 0,
      returnPercentage: 0,
      shares: 125,
      status: "funded",
      investmentDate: "2024-11-15",
      expectedCompletion: "2026-01-30",
      fundingProgress: 100,
      image: "/projects/dominican.jpg",
    },
  ];

  const filteredInvestments = investments.filter(inv => {
    if (filterStatus === "all") return true;
    return inv.status === filterStatus;
  });

  const sortedInvestments = [...filteredInvestments].sort((a, b) => {
    switch (sortBy) {
      case "amount":
        return b.investedAmount - a.investedAmount;
      case "returns":
        return b.returns - a.returns;
      case "date":
      default:
        return new Date(b.investmentDate).getTime() - new Date(a.investmentDate).getTime();
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-400 bg-green-400/10 border-green-400/20";
      case "funded":
        return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      case "completed":
        return "text-gold bg-gold/10 border-gold/20";
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    }
  };

  const totalStats = {
    totalInvested: investments.reduce((sum, inv) => sum + inv.investedAmount, 0),
    currentValue: investments.reduce((sum, inv) => sum + inv.currentValue, 0),
    totalReturns: investments.reduce((sum, inv) => sum + inv.returns, 0),
    activeInvestments: investments.filter(inv => inv.status === "active").length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">My Investments</h1>
        <p className="text-gray-400">Track and manage your gold mining investments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass rounded-xl p-6 border border-gold/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Invested</span>
            <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-white">${totalStats.totalInvested.toLocaleString()}</div>
        </div>

        <div className="glass rounded-xl p-6 border border-gold/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Current Value</span>
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-white">${totalStats.currentValue.toLocaleString()}</div>
        </div>

        <div className="glass rounded-xl p-6 border border-gold/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Returns</span>
            <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="text-2xl font-bold gradient-text">+${totalStats.totalReturns.toLocaleString()}</div>
          <div className="text-sm text-green-400 mt-1">
            +{((totalStats.totalReturns / totalStats.totalInvested) * 100).toFixed(1)}%
          </div>
        </div>

        <div className="glass rounded-xl p-6 border border-gold/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Active Projects</span>
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-white">{totalStats.activeInvestments}</div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="glass rounded-xl p-6 border border-gold/20">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterStatus === "all"
                  ? "bg-gold text-navy"
                  : "bg-navy-dark text-gray-400 hover:text-white border border-gold/20"
              }`}
            >
              All ({investments.length})
            </button>
            <button
              onClick={() => setFilterStatus("active")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterStatus === "active"
                  ? "bg-gold text-navy"
                  : "bg-navy-dark text-gray-400 hover:text-white border border-gold/20"
              }`}
            >
              Active ({investments.filter(i => i.status === "active").length})
            </button>
            <button
              onClick={() => setFilterStatus("funded")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterStatus === "funded"
                  ? "bg-gold text-navy"
                  : "bg-navy-dark text-gray-400 hover:text-white border border-gold/20"
              }`}
            >
              Funded ({investments.filter(i => i.status === "funded").length})
            </button>
            <button
              onClick={() => setFilterStatus("completed")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterStatus === "completed"
                  ? "bg-gold text-navy"
                  : "bg-navy-dark text-gray-400 hover:text-white border border-gold/20"
              }`}
            >
              Completed ({investments.filter(i => i.status === "completed").length})
            </button>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-navy-dark text-white border border-gold/20 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-gold"
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="returns">Returns</option>
            </select>
          </div>
        </div>
      </div>

      {/* Investment Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sortedInvestments.map((investment) => (
          <div
            key={investment.id}
            className="glass rounded-xl border border-gold/20 overflow-hidden hover:border-gold/40 transition-all duration-300 group"
          >
            {/* Project Image */}
            <div className="relative h-48 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-navy-dark to-transparent z-10"></div>
              <div className="w-full h-full bg-navy-dark flex items-center justify-center">
                <svg className="w-16 h-16 text-gold/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className={`absolute top-4 right-4 z-20 px-3 py-1 rounded-full border text-xs font-medium uppercase tracking-wider ${getStatusColor(investment.status)}`}>
                {investment.status}
              </div>
            </div>

            {/* Card Content */}
            <div className="p-6 space-y-4">
              {/* Header */}
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{investment.projectName}</h3>
                <p className="text-sm text-gray-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {investment.location}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Invested Amount</div>
                  <div className="text-lg font-bold text-white">${investment.investedAmount.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Current Value</div>
                  <div className="text-lg font-bold text-white">${investment.currentValue.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Returns</div>
                  <div className="text-lg font-bold gradient-text">+${investment.returns.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Return %</div>
                  <div className={`text-lg font-bold ${investment.returnPercentage > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                    {investment.returnPercentage > 0 ? '+' : ''}{investment.returnPercentage}%
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                  <span>Funding Progress</span>
                  <span>{investment.fundingProgress}%</span>
                </div>
                <div className="w-full bg-navy-dark rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-gold to-gold-light transition-all duration-500"
                    style={{ width: `${investment.fundingProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gold/10">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Investment Date</div>
                  <div className="text-sm text-white">{formatDate(investment.investmentDate)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Expected Completion</div>
                  <div className="text-sm text-white">{formatDate(investment.expectedCompletion)}</div>
                </div>
              </div>

              {/* Action Button */}
              <Link
                href={`/projects/${investment.id}`}
                className="block w-full py-3 bg-navy-dark hover:bg-gold/10 border border-gold/20 hover:border-gold/40 rounded-lg text-center text-sm font-medium text-white transition-all duration-300"
              >
                View Project Details
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {sortedInvestments.length === 0 && (
        <div className="glass rounded-xl p-12 border border-gold/20 text-center">
          <svg className="w-16 h-16 text-gold/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="text-xl font-bold text-white mb-2">No investments found</h3>
          <p className="text-gray-400 mb-6">Try adjusting your filters or explore new projects</p>
          <Link
            href="/projects"
            className="inline-block px-6 py-3 bg-gradient-to-r from-gold to-gold-light text-navy font-bold rounded-lg hover:scale-105 transition-all duration-300"
          >
            Browse Projects
          </Link>
        </div>
      )}
    </div>
  );
}
