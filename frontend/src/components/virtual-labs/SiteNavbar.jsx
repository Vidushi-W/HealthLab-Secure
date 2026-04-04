import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';

const links = [
  { label: 'Home', href: '#top' },
  { label: 'About', href: '#about' },
  { label: 'Labs', href: '/experiments', router: true },
  { label: 'Institutes', href: '#institutes' },
  { label: 'Contact', href: '#contact' },
];

const SiteNavbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={cn(
        'sticky top-0 z-50 border-b border-blue-900/30 bg-gradient-to-r from-blue-950 via-blue-900 to-slate-900 transition-shadow duration-300',
        scrolled && 'shadow-lg shadow-blue-950/25'
      )}
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-1 px-4 py-2 sm:justify-between sm:gap-2 sm:px-6 lg:px-8">
        <ul className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
          {links.map(({ label, href, router }) => (
            <li key={label}>
              {router ? (
                <Link
                  to={href}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-blue-100/90 transition hover:bg-white/10 hover:text-white"
                >
                  {label}
                </Link>
              ) : (
                <a
                  href={href}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-blue-100/90 transition hover:bg-white/10 hover:text-white"
                >
                  {label}
                </a>
              )}
            </li>
          ))}
        </ul>
        <div className="hidden text-xs text-blue-200/70 sm:block">Remote lab simulations · NMEICT</div>
      </div>
    </nav>
  );
};

export default SiteNavbar;
