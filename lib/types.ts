export type JobStatus = 'lead' | 'quoted' | 'completed' | 'reviewed'
export type ServiceType = 'junk-removal' | 'demolition' | 'trailer-rental' | 'unknown'

export interface Job {
  id: string
  createdAt: string
  updatedAt: string
  customerName: string
  phone: string
  service: ServiceType
  city: string
  price?: number
  notes?: string
  status: JobStatus
  aiDraftSMS?: string
  aiDraftEmail?: string
  reviewRequestSMS?: string
}

export interface PricingItem {
  id: string
  label: string
  min: number
  max: number
  notes: string
}

export interface Availability {
  monday: boolean
  tuesday: boolean
  wednesday: boolean
  thursday: boolean
  friday: boolean
  saturday: boolean
  sunday: boolean
}

export interface Settings {
  businessName: string
  ownerName: string
  phone: string
  googleReviewLink: string
  pricing: PricingItem[]
  serviceArea: string[]
  acceptedItems: string[]
  refusedItems: string[]
  availability: Availability
  businessHours: string
  tone: 'friendly' | 'formal' | 'casual'
  responseLength: 'brief' | 'standard' | 'detailed'
  includePricingInFirstResponse: boolean
  onboardingComplete: boolean
  version: number
  updatedAt: string
}

export interface SettingsSnapshot {
  settings: Settings
  savedAt: string
}

export interface FeedbackEntry {
  id: string
  timestamp: string
  tool: string
  rating: 'good' | 'bad'
  outputSummary: string
  issue?: string
}

export interface AuditEntry {
  id: string
  timestamp: string
  action: string
  tool: string
  inputSummary: string
  outputSummary: string
  tokensUsed?: number
  durationMs?: number
  success: boolean
  error?: string
}

export interface Customer {
  id: string
  createdAt: string
  updatedAt: string
  name: string
  phone: string
  city: string
  totalJobs: number
  totalRevenue: number
  lastJobDate: string
  lastJobService: ServiceType
  tags: string[]
  notes: string
  jobs: string[]
}
