import React from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  Shield, 
  Zap, 
  ArrowLeft, 
  ArrowRight,
  CheckCircle2, 
  Globe, 
  Sparkles, 
  Users, 
  Trophy, 
  Play,
  Star,
  GraduationCap,
  Layout,
  BarChart3,
  MessageSquare
} from 'lucide-react';
import { SEO } from '../../components/SEO';
import { Link } from 'react-router-dom';
import { StarRating } from '../../components/ui/StarRating';
import { cn } from '../../lib/utils';

import { WERSEE_COURSES } from '../../data/wersee-courses';

export const AcademyBuilder = () => {
  return (
    <div className="bg-white text-[#1D1D1F] overflow-hidden">
      <SEO 
        title="Wersee Academy - Master Your Craft" 
        description="The ultimate learning platform for creators, entrepreneurs, and experts. Build your own academy or learn from the best."
      />

      <div className="fixed top-6 left-6 z-[100]">
        <Link to="/" className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-gray-200 rounded-full text-sm font-bold hover:bg-white transition-all shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50/50 to-white -z-10" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-24 w-72 h-72 bg-orange-200/20 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-bold mb-6"
              >
                <Sparkles className="w-4 h-4" />
                <span>The Future of Learning is Here</span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-6xl md:text-8xl font-black tracking-tight mb-8 leading-[0.9] flex flex-col sm:flex-row items-center lg:items-start gap-4"
              >
                <img 
                  src="https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/business_logos/d6c2d486-dde4-4447-8f0b-364a5e8d2f17-0.8917728164945703.png" 
                  alt="Wersee Logo" 
                  className="w-20 h-20 md:w-32 md:h-32 object-contain rounded-3xl shadow-2xl"
                  referrerPolicy="no-referrer"
                />
                <div className="flex flex-col">
                  <span>Wersee</span>
                  <span className="text-amber-600">Academy.</span>
                </div>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-[#86868B] max-w-2xl mx-auto lg:mx-0 mb-12 font-medium leading-relaxed"
              >
                Transform your expertise into a world-class learning experience. Build, market, and scale your own online academy with the most powerful LMS ever built for creators.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4"
              >
                <Link to="/auth" className="px-10 py-5 bg-black text-white rounded-full font-bold text-lg hover:scale-105 transition-all shadow-xl shadow-black/10">
                  Start Your Academy
                </Link>
                <a href="#courses" className="px-10 py-5 bg-white text-black border border-gray-200 rounded-full font-bold text-lg hover:bg-gray-50 transition-colors">
                  Explore Courses
                </a>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-12 flex items-center justify-center lg:justify-start gap-8"
              >
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <img 
                      key={i}
                      src={`https://picsum.photos/seed/user${i}/100/100`}
                      className="w-10 h-10 rounded-full border-2 border-white object-cover"
                      alt="User"
                      referrerPolicy="no-referrer"
                    />
                  ))}
                </div>
                <div className="text-sm">
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                  <p className="text-[#86868B] font-medium">Trusted by 10,000+ educators</p>
                </div>
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="flex-1 relative"
            >
              <div className="relative bg-gradient-to-br from-amber-500 to-orange-600 rounded-[3rem] p-2 shadow-2xl">
                <div className="bg-[#1D1D1F] rounded-[2.8rem] overflow-hidden aspect-[4/3] relative group">
                  <img 
                    src="https://picsum.photos/seed/academy/1200/900" 
                    className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
                    alt="Academy Preview"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <a href="#courses" className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30 hover:scale-110 transition-transform group">
                      <Play className="w-8 h-8 text-white fill-current translate-x-1" />
                    </a>
                  </div>
                  
                  {/* Floating UI Elements */}
                  <div className="absolute top-8 right-8 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-xs text-white/60 font-medium">Active Students</div>
                        <div className="text-lg font-bold text-white">1,284</div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-8 left-8 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-xs text-white/60 font-medium">Completion Rate</div>
                        <div className="text-lg font-bold text-white">94%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Courses Created", value: "50K+" },
              { label: "Active Learners", value: "2M+" },
              { label: "Creator Earnings", value: "$120M" },
              { label: "Countries", value: "150+" }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-black mb-1">{stat.value}</div>
                <div className="text-sm text-[#86868B] font-medium uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6 bg-white scroll-mt-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tight">
              Everything you need <br />
              <span className="text-amber-600">to teach at scale.</span>
            </h2>
            <p className="text-xl text-[#86868B] max-w-3xl mx-auto font-medium">
              We've built the most comprehensive set of tools for online education. Focus on your content, we'll handle the rest.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { 
                title: "Cinematic Player", 
                desc: "A distraction-free learning environment that supports 4K video, interactive transcripts, and auto-resume.", 
                icon: Play,
                color: "bg-blue-500"
              },
              { 
                title: "Smart Curriculum", 
                desc: "Drag and drop lessons, sections, and assignments. Create complex learning paths with ease.", 
                icon: Layout,
                color: "bg-purple-500"
              },
              { 
                title: "AI Course Assistant", 
                desc: "Generate outlines, quizzes, and lesson summaries in seconds with our integrated Intelligence Core.", 
                icon: Sparkles,
                color: "bg-amber-500"
              },
              { 
                title: "Advanced Analytics", 
                desc: "Track student progress, drop-off points, and engagement metrics to improve your content.", 
                icon: BarChart3,
                color: "bg-green-500"
              },
              { 
                title: "Community Hub", 
                desc: "Built-in discussion boards and private groups for every course. Foster peer-to-peer learning.", 
                icon: MessageSquare,
                color: "bg-pink-500"
              },
              { 
                title: "Global Payments", 
                desc: "Accept payments in 135+ currencies with local payment methods, subscriptions, and bundles.", 
                icon: Globe,
                color: "bg-orange-500"
              }
            ].map((f, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="p-10 bg-[#F5F5F7] rounded-[2.5rem] border border-transparent hover:border-amber-200 transition-all group"
              >
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform", f.color)}>
                  <f.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{f.title}</h3>
                <p className="text-[#86868B] font-medium leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Course Preview Section */}
      <section id="courses" className="py-32 px-6 bg-[#1D1D1F] text-white overflow-hidden relative scroll-mt-8">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-amber-600/10 blur-[120px] -z-0" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-black mb-6 leading-[0.9]">
              Master your craft <br />
              <span className="text-amber-500">with our top courses.</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto font-medium">
              Jump straight into our most popular, high-converting courses. Learn exactly what works in business today.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {WERSEE_COURSES.map((course, i) => {
              const Icon = course.icon;
              return (
              <Link 
                key={i}
                to={`/dashboard?view=course-player_${course.id}`}
                className="group bg-white/5 backdrop-blur-xl rounded-[2.5rem] overflow-hidden border border-white/10 hover:border-amber-500/50 transition-all duration-500 flex flex-col"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img src={course.image} alt={course.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                      <Play className="w-6 h-6 text-white fill-current translate-x-0.5" />
                    </div>
                  </div>
                  <div className="absolute top-4 right-4">
                    <div className={`w-10 h-10 rounded-xl ${course.color} flex items-center justify-center text-white shadow-lg`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-amber-400 transition-colors">{course.title}</h3>
                  <p className="text-gray-400 font-medium leading-relaxed mb-6 flex-1">{course.description}</p>
                  <div className="flex items-center justify-between pt-6 border-t border-white/10">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="font-bold">{course.rating}</span>
                      </div>
                      <span>•</span>
                      <span>{course.modules} Modules</span>
                    </div>
                    <span className="text-amber-500 font-bold text-sm uppercase tracking-widest group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Start <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            )})}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Loved by educators.</h2>
            <div className="flex justify-center mb-4">
              <StarRating rating={5} size={24} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Jenkins",
                role: "Design Lead at Apple",
                text: "Wersee Academy Builder transformed my side hustle into a $200k/year business. The player is simply unmatched.",
                avatar: "https://picsum.photos/seed/sarah/100/100"
              },
              {
                name: "David Chen",
                role: "Full-stack Developer",
                text: "I've tried every LMS out there. Nothing comes close to the ease of use and professional feel of Wersee.",
                avatar: "https://picsum.photos/seed/david/100/100"
              },
              {
                name: "Elena Rodriguez",
                role: "Marketing Consultant",
                text: "The community features alone are worth the price. My students are more engaged than ever before.",
                avatar: "https://picsum.photos/seed/elena/100/100"
              }
            ].map((t, i) => (
              <div key={i} className="p-10 bg-[#F5F5F7] rounded-[2.5rem]">
                <div className="flex items-center gap-4 mb-6">
                  <img src={t.avatar} className="w-14 h-14 rounded-full object-cover" alt={t.name} referrerPolicy="no-referrer" />
                  <div>
                    <div className="font-bold text-lg">{t.name}</div>
                    <div className="text-sm text-[#86868B] font-medium">{t.role}</div>
                  </div>
                </div>
                <p className="text-lg text-[#1D1D1F] font-medium leading-relaxed italic">"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing / CTA */}
      <section className="py-32 px-6 bg-amber-50">
        <div className="max-w-4xl mx-auto text-center">
          <GraduationCap className="w-20 h-20 text-amber-600 mx-auto mb-8" />
          <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tight">
            Ready to teach <br />
            <span className="text-amber-600">the world?</span>
          </h2>
          <p className="text-xl text-[#86868B] mb-12 font-medium max-w-2xl mx-auto">
            Join thousands of experts who are building their legacy on Wersee Academy. Start for free, scale as you grow.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link to="/auth" className="px-12 py-6 bg-amber-600 text-white rounded-full font-bold text-xl hover:bg-amber-700 transition-all shadow-xl shadow-amber-600/20 transform hover:-translate-y-1">
              Create Your Academy
            </Link>
            <a href="mailto:support@wersee.com?subject=Wersee%20Academy%20sales" className="px-12 py-6 bg-white text-black border border-gray-200 rounded-full font-bold text-xl hover:bg-gray-50 transition-all">
              Talk to Sales
            </a>
          </div>
          
          <p className="mt-8 text-sm text-[#86868B] font-medium">
            No credit card required. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Footer-ish bottom section */}
      <section className="py-24 px-6 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12">
          <div>
            <h4 className="font-bold mb-6">Product</h4>
            <ul className="space-y-4 text-[#86868B] font-medium">
              <li><a href="#features" className="hover:text-black transition-colors">Course Builder</a></li>
              <li><a href="#features" className="hover:text-black transition-colors">Video Hosting</a></li>
              <li><a href="#features" className="hover:text-black transition-colors">Analytics</a></li>
              <li><Link to="/features/wersee-pay" className="hover:text-black transition-colors">Payments</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Resources</h4>
            <ul className="space-y-4 text-[#86868B] font-medium">
              <li><Link to="/community/docs" className="hover:text-black transition-colors">Documentation</Link></li>
              <li><Link to="/learn" className="hover:text-black transition-colors">Creator Guide</Link></li>
              <li><Link to="/community" className="hover:text-black transition-colors">Community</Link></li>
              <li><Link to="/blog" className="hover:text-black transition-colors">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Company</h4>
            <ul className="space-y-4 text-[#86868B] font-medium">
              <li><Link to="/about" className="hover:text-black transition-colors">About Us</Link></li>
              <li><Link to="/jobs" className="hover:text-black transition-colors">Careers</Link></li>
              <li><Link to="/privacy" className="hover:text-black transition-colors">Privacy</Link></li>
              <li><Link to="/terms" className="hover:text-black transition-colors">Terms</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Support</h4>
            <ul className="space-y-4 text-[#86868B] font-medium">
              <li><Link to="/support" className="hover:text-black transition-colors">Help Center</Link></li>
              <li><a href="mailto:support@wersee.com" className="hover:text-black transition-colors">Contact Us</a></li>
              <li><Link to="/status" className="hover:text-black transition-colors">Status</Link></li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};
