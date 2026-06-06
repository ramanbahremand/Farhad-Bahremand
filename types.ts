export enum Language {
  FA = 'fa', // Persian (Standard Iranian)
  KU = 'ku', // Kurdish (Sorani - Central Kurdish)
  EN = 'en'  // English (Medical Standard)
}

export enum DocType {
  PRESCRIPTION = 'prescription',
  LAB_REPORT = 'labreport',
  ULTRASOUND_REPORT = 'ultrasoundreport',
  MRI_REPORT = 'mrireport',
  QR_CODE = 'qrcode',
  GENERAL_TEXT = 'generaltext'
}

// 1. Prescription Structure
export interface PrescriptionItem {
  drugnamesource: string;
  normalized_name: string | null;
  dose_value: number | null;
  dose_unit: string | null;
  frequency: string | null;
  duration: string | null;
  route: string | null;
  warnings: string[];
}

export interface PrescriptionData {
  items: PrescriptionItem[];
  notes: string | null;
  language_detected: string;
}

// 2. Report Summary Structure
export interface ReportSummary {
  key_findings: string[];
  specialist_analysis: string; // New: Detailed medical interpretation
  lay_summary: string;         // Patient-friendly summary
  uncertainties: string[];
  disclaimer: string;
}

// 3. Translation Structure
export interface TranslatedItem {
  drug_display: string;
  dose_display: string | null;
  frequency_display: string | null;
  duration_display: string | null;
  route_display: string | null;
}

export interface TranslationData {
  language_target: string;
  items_translated?: TranslatedItem[]; // For prescriptions
  notes_translated?: string | null;
  translated_text?: string; // For general reports
  specialist_analysis_translated?: string; // New
  lay_summary_translated?: string; // New
  disclaimer: string;
}

// 4. Pharmacy Search Structure
export interface PharmacyData {
  drug_name_en: string;
  drug_name_local: string;
  brand_names: string[];
  category: string;
  uses: string; // Indications / Benefits
  mechanism: string; // How it works
  usage_instructions: string; // Dosage/Admin
  side_effects: string;
  warnings: string;
}

// Combined Result Type
export interface AnalysisResult {
  docType: DocType;
  structuredData?: PrescriptionData | ReportSummary | { raw_text: string, qr_data?: string, qr_context?: string };
  translation: TranslationData;
}