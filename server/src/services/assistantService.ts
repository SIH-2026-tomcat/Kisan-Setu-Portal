import { prisma } from '../config/db';

export type ChatLanguage = 'en' | 'hi' | 'te';

export type Intent =
  | 'BOOK_SLOT'
  | 'BOOKING_STATUS'
  | 'LIVE_QUEUE'
  | 'CENTRE_LOCATION'
  | 'OFFICER_CONTACT'
  | 'PROCUREMENT_STATUS'
  | 'PAYMENT_STATUS'
  | 'NOTIFICATIONS'
  | 'MISSED_SLOT'
  | 'HELP'
  | 'GREETING'
  | 'UNKNOWN';

export interface AssistantResponse {
  intent: Intent;
  message: string;
  data?: any;
  actions?: string[];
}

// ──────────────────────────────────────────────────────────
// Intent Detection (rule-based)
// ──────────────────────────────────────────────────────────
const INTENT_PATTERNS: { intent: Intent; patterns: RegExp[] }[] = [
  {
    intent: 'LIVE_QUEUE',
    patterns: [
      /turn|queue|token|waiting|wait|ahead|serving|number|line/i,
      /నా టోకెన్|నా వంతు|ఎంత సేపు|ఎప్పుడు వస్తుంది|ముందు ఎంత/i,
      /मेरा नंबर|मेरी बारी|कितना इंतजार|कौन सा टोकन|कितने लोग/i,
    ],
  },
  {
    intent: 'PAYMENT_STATUS',
    patterns: [
      /payment|money|paid|amount|rupee|paise|deposit|transfer|bank|pfms|dbt/i,
      /డబ్బులు|పేమెంట్|రూపాయలు|వచ్చాయా|క్రెడిట్/i,
      /पेमेंट|पैसे|रुपए|भुगतान|पैसा|जमा|क्रेडिट/i,
    ],
  },
  {
    intent: 'PROCUREMENT_STATUS',
    patterns: [
      /crop|onion|wheat|paddy|maize|cotton|groundnut|inspection|accepted|rejected|quality|grade|weigh|procure/i,
      /పంట|ఉల్లిపాయ|గోధుమ|వరి|మొక్కజొన్న|పత్తి|వేరుశనగ|తనిఖీ|అంగీకరించారు|తిరస్కరించారు/i,
      /फसल|प्याज|गेहूं|धान|मक्का|कपास|मूंगफली|निरीक्षण|स्वीकृत|अस्वीकृत/i,
    ],
  },
  {
    intent: 'BOOKING_STATUS',
    patterns: [
      /booking|slot|date|time|centre|center|schedule|appointment|my.*book|booked|show.*book/i,
      /నా బుకింగ్|నా స్లాట్|టైమ్|తేదీ|కేంద్రం|బుకింగ్ చూపు/i,
      /मेरी बुकिंग|मेरा स्लॉट|तारीख|समय|केंद्र/i,
    ],
  },
  {
    intent: 'OFFICER_CONTACT',
    patterns: [
      /officer|contact.*number|phone.*number|whom.*call|who.*call|who.*officer|call.*centre|call.*center|centre.*number|center.*number|contact.*officer|officer.*number|contact.*procurement/i,
      /అధికారి ఎవరు|అధికారి నంబర్|సంప్రదించు|ఎవరిని పిలవాలి|కేంద్ర నంబర్|కాల్ చేయాలి/i,
      /अधिकारी कौन|अधिकारी नंबर|संपर्क नंबर|किसे कॉल|केंद्र नंबर|फोन नंबर/i,
    ],
  },
  {
    intent: 'CENTRE_LOCATION',
    patterns: [
      /centre|center|location|address|where|distance|km|direction|map|navigate/i,
      /కేంద్రం ఎక్కడ|చిరునామా|దారి|మ్యాప్|దూరం/i,
      /केंद्र कहाँ|पता|दूरी|रास्ता|नक्शा/i,
    ],
  },
  {
    intent: 'MISSED_SLOT',
    patterns: [
      /missed|miss|hold|on.hold|late|cancel|reassign/i,
      /స్లాట్ మిస్|ఆన్ హోల్డ్|ఆలస్యం|రద్దు/i,
      /स्लॉट मिस|ऑन होल्ड|देर|रद्द/i,
    ],
  },
  {
    intent: 'NOTIFICATIONS',
    patterns: [
      /notification|update|alert|news|message|inform/i,
      /నోటిఫికేషన్|అప్డేట్|వార్తలు|అలెర్ట్/i,
      /नोटिफिकेशन|अपडेट|सूचना|खबर/i,
    ],
  },
  {
    intent: 'BOOK_SLOT',
    patterns: [
      /book.*slot|want.*sell|sell.*crop|schedule.*slot|new.*booking|create.*booking/i,
      /స్లాట్ బుక్|అమ్మాలి|కొత్త బుకింగ్/i,
      /स्लॉट बुक|बेचना है|नई बुकिंग/i,
    ],
  },
  {
    intent: 'HELP',
    patterns: [
      /help|how|what is kisan|explain|guide|how.*work|what.*can/i,
      /సహాయం|ఎలా పనిచేస్తుంది|వివరించు/i,
      /मदद|कैसे|कैसे काम करता|बताओ/i,
    ],
  },
  {
    intent: 'GREETING',
    patterns: [
      /^(hi|hello|namaste|hey|good morning|good evening)\b/i,
      /^(నమస్కారం|నమస్తే|హాయ్)\b/i,
      /^(नमस्ते|नमस्कार|हाय|हेलो)\b/i,
    ],
  },
];

