"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import EarthGlobe from "./components/EarthGlobe";

export default function Home() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.observe').forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="snap-container bg-navy">
      {/* Hero Section */}
      <section className="snap-section relative flex flex-col items-center justify-start px-6 md:px-12 lg:px-24 overflow-hidden pt-32 pb-16">
        {/* Metoro-style Layered Gradient Backgrounds */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Main centered glow - top */}
          <div className="glow-orb glow-gold absolute left-1/2 -translate-x-1/2 w-[80%] h-48 top-[-96px]"></div>

          {/* Left accent glow */}
          <div className="glow-orb glow-gold-subtle absolute left-[-10%] top-1/4 w-96 h-96"></div>

          {/* Right accent glow */}
          <div className="glow-orb glow-gold-subtle absolute right-[-10%] top-1/3 w-96 h-96"></div>

          {/* Bottom ambient glow */}
          <div className="glow-orb absolute left-1/2 -translate-x-1/2 bottom-[-48px] w-[60%] h-32 bg-gold/10 blur-[120px]"></div>
        </div>

        <div className="max-w-6xl w-full flex flex-col items-center text-center relative z-10 space-y-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-full px-4 py-2 opacity-0 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-gold"></span>
            </span>
            <span className="text-gold text-sm font-medium">Democratizing Gold Mining Investment</span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.1] tracking-tight opacity-0 animate-fade-in-up delay-100">
            <span className="text-white">Invest in </span>
            <span className="gradient-text-hero">Gold Mines</span>
            <br />
            <span className="text-white">Without Operating One</span>
          </h1>

          {/* Description */}
          <p className="text-gray-300/70 text-lg md:text-xl lg:text-2xl leading-relaxed max-w-3xl opacity-0 animate-fade-in-up delay-200 font-normal">
            GoldenFleece connects everyday investors with profitable small-scale gold mining operations.
            Earn yields backed by real gold production through blockchain-powered transparency.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 pt-8 opacity-0 animate-fade-in-up delay-300">
            <Link
              href="/projects"
              className="group relative bg-gradient-to-r from-gold to-gold-light hover:from-gold-light hover:to-gold text-navy font-bold py-5 px-10 rounded-xl transition-all duration-300 text-center shadow-xl shadow-gold/30 hover:shadow-gold/50 hover:scale-105 overflow-hidden text-lg"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Browse Mining Projects
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
            <Link
              href="/about"
              className="group border-2 border-gold/40 text-gold hover:bg-gold/10 font-bold py-5 px-10 rounded-xl transition-all duration-300 text-center hover:border-gold/60 text-lg"
            >
              Learn How It Works
            </Link>
          </div>

          {/* Globe */}
          <div className="w-full max-w-xl aspect-square mt-8 opacity-0 animate-fade-in delay-400">
            <EarthGlobe interactive={true} />
          </div>

          {/* Trust indicators */}
          <div className="w-full max-w-4xl pt-16 pb-20 opacity-0 animate-fade-in-up delay-500">
            <div className="border-t border-gold/10 pt-12">
              <div className="grid grid-cols-3 gap-8 md:gap-16 text-center">
                <div>
                  <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">20%</div>
                  <div className="text-xs md:text-sm text-gray-400/60 uppercase tracking-wider">Global Gold Supply</div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">3-5</div>
                  <div className="text-xs md:text-sm text-gray-400/60 uppercase tracking-wider">Mining Partners</div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">100%</div>
                  <div className="text-xs md:text-sm text-gray-400/60 uppercase tracking-wider">Blockchain</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center gap-2 animate-bounce cursor-pointer opacity-0 animate-fade-in delay-700">
          <span className="text-gold/60 text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-6 h-10 border-2 border-gold/40 rounded-full flex justify-center hover:border-gold transition-colors">
            <div className="w-1.5 h-3 bg-gold rounded-full mt-2 animate-pulse"></div>
          </div>
          <svg className="w-4 h-4 text-gold/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="snap-section py-32 md:py-40 px-6 md:px-12 lg:px-24 bg-gradient-to-b from-navy to-navy-dark flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-20 md:mb-24 observe opacity-0">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-[1.15] tracking-tight">
              <span className="text-white">Bridging the </span>
              <span className="gradient-text-hero">Financing Gap</span>
            </h2>
            <p className="text-gray-300/70 text-lg md:text-xl lg:text-2xl max-w-3xl mx-auto leading-relaxed">
              Connecting small-scale miners with global investors through blockchain technology
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10 md:gap-12">
            {/* For Investors */}
            <div className="group glass rounded-2xl p-10 md:p-12 border-glow card-hover-lift observe opacity-0">
              <div className="flex items-start gap-6 mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-gold/20 to-gold-light/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold gradient-text mb-2">For Investors</h3>
                  <p className="text-gray-400 text-sm">Earn gold-backed returns</p>
                </div>
              </div>
              <ul className="space-y-4">
                {[
                  "Fixed returns tied to real gold production",
                  "Natural hedge against inflation",
                  "Transparent blockchain tracking",
                  "Access to vetted mining operations",
                  "Start with accessible minimums",
                ].map((item, index) => (
                  <li key={index} className="flex gap-3 items-start group/item">
                    <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-300 group-hover/item:text-white transition-colors leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* For Miners */}
            <div className="group glass rounded-2xl p-10 md:p-12 border-glow card-hover-lift observe opacity-0 delay-200">
              <div className="flex items-start gap-6 mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-gold/20 to-gold-light/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold gradient-text mb-2">For Small-Scale Miners</h3>
                  <p className="text-gray-400 text-sm">Access fair financing</p>
                </div>
              </div>
              <ul className="space-y-4">
                {[
                  "Capital without bank requirements",
                  "Fair financing terms",
                  "Reach global investors",
                  "Scale your operations",
                  "Maintain operational control",
                ].map((item, index) => (
                  <li key={index} className="flex gap-3 items-start group/item">
                    <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-300 group-hover/item:text-white transition-colors leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="snap-section py-32 md:py-40 px-6 md:px-12 lg:px-24 bg-navy-dark flex items-center">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-20 md:mb-24 observe opacity-0">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 text-white leading-[1.15] tracking-tight">
              How <span className="gradient-text-hero">GoldenFleece</span> Works
            </h2>
            <p className="text-gray-300/70 text-lg md:text-xl lg:text-2xl max-w-2xl mx-auto leading-relaxed">
              Our platform tokenizes gold mining contracts, making investment opportunities accessible to everyone
            </p>
          </div>

          <div className="space-y-10 md:space-y-16">
            {[
              {
                number: "01",
                title: "Mining Agreement",
                description: "Small and artisanal gold mines sign production contracts with AurumChain, outlining expected gold output and operational terms.",
                icon: (
                  <svg className="w-12 h-12 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
              },
              {
                number: "02",
                title: "Tokenization",
                description: "We convert mining contracts into investment tokens on the blockchain, representing shares of future gold production.",
                icon: (
                  <svg className="w-12 h-12 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                ),
              },
              {
                number: "03",
                title: "Crowdfunding",
                description: "Investors purchase tokens to fund mining operations, with transparent tracking of capital deployment and production milestones.",
                icon: (
                  <svg className="w-12 h-12 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
              },
              {
                number: "04",
                title: "Gold Production & Payout",
                description: "As mines produce gold, investors receive Golden Fleece Tokens pegged to real gold value, providing steady, tangible returns.",
                icon: (
                  <svg className="w-12 h-12 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
              },
            ].map((item, index) => (
              <div key={index} className={`observe opacity-0 delay-${index}00`}>
                <div className="group glass rounded-2xl p-10 md:p-12 border-glow card-hover-lift">
                  <div className="flex flex-col md:flex-row items-start gap-10">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-gold/20 to-gold-light/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        {item.icon}
                      </div>
                      <div className="text-6xl font-bold text-gold/20 group-hover:text-gold/40 transition-colors">
                        {item.number}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl md:text-2xl lg:text-3xl font-bold gradient-text mb-4">{item.title}</h3>
                      <p className="text-gray-400 text-base md:text-lg leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem & Opportunity Section */}
      <section className="snap-section py-32 md:py-40 px-6 md:px-12 lg:px-24 bg-gradient-to-b from-navy-dark to-navy flex items-center">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-20 md:mb-24 observe opacity-0">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 text-white leading-[1.15] tracking-tight">
              The <span className="gradient-text-hero">Untapped Opportunity</span>
            </h2>
            <p className="text-gray-300/70 text-lg md:text-xl lg:text-2xl max-w-3xl mx-auto leading-relaxed">
              Artisanal and small-scale mining contributes <span className="text-gold font-semibold">20%</span> of global gold supply and <span className="text-gold font-semibold">80%</span> of mining employment, yet these operations struggle to access formal financing
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10 md:gap-12">
            <div className="glass rounded-2xl p-10 md:p-12 border-l-4 border-gold-dark card-hover-lift observe opacity-0">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-gold-dark/20 to-gold-dark/30 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-gold-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gold-dark">The Problem</h3>
              </div>
              <ul className="space-y-4 text-gray-300">
                {[
                  'Large corporations overlook low-yield deposits as "too small"',
                  "Banks demand collateral small miners can't provide",
                  "Miners resort to predatory informal lenders",
                  "Investors lack gold-backed yield opportunities",
                ].map((item, index) => (
                  <li key={index} className="flex gap-3 items-start">
                    <span className="text-gold-dark mt-1.5">•</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass rounded-2xl p-10 md:p-12 border-l-4 border-gold card-hover-lift observe opacity-0 delay-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-gold/20 to-gold-light/30 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl md:text-2xl font-bold gradient-text">Our Solution</h3>
              </div>
              <ul className="space-y-4 text-gray-300">
                {[
                  "Crowdfunding pools global capital",
                  "Blockchain ensures transparency",
                  "Vetted mining partners",
                  "Retail investors earn gold-backed returns",
                ].map((item, index) => (
                  <li key={index} className="flex gap-3 items-start">
                    <span className="text-gold mt-1.5">•</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="snap-section py-32 md:py-40 px-6 md:px-12 lg:px-24 bg-navy-dark relative overflow-hidden flex items-center">
        {/* Metoro-style Layered Gradient Backgrounds */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Top glow */}
          <div className="glow-orb glow-gold-subtle absolute left-1/4 top-[-96px] w-96 h-96"></div>

          {/* Bottom glow */}
          <div className="glow-orb glow-gold absolute right-1/4 bottom-[-96px] w-[500px] h-[500px]"></div>

          {/* Center ambient glow */}
          <div className="glow-orb absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-[60%] h-64 bg-gold/5 blur-[120px]"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10 observe opacity-0">
          <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-10 leading-[1.1] tracking-tight">
            <span className="text-white">Ready to Start Investing in </span>
            <span className="gradient-text-hero">Real Gold</span>
            <span className="text-white">?</span>
          </h2>
          <p className="text-lg md:text-xl lg:text-2xl text-gray-300/70 mb-16 leading-relaxed max-w-2xl mx-auto">
            Join early supporters and gain access to exclusive mining investment opportunities. We're launching with 3-5 vetted mining partners.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/account"
              className="group bg-gradient-to-r from-gold to-gold-light hover:from-gold-light hover:to-gold text-navy font-bold py-5 px-12 rounded-xl text-xl transition-all duration-300 shadow-2xl shadow-gold/30 hover:shadow-gold/50 hover:scale-105"
            >
              <span className="flex items-center justify-center gap-2">
                Create Account
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
            <Link
              href="/projects"
              className="border-2 border-gold/40 text-gold hover:bg-gold/10 font-bold py-5 px-12 rounded-xl text-xl transition-all duration-300 hover:border-gold/60"
            >
              View Projects
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
