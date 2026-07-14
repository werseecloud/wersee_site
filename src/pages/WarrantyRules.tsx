import React from 'react';
import { ShieldCheck, Scale, Clock, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { PageWrapper } from '../components/PageWrapper';
import { SEO } from '../components/SEO';

export const WarrantyRules = () => {
  const navigate = useNavigate();

  return (
    <PageWrapper>
      <SEO 
        title="Warranty Rules for Used Goods - Know Your Rights"
        description="Understand your rights and obligations regarding warranties for used goods. Learn about legal guarantees, condition disclosure, and return policies."
        url="/warranty-rules"
      />
      <div className="min-h-screen bg-[#FBFBFD] pb-24 pt-[calc(4rem+max(env(safe-area-inset-top),0px))]">
        <div className="max-w-4xl mx-auto px-6">
          <button 
            onClick={() => navigate(-1)} 
            className="mb-8 flex items-center text-sm font-medium text-gray-500 hover:text-[#1D1D1F] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl font-bold text-[#1D1D1F] tracking-tight">
                Warranty Rules for Used Goods
              </h1>
              <p className="text-xl text-gray-500 leading-relaxed">
                Understanding your rights and obligations when buying or selling pre-owned items on our platform.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 bg-white rounded-[2.5rem] border border-black/5 shadow-sm space-y-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold">Legal Guarantee</h3>
                <p className="text-gray-600 leading-relaxed">
                  In the European Union, even for used goods, a minimum 1-year legal guarantee applies when buying from a professional seller. Private sellers may have different rules depending on local laws.
                </p>
              </div>

              <div className="p-8 bg-white rounded-[2.5rem] border border-black/5 shadow-sm space-y-4">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold">Condition Disclosure</h3>
                <p className="text-gray-600 leading-relaxed">
                  Sellers are required to accurately describe the condition of used items. Any defects or signs of wear must be clearly stated in the product description and shown in photos.
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <h2 className="text-3xl font-bold text-[#1D1D1F]">Key Policies</h2>
              
              <div className="space-y-6">
                <div className="flex gap-6">
                  <div className="shrink-0 w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-lg">Right of Withdrawal</h4>
                    <p className="text-gray-600 leading-relaxed">
                      For online purchases from professional sellers, you generally have a 14-day right to cancel and return the item for any reason. This does not always apply to private sales.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="shrink-0 w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                    <Scale className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-lg">Dispute Resolution</h4>
                    <p className="text-gray-600 leading-relaxed">
                      If an item arrives significantly not as described, our platform provides a dispute resolution process to protect both buyers and sellers.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="shrink-0 w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-lg">Warranty Period</h4>
                    <p className="text-gray-600 leading-relaxed">
                      Professional sellers can reduce the warranty period for used goods to 1 year, provided they inform the buyer at the time of purchase.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-10 bg-black text-white rounded-[3rem] space-y-6">
              <h3 className="text-2xl font-bold">Need more help?</h3>
              <p className="text-gray-400 leading-relaxed">
                If you have specific questions about a used item or a warranty claim, please contact our support team or consult with a legal expert in your jurisdiction.
              </p>
              <button className="px-8 py-4 bg-white text-black rounded-2xl font-bold hover:bg-gray-100 transition-all">
                Contact Support
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </PageWrapper>
  );
};
