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
  latitude?: number | null;
  longitude?: number | null;
  phoneNumber?: string | null;
  contactOfficerName?: string | null;
  contactOfficerNumber?: string | null;
  openingTime: string;
  closingTime: string;
  active: boolean;
  currentlyServing?: string;
  estimatedWaitTime?: string;
  distanceKm?: number | null;
  isNearest?: boolean;
  isRecommended?: boolean;
  recommendationReason?: string;
  todayQueueCount?: number;
  nextAvailableSlotTime?: string;
  supportedCrops?: string[];
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
  centreLatitude?: number | null;
  centreLongitude?: number | null;
  centrePhone?: string | null;
  officerName?: string | null;
  officerContactNumber?: string | null;
  distanceKm?: number | null;
  date: string;
  timeSlot: string;
  cropType: string;
  expectedQuantity: number;
  quantityUnit?: string;
  originalQuantity?: number;
  expectedQuantityKg?: number;
  dualQuantityDisplay?: string;
  originalSlotId?: string | null;
  originalTokenNumber?: string | null;
  heldAt?: string | null;
  reassignedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  status: 'BOOKED' | 'ARRIVED' | 'ON_HOLD' | 'REASSIGNED' | 'INSPECTED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
  qrData?: string;
  procurement?: Procurement | null;
  createdAt: string;
}

export interface ReassignmentSlot {
  id: string;
  startTime: string;
  endTime: string;
  date: string;
  capacity: number;
  bookedCount: number;
  remainingCapacity: number;
  isRecommended: boolean;
}

export interface Procurement {
  id: string;
  bookingId?: string;
  bookingReference?: string;
  tokenNumber?: string;
  centreName?: string;
  cropType: string;
  expectedQuantity: number;
  quantityUnit?: string;
  originalQuantity?: number;
  expectedQuantityKg?: number;
  actualReceivedQuantityKg?: number | null;
  acceptedQuantityKg?: number | null;
  rejectedQuantityKg?: number | null;
  acceptedQuantity?: number | null;
  qualityGrade?: string | null;
  inspectionDecision?: 'FULLY_ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'REJECTED' | null;
  rejectionReason?: string | null;
  officerRemarks?: string | null;
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
    latitude?: number | null;
    longitude?: number | null;
    phoneNumber?: string | null;
    contactOfficerName?: string | null;
    contactOfficerNumber?: string | null;
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
    originalTokenNumber?: string | null;
    farmerName: string;
    cropType: string;
    quantity: number;
    quantityUnit?: string;
    timeSlot: string;
    status: string;
    isCurrentlyServing: boolean;
  }>;
  updatedAt: string;
}
