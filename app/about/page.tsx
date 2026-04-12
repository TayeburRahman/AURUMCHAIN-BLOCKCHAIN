import Image from "next/image";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-navy pt-20">
      {/* Hero Section */}
      <section className="py-20 px-6 md:px-12 lg:px-24 bg-gradient-to-b from-navy-dark to-navy">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                About <span className="text-gold">AurumChain</span>
              </h1>
              <p className="text-xl text-gray-300 leading-relaxed mb-6">
                We're democratizing access to gold mining investments by connecting small-scale miners with global investors through blockchain technology.
              </p>
              <p className="text-gray-400 leading-relaxed">
                GoldenFleece (powered by AurumChain) was founded to solve a critical problem: viable small-scale gold mines struggle to access capital, while investors lack gold-backed yield opportunities. Our platform bridges this gap, creating value for both sides of the market.
              </p>
            </div>
            <div className="flex justify-center">
              <Image src="/logo.png" alt="AurumChain" width={300} height={300} className="drop-shadow-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 px-6 md:px-12 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-navy-dark border border-gold/30 rounded-xl p-8">
              <div className="w-14 h-14 mb-4 bg-gradient-to-br from-gold/20 to-gold-light/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gold mb-4">Our Mission</h2>
              <p className="text-gray-300 leading-relaxed">
                To make gold mining investment accessible to everyday investors while providing fair, transparent financing to small-scale mining operations that are often overlooked by traditional financial institutions.
              </p>
            </div>
            <div className="bg-navy-dark border border-gold/30 rounded-xl p-8">
              <div className="w-14 h-14 mb-4 bg-gradient-to-br from-gold/20 to-gold-light/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gold mb-4">Our Vision</h2>
              <p className="text-gray-300 leading-relaxed">
                A world where gold mining investment is democratized, small-scale miners have access to fair capital, and investors can earn stable, gold-backed returns through transparent, blockchain-verified operations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem We're Solving */}
      <section className="py-20 px-6 md:px-12 lg:px-24 bg-navy-dark">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12">
            The <span className="text-gold">Market Gap</span> We Address
          </h2>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Miners Side */}
            <div>
              <h3 className="text-2xl font-bold text-gold mb-6">Small-Scale Miners Face:</h3>
              <ul className="space-y-4">
                {[
                  "Limited access to traditional bank financing",
                  "Collateral requirements they cannot meet",
                  "Predatory lending from informal sources",
                  "Forced to pre-sell gold at steep discounts",
                  "Large corporations overlook 'small' deposits",
                ].map((item, index) => (
                  <li key={index} className="flex gap-3 items-start">
                    <span className="text-gold-dark mt-1">▶</span>
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Investors Side */}
            <div>
              <h3 className="text-2xl font-bold text-gold mb-6">Investors Face:</h3>
              <ul className="space-y-4">
                {[
                  "Physical gold offers no yield",
                  "Gold ETFs only track price, no returns",
                  "Mining stocks are risky and volatile",
                  "High barriers to direct mining investment",
                  "No accessible gold-backed yield products",
                ].map((item, index) => (
                  <li key={index} className="flex gap-3 items-start">
                    <span className="text-gold-dark mt-1">▶</span>
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="inline-block bg-gold/10 border border-gold rounded-lg p-6">
              <p className="text-gold-light text-lg">
                <span className="font-bold text-gold">The Opportunity:</span> Artisanal and small-scale mining contributes{" "}
                <span className="font-bold">20%</span> of global gold supply and <span className="font-bold">80%</span> of mining employment, yet remains chronically underfunded.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Solution */}
      <section className="py-20 px-6 md:px-12 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12">
            Our <span className="text-gold">Solution</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                ),
                title: "Blockchain Transparency",
                description: "Smart contracts ensure transparent fund allocation and production tracking. Every transaction is verifiable on-chain.",
              },
              {
                icon: (
                  <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: "Vetted Partnerships",
                description: "Rigorous due diligence on every mining partner. Geological surveys, financial audits, and operational assessments.",
              },
              {
                icon: (
                  <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                ),
                title: "Tokenized Contracts",
                description: "Mining contracts become investment tokens, making fractional ownership accessible to all investors globally.",
              },
              {
                icon: (
                  <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "Gold-Backed Returns",
                description: "Investors receive Golden Fleece Tokens pegged to real gold, providing stable returns backed by tangible assets.",
              },
              {
                icon: (
                  <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                title: "Real-Time Tracking",
                description: "Monitor your investments, production milestones, and returns through our transparent dashboard.",
              },
              {
                icon: (
                  <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "Global Access",
                description: "Connect miners from emerging markets with investors worldwide, unlocking capital for profitable operations.",
              },
            ].map((item, index) => (
              <div key={index} className="bg-navy-dark border border-gold/30 rounded-xl p-6 hover:border-gold transition-all">
                <div className="w-14 h-14 mb-4 bg-gradient-to-br from-gold/20 to-gold-light/20 rounded-xl flex items-center justify-center">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-gold mb-3">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-6 md:px-12 lg:px-24 bg-navy-dark">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-4">
            Meet the <span className="text-gold">Team</span>
          </h2>
          <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
            Our team combines expertise in blockchain technology, gold mining, and financial markets
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "David Giorgadze",
                role: "Strategy & Partnerships",
                description: "Leads business development and mining partner relationships across Eastern Europe, Latin America, and Africa.",
              },
              {
                name: "Rati Sturua",
                role: "Platform Development & Engineering",
                description: "Oversees blockchain infrastructure, smart contract development, and platform architecture.",
              },
              {
                name: "George Richmond",
                role: "Gold Mining Industry Expert",
                description: "20+ years in gold mining. Direct access to mining operations and formation of contract-based VC deals.",
              },
            ].map((member, index) => (
              <div key={index} className="bg-navy border border-gold/30 rounded-xl p-8 text-center hover:border-gold transition-all">
                <div className="w-24 h-24 bg-gold/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gold mb-2">{member.name}</h3>
                <div className="text-gold-light text-sm mb-4">{member.role}</div>
                <p className="text-gray-400 text-sm leading-relaxed">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 md:px-12 lg:px-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Join the <span className="text-gold">Golden Revolution</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Be part of the movement democratizing gold mining investment. Early supporters get exclusive access to our initial mining partners.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/account"
              className="bg-gold hover:bg-gold-light text-navy font-bold py-4 px-8 rounded-lg transition-all"
            >
              Create Account
            </Link>
            <Link
              href="/projects"
              className="border-2 border-gold text-gold hover:bg-gold hover:text-navy font-bold py-4 px-8 rounded-lg transition-all"
            >
              View Projects
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
