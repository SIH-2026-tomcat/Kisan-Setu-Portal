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
      <div className="text-center space-y-2 border-b border-line pb-6">
        <div className="inline-flex p-3 rounded bg-green-50 text-india-green border border-green-100">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-ink">Help & Support Centre</h1>
        <p className="text-sm text-muted max-w-lg mx-auto">
          Answers to common questions regarding slot booking, queue tracking, and payments.
        </p>
      </div>

      {/* Helpline Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded border border-line shadow-sm space-y-2">
          <Phone className="w-5 h-5 text-india-green" />
          <h3 className="font-bold text-sm text-ink">Toll-Free Helpline</h3>
          <p className="text-xs text-muted">1800-425-26032 (Mon–Sat, 8 AM–8 PM)</p>
        </div>

        <div className="bg-white p-5 rounded border border-line shadow-sm space-y-2">
          <Mail className="w-5 h-5 text-india-green" />
          <h3 className="font-bold text-sm text-ink">Email Support</h3>
          <p className="text-xs text-muted">support@kisansetu.in</p>
        </div>

        <div className="bg-white p-5 rounded border border-line shadow-sm space-y-2">
          <MapPin className="w-5 h-5 text-india-saffron" />
          <h3 className="font-bold text-sm text-ink">Guntur Control Desk</h3>
          <p className="text-xs text-muted">Market Yard Road, Guntur APMC</p>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="bg-white rounded p-6 border border-line shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-ink border-b border-line pb-3">
          Frequently Asked Questions
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border border-line rounded overflow-hidden transition"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 text-left font-bold text-sm text-ink bg-paper hover:bg-gray-50 flex items-center justify-between gap-3"
              >
                <span>{faq.q}</span>
                {openIndex === idx ? (
                  <ChevronUp className="w-4 h-4 text-india-green shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted shrink-0" />
                )}
              </button>

              {openIndex === idx && (
                <div className="p-4 text-xs text-muted bg-white border-t border-line leading-relaxed">
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
