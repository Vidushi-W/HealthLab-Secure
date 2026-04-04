import React from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Play } from 'lucide-react';

const announcements = [
  {
    title: 'Outreach & workshops',
    body: 'Explore Ministry of Education ICT initiatives and connected digital learning programmes for institutions.',
  },
  {
    title: 'Legacy lab support',
    body: 'Guidance for running older simulation environments and VirtualBox-based lab setups where applicable.',
  },
  {
    title: 'Nodal centers',
    body: 'Expression of interest for becoming a Virtual Labs nodal center—check announcements for the latest cycle.',
  },
];

/** Replace with your official Virtual Labs or NPTEL embed ID */
const YOUTUBE_EMBED_ID = 'M7lc1UVf-VE';

const AnnouncementsVideo = () => (
  <section className="bg-[#e6f2ff] py-16 sm:py-20">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-stretch">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="flex flex-col rounded-2xl border border-blue-100 bg-white p-6 shadow-card sm:p-8"
        >
          <div className="flex items-center gap-2 text-blue-900">
            <Megaphone className="h-5 w-5" aria-hidden />
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Announcements</h2>
          </div>
          <p className="mt-2 text-sm text-slate-600">Recent updates from the platform and partner network.</p>
          <ul className="mt-6 space-y-4">
            {announcements.map((a) => (
              <li
                key={a.title}
                className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 transition hover:border-blue-200 hover:bg-white"
              >
                <p className="font-semibold text-slate-900">{a.title}</p>
                <p className="mt-1 text-sm text-slate-600">{a.body}</p>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="flex flex-col overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-card"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Platform overview</h2>
            <span className="flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
              <Play className="h-3 w-3 fill-current" aria-hidden />
              Video
            </span>
          </div>
          <div className="relative aspect-video w-full bg-slate-900">
            <iframe
              title="Virtual Labs — introductory video"
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube.com/embed/${YOUTUBE_EMBED_ID}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          <p className="px-6 py-3 text-xs text-slate-500">
            Swap <code className="rounded bg-slate-100 px-1">YOUTUBE_EMBED_ID</code> in{' '}
            <code className="rounded bg-slate-100 px-1">AnnouncementsVideo.jsx</code> for your official clip.
          </p>
        </motion.div>
      </div>
    </div>
  </section>
);

export default AnnouncementsVideo;
