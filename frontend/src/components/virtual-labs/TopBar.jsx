import React, { useState } from 'react';
import { Search } from 'lucide-react';

const TopBar = () => {
  const [query, setQuery] = useState('');

  return (
    <div className="border-b border-slate-200/80 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <p className="text-lg font-bold tracking-tight text-blue-950 sm:text-xl">Virtual Labs</p>
          <p className="text-xs font-medium text-slate-600 sm:text-sm">Ministry of Education Initiative</p>
        </div>
        <label className="relative w-full sm:max-w-xs lg:max-w-md" htmlFor="vl-search">
          <span className="sr-only">Search labs</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            id="vl-search"
            type="search"
            placeholder="Search labs, topics, or disciplines…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
          />
        </label>
      </div>
    </div>
  );
};

export default TopBar;
