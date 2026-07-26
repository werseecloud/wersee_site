import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Briefcase, MapPin, Euro, Tag, FileText, Image as ImageIcon } from 'lucide-react';
import { DatabaseService } from '../../services/databaseService';

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

export const CreateJobModal: React.FC<CreateJobModalProps> = ({ isOpen, onClose, onSuccess, userId }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Full-time',
    location: 'Remote',
    company_name: '',
    image_url: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await DatabaseService.insert('listings', {
        user_id: userId,
        type: 'job',
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        image_url: formData.image_url || `https://picsum.photos/seed/${formData.title}/400/300`,
        metadata: {
          location: formData.location,
          company_name: formData.company_name,
          posted_at: new Date().toISOString()
        },
        status: 'active'
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating job:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Post a Job</h2>
                  <p className="text-sm text-gray-500 font-medium">Reach thousands of talented professionals.</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-white rounded-2xl transition-colors text-gray-400 hover:text-gray-600 shadow-sm"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 uppercase tracking-widest flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500" /> Job Title
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Senior Product Designer"
                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 uppercase tracking-widest flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-indigo-500" /> Company Name
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.company_name}
                    onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Your Business Name"
                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 uppercase tracking-widest flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-500" /> Location
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Remote or Amsterdam, NL"
                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 uppercase tracking-widest flex items-center gap-2">
                    <Euro className="w-4 h-4 text-indigo-500" /> Salary / Budget
                  </label>
                  <input
                    required
                    type="number"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    placeholder="e.g. 5000"
                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 uppercase tracking-widest flex items-center gap-2">
                    <Tag className="w-4 h-4 text-indigo-500" /> Job Type
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none font-medium appearance-none"
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Freelance</option>
                    <option>Contract</option>
                    <option>Internship</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-indigo-500" /> Logo URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500" /> Job Description
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the role, responsibilities, and requirements..."
                  className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none font-medium resize-none"
                />
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Post Job Listing</>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
