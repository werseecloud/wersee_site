import React from 'react';
import { motion } from 'motion/react';
import { QrCode, Shield, Zap, ArrowLeft, CheckCircle2, Globe, Sparkles, ChevronRight } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { Link } from 'react-router-dom';

export const FlashCheckout = () => {
  return (
    <div className="bg-white text-[#1D1D1F] overflow-hidden">
      <SEO 
        title="Flash Checkout - QR Pay" 
        description="The fastest way to pay. Scan, pay, and go with Flash Checkout."
      />

      <div className="fixed top-6 left-6 z-[100]">
        <Link to="/" className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-gray-200 rounded-full text-sm font-bold hover:bg-white transition-all shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      <section className="relative pt-32 pb-20 px-6 bg-gradient-to-b from-rose-50 to-white">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black tracking-tight mb-8"
          >
            Flash <span className="text-rose-600">Checkout.</span>
          </motion.h1>
          <p className="text-xl text-[#86868B] max-w-2xl mx-auto mb-12 font-medium">
            The fastest way to pay. Scan, pay, and go with Flash Checkout. No apps required, just use your camera.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/demo/flash-checkout" className="px-10 py-5 bg-black text-white rounded-full font-bold text-lg hover:scale-105 transition-transform">Try Demo</Link>
            <Link to="/auth" className="px-10 py-5 bg-white text-black border border-gray-200 rounded-full font-bold text-lg hover:bg-gray-50 transition-colors">Get QR Codes</Link>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Scan. Pay. Done.</h2>
            <p className="text-xl text-[#86868B] max-w-3xl mx-auto">
              Friction kills sales. Flash Checkout eliminates it. Allow customers to buy directly from a QR code, social link, or NFC tag without filling out endless forms or creating an account.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Scan & Pay", desc: "No hardware required. Just scan the QR code and pay with Apple Pay or Google Pay instantly.", icon: QrCode },
              { title: "Instant Verification", desc: "Real-time payment confirmation for both parties. You get a notification, they get a receipt.", icon: Zap },
              { title: "Secure Checkout", desc: "Fully encrypted and PCI compliant transactions. We use tokenization to keep card data safe.", icon: Shield },
              { title: "Social Selling", desc: "Create checkout links for Instagram, TikTok, and WhatsApp. Turn followers into buyers in one click.", icon: Globe },
              { title: "Guest Checkout", desc: "No account required. We remember customers by their device so they don't have to type details twice.", icon: CheckCircle2 },
              { title: "Abandoned Cart Recovery", desc: "If they scan but don't pay, we can retarget them automatically to complete the purchase.", icon: Sparkles }
            ].map((f, i) => (
              <div key={i} className="p-8 bg-[#F5F5F7] rounded-[2rem] hover:bg-rose-50 transition-colors duration-300 group">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  <f.icon className="w-7 h-7 text-rose-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{f.title}</h3>
                <p className="text-[#86868B] font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-[#1D1D1F] text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">
            <h2 className="text-4xl md:text-6xl font-black mb-8">Anywhere Commerce.</h2>
            <p className="text-xl text-gray-400 mb-8 leading-relaxed">
              Turn any surface into a point of sale. Print QR codes on stickers, flyers, tables, or product packaging.
            </p>
            <div className="grid grid-cols-2 gap-4">
               {['Restaurants', 'Pop-up Stores', 'Events', 'Charities'].map((item, i) => (
                  <div key={i} className="bg-white/10 rounded-xl p-4 text-center font-bold">
                     {item}
                  </div>
               ))}
            </div>
          </div>
          <div className="flex-1 flex justify-center">
             <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="aspect-square bg-black rounded-xl mb-6 flex items-center justify-center relative overflow-hidden group cursor-pointer" onClick={() => window.open('/demo/flash-checkout', '_blank')}>
                   <div className="absolute inset-0 bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://wersee.com/demo/flash-checkout')] bg-cover opacity-90 group-hover:opacity-100 transition-opacity"></div>
                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 backdrop-blur-sm">
                      <div className="bg-white px-4 py-2 rounded-full font-bold text-black flex items-center gap-2">
                         Try Demo <ChevronRight className="w-4 h-4" />
                      </div>
                   </div>
                   <div className="absolute inset-0 flex items-center justify-center group-hover:opacity-0 transition-opacity pointer-events-none">
                      <div className="bg-white p-2 rounded-full shadow-lg">
                         <Zap className="w-6 h-6 text-rose-600 fill-current" />
                      </div>
                   </div>
                </div>
                <div className="text-center">
                   <div className="text-gray-500 text-sm mb-1">Scan to try demo</div>
                   <div className="text-2xl font-black text-black">$149.00</div>
                </div>
             </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-rose-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-8">Speed up your sales.</h2>
          <p className="text-xl text-[#86868B] mb-12">
            Get started with Flash Checkout today. No hardware needed.
          </p>
          <Link to="/auth" className="inline-flex items-center justify-center px-12 py-6 bg-rose-600 text-white rounded-full font-bold text-xl hover:bg-rose-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            Generate QR Code
          </Link>
        </div>
      </section>
    </div>
  );
};
