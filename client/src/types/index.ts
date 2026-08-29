export interface Farmer {
  id: string;
  fullName: string;
  mobileNumber: string;
  aadhaarMasked: string;
  preferredLanguage: string;
  village: string;
  district: string;
  state: string;
  centreId?: string | null;
  centre?: ProcurementCentre | null;
}

export interface Officer {
  id: string;
  username: string;
  fullName: string;
  role: string;
  centreId: string;
  centre?: ProcurementCentre;
}

export interface ProcurementCentre {
  id: string;
  name: string;
  district: string;
  state: string;
  address: string;
  openingTime: string;
  closingTime: string;
  active: boolean;
  currentlyServing?: string;
  estimatedWaitTime?: string;
}

export interface Slot {
  id: string;
  centreId: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  availableCapacity: number;
  status: 'AVAILABLE' | 'ALMOST_FULL' | 'FULL';
  isRecommended: boolean;
  congestionLevel: 'LOW' | 'MODERATE' | 'HIGH';
  estimatedWaitMinutes: number;
  recommendationReason?: string;
}

export interface Booking {
  id: string;
  bookingReference: string;
  tokenNumber: string;
  farmerName?: string;
  centreId: string;
  centreName: string;
  centreAddress?: string;
  date: string;
  timeSlot: string;
  cropType: string;
  expectedQuantity: number;
  status: 'BOOKED' | 'ARRIVED' | 'INSPECTED' | 'COMPLETED' | 'CANCELLED';
  qrData?: string;
  procurement?: Procurement | null;
  createdAt: string;
}

export interface Procurement {
  id: string;
  bookingId?: string;
  bookingReference?: string;
  tokenNumber?: string;
  centreName?: string;
  cropType: string;
  expectedQuantity: number;
  acceptedQuantity?: number | null;
  qualityGrade?: string | null;
  ratePerQuintal?: number | null;
  totalAmount?: number | null;
  status: 'PENDING_INSPECTION' | 'INSPECTED' | 'APPROVED' | 'REJECTED';
  inspectedAt?: string | null;
  approvedAt?: string | null;
  payment?: Payment | null;
}

export interface Payment {
  id: string;
  procurementId?: string;
  bookingReference?: string;
  centreName?: string;
  cropType?: string;
  acceptedQuantity?: number;
  ratePerQuintal?: number;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'PAID';
  transactionReference?: string | null;
  bankAccountLast4?: string;
  processingAt?: string | null;
  paidAt?: string | null;
  createdAt?: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface QueueData {
  centre: {
    id: string;
    name: string;
    district: string;
    address: string;
  };
  date: string;
  currentlyServing: string;
  farmersAhead: number;
  estimatedWaitMinutes: number;
  expectedTurnTime: string;
  advisoryNotice: string;
  totalWaitingToday: number;
  totalServedToday: number;
  queueList: Array<{
    tokenNumber: string;
    farmerName: string;
    cropType: string;
    quantity: number;
    timeSlot: string;
    status: string;
    isCurrentlyServing: boolean;
  }>;
  updatedAt: string;
}
