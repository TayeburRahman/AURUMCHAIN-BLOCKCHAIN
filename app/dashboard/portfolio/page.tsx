"use client";

import { useState } from "react";
import Link from "next/link";

export default function PortfolioPage() {
  const [timeframe, setTimeframe] = useState<"1D" | "1W" | "1M" | "3M" | "1Y" | "ALL">("1M");

  const portfolioData = {
    totalValue: 28250.50,
    totalInvested: 25000.00,
    totalReturns: 3250.50,
    returnPercentage: 13.0,
    goldTokens: 45.25,
    activeProjects: 3,
    completedProjects: 1,
  };

  const projectBreakdown = [
    {
      id: 1,
      name: "Super Pit",
      location: "Australia",
      allocation: 32.6,
      value: 9200,
      returns: 1200,
      returnPercentage: 15.0,
      status: "active",
    },
    {
      id: 2,
      name: "Grasberg Mine",
      location: "Papua New Guinea",
      allocation: 26.5,
      value: 7500,
      returns: 1500,
      returnPercentage: 25.0,
      status: "completed",
    },
    {
      id: 3,
      name: "Obuasi Gold Mine",
      location: "Ghana",
      allocation: 20.4,
      value: 5750,
      returns: 750,
      returnPercentage: 15.0,
      status: "active",
    },
    {
      id: 4,
      name: "Kumtor Mine",
      location: "Kyrgyzstan",
      allocation: 13.6,
      value: 3850,
      returns: 350,
      returnPercentage: 10.0,
      status: "active",
    },
    {
      id: 5,
      name: "Pueblo Viejo",
      location: "Dominican Republic",
      allocation: 8.9,
      value: 2500,
      returns: 0,
      returnPercentage: 0,
      status: "funded",
    },
  ];

  const performanceMetrics = [
    {
      label: "Best Performing",
      value: "Grasberg Mine",
      metric: "+25.0%",
      color: "text-green-400",
    },
    {
      label: "Total Dividends Earned",
      value: "$1,305",
      metric: "This year",
      color: "text-gold",
    },
    {
      label: "Average Return Rate",
      value: "13.0%",
      metric: "Across all projects",
      color: "text-blue-400",
    },
    {
      label: "Portfolio Diversity",
      value: "5 Projects",
      metric: "3 continents",
      color: "text-purple-400",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-400 bg-green-400/10";
      case "funded":
        return "text-blue-400 bg-blue-400/10";
      case "completed":
        return "text-gold bg-gold/10";
      default:
        return "text-gray-400 bg-gray-400/10";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Portfolio Analytics</h1>
        <p className="text-gray-400">Track your portfolio performance and allocation</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass rounded-xl p-6 border border-gold/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Portfolio Value</span>
            <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-white mb-1">${portfolioData.totalValue.toLocaleString()}</div>
          <div className="text-sm text-green-400">+${portfolioData.totalReturns.toLocaleString()} ({portfolioData.returnPercentage}%)</div>
        </div>

        <div className="glass rounded-xl p-6 border border-gold/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Invested</span>
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-white">${portfolioData.totalInvested.toLocaleString()}</div>
        </div>

        <div className="glass rounded-xl p-6 border border-gold/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Gold Tokens</span>
            <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-2xl font-bold gradient-text">{portfolioData.goldTokens} GFT</div>
        </div>

        <div className="glass rounded-xl p-6 border border-gold/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Active Projects</span>
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-white">{portfolioData.activeProjects}</div>
        </div>
      </div>

      {/* Portfolio Performance Chart */}
      <div className="glass rounded-xl p-6 border border-gold/20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Portfolio Performance</h2>
            <p className="text-sm text-gray-400">Track your portfolio value over time</p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            {(["1D", "1W", "1M", "3M", "1Y", "ALL"] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  timeframe === tf
                    ? "bg-gold text-navy"
                    : "bg-navy-dark text-gray-400 hover:text-white border border-gold/20"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Placeholder */}
        <div className="bg-navy-dark rounded-lg p-8 border border-gold/10">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <svg className="w-16 h-16 text-gold/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-lg font-bold text-white mb-2">Portfolio Chart</h3>
              <p className="text-sm text-gray-400">Interactive chart showing portfolio growth over {timeframe}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceMetrics.map((metric, index) => (
          <div key={index} className="glass rounded-xl p-6 border border-gold/20">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">{metric.label}</div>
            <div className={`text-2xl font-bold ${metric.color} mb-1`}>{metric.value}</div>
            <div className="text-sm text-gray-400">{metric.metric}</div>
          </div>
        ))}
      </div>

      {/* Project Allocation */}
      <div className="glass rounded-xl p-6 border border-gold/20">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-1">Project Allocation</h2>
          <p className="text-sm text-gray-400">Breakdown of your investments by project</p>
        </div>

        {/* Allocation Bar */}
        <div className="mb-6">
          <div className="flex h-12 rounded-lg overflow-hidden">
            {projectBreakdown.map((project, index) => (
              <div
                key={project.id}
                className="relative group cursor-pointer transition-all hover:opacity-80"
                style={{
                  width: `${project.allocation}%`,
                  backgroundColor: [
                    "#FFD700",
                    "#FFA500",
                    "#FF8C00",
                    "#FF6B35",
                    "#C44569",
                  ][index % 5],
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-navy opacity-0 group-hover:opacity-100 transition-opacity">
                    {project.allocation}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project List */}
        <div className="space-y-4">
          {projectBreakdown.map((project, index) => (
            <div
              key={project.id}
              className="flex items-center justify-between p-4 bg-navy-dark rounded-lg border border-gold/10 hover:border-gold/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: [
                      "#FFD700",
                      "#FFA500",
                      "#FF8C00",
                      "#FF6B35",
                      "#C44569",
                    ][index % 5],
                  }}
                ></div>
                <div>
                  <div className="text-sm font-bold text-white">{project.name}</div>
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {project.location}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-sm font-bold text-white">${project.value.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">{project.allocation}% allocation</div>
                </div>

                <div className="text-right">
                  <div className={`text-sm font-bold ${project.returnPercentage > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                    {project.returnPercentage > 0 ? '+' : ''}{project.returnPercentage}%
                  </div>
                  <div className="text-xs text-gray-400">
                    {project.returns > 0 ? `+$${project.returns.toLocaleString()}` : '$0'}
                  </div>
                </div>

                <div>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>

                <Link
                  href={`/projects/${project.id}`}
                  className="text-gold hover:text-gold-light transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="glass rounded-xl p-6 border border-gold/20">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-1">Risk Assessment</h2>
          <p className="text-sm text-gray-400">Portfolio risk analysis and diversification score</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-navy-dark rounded-lg p-6 border border-gold/10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-400">Risk Level</span>
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-yellow-400 mb-2">Moderate</div>
            <div className="w-full bg-navy rounded-full h-2">
              <div className="bg-yellow-400 h-2 rounded-full" style={{ width: "60%" }}></div>
            </div>
          </div>

          <div className="bg-navy-dark rounded-lg p-6 border border-gold/10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-400">Diversification</span>
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-green-400 mb-2">Good</div>
            <div className="w-full bg-navy rounded-full h-2">
              <div className="bg-green-400 h-2 rounded-full" style={{ width: "75%" }}></div>
            </div>
          </div>

          <div className="bg-navy-dark rounded-lg p-6 border border-gold/10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-400">Stability Score</span>
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-blue-400 mb-2">8.5/10</div>
            <div className="w-full bg-navy rounded-full h-2">
              <div className="bg-blue-400 h-2 rounded-full" style={{ width: "85%" }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