export function detectIntent(message: string): Intent {
  const cleaned = message.trim();
  for (const { intent, patterns } of INTENT_PATTERNS) {
    if (patterns.some((p) => p.test(cleaned))) {
      return intent;
    }
  }
  return 'UNKNOWN';
}

// ──────────────────────────────────────────────────────────
// Response templates
// ──────────────────────────────────────────────────────────
const RESPONSES: Record<string, Record<ChatLanguage, string>> = {
  noBooking: {
    en: "I couldn't find any active booking for your account. Would you like to book a slot?",
    hi: 'मुझे आपके खाते में कोई सक्रिय बुकिंग नहीं मिली। क्या आप स्लॉट बुक करना चाहते हैं?',
    te: 'మీ ఖాతాలో ఏ క్రియాశీల బుకింగ్ కనుగొనబడలేదు. మీరు స్లాట్ బుక్ చేయాలనుకుంటున్నారా?',
  },
  bookingFound: {
    en: '📅 YOUR UPCOMING BOOKING\n\nCentre: {{centre}}\nDate: {{date}}\nSlot: {{slot}}\nToken: {{token}}\nStatus: {{status}}',
    hi: '📅 आपकी बुकिंग विवरण\n\nकेंद्र: {{centre}}\nतारीख: {{date}}\nस्लॉट: {{slot}}\nटोकन: {{token}}\nस्थिति: {{status}}',
    te: '📅 మీ బుకింగ్ వివరాలు\n\nకేంద్రం: {{centre}}\nతేదీ: {{date}}\nస్లాట్: {{slot}}\nటోకెన్: {{token}}\nస్థితి: {{status}}',
  },
  queueData: {
    en: '⏱ LIVE QUEUE STATUS\n\nYour Token: {{token}}\nCurrently Serving: {{serving}}\nFarmers Ahead: {{ahead}}\nEstimated Wait: ~{{wait}} minutes',
    hi: '⏱ लाइव क्यू स्थिति\n\nआपका टोकन: {{token}}\nअभी सेवा: {{serving}}\nआगे किसान: {{ahead}}\nअनुमानित प्रतीक्षा: ~{{wait}} मिनट',
    te: '⏱ లైవ్ క్యూ స్థితి\n\nమీ టోకెన్: {{token}}\nప్రస్తుతం సేవ: {{serving}}\nముందు రైతులు: {{ahead}}\nఆంచనా వేచి సమయం: ~{{wait}} నిమిషాలు',
  },
  queueApproaching: {
    en: 'Your turn is approaching! Please proceed to the procurement centre now.',
    hi: 'आपकी बारी आने वाली है! कृपया अभी खरीद केंद्र जाएं।',
    te: 'మీ వంతు వస్తోంది! దయచేసి ఇప్పుడే సేకరణ కేంద్రానికి వెళ్ళండి.',
  },
  noQueue: {
    en: "I couldn't find your live queue position. Please ensure you have an active booking.",
    hi: 'मुझे आपकी लाइव क्यू स्थिति नहीं मिली। कृपया सुनिश्चित करें कि आपकी सक्रिय बुकिंग है।',
    te: 'మీ లైవ్ క్యూ స్థితి కనుగొనబడలేదు. దయచేసి మీకు క్రియాశీల బుకింగ్ ఉందని నిర్ధారించుకోండి.',
  },
  centreInfo: {
    en: '📍 YOUR PROCUREMENT CENTRE\n\nCentre: {{centre}}\nAddress: {{address}}\nSlot: {{slot}}\nDate: {{date}}',
    hi: '📍 आपका खरीद केंद्र\n\nकेंद्र: {{centre}}\nपता: {{address}}\nस्लॉट: {{slot}}\nतारीख: {{date}}',
    te: '📍 మీ సేకరణ కేంద్రం\n\nకేంద్రం: {{centre}}\nచిరునామా: {{address}}\nస్లాట్: {{slot}}\nతేదీ: {{date}}',
  },
  noCentre: {
    en: "You don't have an active booking yet. Please book a slot first.",
    hi: 'आपके पास अभी कोई सक्रिय बुकिंग नहीं है। पहले स्लॉट बुक करें।',
    te: 'మీకు ఇంకా క్రియాశీల బుకింగ్ లేదు. ముందుగా స్లాట్ బుక్ చేయండి.',
  },
  paymentFound: {
    en: '💰 PAYMENT STATUS\n\nCrop: {{crop}}\nAccepted Qty: {{qty}} Quintals\nAmount: ₹{{amount}}\nStatus: {{status}}\nReference: {{ref}}',
    hi: '💰 भुगतान स्थिति\n\nफसल: {{crop}}\nस्वीकृत मात्रा: {{qty}} क्विंटल\nराशि: ₹{{amount}}\nस्थिति: {{status}}\nसंदर्भ: {{ref}}',
    te: '💰 చెల్లింపు స్థితి\n\nపంట: {{crop}}\nఆమోదించిన పరిమాణం: {{qty}} క్వింటాళ్ళు\nమొత్తం: ₹{{amount}}\nస్థితి: {{status}}\nరిఫరెన్స్: {{ref}}',
  },
  paymentPaid: {
    en: '✅ Your payment of ₹{{amount}} for {{crop}} has been successfully deposited to your bank account.',
    hi: '✅ {{crop}} के लिए ₹{{amount}} का भुगतान सफलतापूर्वक बैंक में जमा हो गया।',
    te: '✅ {{crop}} కోసం ₹{{amount}} చెల్లింపు విజయవంతంగా బ్యాంక్‌లో జమ అయింది.',
  },
  paymentProcessing: {
    en: '⏳ Your payment of ₹{{amount}} for {{crop}} is being processed and will be credited soon.',
    hi: '⏳ {{crop}} के लिए ₹{{amount}} प्रक्रिया में है और जल्द जमा होगा।',
    te: '⏳ {{crop}} కోసం ₹{{amount}} ప్రక్రియలో ఉంది మరియు త్వరలో జమ అవుతుంది.',
  },
  paymentPending: {
    en: '🕐 Your payment for {{crop}} is pending officer approval.',
    hi: '🕐 {{crop}} के लिए भुगतान अधिकारी की मंजूरी का इंतजार कर रहा है।',
    te: '🕐 {{crop}} కోసం చెల్లింపు అధికారి ఆమోదం కోసం పెండింగ్‌లో ఉంది.',
  },
  noPayment: {
    en: 'No payment record found. Your procurement may still be under inspection or was rejected.',
    hi: 'कोई भुगतान रिकॉर्ड नहीं। खरीद निरीक्षण में हो सकती है या अस्वीकृत हो गई।',
    te: 'చెల్లింపు రికార్డు కనుగొనబడలేదు. మీ సేకరణ ఇంకా తనిఖీలో ఉండవచ్చు లేదా తిరస్కరించబడింది.',
  },
  procurementFound: {
    en: '🌾 PROCUREMENT STATUS\n\nCrop: {{crop}}\nReceived: {{received}} kg\nAccepted: {{accepted}} kg\nRejected: {{rejected}} kg\nDecision: {{decision}}\nAmount: ₹{{amount}}',
    hi: '🌾 खरीद स्थिति\n\nफसल: {{crop}}\nप्राप्त: {{received}} किलो\nस्वीकृत: {{accepted}} किलो\nअस्वीकृत: {{rejected}} किलो\nनिर्णय: {{decision}}\nराशि: ₹{{amount}}',
    te: '🌾 సేకరణ స్థితి\n\nపంట: {{crop}}\nస్వీకరించినది: {{received}} కిలో\nఆమోదించినది: {{accepted}} కిలో\nతిరస్కరించినది: {{rejected}} కిలో\nనిర్ణయం: {{decision}}\nమొత్తం: ₹{{amount}}',
  },
  procurementPartialNote: {
    en: '\n\n{{accepted}} kg of your {{received}} kg {{crop}} was accepted. {{rejected}} kg was rejected due to: {{reason}}.',
    hi: '\n\nआपके {{received}} किलो {{crop}} में से {{accepted}} किलो स्वीकृत। {{rejected}} किलो अस्वीकृत क्योंकि: {{reason}}।',
    te: '\n\nమీ {{received}} కిలో {{crop}} నుండి {{accepted}} కిలో ఆమోదించబడింది. {{rejected}} కిలో తిరస్కరించబడింది కారణం: {{reason}}.',
  },
  noProcurement: {
    en: 'No procurement record found. Please check after your slot visit.',
    hi: 'कोई खरीद रिकॉर्ड नहीं मिला। स्लॉट यात्रा के बाद जांचें।',
    te: 'సేకరణ రికార్డు కనుగొనబడలేదు. స్లాట్ సందర్శన తర్వాత తనిఖీ చేయండి.',
  },
  onHold: {
    en: '⚠️ Your booking is ON HOLD — the scheduled slot was missed. Please report to the procurement centre. An officer will check if another slot is available today.',
    hi: '⚠️ आपकी बुकिंग ऑन होल्ड है — निर्धारित स्लॉट छूट गया। खरीद केंद्र में रिपोर्ट करें।',
    te: '⚠️ మీ బుకింగ్ ఆన్ హోల్డ్‌లో ఉంది — నిర్ణయించిన స్లాట్ మిస్ అయింది. సేకరణ కేంద్రానికి నివేదించండి.',
  },
  reassigned: {
    en: '✅ Your booking has been REASSIGNED.\n\nNew Token: {{newToken}}\nNew Slot: {{newSlot}}',
    hi: '✅ आपकी बुकिंग पुनः नियुक्त की गई है।\n\nनया टोकन: {{newToken}}\nनया स्लॉट: {{newSlot}}',
    te: '✅ మీ బుకింగ్ పునఃకేటాయించబడింది.\n\nకొత్త టోకెన్: {{newToken}}\nకొత్త స్లాట్: {{newSlot}}',
  },
  cancelled: {
    en: '❌ Your booking was CANCELLED — the slot was missed and no remaining slots were available for today.',
    hi: '❌ आपकी बुकिंग रद्द हो गई — स्लॉट छूट गया और आज के लिए कोई और स्लॉट नहीं था।',
    te: '❌ మీ బుకింగ్ రద్దు చేయబడింది — స్లాట్ మిస్ అయింది మరియు నేడు మరే స్లాట్‌లు అందుబాటులో లేవు.',
  },
  noMissedSlot: {
    en: 'Your booking is currently active and in good standing.',
    hi: 'आपकी बुकिंग वर्तमान में सक्रिय है।',
    te: 'మీ బుకింగ్ ప్రస్తుతం క్రియాశీలంగా ఉంది.',
  },
  notifications: {
    en: '🔔 RECENT NOTIFICATIONS\n\n{{list}}',
    hi: '🔔 हालिया सूचनाएं\n\n{{list}}',
    te: '🔔 ఇటీవలి నోటిఫికేషన్లు\n\n{{list}}',
  },
  noNotifications: {
    en: 'No recent notifications found.',
    hi: 'कोई हालिया सूचनाएं नहीं मिलीं।',
    te: 'ఇటీవలి నోటిఫికేషన్లు కనుగొనబడలేదు.',
  },
  bookSlotGuide: {
    en: 'I can help you book a procurement slot!\n\n1. Select a Centre\n2. Choose a date\n3. Pick a time slot\n4. Select crop & enter quantity\n5. Confirm\n\nTap below to start:',
    hi: 'मैं आपको स्लॉट बुक करने में मदद कर सकता हूँ!\n\n1. केंद्र चुनें\n2. तारीख चुनें\n3. समय स्लॉट चुनें\n4. फसल और मात्रा दर्ज करें\n5. पुष्टि करें\n\nशुरू करने के लिए नीचे टैप करें:',
    te: 'నేను మీకు స్లాట్ బుక్ చేయడంలో సహాయం చేయగలను!\n\n1. కేంద్రాన్ని ఎంచుకోండి\n2. తేదీ ఎంచుకోండి\n3. సమయ స్లాట్ ఎంచుకోండి\n4. పంట మరియు పరిమాణం నమోదు చేయండి\n5. నిర్ధారించండి\n\nప్రారంభించడానికి దిగువ నొక్కండి:',
  },
  help: {
    en: 'Kisan Setu helps you sell produce at government MSP rates. I can help with:\n\n• Booking status & token\n• Live queue position\n• Crop inspection status\n• Payment tracking\n• Centre location & directions\n• Notifications',
    hi: 'किसान सेतु आपको सरकारी MSP पर उपज बेचने में मदद करता है। मैं इनमें मदद कर सकता हूँ:\n\n• बुकिंग और टोकन\n• लाइव क्यू\n• फसल निरीक्षण\n• भुगतान\n• केंद्र और दिशा\n• सूचनाएं',
    te: 'కిసాన్ సేతు ప్రభుత్వ MSP రేట్లలో పంట అమ్మడంలో సహాయం చేస్తుంది. నేను సహాయం చేయగలను:\n\n• బుకింగ్ మరియు టోకెన్\n• లైవ్ క్యూ\n• పంట తనిఖీ\n• చెల్లింపు\n• కేంద్రం మరియు దిశలు\n• నోటిఫికేషన్లు',
  },
  unknown: {
    en: "I'm sorry, I didn't understand that. Try asking about your booking, queue, payment, or crop status.",
    hi: 'मुझे क्षमा करें, समझ नहीं आया। बुकिंग, क्यू, भुगतान या फसल के बारे में पूछें।',
    te: 'క్షమించండి, అర్థం కాలేదు. మీ బుకింగ్, క్యూ, చెల్లింపు లేదా పంట స్థితి గురించి అడగండి.',
  },
  officerContact: {
    en: '👨\u200d💼 CENTRE OFFICER\n\nOfficer: {{name}}\nContact: {{number}}\n\nYou can call the centre using the button below. For privacy, the number is displayed on screen.',
    hi: '👨\u200d💼 केंद्र अधिकारी\n\nअधिकारी: {{name}}\nसंपर्क: {{number}}\n\nनीचे बटन से केंद्र को कॉल कर सकते हैं।',
    te: '👨\u200d💼 కేంద్ర అధికారి\n\nఅధికారి: {{name}}\nసంప్రదింపు: {{number}}\n\nదిగువ బటన్ ద్వారా కేంద్రానికి కాల్ చేయవచ్చు.',
  },
  noOfficerContact: {
    en: 'Centre contact information is currently unavailable. Please contact the procurement centre directly or visit in person.',
    hi: 'केंद्र संपर्क जानकारी अभी उपलब्ध नहीं है। कृपया सीधे खरीद केंद्र से संपर्क करें।',
    te: 'కేంద్ర సంప్రదింపు సమాచారం ప్రస్తుతం అందుబాటులో లేదు. దయచేసి నేరుగా సేకరణ కేంద్రాన్ని సంప్రదించండి.',
  },
  unavailable: {
    en: "I couldn't find that information right now. Please try again or contact the procurement centre.",
    hi: 'अभी वह जानकारी नहीं मिली। फिर से कोशिश करें या केंद्र से संपर्क करें।',
    te: 'ఇప్పుడు ఆ సమాచారం కనుగొనబడలేదు. మళ్ళీ ప్రయత్నించండి లేదా కేంద్రాన్ని సంప్రదించండి.',
  },
};

