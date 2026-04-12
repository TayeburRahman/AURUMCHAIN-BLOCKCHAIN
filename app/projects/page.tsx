"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import EarthGlobe from "../components/EarthGlobe";

function ProjectsContent() {
  const searchParams = useSearchParams();
  const [activeFilter, setActiveFilter] = useState("all");
  const [highlightedProject, setHighlightedProject] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const projectRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const highlight = searchParams.get('highlight');
    if (highlight) {
      const projectId = parseInt(highlight);
      setHighlightedProject(projectId);

      // Scroll to the project card
      setTimeout(() => {
        projectRefs.current[projectId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);

      // Remove highlight after 3 seconds
      setTimeout(() => {
        setHighlightedProject(null);
      }, 3000);
    }
  }, [searchParams]);

  const handleLocationClick = (id: number) => {
    setHighlightedProject(id);
    setTimeout(() => {
      projectRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);

    // Remove highlight after 3 seconds
    setTimeout(() => {
      setHighlightedProject(null);
    }, 3000);
  };

  const projects = [
    {
      id: 1,
      name: "Sierra Leone Artisanal Mine",
      location: "Eastern Province, Sierra Leone",
      status: "Funding",
      fundingGoal: 250000,
      fundingCurrent: 187500,
      expectedReturn: "12-15%",
      duration: "18 months",
      goldReserve: "~500 oz",
      risk: "Medium",
      description: "Established artisanal mining operation with proven gold deposits. Seeking capital for equipment upgrades and operational expansion.",
    },
    {
      id: 2,
      name: "Georgian Mountain Gold",
      location: "Svaneti Region, Georgia",
      status: "Funding",
      fundingGoal: 180000,
      fundingCurrent: 95000,
      expectedReturn: "10-14%",
      duration: "24 months",
      goldReserve: "~350 oz",
      risk: "Medium-Low",
      description: "Small-scale operation in historic gold mining region. Family-owned with 15 years of experience and consistent production records.",
    },
    {
      id: 3,
      name: "Brazilian Alluvial Deposit",
      location: "Minas Gerais, Brazil",
      status: "Coming Soon",
      fundingGoal: 320000,
      fundingCurrent: 0,
      expectedReturn: "14-18%",
      duration: "20 months",
      goldReserve: "~650 oz",
      risk: "Medium-High",
      description: "High-yield alluvial deposit requiring hydraulic mining equipment. Partnership with local cooperative with strong community ties.",
    },
    {
      id: 4,
      name: "Papua New Guinea Highlands",
      location: "Eastern Highlands, Papua New Guinea",
      status: "Funding",
      fundingGoal: 420000,
      fundingCurrent: 215000,
      expectedReturn: "15-19%",
      duration: "22 months",
      goldReserve: "~850 oz",
      risk: "Medium-High",
      description: "Remote highland operation with rich alluvial deposits. Modern equipment and strong local partnerships enable sustainable extraction.",
    },
    {
      id: 5,
      name: "Dominican Gold Stream",
      location: "Pueblo Viejo District, Dominican Republic",
      status: "Funding",
      fundingGoal: 290000,
      fundingCurrent: 145000,
      expectedReturn: "11-14%",
      duration: "19 months",
      goldReserve: "~580 oz",
      risk: "Medium",
      description: "Proven stream-bed deposits in established mining district. Experienced team with track record of consistent production and environmental compliance.",
    },
    {
      id: 6,
      name: "Yusufeli River Gold",
      location: "Yusufeli, Artvin, Turkey",
      status: "Coming Soon",
      fundingGoal: 375000,
      fundingCurrent: 0,
      expectedReturn: "13-16%",
      duration: "21 months",
      goldReserve: "~720 oz",
      risk: "Medium",
      description: "Historic river gold site with modern prospecting data. Strategic location near infrastructure with government mining permits secured.",
    },
  ];

  const filters = ["All Projects", "Funding", "Active", "Completed"];

  return (
    <div className="min-h-screen bg-navy pt-20">
      {/* Hero Section */}
      <section className="py-24 px-6 md:px-12 lg:px-24 bg-gradient-to-b from-navy-dark to-navy relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-64 h-64 bg-gold/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-gold/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-full px-4 py-2 mb-6">
            <span className="text-gold text-sm font-medium">Active Investment Opportunities</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="text-white">Mining </span>
            <span className="gradient-text">Projects</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
            Invest in vetted gold mining operations with transparent tracking and real returns backed by gold production
          </p>

          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-3">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter.toLowerCase().replace(' ', '-'))}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeFilter === filter.toLowerCase().replace(' ', '-') || (filter === "All Projects" && activeFilter === "all")
                    ? "bg-gradient-to-r from-gold to-gold-light text-navy shadow-lg shadow-gold/30"
                    : "glass border border-gold/30 text-white hover:border-gold/60"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Map Section */}
      <section className="py-16 px-6 md:px-12 lg:px-24 bg-navy-dark">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-white">Global </span>
              <span className="gradient-text">Mining Network</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Click on a location to view project details
            </p>
          </div>

          <div className="glass rounded-2xl p-8 border border-gold/20">
            <div className="w-full aspect-square">
              <EarthGlobe interactive={false} onLocationClick={handleLocationClick} />
            </div>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-20 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
              <div
                key={project.id}
                ref={(el) => { projectRefs.current[project.id] = el; }}
                className={`group glass rounded-2xl overflow-hidden border transition-all duration-500 hover-lift flex flex-col h-full ${
                  highlightedProject === project.id
                    ? 'border-gold shadow-2xl shadow-gold/50 scale-105'
                    : 'border-gold/20 hover:border-gold/40'
                } ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}
                style={mounted ? { animationDelay: `${index * 150}ms` } : undefined}
              >
                {/* Project Image */}
                <div className="relative h-56 bg-gradient-to-br from-gold/20 via-gold/10 to-gold-dark/20 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm"></div>
                  <Image
                    src="/logo.png"
                    alt={project.name}
                    width={100}
                    height={100}
                    className="relative z-10 opacity-40 group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 z-20">
                    <span
                      className={`px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm ${
                        project.status === "Funding"
                          ? "bg-gold/90 text-navy shadow-lg shadow-gold/30"
                          : "bg-gray-700/90 text-gray-300"
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>
                  <div className="absolute top-4 left-4 z-20">
                    <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-navy/80 text-gold border border-gold/30 backdrop-blur-sm">
                      #{project.id}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-gold transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {project.location}
                  </p>
                  <p className="text-gray-300 text-sm mb-6 line-clamp-3 leading-relaxed">{project.description}</p>

                  {/* Funding Progress */}
                  {project.status === "Funding" && (
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400 font-medium">Progress</span>
                        <span className="text-gold font-bold">
                          ${(project.fundingCurrent / 1000).toFixed(0)}k / ${(project.fundingGoal / 1000).toFixed(0)}k
                        </span>
                      </div>
                      <div className="relative w-full bg-navy/60 rounded-full h-3 overflow-hidden border border-gold/20">
                        <div
                          className="absolute inset-0 bg-gradient-to-r from-gold to-gold-light rounded-full transition-all duration-1000 shimmer"
                          style={{ width: `${(project.fundingCurrent / project.fundingGoal) * 100}%` }}
                        ></div>
                      </div>
                      <div className="text-right text-xs text-gray-500 mt-1">
                        {Math.round((project.fundingCurrent / project.fundingGoal) * 100)}% funded
                      </div>
                    </div>
                  )}

                  {/* Project Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="glass rounded-lg p-3 border border-gold/10">
                      <div className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Expected Return</div>
                      <div className="text-gold font-bold text-lg">{project.expectedReturn}</div>
                    </div>
                    <div className="glass rounded-lg p-3 border border-gold/10">
                      <div className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Duration</div>
                      <div className="text-white font-bold">{project.duration}</div>
                    </div>
                    <div className="glass rounded-lg p-3 border border-gold/10">
                      <div className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Gold Reserve</div>
                      <div className="text-white font-bold">{project.goldReserve}</div>
                    </div>
                    <div className="glass rounded-lg p-3 border border-gold/10">
                      <div className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Risk Level</div>
                      <div
                        className={`font-bold text-sm ${
                          project.risk === "Medium-Low"
                            ? "text-green-400"
                            : project.risk === "Medium"
                            ? "text-yellow-400"
                            : "text-orange-400"
                        }`}
                      >
                        {project.risk}
                      </div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    className={`w-full font-bold py-3.5 px-6 rounded-xl transition-all duration-300 mt-auto ${
                      project.status === "Funding"
                        ? "bg-gradient-to-r from-gold to-gold-light hover:from-gold-light hover:to-gold text-navy shadow-lg shadow-gold/20 hover:shadow-gold/40 hover:scale-[1.02]"
                        : "bg-gray-700/50 text-gray-400 cursor-not-allowed"
                    }`}
                    disabled={project.status !== "Funding"}
                  >
                    {project.status === "Funding" ? (
                      <span className="flex items-center justify-center gap-2">
                        Invest Now
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    ) : (
                      "Coming Soon"
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How Investment Works */}
      <section className="py-20 px-6 md:px-12 lg:px-24 bg-navy-dark">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              <span className="text-white">How </span>
              <span className="gradient-text">Investment</span>
              <span className="text-white"> Works</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Every project undergoes rigorous vetting to ensure transparency and minimize risk
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-12 h-12 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                ),
                title: "Due Diligence",
                description: "Rigorous vetting including geological surveys, financial audits, and operational assessments",
              },
              {
                icon: (
                  <svg className="w-12 h-12 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                ),
                title: "Tokenized Ownership",
                description: "Your investment is tokenized on the blockchain, representing a share of the mine's future production",
              },
              {
                icon: (
                  <svg className="w-12 h-12 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ),
                title: "Gold-Backed Returns",
                description: "Receive Golden Fleece Tokens pegged to real gold as the mine produces",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="group glass rounded-2xl p-8 border border-gold/20 hover:border-gold/40 transition-all duration-500 hover-lift text-center"
              >
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-gold/20 to-gold-light/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold gradient-text mb-4">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link
              href="/account"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-gold to-gold-light hover:from-gold-light hover:to-gold text-navy font-bold py-4 px-10 rounded-xl transition-all duration-300 shadow-xl shadow-gold/30 hover:shadow-gold/50 hover:scale-105"
            >
              Create Account to Invest
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="text-gold text-xl">Loading...</div>
      </div>
    }>
      <ProjectsContent />
    </Suspense>
  );
}
