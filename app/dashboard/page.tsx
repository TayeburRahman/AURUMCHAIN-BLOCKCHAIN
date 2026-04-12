"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { WalletBanner } from "@/app/components/WalletBanner";

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "investments" | "transactions">("overview");
  const [loading, setLoading] = useState(true);

  // User data
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    accountBalance: 0,
    totalInvested: 0,
    totalReturns: 0,
    portfolioValue: 0,
    goldTokens: 0,
  });

  // Investments and transactions
  const [investments, setInvestments] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        // Fetch wallet
        const { data: wallet } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', user.id)
          .single();

        // Fetch investments with project details
        const { data: investmentsData } = await supabase
          .from('investments')
          .select(`
            *,
            projects (
              name,
              slug,
              location,
              country,
              status
            )
          `)
          .eq('user_id', user.id)
          .order('invested_at', { ascending: false });

        // Fetch recent transactions
        const { data: transactionsData } = await supabase
          .from('transactions')
          .select(`
            *,
            projects (
              name
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        // Calculate totals
        const totalInvested = investmentsData?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;
        const totalReturns = 0; // Will be calculated from dividends later
        const portfolioValue = totalInvested + totalReturns;

        setUserData({
          name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'User',
          email: profile?.email || user.email || '',
          accountBalance: Number(wallet?.balance || 0),
          totalInvested,
          totalReturns,
          portfolioValue,
          goldTokens: Number(wallet?.gold_tokens || 0),
        });

        setInvestments(investmentsData || []);
        setTransactions(transactionsData || []);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [router]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy pt-20 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy pt-20">
      {/* Header */}
      <section className="py-8 px-6 md:px-12 lg:px-24 bg-gradient-to-b from-navy-dark to-navy border-b border-gold/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Welcome back, <span className="gradient-text">{userData.name}</span>
              </h1>
              <p className="text-gray-400">Track your investments and returns</p>
            </div>
            <Link
              href="/projects"
              className="bg-gradient-to-r from-gold to-gold-light hover:from-gold-light hover:to-gold text-navy font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg shadow-gold/20 hover:shadow-gold/40 hover:scale-105"
            >
              Browse Projects
            </Link>
          </div>
        </div>
      </section>

      {/* Wallet Connection Banner */}
      <section className="py-6 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <WalletBanner />
        </div>
      </section>

      {/* Stats Overview */}
      <section className="py-8 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {/* Portfolio Value */}
            <div className="glass rounded-xl p-6 border border-gold/20 hover:border-gold/40 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs text-gray-400 uppercase tracking-wider">Portfolio Value</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold gradient-text">${userData.portfolioValue.toLocaleString()}</div>
            </div>

            {/* Total Invested */}
            <div className="glass rounded-xl p-6 border border-gold/20 hover:border-gold/40 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
                <span className="text-xs text-gray-400 uppercase tracking-wider">Total Invested</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-white">${userData.totalInvested.toLocaleString()}</div>
            </div>

            {/* Total Returns */}
            <div className="glass rounded-xl p-6 border border-gold/20 hover:border-gold/40 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="text-xs text-gray-400 uppercase tracking-wider">Total Returns</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-green-400">+${userData.totalReturns.toLocaleString()}</div>
            </div>

            {/* Gold Tokens */}
            <div className="glass rounded-xl p-6 border border-gold/20 hover:border-gold/40 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5">
                  <Image src="/logo.png" alt="Gold" width={20} height={20} />
                </div>
                <span className="text-xs text-gray-400 uppercase tracking-wider">Gold Tokens</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold gradient-text">{userData.goldTokens.toFixed(2)} oz</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-gold/20">
            {(["overview", "investments", "transactions"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 px-2 font-bold text-sm uppercase tracking-wider transition-all relative ${
                  activeTab === tab
                    ? "text-gold"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent"></span>
                )}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Recent Investments */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Your Investments</h2>
                {investments.length === 0 ? (
                  <div className="glass rounded-xl p-12 border border-gold/20 text-center">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <h3 className="text-xl font-bold text-white mb-2">No investments yet</h3>
                    <p className="text-gray-400 mb-6">Start investing in gold mining projects to see them here</p>
                    <Link
                      href="/projects"
                      className="inline-block bg-gradient-to-r from-gold to-gold-light text-navy font-bold py-3 px-6 rounded-lg hover:scale-105 transition-all"
                    >
                      Explore Projects
                    </Link>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {investments.slice(0, 6).map((investment: any) => (
                      <div key={investment.id} className="glass rounded-xl p-6 border border-gold/20 hover:border-gold/40 transition-all hover-lift">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gold mb-1">{investment.projects?.name || 'Project'}</h3>
                            <p className="text-xs text-gray-400">{investment.projects?.location || ''}, {investment.projects?.country || ''}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            investment.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            investment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {investment.status}
                          </span>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Invested</span>
                            <span className="text-sm font-bold text-white">${Number(investment.amount).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Tokens Purchased</span>
                            <span className="text-sm font-bold gradient-text">{Number(investment.tokens_purchased).toFixed(4)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Price per Token</span>
                            <span className="text-sm font-bold text-white">${Number(investment.token_price_at_purchase).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Date</span>
                            <span className="text-sm font-bold text-gray-400">{formatDate(investment.invested_at)}</span>
                          </div>
                        </div>

                        <Link
                          href={`/projects`}
                          className="block w-full text-center py-2 border-2 border-gold/50 text-gold hover:bg-gold/10 rounded-lg transition-all font-bold text-sm"
                        >
                          View Details
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Performance Chart Placeholder */}
              <div className="glass rounded-xl p-6 border border-gold/20">
                <h2 className="text-2xl font-bold text-white mb-4">Portfolio Performance</h2>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gold/20 rounded-lg">
                  <p className="text-gray-400">Chart coming soon</p>
                </div>
              </div>
            </div>
          )}

          {/* Investments Tab */}
          {activeTab === "investments" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">All Investments</h2>
                <Link
                  href="/projects"
                  className="text-gold hover:text-gold-light transition-colors font-bold text-sm flex items-center gap-2"
                >
                  Explore More Projects
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>

              {investments.length === 0 ? (
                <div className="glass rounded-xl p-12 border border-gold/20 text-center">
                  <p className="text-gray-400">No investments yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {investments.map((investment: any) => (
                    <div key={investment.id} className="glass rounded-xl p-6 border border-gold/20 hover:border-gold/40 transition-all">
                      <div className="grid md:grid-cols-4 gap-4 items-center">
                        <div className="md:col-span-2">
                          <h3 className="text-lg font-bold text-gold mb-1">{investment.projects?.name || 'Project'}</h3>
                          <p className="text-sm text-gray-400">{investment.projects?.location || ''}, {investment.projects?.country || ''}</p>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-400 mb-1">Invested</div>
                          <div className="text-lg font-bold text-white">${Number(investment.amount).toLocaleString()}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-400 mb-1">Tokens</div>
                          <div className="text-lg font-bold gradient-text">{Number(investment.tokens_purchased).toFixed(4)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === "transactions" && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Transaction History</h2>
              {transactions.length === 0 ? (
                <div className="glass rounded-xl p-12 border border-gold/20 text-center">
                  <p className="text-gray-400">No transactions yet</p>
                </div>
              ) : (
                <div className="glass rounded-xl border border-gold/20 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gold/20">
                          <th className="text-left py-4 px-6 text-sm font-bold text-gray-400 uppercase tracking-wider">Type</th>
                          <th className="text-left py-4 px-6 text-sm font-bold text-gray-400 uppercase tracking-wider">Project</th>
                          <th className="text-left py-4 px-6 text-sm font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                          <th className="text-left py-4 px-6 text-sm font-bold text-gray-400 uppercase tracking-wider">Date</th>
                          <th className="text-left py-4 px-6 text-sm font-bold text-gray-400 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((transaction: any) => (
                          <tr key={transaction.id} className="border-b border-gold/10 hover:bg-gold/5 transition-colors">
                            <td className="py-4 px-6">
                              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
                                transaction.type === "investment" ? "bg-gold/20 text-gold" : "bg-green-500/20 text-green-400"
                              }`}>
                                {transaction.type}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-sm text-white">{transaction.projects?.name || 'N/A'}</td>
                            <td className="py-4 px-6">
                              <span className="text-sm font-bold text-white">
                                ${Number(transaction.amount).toLocaleString()}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-sm text-gray-400">{formatDate(transaction.created_at)}</td>
                            <td className="py-4 px-6">
                              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                                transaction.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                transaction.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {transaction.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
