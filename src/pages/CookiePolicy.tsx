import React from 'react';
import { motion } from 'motion/react';
import { Cookie, Shield, Info, Settings } from 'lucide-react';
import { PageWrapper } from '../components/PageWrapper';
import { SEO } from '../components/SEO';

export const CookiePolicy = () => {
  return (
    <>
      <SEO
        title="Cookie Policy"
        description="Wersee Cookie Policy. Learn how we use cookies and similar technologies to improve your experience on our platform."
        url="/cookies"
        keywords="wersee cookies, cookie policy, tracking, privacy, browser cookies"
      />
      <PageWrapper>
      <div className="min-h-screen bg-[#F5F5F7] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-600 text-white mb-6 shadow-xl shadow-amber-600/20"
            >
              <Cookie className="w-8 h-8" />
            </motion.div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Cookie Policy</h1>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              How we use cookies to improve your experience.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-8">
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Info className="w-6 h-6 text-amber-600" />
                <h2 className="text-2xl font-bold text-gray-900">What are cookies?</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-amber-600" />
                <h2 className="text-2xl font-bold text-gray-900">How we use cookies</h2>
              </div>
              <p className="text-gray-600 leading-relaxed mb-4">
                We use cookies for several reasons:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li><strong>Essential Cookies:</strong> These are necessary for the website to function and cannot be switched off. They are usually only set in response to actions made by you, such as logging in or filling in forms.</li>
                <li><strong>Performance Cookies:</strong> These allow us to count visits and traffic sources so we can measure and improve the performance of our site.</li>
                <li><strong>Functional Cookies:</strong> These enable the website to provide enhanced functionality and personalization.</li>
                <li><strong>Targeting Cookies:</strong> These may be set through our site by our advertising partners to build a profile of your interests and show you relevant adverts on other sites.</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Settings className="w-6 h-6 text-amber-600" />
                <h2 className="text-2xl font-bold text-gray-900">Managing your cookies</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                You can manage your cookie preferences at any time through our cookie banner or by adjusting your browser settings. Please note that blocking some types of cookies may impact your experience of the site and the services we are able to offer.
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
