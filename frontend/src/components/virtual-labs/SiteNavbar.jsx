import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) navigate(`/experiments?q=${encodeURIComponent(q)}`);
    else navigate('/experiments');
  };

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
      <div className="relative mx-auto w-full max-w-7xl px-4 py-3 sm:min-h-[52px] sm:py-2 sm:px-6 lg:px-8">
        <ul
          className="mb-3 flex flex-wrap items-center justify-center gap-1 sm:mb-0 sm:absolute sm:left-1/2 sm:top-1/2 sm:z-10 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:gap-2"
          role="list"
        >
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
        <form
          onSubmit={handleSearchSubmit}
          className="mx-auto flex w-full max-w-xs justify-center sm:absolute sm:right-4 sm:top-1/2 sm:z-20 sm:mx-0 sm:w-auto sm:-translate-y-1/2 lg:right-8"
          role="search"
          aria-label="Search labs"
        >
          <label htmlFor="vl-nav-search" className="sr-only">
            Search labs
          </label>
          <div className="relative flex w-full max-w-[220px] items-center sm:max-w-[240px]">
            <Search
              className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-blue-300/80"
              aria-hidden
            />
            <input
              id="vl-nav-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search…"
              className="h-9 w-full rounded-lg border border-white/20 bg-white/10 py-1.5 pl-8 pr-2 text-xs text-white placeholder:text-blue-200/60 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 sm:text-sm"
            />
          </div>
        </form>
      </div>
    </nav>
  );
};

export default SiteNavbar;
