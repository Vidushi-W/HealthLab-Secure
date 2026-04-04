import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Facebook, Linkedin, Twitter, Youtube, Mail, MapPin, Phone } from 'lucide-react';

const quickLinks = [
  { label: 'Lab feedback', href: '#' },
  { label: 'Lab assessment', href: '#' },
  { label: 'FAQ', href: '#' },
  { label: 'Outreach portal', href: '#' },
];

const aboutLinks = [
  { label: 'Home', href: '#top' },
  { label: 'About', href: '#about' },
  { label: 'Labs', href: '/experiments', router: true },
  { label: 'Contact', href: '#contact' },
];

const social = [
  { label: 'Facebook', href: 'https://facebook.com', icon: Facebook },
  { label: 'Twitter / X', href: 'https://twitter.com', icon: Twitter },
  { label: 'LinkedIn', href: 'https://linkedin.com', icon: Linkedin },
  { label: 'YouTube', href: 'https://youtube.com', icon: Youtube },
];

const VirtualLabsFooter = () => (
  <footer id="contact" className="scroll-mt-24 bg-slate-950 text-slate-300">
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="grid gap-10 md:grid-cols-2 lg:grid-cols-4"
      >
        <div>
          <p className="text-lg font-bold text-white">Virtual Labs</p>
          <p className="mt-2 text-sm text-slate-400">
            An initiative of the Ministry of Education under NMEICT—remote access to quality lab learning.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {social.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-slate-700 p-2 text-slate-400 transition hover:border-emerald-500/50 hover:bg-slate-900 hover:text-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                aria-label={label}
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Quick links</h3>
          <ul className="mt-4 space-y-2">
            {quickLinks.map((l) => (
              <li key={l.label}>
                <a href={l.href} className="text-sm transition hover:text-white">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">About Virtual Labs</h3>
          <ul className="mt-4 space-y-2">
            {aboutLinks.map((l) => (
              <li key={l.label}>
                {l.router ? (
                  <Link to={l.href} className="text-sm transition hover:text-white">
                    {l.label}
                  </Link>
                ) : (
                  <a href={l.href} className="text-sm transition hover:text-white">
                    {l.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Get in touch</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
              <a href="mailto:support@vlab.example" className="hover:text-white">
                support@vlab.example
              </a>
            </li>
            <li className="flex gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
              <span>+91-11-0000-0000</span>
            </li>
            <li className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
              <span>
                Wireless Research Lab, IIT Delhi, Hauz Khas, New Delhi — 110016
              </span>
            </li>
          </ul>
        </div>
      </motion.div>

      <div className="mt-12 border-t border-slate-800 pt-8 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Virtual Labs (demo UI). Replace contact details and links with production values.
      </div>
    </div>
  </footer>
);

export default VirtualLabsFooter;
