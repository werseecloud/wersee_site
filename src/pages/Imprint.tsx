import React from 'react';
import { motion } from 'motion/react';
import { Building2, Mail, Phone, MapPin, Globe, FileText } from 'lucide-react';
import { PageWrapper } from '../components/PageWrapper';
import { SEO } from '../components/SEO';

export const Imprint = () => {
  return (
    <>
      <SEO
        title="Imprint"
        description="Legal imprint and company information for Wersee. Contact details, registration, and responsible persons."
        url="/imprint"
        keywords="wersee imprint, company information, legal notice, contact, impressum"
      />
      <PageWrapper>
      <div className="min-h-screen bg-[#F5F5F7] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-900 text-white mb-6 shadow-xl shadow-gray-900/20"
            >
              <Building2 className="w-8 h-8" />
            </motion.div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Imprint</h1>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Legal information about the company.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-12">
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <Building2 className="w-6 h-6 text-gray-900" />
                  <h2 className="text-2xl font-bold text-gray-900">Company Details</h2>
                </div>
                <div className="space-y-4 text-gray-600">
                  <p><strong>Company Name:</strong> Wersee B.V.</p>
                  <p><strong>Legal Form:</strong> Besloten Vennootschap (B.V.)</p>
                  <p><strong>Registered Office:</strong> Amsterdam, The Netherlands</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="w-6 h-6 text-gray-900" />
                  <h2 className="text-2xl font-bold text-gray-900">Address</h2>
                </div>
                <div className="space-y-4 text-gray-600">
                  <p>Wersee B.V.</p>
                  <p>Strawinskylaan 3051</p>
                  <p>1077 ZX Amsterdam</p>
                  <p>The Netherlands</p>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t border-gray-100">
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <Mail className="w-6 h-6 text-gray-900" />
                  <h2 className="text-2xl font-bold text-gray-900">Contact</h2>
                </div>
                <div className="space-y-4 text-gray-600">
                  <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> support@wersee.com</p>
                  <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> +31 (0) 20 123 4567</p>
                  <p className="flex items-center gap-2"><Globe className="w-4 h-4" /> www.wersee.com</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-6 h-6 text-gray-900" />
                  <h2 className="text-2xl font-bold text-gray-900">Registration</h2>
                </div>
                <div className="space-y-4 text-gray-600">
                  <p><strong>Chamber of Commerce (KvK):</strong> 12345678</p>
                  <p><strong>VAT Identification Number:</strong> NL123456789B01</p>
                  <p><strong>Managing Director:</strong> [Director Name]</p>
                </div>
              </div>
            </section>

            <div className="pt-8 border-t border-gray-100 text-sm text-gray-500">
              <p>Last updated: March 2026</p>
              <p className="mt-2">© 2026 Wersee B.V. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
    </>
  );
};
