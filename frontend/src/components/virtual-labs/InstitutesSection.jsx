import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const institutes = [
  { short: 'IIT KGP', name: 'IIT Kharagpur' },
  { short: 'IIT R', name: 'IIT Roorkee' },
  { short: 'IIT G', name: 'IIT Guwahati' },
  { short: 'IIT D', name: 'IIT Delhi' },
  { short: 'IIT B', name: 'IIT Bombay' },
  { short: 'IIT K', name: 'IIT Kanpur' },
  { short: 'IIIT H', name: 'IIIT Hyderabad' },
  { short: 'NITK', name: 'NITK Surathkal' },
  { short: 'Amrita', name: 'Amrita Vishwa Vidyapeetham' },
  { short: 'COEP', name: 'COEP Technological University' },
];

const InstitutesSection = () => {
  const scrollerRef = useRef(null);

  const scrollBy = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.min(el.clientWidth * 0.85, 400) * dir;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <section id="institutes" className="scroll-mt-24 border-y border-slate-200 bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-800">Participating institutes</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              National partners
            </h2>
            <p className="mt-2 max-w-xl text-slate-600">
              Leading institutions contributing experiments, content, and outreach across the network.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              aria-label="Scroll institutes left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              aria-label="Scroll institutes right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </motion.div>

        <div className="relative mt-10">
          <div
            ref={scrollerRef}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="list"
            aria-label="Institute logos carousel"
          >
            {institutes.map((inst) => (
              <motion.div
                key={inst.name}
                role="listitem"
                whileHover={{ scale: 1.04 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                className="snap-start shrink-0"
              >
                <div className="flex h-28 w-40 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 shadow-card transition hover:border-blue-200 hover:shadow-cardHover">
                  <span className="text-lg font-bold text-blue-900">{inst.short}</span>
                  <span className="mt-1 text-center text-xs text-slate-500">{inst.name}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Placeholder tiles—replace with official institute logos when assets are available.
        </p>
      </div>
    </section>
  );
};

export default InstitutesSection;