function buildMessage(lang: ChatLanguage, key: string, vars: Record<string, any> = {}): string {
  const tplObj = RESPONSES[key];
  if (!tplObj) return '';
  let tpl = tplObj[lang] || tplObj['en'];
  for (const [k, v] of Object.entries(vars)) {
    tpl = tpl.replace(new RegExp(`{{${k}}}`, 'g'), String(v ?? '—'));
  }
  return tpl;
}

// ──────────────────────────────────────────────────────────
// Data fetchers (all scoped by authenticated farmerId)
// ──────────────────────────────────────────────────────────
async function getLatestActiveBooking(farmerId: string) {
  return prisma.booking.findFirst({
    where: { farmerId, status: { notIn: ['CANCELLED'] } },
    include: { centre: true, slot: true },
    orderBy: { createdAt: 'desc' },
  });
}

async function getLiveQueueData(centreId: string, tokenNumber: string) {
  const today = new Date().toISOString().split('T')[0];
  const queueRecord = await prisma.queue.findUnique({
    where: { centreId_date: { centreId, date: today } },
  });
  const currentlyServing = queueRecord?.currentlyServing || null;

  const bookings = await prisma.booking.findMany({
    where: { centreId, slot: { date: today }, status: { notIn: ['CANCELLED', 'COMPLETED'] } },
    orderBy: { tokenNumber: 'asc' },
  });
  const myIndex = bookings.findIndex((b) => b.tokenNumber === tokenNumber);
  let servingIndex = -1;
  if (currentlyServing) {
    servingIndex = bookings.findIndex((b) => b.tokenNumber === currentlyServing);
  }
  const farmersAhead = myIndex >= 0 ? Math.max(0, servingIndex >= 0 ? myIndex - servingIndex : myIndex) : 0;
  return { tokenNumber, currentlyServing: currentlyServing || '—', farmersAhead, estimatedWaitMinutes: farmersAhead * 4 };
}

