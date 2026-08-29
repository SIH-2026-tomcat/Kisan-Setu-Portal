import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle, ChevronDown, ChevronUp, Phone, Mail, MapPin, Shield } from 'lucide-react';

export const HelpCenter: React.FC = () => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How do I book a procurement slot on Kisan Setu?',
      a: 'Navigate to "Book Slot", choose your nearest procurement centre, select your desired date, choose a time window (look for the "RECOMMENDED" badge for lowest wait times), specify your crop and quantity in quintals, and confirm to instantly receive your Digital Token with QR code.',
    },
    {
      q: 'How do I check my position in the live queue?',
      a: 'Click on "Live Queue" in the header or dashboard. Enter or view your active token number. The page displays the token currently being served, how many farmers are ahead of you, your estimated waiting time (~4 mins per farmer), and dynamic arrival advisories telling you when to start travelling.',
    },
    {
      q: 'What should I bring with me to the procurement centre?',
      a: 'Bring: 1) Your produce loaded safely for transport, 2) Your Kisan Setu Digital Token (either printed or displayed on your mobile screen), 3) Identity proof (Aadhaar or Voter ID), and 4) Your bank passbook copy for payment confirmation.',
    },
    {
      q: 'What happens if I arrive late or miss my slot?',
      a: 'If you arrive late for your booked time window, your token remains in the system but you will be assigned to the next available buffer slot for that day. We recommend reporting 15 minutes before your scheduled window.',
    },
    {
      q: 'How do I track quality inspection and weighing of my produce?',
      a: 'Under "Track Procurement", you can view the 7-stage visual tracker. Once the inspector verifies moisture and purity, your assigned quality grade (Grade A, B, or C), net accepted weight, and total calculated amount appear in real time.',
    },
    {
      q: 'How does payment processing work and when will I receive funds?',
      a: 'Once procurement is approved by the centre officer, payment moves to "Processing" and is credited directly to your Aadhaar-linked bank account via PFMS (Public Financial Management System). You can monitor payment status and transaction references under "Payment Status".',
    },
    {
      q: 'How do I change my preferred language?',
      a: 'You can change the language anytime by clicking the language selector (Globe icon) in the top-right header, or choose from English, हिन्दी, and తెలుగు from your profile settings.',
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="text-center space-y-2 border-b border-slate-200 pb-6">
        <div className="inline-flex p-3 rounded-full bg-navy-50 text-navy-800 border border-navy-100">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-navy-900">Help & Support Centre</h1>
        <p className="text-sm text-slate-600 max-w-lg mx-auto">
          Answers to common questions regarding slot booking, queue tracking, and payments.
        </p>
      </div>

      {/* Helpline Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <Phone className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-sm text-slate-800">Toll-Free Helpline</h3>
          <p className="text-xs text-slate-600">1800-425-26032 (Mon–Sat, 8 AM–8 PM)</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <Mail className="w-5 h-5 text-navy-800" />
          <h3 className="font-bold text-sm text-slate-800">Email Support</h3>
          <p className="text-xs text-slate-600">support@kisansetu.in</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <MapPin className="w-5 h-5 text-amber-600" />
          <h3 className="font-bold text-sm text-slate-800">Guntur Control Desk</h3>
          <p className="text-xs text-slate-600">Market Yard Road, Guntur APMC</p>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-navy-900 border-b border-slate-100 pb-3">
          Frequently Asked Questions
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border border-slate-200 rounded-xl overflow-hidden transition"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 text-left font-bold text-sm text-slate-800 bg-slate-50/50 hover:bg-slate-100 flex items-center justify-between gap-3"
              >
                <span>{faq.q}</span>
                {openIndex === idx ? (
                  <ChevronUp className="w-4 h-4 text-navy-800 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>

              {openIndex === idx && (
                <div className="p-4 text-xs text-slate-600 bg-white border-t border-slate-200 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
