import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { getCurrentUser } from '../../api/auth';

const heroContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.06 * i, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  }),
};

const Hero = () => {
  const user = getCurrentUser();

  return (
    <section
      id="top"
      className="relative isolate overflow-hidden bg-slate-950"
      aria-labelledby="vl-hero-heading"
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(115deg, rgba(15,23,42,0.92) 0%, rgba(30,58,138,0.82) 45%, rgba(6,78,59,0.55) 100%), url('https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=2000&q=80')`,
        }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/15 via-transparent to-transparent" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
        <motion.div
          variants={heroContainer}
          initial="hidden"
          animate="visible"
          className="max-w-3xl"
        >
          <motion.div custom={0} variants={fadeUp} className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-200 ring-1 ring-white/20 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Remote experimentation
          </motion.div>
          <motion.h1
            id="vl-hero-heading"
            custom={1}
            variants={fadeUp}
            className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl"
          >
            Learn Anytime, Anywhere with Virtual Labs
          </motion.h1>
          <motion.p
            custom={2}
            variants={fadeUp}
            className="mt-5 max-w-2xl text-base leading-relaxed text-blue-100/90 sm:text-lg"
          >
            Access simulation-based laboratory experiences across engineering and science—practice
            concepts, repeat experiments, and build confidence before you step into a physical lab.
          </motion.p>
          <motion.div custom={3} variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/experiments"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Explore Labs
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              to={user ? '/my-studies' : '/signup'}
              className="inline-flex items-center rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {user ? 'My Studies' : 'Get Started'}
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
