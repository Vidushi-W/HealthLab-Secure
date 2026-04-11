import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Globe2, Layers, Sparkles } from 'lucide-react';

const objectives = [
  {
    title: 'Accessible anywhere',
    description:
      'Provide remote access to quality lab simulations so learners are not limited by location, schedule, or facility constraints.',
    icon: Globe2,
  },
  {
    title: 'Practice & mastery',
    description:
      'Let students rehearse procedures, repeat experiments, and strengthen understanding through self-paced digital practice.',
    icon: BookOpen,
  },
  {
    title: 'Structured learning',
    description:
      'Combine experiments with guidance, assessments, and resources that mirror real lab workflows and learning outcomes.',
    icon: Layers,
  },
  {
    title: 'Innovation in teaching',
    description:
      'Support instructors with scalable tools that complement classroom teaching and outreach programmes nationwide.',
    icon: Sparkles,
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.06 * i, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

const ObjectivesSection = () => (
  <section id="about" className="scroll-mt-24 bg-[#e6f2ff] py-16 sm:py-20">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-2xl text-center"
      >
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-800">Objectives</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Why Virtual Labs matter
        </h2>
        <p className="mt-4 text-slate-600">
          Built for national-scale education: equitable access, rigorous practice, and modern pedagogy.
        </p>
      </motion.div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {objectives.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.article
              key={item.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              variants={cardVariants}
              className="group rounded-2xl border border-blue-100/80 bg-white p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-cardHover"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-emerald-600 text-white shadow-md transition group-hover:scale-105">
                <Icon className="h-6 w-6" aria-hidden />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
            </motion.article>
          );
        })}
      </div>
    </div>
  </section>
);

export default ObjectivesSection;
