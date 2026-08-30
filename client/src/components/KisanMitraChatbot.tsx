import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  MessageSquare,
  X,
  Mic,
  MicOff,
  Send,
  Volume2,
  Calendar,
  Ticket,
  Clock,
  Navigation,
  Wheat,
  IndianRupee,
  Bell,
  HelpCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  data?: any;
  actions?: string[];
  timestamp: string;
}

export const KisanMitraChatbot: React.FC = () => {
  const { t } = useTranslation();
  const { farmer, role } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<'en' | 'hi' | 'te'>(() => {
    // Use chatbot-specific language preference, independent from website language
    const saved = localStorage.getItem('kisan_setu_chatbot_language');
    if (saved === 'hi' || saved === 'te' || saved === 'en') return saved;
    return 'en';
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [ttsSupported, setTtsSupported] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Chatbot language is intentionally independent from the global website language.
  // Do NOT sync with i18n.language here.

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) setSpeechSupported(false);
    if (!('speechSynthesis' in window)) setTtsSupported(false);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen && messages.length === 0) sendInitialGreeting(language);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && messages.length <= 1) sendInitialGreeting(language);
  }, [language]);

  const getGreetingText = (lang: string, name: string) => {
    if (lang === 'hi') return `Namaste${name}! Kisan Mitra aapka sahayak hai.\n\nMain in vishyon mein madad kar sakta hoon:\n- Booking sthiti\n- Live queue\n- Fasal kharid\n- Bhugtan\n- Kendra ka pata`;
    if (lang === 'te') return `Namaskaram${name}! Kisan Mitra mee sahayakudu.\n\nNenu ee vishayalalo sahayam cheyagalanu:\n- Booking sthiti\n- Live queue\n- Panta sekarana\n- Chellimpu\n- Kendra sthanam`;
    return `Namaste${name}! I am Kisan Mitra, your Kisan Setu Assistant.\n\nI can help you with:\n- Booking status and token\n- Live queue position\n- Crop procurement status\n- Payment tracking\n- Centre location`;
  };

  const sendInitialGreeting = (lang: 'en' | 'hi' | 'te') => {
    const name = farmer?.fullName ? ` ${farmer.fullName}` : '';
    setMessages([{
      id: '1',
      sender: 'assistant',
      text: getGreetingText(lang, name),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
  };

  const handleLanguageSelect = (newLang: 'en' | 'hi' | 'te') => {
    setLanguage(newLang);
    // Note: i18n.changeLanguage is intentionally NOT called here.
    // The chatbot language is independent from the website's global language.
    localStorage.setItem('kisan_setu_chatbot_language', newLang);
    stopSpeech();
    sendInitialGreeting(newLang);
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[^\x00-\x7F]/g, '').replace(/[*_#]/g, ' ').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-IN';
    utterance.rate = 0.95;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); setIsSpeaking(false); }
  };

  const toggleListening = () => {
    stopSpeech();
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('Speech recognition not supported. Please type.'); return; }
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-IN';
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) { setInputMessage(transcript); handleSendMessage(transcript); }
      };
      recognition.start();
    } catch (err) { console.error('Mic error:', err); setIsListening(false); }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;
    stopSpeech();
    setInputMessage('');
    setErrorState(false);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await api.sendAssistantMessage(text, language);
      setLoading(false);
      if (response.success) {
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: response.message || 'I have fetched your details.',
          data: response.data,
          actions: response.actions,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        speakText(assistantMsg.text);
      } else {
        const isAuthError = response.status === 401 ||
          response.message?.toLowerCase().includes('log in') ||
          response.message?.toLowerCase().includes('unauthorized');
        let errorText = response.message;
        if (!errorText || errorText.includes('failed with status')) {
          errorText = isAuthError
            ? 'Please log in first to access your Kisan Setu details.'
            : 'Kisan Mitra is temporarily unavailable. Please try again.';
        }
        setErrorState(!isAuthError);
        const errMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: errorText,
          actions: isAuthError ? ['LOGIN'] : [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errMsg]);
      }
    } catch (err) {
      console.error('Assistant error:', err);
      setLoading(false);
      setErrorState(true);
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: 'Kisan Mitra is temporarily unavailable. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const handleActionClick = (action: string, data?: any) => {
    switch (action) {
      case 'BOOK_SLOT': navigate('/book-slot'); setIsOpen(false); break;
      case 'VIEW_BOOKING': navigate('/dashboard'); setIsOpen(false); break;
      case 'VIEW_LIVE_QUEUE': navigate('/live-queue'); setIsOpen(false); break;
      case 'VIEW_PROCUREMENT': navigate('/track-procurement'); setIsOpen(false); break;
      case 'VIEW_PAYMENT_STATUS': navigate('/payment-status'); setIsOpen(false); break;
      case 'VIEW_NOTIFICATIONS': navigate('/dashboard'); setIsOpen(false); break;
      case 'GET_DIRECTIONS':
        if (data?.centreLatitude && data?.centreLongitude) {
          window.open(`https://www.google.com/maps/dir/?api=1&destination=${data.centreLatitude},${data.centreLongitude}`, '_blank', 'noopener,noreferrer');
        }
        break;
      case 'CALL_OFFICER':
        if (data?.officerContactNumber) {
          window.open(`tel:${data.officerContactNumber.replace(/\s/g, '')}`, '_self');
        }
        break;
      case 'LOGIN': navigate('/farmer/login'); setIsOpen(false); break;
      default: break;
    }
  };

  const quickActions = [
    { id: 'BOOKING_STATUS', label: '📅 Show My Booking', intentQuery: 'Show my booking status' },
    { id: 'LIVE_QUEUE', label: '⏱ When is my turn?', intentQuery: 'What is my queue number?' },
    { id: 'PAYMENT_STATUS', label: '💰 Payment Status', intentQuery: 'What is my payment status?' },
    { id: 'PROCUREMENT_STATUS', label: '🌾 Crop Procurement', intentQuery: 'What is my crop procurement status?' },
    { id: 'CENTRE_LOCATION', label: '📍 Centre Location', intentQuery: 'Where is the procurement centre?' },
    { id: 'OFFICER_CONTACT', label: '👨‍💼 Centre Officer', intentQuery: 'Who is my officer?' },
  ];

  if (role && role !== 'FARMER') return null;

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          id="kisan-mitra-open-btn"
          className="fixed bottom-6 right-6 z-50 p-0 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 border-4 border-white overflow-hidden bg-white group"
        >
          <img 
            src="/images/media_1788058025768.png" 
            alt="Kisan Mitra Chatbot" 
            className="w-16 h-16 object-cover object-top group-hover:opacity-90 transition-opacity"
          />
        </button>
      )}

      {isOpen && (
        <div
          id="kisan-mitra-chat-window"
          className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[400px] h-[85vh] sm:h-[600px] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-emerald-700/50"
          style={{ maxHeight: '90vh' }}
        >
          {/* HEADER */}
          <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 px-4 py-3 flex items-center justify-between flex-shrink-0 relative overflow-hidden">
            {/* Spinning Background Wheel Decor */}
            <svg viewBox="0 0 100 100" className="absolute -right-4 -top-8 w-32 h-32 text-emerald-700/20 animate-[spin_20s_linear_infinite]" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="50" cy="50" r="45" />
              <circle cx="50" cy="50" r="8" fill="currentColor" />
              {Array.from({ length: 24 }).map((_, i) => (
                <line key={i} x1="50" y1="50" x2={50 + 45 * Math.cos((i * 15 * Math.PI) / 180)} y2={50 + 45 * Math.sin((i * 15 * Math.PI) / 180)} />
              ))}
            </svg>

            <div className="flex items-center gap-2.5 z-10">
              <div className="w-10 h-10 rounded-full bg-white border-2 border-amber-400 flex items-center justify-center overflow-hidden shadow-sm">
                <img src="/images/media_1788058025768.png" alt="Avatar" className="w-full h-full object-cover object-top" />
              </div>
              <div>
                <div className="text-white font-bold text-sm leading-tight flex items-center gap-1.5">
                  Kisan Sahayak
                  <svg viewBox="0 0 100 100" className="w-3.5 h-3.5 text-amber-300 animate-[spin_4s_linear_infinite]" fill="none" stroke="currentColor" strokeWidth="3">
                    <circle cx="50" cy="50" r="45" />
                    <circle cx="50" cy="50" r="10" fill="currentColor" />
                    {Array.from({ length: 24 }).map((_, i) => (
                      <line key={i} x1="50" y1="50" x2={50 + 45 * Math.cos((i * 15 * Math.PI) / 180)} y2={50 + 45 * Math.sin((i * 15 * Math.PI) / 180)} />
                    ))}
                  </svg>
                </div>
                <div className="text-emerald-200 text-[11px] font-medium">Digital Agriculture Assistant</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={language}
                onChange={(e) => handleLanguageSelect(e.target.value as 'en' | 'hi' | 'te')}
                id="kisan-mitra-lang-select"
                className="bg-emerald-950 text-amber-200 text-xs font-bold border border-amber-400/50 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-300"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="te">Telugu</option>
              </select>
              <button
                onClick={() => { stopSpeech(); setIsOpen(false); }}
                id="kisan-mitra-close-btn"
                className="p-1.5 text-emerald-100 hover:text-amber-300 rounded-lg hover:bg-emerald-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* STATUS BANNER */}
          {(isListening || isSpeaking) && (
            <div className="bg-amber-100 border-b border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-900 flex items-center justify-between animate-pulse flex-shrink-0">
              <div className="flex items-center gap-2">
                {isListening ? (
                  <><Mic className="w-4 h-4 text-red-600 animate-bounce" /><span>Listening...</span></>
                ) : (
                  <><Volume2 className="w-4 h-4 text-emerald-700 animate-bounce" /><span>Speaking...</span></>
                )}
              </div>
              <button onClick={stopSpeech} className="text-[10px] bg-amber-200 hover:bg-amber-300 text-amber-900 px-2 py-0.5 rounded font-bold">
                Stop
              </button>
            </div>
          )}

          {/* MESSAGES AREA */}
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-4 relative"
            style={{ 
              backgroundImage: 'url(/images/media_1788058018536.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              backgroundBlendMode: 'overlay'
            }}
          >
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[88%] rounded-2xl p-3.5 shadow-sm text-sm ${msg.sender === 'user' ? 'bg-emerald-700 text-white rounded-br-none font-medium' : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'}`}>
                  {msg.sender === 'assistant' && (
                    <div className="flex items-center justify-between border-b border-gray-100 pb-1 mb-1.5 text-xs font-bold text-emerald-800">
                      <span>🌾 Kisan Mitra</span>
                      {ttsSupported && (
                        <button onClick={() => speakText(msg.text)} className="flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded font-semibold">
                          <Volume2 className="w-3 h-3" /><span>Listen</span>
                        </button>
                      )}
                    </div>
                  )}
                  <div className="whitespace-pre-line leading-relaxed">{msg.text}</div>
                  {msg.data?.tokenNumber && (
                    <div className="mt-2 pt-2 border-t border-emerald-100 bg-emerald-50/70 rounded-lg p-2.5 text-xs space-y-1">
                      <div>Token: <strong>{msg.data.tokenNumber}</strong></div>
                      {msg.data.currentlyServing && <div>Serving: <strong>{msg.data.currentlyServing}</strong></div>}
                      {msg.data.farmersAhead !== undefined && <div>Ahead: <strong>{msg.data.farmersAhead}</strong></div>}
                      {msg.data.estimatedWaitMinutes !== undefined && <div>Wait: <strong>{msg.data.estimatedWaitMinutes} mins</strong></div>}
                    </div>
                  )}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 pt-1 border-t border-gray-100">
                      {msg.actions.includes('BOOK_SLOT') && <button onClick={() => handleActionClick('BOOK_SLOT')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Book Slot</button>}
                      {msg.actions.includes('VIEW_BOOKING') && <button onClick={() => handleActionClick('VIEW_BOOKING')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"><Ticket className="w-3.5 h-3.5" /> View Booking</button>}
                      {msg.actions.includes('VIEW_LIVE_QUEUE') && <button onClick={() => handleActionClick('VIEW_LIVE_QUEUE')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Live Queue</button>}
                      {msg.actions.includes('CALL_OFFICER') && <button onClick={() => handleActionClick('CALL_OFFICER', msg.data)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1">📞 Call Officer</button>}
                      {msg.actions.includes('GET_DIRECTIONS') && <button onClick={() => handleActionClick('GET_DIRECTIONS', msg.data)} className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"><Navigation className="w-3.5 h-3.5" /> Directions</button>}
                      {msg.actions.includes('VIEW_PROCUREMENT') && <button onClick={() => handleActionClick('VIEW_PROCUREMENT')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"><Wheat className="w-3.5 h-3.5" /> Procurement</button>}
                      {msg.actions.includes('VIEW_PAYMENT_STATUS') && <button onClick={() => handleActionClick('VIEW_PAYMENT_STATUS')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5" /> Payment</button>}
                      {msg.actions.includes('VIEW_NOTIFICATIONS') && <button onClick={() => handleActionClick('VIEW_NOTIFICATIONS')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"><Bell className="w-3.5 h-3.5" /> Notifications</button>}
                      {msg.actions.includes('LOGIN') && <button onClick={() => handleActionClick('LOGIN')} className="bg-india-green hover:bg-green-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg">Log In</button>}
                    </div>
                  )}
                  <div className="mt-1 text-[10px] opacity-70 text-right font-mono">{msg.timestamp}</div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold bg-white p-2.5 rounded-xl border border-gray-200 w-fit">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Kisan Mitra is checking records...</span>
              </div>
            )}

            {errorState && !loading && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center text-xs text-red-700 space-y-2">
                <p>Kisan Mitra is temporarily unavailable. Please try again.</p>
                <button id="kisan-mitra-retry-btn" onClick={() => { setErrorState(false); handleSendMessage('Help'); }} className="bg-red-600 text-white font-bold px-3 py-1 rounded hover:bg-red-700">
                  TRY AGAIN
                </button>
              </div>
            )}

            {messages.length <= 1 && !loading && (
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-emerald-900 uppercase tracking-wider px-1">Quick Assistance</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {quickActions.map((act) => (
                    <button
                      key={act.id}
                      onClick={() => handleSendMessage(act.intentQuery)}
                      className="bg-white hover:bg-emerald-100 text-emerald-950 border border-emerald-200 hover:border-emerald-400 font-semibold text-xs text-left p-2.5 rounded-xl shadow-sm transition-all flex items-center justify-between group"
                    >
                      <span>{act.label}</span>
                      <span className="text-emerald-500 group-hover:translate-x-0.5 transition-transform">&#8594;</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT AREA */}
          <div className="p-3 bg-white border-t border-gray-200 space-y-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              {speechSupported && (
                <button
                  onClick={toggleListening}
                  disabled={loading}
                  id="kisan-mitra-mic-btn"
                  className={`p-2.5 rounded-xl border font-bold text-xs flex items-center gap-1 transition-colors disabled:opacity-50 ${isListening ? 'bg-red-500 border-red-500 text-white animate-pulse' : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'}`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}
              <input
                type="text"
                id="kisan-mitra-text-input"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your question..."
                disabled={loading}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50 bg-gray-50"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={loading || !inputMessage.trim()}
                id="kisan-mitra-send-btn"
                className="bg-emerald-700 hover:bg-emerald-800 text-white p-2.5 rounded-xl font-bold flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-center text-gray-400 font-medium">
              Part of the Kisan Setu Government MSP Service
            </p>
          </div>
        </div>
      )}
    </>
  );
};