async function getLatestProcurement(farmerId: string) {
  return prisma.procurement.findFirst({
    where: { farmerId },
    include: { payment: true, booking: { include: { centre: true, slot: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

async function getLatestPayment(farmerId: string) {
  return prisma.payment.findFirst({
    where: { farmerId },
    include: { procurement: { include: { booking: { include: { centre: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
}

async function getRecentNotifications(farmerId: string) {
  return prisma.notification.findMany({
    where: { farmerId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
}

// ──────────────────────────────────────────────────────────
// Main handler
// ──────────────────────────────────────────────────────────
export async function processFarmerMessage(
  farmerId: string,
  userMessage: string,
  lang: ChatLanguage = 'en'
): Promise<AssistantResponse> {
  const intent = detectIntent(userMessage);
  const currentLang: ChatLanguage = lang || 'en';

  try {
    switch (intent) {
      case 'GREETING': {
        const farmer = await prisma.farmer.findUnique({ where: { id: farmerId } });
        const name = farmer?.fullName || '';
        return {
          intent,
          message: `Namaste${name ? ' ' + name : ''}! 🙏\n\n` + buildMessage(currentLang, 'help'),
          actions: [],
        };
      }

      case 'BOOKING_STATUS': {
        const booking = await getLatestActiveBooking(farmerId);
        if (!booking) return { intent, message: buildMessage(currentLang, 'noBooking'), actions: ['BOOK_SLOT'] };
        return {
          intent,
          message: buildMessage(currentLang, 'bookingFound', {
            centre: booking.centre.name,
            date: booking.slot.date,
            slot: `${booking.slot.startTime}–${booking.slot.endTime}`,
            token: booking.tokenNumber,
            status: booking.status,
          }),
          data: {
            bookingId: booking.id,
            centreId: booking.centreId,
            centreName: booking.centre.name,
            centreAddress: booking.centre.address,
            centreLatitude: booking.centre.latitude,
            centreLongitude: booking.centre.longitude,
          },
          actions: ['VIEW_BOOKING', 'GET_DIRECTIONS'],
        };
      }

      case 'LIVE_QUEUE': {
        const booking = await getLatestActiveBooking(farmerId);
        if (!booking) return { intent, message: buildMessage(currentLang, 'noQueue'), actions: ['BOOK_SLOT'] };
        const q = await getLiveQueueData(booking.centreId, booking.tokenNumber);
        let msg = buildMessage(currentLang, 'queueData', {
          token: q.tokenNumber,
          serving: q.currentlyServing || '—',
          ahead: q.farmersAhead,
          wait: q.estimatedWaitMinutes,
        });
        if (q.farmersAhead <= 3) msg += '\n\n' + buildMessage(currentLang, 'queueApproaching');
        return {
          intent,
          message: msg,
          data: { ...q, centreName: booking.centre.name, centreAddress: booking.centre.address, centreLatitude: booking.centre.latitude, centreLongitude: booking.centre.longitude },
          actions: ['VIEW_LIVE_QUEUE', 'GET_DIRECTIONS'],
        };
      }

      case 'CENTRE_LOCATION': {
        const booking = await getLatestActiveBooking(farmerId);
        if (!booking) return { intent, message: buildMessage(currentLang, 'noCentre'), actions: ['BOOK_SLOT'] };
        return {
          intent,
          message: buildMessage(currentLang, 'centreInfo', {
            centre: booking.centre.name,
            address: booking.centre.address,
            slot: `${booking.slot.startTime}–${booking.slot.endTime}`,
            date: booking.slot.date,
          }),
          data: {
            centreName: booking.centre.name,
            centreAddress: booking.centre.address,
            centreLatitude: booking.centre.latitude,
            centreLongitude: booking.centre.longitude,
          },
          actions: ['GET_DIRECTIONS'],
        };
      }

      case 'PAYMENT_STATUS': {
        const payment = await getLatestPayment(farmerId);
        if (!payment) return { intent, message: buildMessage(currentLang, 'noPayment'), actions: [] };
        const crop = payment.procurement.cropType;
        const amount = payment.amount;
        let msg = buildMessage(currentLang, 'paymentFound', {
          crop,
          qty: payment.procurement.acceptedQuantity ?? '—',
          amount: amount.toLocaleString('en-IN'),
          status: payment.status,
          ref: payment.transactionReference || 'Pending',
        });
        if (payment.status === 'PAID') msg += '\n\n' + buildMessage(currentLang, 'paymentPaid', { amount: amount.toLocaleString('en-IN'), crop });
        else if (payment.status === 'PROCESSING') msg += '\n\n' + buildMessage(currentLang, 'paymentProcessing', { amount: amount.toLocaleString('en-IN'), crop });
        else msg += '\n\n' + buildMessage(currentLang, 'paymentPending', { crop });
        return {
          intent,
          message: msg,
          data: { status: payment.status, amount, crop, reference: payment.transactionReference },
          actions: ['VIEW_PAYMENT_STATUS'],
        };
      }

      case 'PROCUREMENT_STATUS': {
        const proc = await getLatestProcurement(farmerId);
        if (!proc) return { intent, message: buildMessage(currentLang, 'noProcurement'), actions: [] };
        const expectedKg = proc.expectedQuantityKg || (proc.expectedQuantity ? proc.expectedQuantity * 100 : 0);
        const actualKg = proc.actualReceivedQuantityKg ?? expectedKg;
        const acceptedKg = proc.acceptedQuantityKg ?? (proc.acceptedQuantity ? proc.acceptedQuantity * 100 : 0);
        const rejectedKg = Math.max(0, actualKg - acceptedKg);
        let msg = buildMessage(currentLang, 'procurementFound', {
          crop: proc.cropType,
          received: actualKg,
          accepted: acceptedKg,
          rejected: rejectedKg,
          decision: (proc.inspectionDecision || proc.status).replace(/_/g, ' '),
          amount: (proc.totalAmount || 0).toLocaleString('en-IN'),
        });
        if (rejectedKg > 0 && proc.rejectionReason) {
          msg += buildMessage(currentLang, 'procurementPartialNote', {
            accepted: acceptedKg,
            received: actualKg,
            crop: proc.cropType,
            rejected: rejectedKg,
            reason: proc.rejectionReason,
          });
        }
        return {
          intent,
          message: msg,
          data: { cropType: proc.cropType, decision: proc.inspectionDecision, acceptedKg, rejectedKg, totalAmount: proc.totalAmount },
          actions: ['VIEW_PROCUREMENT'],
        };
      }

      case 'MISSED_SLOT': {
        const booking = await getLatestActiveBooking(farmerId);
        if (!booking) return { intent, message: buildMessage(currentLang, 'noBooking'), actions: ['BOOK_SLOT'] };
        if (booking.status === 'ON_HOLD') return { intent, message: buildMessage(currentLang, 'onHold'), actions: ['GET_DIRECTIONS'] };
        if (booking.status === 'REASSIGNED')
          return {
            intent,
            message: buildMessage(currentLang, 'reassigned', {
              newToken: booking.tokenNumber,
              newSlot: `${booking.slot.startTime}–${booking.slot.endTime}`,
            }),
            data: { token: booking.tokenNumber },
            actions: ['VIEW_BOOKING'],
          };
        if (booking.status === 'CANCELLED') return { intent, message: buildMessage(currentLang, 'cancelled'), actions: ['BOOK_SLOT'] };
        return { intent, message: buildMessage(currentLang, 'noMissedSlot'), actions: ['VIEW_BOOKING'] };
      }

      case 'NOTIFICATIONS': {
        const notifs = await getRecentNotifications(farmerId);
        if (notifs.length === 0) return { intent, message: buildMessage(currentLang, 'noNotifications'), actions: [] };
        const list = notifs.map((n, i) => `${i + 1}. ${n.message}`).join('\n');
        return {
          intent,
          message: buildMessage(currentLang, 'notifications', { list }),
          data: { notifications: notifs.map((n) => ({ id: n.id, message: n.message, read: n.read })) },
          actions: ['VIEW_NOTIFICATIONS'],
        };
      }

      case 'OFFICER_CONTACT': {
        const booking = await getLatestActiveBooking(farmerId);
        if (!booking) return { intent, message: buildMessage(currentLang, 'noBooking'), actions: ['BOOK_SLOT'] };
        const officerName = booking.centre.contactOfficerName || null;
        const officerNumber = booking.centre.contactOfficerNumber || null;
        if (!officerName && !officerNumber) {
          return { intent, message: buildMessage(currentLang, 'noOfficerContact'), actions: ['GET_DIRECTIONS'] };
        }
        return {
          intent,
          message: buildMessage(currentLang, 'officerContact', {
            name: officerName || 'Not assigned',
            number: officerNumber || 'Not available',
          }),
          data: {
            officerName,
            officerContactNumber: officerNumber,
            centreName: booking.centre.name,
            centreAddress: booking.centre.address,
            centreLatitude: booking.centre.latitude,
            centreLongitude: booking.centre.longitude,
          },
          actions: ['CALL_OFFICER', 'GET_DIRECTIONS'],
        };
      }

      case 'BOOK_SLOT':
        return { intent, message: buildMessage(currentLang, 'bookSlotGuide'), actions: ['BOOK_SLOT'] };

      case 'HELP':
        return { intent, message: buildMessage(currentLang, 'help'), actions: [] };

      default:
        return { intent: 'UNKNOWN', message: buildMessage(currentLang, 'unknown'), actions: [] };
    }
  } catch (err) {
    console.error('Assistant error:', err);
    return { intent, message: buildMessage(currentLang, 'unavailable'), actions: [] };
  }
}
