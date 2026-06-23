// Core domain types for SecQ-Auto

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'trial' | 'starter' | 'growth' | 'enterprise';
  settings: TenantSettings;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSettings {
  companyName: string;
  companyDomain: string;
  complianceFrameworks: string[]; // ['SOC2', 'ISO27001', 'HIPAA', 'GDPR']
  defaultLanguage: string;
  timezone: string;
  autoApproveThreshold: number; // confidence threshold for auto-approval (0-1)
  retentionDays: number;
  allowedDomains: string[]; // for email verification
}

// Questionnaire types
export type QuestionnaireStatus = 
  | 'uploading' 
  | 'parsing' 
  | 'parsing_failed'
  | 'ready' 
  | 'answering' 
  | 'in_review' 
  | 'completed' 
  | 'exporting'
  | 'exported'
  | 'archived';

export type QuestionType = 
  | 'yes_no' 
  | 'multiple_choice' 
  | 'free_text' 
  | 'numeric' 
  | 'date' 
  | 'evidence_request'
  | 'unknown';

export interface Questionnaire {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  sourceFormat: 'excel' | 'csv' | 'pdf' | 'portal' | 'api';
  originalFileKey: string; // R2 key
  originalFileName: string;
  originalFileSize: number;
  questions: Question[];
  status: QuestionnaireStatus;
  progress: QuestionnaireProgress;
  metadata: QuestionnaireMetadata;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  exportedAt?: string;
}

export interface QuestionnaireProgress {
  total: number;
  parsed: number;
  answered: number;
  validated: number;
  approved: number;
  exported: number;
}

export interface QuestionnaireMetadata {
  sourceUrl?: string;
  portalName?: string;
  dueDate?: string;
  assignedTo?: string;
  tags: string[];
  customFields: Record<string, string>;
}

export interface Question {
  id: string;
  questionnaireId: string;
  section: string;
  subsection?: string;
  number: string; // Original numbering (e.g., "3.2.1")
  text: string;
  type: QuestionType;
  required: boolean;
  options?: string[]; // For multiple_choice
  context?: string; // Instructions, notes, surrounding text
  rowIndex?: number; // Original row in spreadsheet
  columnMapping?: Record<string, string>; // For Excel column mapping
  answer?: Answer;
  createdAt: string;
  updatedAt: string;
}

// Answer types
export type AnswerStatus = 'draft' | 'validated' | 'approved' | 'rejected' | 'needs_review';

export interface Answer {
  id: string;
  questionId: string;
  questionnaireId: string;
  tenantId: string;
  text: string;
  confidence: number; // 0.0 - 1.0
  citations: Citation[];
  reasoning: string;
  status: AnswerStatus;
  generatedBy: 'ai' | 'human' | 'template';
  modelUsed?: string;
  tokensUsed?: number;
  processingTimeMs?: number;
  validatedBy?: string;
  validatedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Citation {
  docId: string;
  chunkId: string;
  excerpt: string; // Relevant excerpt (max 500 chars)
  relevanceScore: number; // 0-1
  docName: string;
  docType: KBDocumentType;
  page?: number;
  section?: string;
}

// Knowledge Base types
export type KBDocumentType = 
  | 'policy' 
  | 'certification' 
  | 'architecture' 
  | 'previous_answer' 
  | 'evidence' 
  | 'contract' 
  | 'procedure' 
  | 'other';

export interface KBDocument {
  id: string;
  tenantId: string;
  name: string;
  originalFileName: string;
  originalFileKey: string; // R2 key
  originalFileSize: number;
  mimeType: string;
  type: KBDocumentType;
  description?: string;
  tags: string[];
  metadata: Record<string, any>;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processingError?: string;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
}

export interface KBChunk {
  id: string;
  docId: string;
  tenantId: string;
  text: string;
  embedding?: number[]; // Not stored in D1, only in Vectorize
  vectorId?: string; // Vectorize ID
  metadata: KBChunkMetadata;
  createdAt: string;
}

export interface KBChunkMetadata {
  section?: string;
  page?: number;
  chunkIndex: number;
  startChar?: number;
  endChar?: number;
  headers?: string[]; // Document headers for context
}

// Agent types
export interface AgentInput<T = any> {
  tenantId: string;
  questionnaireId?: string;
  questionId?: string;
  data: T;
  context?: AgentContext;
}

export interface AgentContext {
  companyProfile?: CompanyProfile;
  previousAnswers?: Answer[];
  relevantChunks?: KBChunkWithScore[];
}

export interface CompanyProfile {
  name: string;
  domain: string;
  industry?: string;
  size?: string;
  complianceFrameworks: string[];
  keyContacts: KeyContact[];
  certifications: Certification[];
}

export interface KeyContact {
  name: string;
  role: string;
  email: string;
  department: string;
}

export interface Certification {
  name: string;
  standard: string;
  scope: string;
  issuedDate: string;
  expiryDate?: string;
  certificateNumber?: string;
  issuingBody: string;
}

export interface KBChunkWithScore extends KBChunk {
  score: number; // Similarity score 0-1
}

export interface AgentOutput<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: AgentMetadata;
}

export interface AgentMetadata {
  modelUsed: string;
  tokensUsed: number;
  processingTimeMs: number;
  confidence?: number;
  warnings?: string[];
}

// API types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  requestId: string;
}

export interface ResponseMeta {
  requestId: string;
  timestamp: string;
  version: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// Queue message types
export interface ProcessingMessage {
  type: 'parse' | 'answer' | 'validate' | 'export' | 'index_kb';
  tenantId: string;
  questionnaireId?: string;
  docId?: string;
  payload: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
  retryCount?: number;
  idempotencyKey: string;
}

// Export types
export type ExportFormat = 'excel' | 'csv' | 'pdf' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  includeUnanswered: boolean;
  includeRejected: boolean;
  includeCitations: boolean;
  includeConfidence: boolean;
  includeReasoning: boolean;
  templateKey?: string; // Custom export template
}

// Webhook types
export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  tenantId: string;
  payload: Record<string, any>;
  createdAt: string;
  deliveredAt?: string;
  attempts: number;
  lastError?: string;
}

export type WebhookEventType = 
  | 'questionnaire.completed'
  | 'questionnaire.exported'
  | 'answer.approved'
  | 'answer.rejected'
  | 'kb.document.processed'
  | 'usage.limit.warning'
  | 'billing.subscription.updated';

// Usage & Billing
export interface UsageRecord {
  id: string;
  tenantId: string;
  date: string; // YYYY-MM-DD
  questionnairesProcessed: number;
  questionsAnswered: number;
  tokensUsed: number;
  apiCalls: number;
  storageBytes: number;
  vectorOperations: number;
}

export interface BillingSubscription {
  id: string;
  tenantId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  plan: 'starter' | 'growth' | 'enterprise';
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}