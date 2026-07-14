import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, CheckCircle2, Circle, Clock, Rocket, Star, Zap, ChevronRight, X } from 'lucide-react';
import { SEO } from '../components/SEO';

interface Milestone {
  id: string;
  date: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming';
  details: string[];
}

const milestones: Milestone[] = [
  {
    id: '1',
    date: 'Q1 2024',
    title: 'The Genesis',
    description: 'The birth of the Wersee Business OS concept.',
    status: 'completed',
    details: [
      'Initial architecture design by Raeven Voge.',
      'Core payment infrastructure development.',
      'Formation of the founding vision.'
    ]
  },
  {
    id: '2',
    date: 'Q3 2024',
    title: 'Wersee Alpha',
    description: 'First closed-beta launch for selected creators.',
    status: 'completed',
    details: [
      'Launch of the digital marketplace.',
      'Introduction of real-time chat features.',
      'First 100 successful transactions.'
    ]
  },
  {
    id: '3',
    date: 'Q1 2025',
    title: 'The Sovereign Expansion',
    description: 'Launch of Wersee Sovereign for enterprise clients.',
    status: 'completed',
    details: [
      'Jelte joins as Co-Owner and Marketing Specialist.',
      'Launch of custom app building services.',
      'Global outreach program initiated.'
    ]
  },
  {
    id: '4',
    date: 'Q2 2025',
    title: 'Wersee Shield & Security',
    description: 'Advanced identity verification and security protocols.',
    status: 'current',
    details: [
      'Implementation of Wersee Shield (Slide-to-Verify).',
      'Advanced encryption for all business data.',
      'Enhanced privacy controls for users.'
    ]
  },
  {
    id: '5',
    date: 'Q4 2025',
    title: 'AI-Driven Localization',
    description: 'Global expansion with intelligent language adaptation.',
    status: 'upcoming',
    details: [
      'Integration of Gemini-powered localization service.',
      'Support for 50+ languages and regional tones.',
      'Global payment gateway expansion.'
    ]
  },
  {
    id: '6',
    date: '2026',
    title: 'The Global Marketplace',
    description: 'Becoming the world’s largest digital ecosystem.',
    status: 'upcoming',
    details: [
      'Launch of the Wersee Mobile OS.',
      'Decentralized marketplace protocols.',
      'Wersee World Conference.'
    ]
  }
];

export const Roadmap = () => {
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-indigo-500/30">
      <SEO 
        title="Roadmap | Wersee" 
        description="Explore the past, present, and future of Wersee. Our interactive timeline of innovation."
      />

      {/* Hero */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full animate-pulse" />
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-[0.9]">
              The Path to <br />
              <span className="text-indigo-400">
                Sovereignty.
              </span>
            </h1>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Innovation isn't a destination; it's a journey. Follow our interactive roadmap to see where we've been and where we're going.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Interactive Timeline */}
      <section className="py-24 relative">
        <div className="max-w-5xl mx-auto px-6 relative">
          {/* Vertical Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500/0 via-indigo-500/50 to-indigo-500/0 hidden md:block" />

          <div className="space-y-24">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`relative flex flex-col md:flex-row items-center gap-8 ${
                  index % 2 === 0 ? 'md:flex-row-reverse' : ''
                }`}
              >
                {/* Center Point */}
                <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center justify-center z-20">
                  <button
                    onClick={() => setSelectedMilestone(milestone)}
                    className={`w-12 h-12 rounded-full border-4 border-[#0A0A0A] transition-all duration-500 flex items-center justify-center ${
                      milestone.status === 'completed' ? 'bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]' :
                      milestone.status === 'current' ? 'bg-white animate-ping' :
                      'bg-white/10'
                    }`}
                  >
                    {milestone.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-white" />}
                    {milestone.status === 'current' && <Zap className="w-5 h-5 text-black" />}
                    {milestone.status === 'upcoming' && <Circle className="w-5 h-5 text-white/30" />}
                  </button>
                  {milestone.status === 'current' && (
                    <div className="absolute w-12 h-12 rounded-full bg-white flex items-center justify-center">
                      <Zap className="w-5 h-5 text-black" />
                    </div>
                  )}
                </div>

                {/* Content Card */}
                <div className="w-full md:w-[45%]">
                  <button
                    onClick={() => setSelectedMilestone(milestone)}
                    className="w-full text-left p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-indigo-400 font-black tracking-widest text-xs uppercase">{milestone.date}</span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        milestone.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                        milestone.status === 'current' ? 'bg-indigo-500/10 text-indigo-500' :
                        'bg-white/5 text-gray-500'
                      }`}>
                        {milestone.status}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black mb-2 group-hover:text-indigo-400 transition-colors">{milestone.title}</h3>
                    <p className="text-gray-500 leading-relaxed">{milestone.description}</p>
                    <div className="mt-6 flex items-center gap-2 text-xs font-bold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to explore details <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Milestone Modal */}
      <AnimatePresence>
        {selectedMilestone && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMilestone(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-[#111] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <button
                onClick={() => setSelectedMilestone(null)}
                className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-12">
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-indigo-400 font-black tracking-widest text-sm uppercase">{selectedMilestone.date}</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <h2 className="text-4xl font-black mb-4">{selectedMilestone.title}</h2>
                <p className="text-xl text-gray-400 mb-10">{selectedMilestone.description}</p>
                
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-6">Key Achievements & Goals</h4>
                  {selectedMilestone.details.map((detail, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                        <Star className="w-3 h-3 text-indigo-400" />
                      </div>
                      <p className="text-gray-300 font-medium">{detail}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setSelectedMilestone(null)}
                  className="w-full mt-12 py-5 bg-white text-black rounded-2xl font-black text-lg hover:bg-gray-200 transition-all"
                >
                  Close Explorer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer CTA */}
      <section className="py-32 text-center border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl md:text-6xl font-black mb-10 leading-[0.9]">
            Be Part of the <br /> Next Milestone.
          </h2>
          <button className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20">
            Join the Ecosystem
          </button>
        </div>
      </section>
    </div>
  );
};
