// Enums
export enum TypeStructure {
  HOSPITAL = 'HOSPITAL',
  CLINIC = 'CLINIC',
  PHARMACY = 'PHARMACY',
  LABORATORY = 'LABORATORY'
}

export enum DocumentType {
  PASSPORT = 'PASSPORT',
  ID_CARD = 'ID_CARD',
  BIRTH_CERTIFICATE = 'BIRTH_CERTIFICATE',
  MEDICAL_CERTIFICATE = 'MEDICAL_CERTIFICATE'
}

export enum UserRole {
  ADMIN = 'ROLE_ADMIN',
  MEMBRE_STRUCTURE = 'ROLE_MEMBRE_STRUCTURE'
}

// Data Models
export interface Contact {
  phone: string;
  email: string;
  website?: string;
}

export interface Address {
  street: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface OpeningHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

export interface AvailableDoc {
  id: number;
  type: DocumentType;
  description?: string;
}

export interface Structure {
  id: number;
  name: string;
  type: TypeStructure;
  description?: string;
  contact: Contact;
  address: Address;
  openingHours?: OpeningHours;
  availableDocs: AvailableDoc[];
}

export interface MemberStructure {
  id: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  structure: Structure;
  roleInStructure: string;
}

export interface Admin {
  id: number;
  email: string;
  password: string;
}

// Auth Models
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  structure?: Structure;
  roleInStructure?: string;
}

// API Response Models
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  error: string;
  message: string;
  status: number;
  timestamp: string;
}

// Filter Models
export interface StructureFilter {
  type?: TypeStructure;
  region?: string;
  city?: string;
  name?: string;
}

// Create DTOs (Data Transfer Objects)
export interface CreateStructureRequest {
  name: string;
  type: TypeStructure;
  description?: string;
  contact: Contact;
  address: Address;
  openingHours?: OpeningHours;
}

export interface CreateMemberRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  structureId: number;
  roleInStructure: string;
}

export interface CreateAdminRequest {
  email: string;
  password: string;
}

export interface UpdateStructureRequest extends Partial<CreateStructureRequest> {
  id: number;
}

export interface UpdateMemberRequest extends Partial<CreateMemberRequest> {
  id: number;
}
