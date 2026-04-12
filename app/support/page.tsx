"use client";

import { useState } from "react";
import Link from "next/link";

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    alert("Thank you for your message! We'll get back to you soon.");
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  const faqs = [
    {
      question: "How does GoldenFleece work?",
      answer: "GoldenFleece tokenizes gold mining contracts, allowing investors to fund small-scale mining operations and receive returns in Golden Fleece Tokens pegged to real gold production.",
    },
    {
      question: "What are Golden Fleece Tokens?",
      answer: "Golden Fleece Tokens are blockchain-based tokens pegged to real gold value. As mining operations produce gold, investors receive these tokens representing their share of the output.",
    },
    {
      question: "What is the minimum investment?",
      answer: "Minimum investment amounts vary by project but typically start from $100-$500, making gold mining investment accessible to retail investors.",
    },
    {
      question: "How are mining projects vetted?",
      answer: "Every project undergoes rigorous due diligence including geological surveys, financial audits, operational assessments, and verification of gold reserves.",
    },
    {
      question: "What returns can I expect?",
      answer: "Expected returns vary by project, typically ranging from 10-18% annually. Returns depend on gold production, market prices, and operational efficiency.",
    },
    {
      question: "How do I track my investments?",
      answer: "Your account dashboard provides real-time tracking of investments, production milestones, and returns. All transactions are recorded on the blockchain for transparency.",
    },
    {
      question: "Can I withdraw my investment early?",
      answer: "Investment terms vary by project. Some tokens may be tradeable on secondary markets, while others are locked until project completion or milestone achievement.",
    },
    {
      question: "Is my investment secure?",
      answer: "Investments are secured through blockchain smart contracts, vetted mining partners, and transparent fund allocation. However, all investments carry inherent risks.",
    },
  ];

  return (
    <div className="min-h-screen bg-navy pt-20">
      {/* Hero Section */}
      <section className="py-20 px-6 md:px-12 lg:px-24 bg-gradient-to-b from-navy-dark to-navy">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            How Can We <span className="text-gold">Help You</span>?
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Get support for your GoldenFleece account, investments, and general inquiries
          </p>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 px-6 md:px-12 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                icon: (
                  <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                ),
                title: "Documentation",
                desc: "Learn about the platform"
              },
              {
                icon: (
                  <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                ),
                title: "Live Chat",
                desc: "Chat with support team"
              },
              {
                icon: (
                  <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                ),
                title: "Email Support",
                desc: "Send us a message"
              },
              {
                icon: (
                  <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "FAQ",
                desc: "Find quick answers"
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-navy-dark border border-gold/30 rounded-xl p-6 text-center hover:border-gold transition-all cursor-pointer"
              >
                <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-gold/20 to-gold-light/20 rounded-xl flex items-center justify-center">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-gold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 md:px-12 lg:px-24 bg-navy-dark">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12">
            Frequently Asked <span className="text-gold">Questions</span>
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="bg-navy border border-gold/30 rounded-lg p-6 hover:border-gold transition-all group"
              >
                <summary className="cursor-pointer text-lg font-bold text-white group-hover:text-gold transition-colors list-none flex justify-between items-center">
                  <span>{faq.question}</span>
                  <span className="text-gold text-2xl">+</span>
                </summary>
                <p className="text-gray-300 mt-4 leading-relaxed">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 px-6 md:px-12 lg:px-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Still Have <span className="text-gold">Questions</span>?
            </h2>
            <p className="text-gray-400">Send us a message and we'll get back to you within 24 hours</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-navy-dark border border-gold/30 rounded-xl p-8">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="name" className="block text-gray-300 mb-2 text-sm font-medium">
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-navy border border-gold/30 rounded-lg px-4 py-3 text-white focus:border-gold focus:outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-gray-300 mb-2 text-sm font-medium">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-navy border border-gold/30 rounded-lg px-4 py-3 text-white focus:border-gold focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="subject" className="block text-gray-300 mb-2 text-sm font-medium">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full bg-navy border border-gold/30 rounded-lg px-4 py-3 text-white focus:border-gold focus:outline-none transition-all"
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="message" className="block text-gray-300 mb-2 text-sm font-medium">
                Message
              </label>
              <textarea
                id="message"
                rows={6}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full bg-navy border border-gold/30 rounded-lg px-4 py-3 text-white focus:border-gold focus:outline-none transition-all resize-none"
                required
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-gold hover:bg-gold-light text-navy font-bold py-4 px-6 rounded-lg transition-all"
            >
              Send Message
            </button>
          </form>
        </div>
      </section>

      {/* Additional Resources */}
      <section className="py-20 px-6 md:px-12 lg:px-24 bg-navy-dark">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Additional <span className="text-gold">Resources</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-navy border border-gold/30 rounded-xl p-8 text-center">
              <div className="text-4xl mb-4">📄</div>
              <h3 className="text-xl font-bold text-gold mb-3">Whitepaper</h3>
              <p className="text-gray-400 text-sm mb-6">
                Read our comprehensive whitepaper on the GoldenFleece platform and tokenomics
              </p>
              <a href="#" className="text-gold hover:text-gold-light transition-colors font-medium">
                Download PDF →
              </a>
            </div>

            <div className="bg-navy border border-gold/30 rounded-xl p-8 text-center">
              <div className="text-4xl mb-4">🎓</div>
              <h3 className="text-xl font-bold text-gold mb-3">Investment Guide</h3>
              <p className="text-gray-400 text-sm mb-6">
                Learn how to evaluate mining projects and make informed investment decisions
              </p>
              <a href="#" className="text-gold hover:text-gold-light transition-colors font-medium">
                Read Guide →
              </a>
            </div>

            <div className="bg-navy border border-gold/30 rounded-xl p-8 text-center">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-bold text-gold mb-3">Community</h3>
              <p className="text-gray-400 text-sm mb-6">
                Join our community on Telegram and Discord to connect with other investors
              </p>
              <a href="#" className="text-gold hover:text-gold-light transition-colors font-medium">
                Join Community →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 md:px-12 lg:px-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Start <span className="text-gold">Investing</span>?
          </h2>
          <p className="text-gray-400 mb-8">
            Create your account and explore available mining projects
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
              Browse Projects
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
