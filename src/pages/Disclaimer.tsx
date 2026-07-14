import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Shield, Info, ExternalLink } from 'lucide-react';
import { PageWrapper } from '../components/PageWrapper';
import { SEO } from '../components/SEO';

export const Disclaimer = () => {
  return (
    <>
      <SEO
        title="Disclaimer"
        description="Wersee Disclaimer. Legal limitations, responsibilities, and important notices about using the Wersee platform."
        url="/disclaimer"
        keywords="wersee disclaimer, legal limitations, liability, platform usage, terms"
      />
      <PageWrapper>
      <div className="min-h-screen bg-[#F5F5F7] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-600 text-white mb-6 shadow-xl shadow-red-600/20"
            >
              <AlertTriangle className="w-8 h-8" />
            </motion.div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Disclaimer</h1>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Legal limitations and responsibilities.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-8">
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Info className="w-6 h-6 text-red-600" />
                <h2 className="text-2xl font-bold text-gray-900">General Information</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                The information provided on Wersee is for general informational purposes only. All information on the site is provided in good faith, however we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the site.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <ExternalLink className="w-6 h-6 text-red-600" />
                <h2 className="text-2xl font-bold text-gray-900">External Links</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                The site may contain links to other websites or content belonging to or originating from third parties. Such external links are not investigated, monitored, or checked for accuracy, adequacy, validity, reliability, availability, or completeness by us.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-red-600" />
                <h2 className="text-2xl font-bold text-gray-900">Professional Advice</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                The site cannot and does not contain legal, financial, or tax advice. The legal, financial, or tax information is provided for general informational and educational purposes only and is not a substitute for professional advice.
              </p>
            </section>

            <div className="pt-8 border-t border-gray-100 text-sm text-gray-500">
              <p>Last updated: March 2026</p>
              <p className="mt-2">© 2026 Wersee. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
    </>
  );
};
