import React from 'react';
import { PageWrapper } from '../components/PageWrapper';
import { Calendar, User, ArrowRight, MessageCircle, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';

const BLOG_POSTS = [
  {
    id: 1,
    title: "The Future of Digital Commerce in 2024",
    excerpt: "Discover the trends shaping the way we buy and sell online. From AI-driven personalization to sustainable practices.",
    category: "Trends",
    author: "Sarah Jenkins",
    date: "Oct 12, 2023",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop",
    readTime: "5 min read",
    likes: 124,
    comments: 18
  },
  {
    id: 2,
    title: "How to Build a Loyal Community Around Your Brand",
    excerpt: "Community is the new currency. Learn actionable strategies to turn customers into raving fans.",
    category: "Growth",
    author: "Mike Ross",
    date: "Oct 08, 2023",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2940&auto=format&fit=crop",
    readTime: "8 min read",
    likes: 89,
    comments: 12
  },
  {
    id: 3,
    title: "Mastering Product Photography with Your Smartphone",
    excerpt: "You don't need expensive gear to take stunning photos. Here are 5 tips for professional results.",
    category: "Tips & Tricks",
    author: "Emily Chen",
    date: "Sep 28, 2023",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=2864&auto=format&fit=crop",
    readTime: "4 min read",
    likes: 210,
    comments: 45
  },
  {
    id: 4,
    title: "Understanding SEO for E-commerce",
    excerpt: "Get found on Google. A beginner's guide to optimizing your product listings for search engines.",
    category: "Marketing",
    author: "David Kim",
    date: "Sep 15, 2023",
    image: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?q=80&w=2948&auto=format&fit=crop",
    readTime: "6 min read",
    likes: 156,
    comments: 22
  }
];

export const Blog = () => {
  const featuredPost = BLOG_POSTS[0];
  const otherPosts = BLOG_POSTS.slice(1);

  return (
    <PageWrapper>
      <SEO 
        title="Wersee Journal - Insights for the Modern Creator Economy"
        description="Discover trends, strategies, and tips for digital commerce, community building, and creator growth."
        url="/blog"
      />
      <div className="bg-black text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-6">Wersee Journal</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Insights, stories, and expertise for the modern creator economy.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Featured Post */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-[#1D1D1F] mb-8">Featured Story</h2>
          <div className="group grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="relative aspect-video lg:aspect-[4/3] rounded-3xl overflow-hidden">
              <img 
                src={featuredPost.image} 
                alt={featuredPost.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="lg:pl-8">
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span className="px-3 py-1 bg-black text-white rounded-full font-medium">{featuredPost.category}</span>
                <span>{featuredPost.readTime}</span>
              </div>
              <h3 className="text-3xl lg:text-4xl font-bold text-[#1D1D1F] mb-4 leading-tight group-hover:text-blue-600 transition-colors">
                {featuredPost.title}
              </h3>
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                {featuredPost.excerpt}
              </p>
              <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                    <img src={`https://i.pravatar.cc/150?u=${featuredPost.author}`} alt={featuredPost.author} referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <p className="font-medium text-[#1D1D1F]">{featuredPost.author}</p>
                    <p className="text-sm text-gray-500">{featuredPost.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-gray-400">
                  <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {featuredPost.likes}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> {featuredPost.comments}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Posts Grid */}
        <h2 className="text-2xl font-bold text-[#1D1D1F] mb-8">Recent Stories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {otherPosts.map((post) => (
            <article key={post.id} className="group flex flex-col h-full">
              <div className="relative aspect-[3/2] rounded-2xl overflow-hidden mb-6">
                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-black text-xs font-bold uppercase tracking-wider rounded-full">
                    {post.category}
                  </span>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                  <span>{post.date}</span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </div>
                
                <h3 className="text-xl font-bold text-[#1D1D1F] mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {post.title}
                </h3>
                
                <p className="text-gray-600 mb-6 line-clamp-3 flex-1">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-200 rounded-full overflow-hidden">
                      <img src={`https://i.pravatar.cc/150?u=${post.author}`} alt={post.author} referrerPolicy="no-referrer" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{post.author}</span>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 transition-colors">
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Newsletter */}
        <div className="mt-24 bg-[#F5F5F7] rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-[#1D1D1F] mb-4">Stay in the loop</h2>
            <p className="text-gray-600 mb-8">
              Get the latest insights on creator economy, e-commerce trends, and platform updates delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <input 
                type="email" 
                placeholder="Enter your email address" 
                className="flex-1 px-6 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black/5 focus:border-black outline-none"
              />
              <button className="px-8 py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-x-1/2 translate-y-1/2" />
        </div>
      </div>
    </PageWrapper>
  );
};
