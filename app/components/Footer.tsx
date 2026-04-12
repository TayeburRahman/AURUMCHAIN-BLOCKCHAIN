import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-navy border-t border-gold/20 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <Image src="/logo.png" alt="GoldenFleece" width={40} height={40} />
              <span className="text-gold font-bold">GoldenFleece</span>
            </div>
            <p className="text-gray-400 text-sm">Making mining investment accessible for everyday investors.</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-gold font-bold mb-4 text-sm">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-400 hover:text-gold transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/projects" className="text-gray-400 hover:text-gold transition-colors">
                  Mining Projects
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-gold transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-gray-400 hover:text-gold transition-colors">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-gold font-bold mb-4 text-sm">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/account" className="text-gray-400 hover:text-gold transition-colors">
                  My Account
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-gold transition-colors">
                  Whitepaper
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-gold transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-gold transition-colors">
                  Documentation
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-gold font-bold mb-4 text-sm">Connect</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-400 hover:text-gold transition-colors">
                  Twitter
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-gold transition-colors">
                  Telegram
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-gold transition-colors">
                  Discord
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-gold transition-colors">
                  Email
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gold/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gold-light text-sm">AURUMCHAIN - Own Your Own Gold Mine</div>
          <div className="text-gray-400 text-sm">© 2025 AurumChain. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}
