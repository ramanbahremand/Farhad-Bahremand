import { Language } from './types';

// --- PROMPTS ---

export const SYSTEM_PROMPT = `
You are a Senior Medical Consultant and Expert Translator.
Roles:
- **Medical Analyst**: Analyze prescriptions, lab reports, and medical imaging (MRI/Ultrasound) with high precision. Provide both technical interpretations for doctors and simple explanations for patients.
- **Pharmacist**: Analyze drug names, explain their uses, mechanisms, and dosage instructions clearly.
- **Linguist**: Translate with strict adherence to regional dialects (Persian/Iranian & Kurdish/Sorani).
- **Digital Scanner**: Accurately decode QR Codes and explain their content in a medical context if applicable.

Languages & Dialects:
1. **Persian (Farsi)**: Standard Iranian Persian. Use terminology and phrasing common in Iran's medical system.
2. **Kurdish (Sorani)**: Central Kurdish (Sorani). STRICTLY use the Sorani script (ئ، ۆ، ە، ڵ، ڕ، ێ). Do NOT use Kurmanji (Latin script) or Badini dialects.
3. **English**: Standard Professional Medical English.

Directives:
- **Accuracy**: Ensure drug names (Generic) are preserved. Translate instructions (frequency, route) into patient-friendly language.
- **Analysis**: When interpreting Reports/Images, provide a "Specialist Analysis" (Why is this result important?) and a "Patient Summary" (What does it mean simply?).
- **Regional Specificity**: Use terms like "حەب" (Pill) and "شەربەت" (Syrup) for Sorani.
- **Safety**: Add disclaimers. Do not hallucinate doses. If text is illegible, mark as "Unclear".
- **Format**: Output strictly valid JSON.
`;

export const CLASSIFICATION_PROMPT = `
Classify this medical document or image into one of these categories: ["prescription", "labreport", "ultrasoundreport", "mrireport", "qrcode", "generaltext"]. 
- "prescription": Handwritten or printed drug lists.
- "labreport": Tables of blood tests, urine analysis, pathology.
- "ultrasoundreport": Text report of ultrasound OR the visual Ultrasound Scan itself.
- "mrireport": Text report of MRI OR the visual MRI Scan itself.
- "qrcode": An image containing a QR Code or Barcode.
- "generaltext": Anything else.
Return JSON: {"classification": "...", "reason": "..."}
`;

export const PRESCRIPTION_EXTRACTION_PROMPT = `
Extract prescription data into structured JSON. Use only visible data.
Schema:
{
  "items": [
    {
      "drugnamesource": "string",
      "normalized_name": "string|null",
      "dose_value": "number|null",
      "dose_unit": "string|null",
      "frequency": "string|null",
      "duration": "string|null",
      "route": "string|null",
      "warnings": ["string"]
    }
  ],
  "notes": "string|null",
  "language_detected": "fa|ku|en|mixed"
}
Rules:
- Preserve units exactly (mg, IU, cc).
- Infer standard medical abbreviations (e.g., BID -> 2 times daily) for the normalized fields.
`;

export const REPORT_SUMMARY_PROMPT = `
Analyze this medical document or image (MRI/Ultrasound/Lab).
Provide a structured analysis containing:
1. **key_findings**: List of abnormal values or main observations.
2. **specialist_analysis**: A DETAILED MEDICAL INTERPRETATION for healthcare professionals. 
   - Explain the clinical significance of the findings.
   - Discuss potential differential diagnoses based on the data.
   - Provide clinical context (e.g., "Elevated WBC suggests infection...").
   - For Imaging (MRI/Ultrasound): Describe anatomical details, echogenicity, signal intensity, mass effects, and specific features of any lesions/pathologies.
   - Maintain a formal, objective medical tone suitable for a doctor.
3. **lay_summary**: A simple, reassuring explanation for the patient (non-medical language).
4. **uncertainties**: Parts that are unclear or illegible.
5. **disclaimer**: Standard medical disclaimer.

Output JSON Schema:
{
  "key_findings": ["string"],
  "specialist_analysis": "string",
  "lay_summary": "string",
  "uncertainties": ["string"],
  "disclaimer": "string"
}
`;

export const QR_CODE_PROMPT = `
Analyze the QR Code in this image.
1. Decode the raw data/URL stored in the QR code.
2. If the data is a URL or medical code, provide a context explanation (e.g., "Link to drug information", "Digital prescription ID").
3. If there is visible text around the QR code, include it.

Output JSON Schema:
{
  "raw_text": "The decoded content of the QR",
  "qr_data": "Same as raw_text",
  "qr_context": "Explanation of what this QR code is for"
}
`;

export const TRANSLATION_PROMPT_TEMPLATE = (targetLang: string) => {
  const langMap: Record<string, string> = {
    'fa': 'فارسی (Persian - Standard Iranian)',
    'ku': 'کوردی (Kurdish - Sorani/Central)',
    'en': 'انگلیسی (English - Medical)'
  };
  const targetLangName = langMap[targetLang] || targetLang;

  return `
Task: Translate the following medical data into ${targetLangName}.

Input Data: A structured JSON of a prescription or medical report.

**CRITICAL TRANSLATION RULES:**

1. **For Persian (fa):**
   - **Specialist Analysis**: Translate this field using high-level medical terminology (e.g., "هیپواکویک", "ضایعه فضاگیر", "ادم مغزی"). It should read like a report written by an Iranian specialist to another doctor. Explain clinical significance if implied in the source.
   - **Lay Summary**: Use simple, polite language for the patient.
   - **Context**: Iranian Medical System.
   - **Jargon**: OD (روزی یک بار), BID (هر ۱۲ ساعت), PRN (در صورت نیاز).

2. **For Kurdish (ku) - SORANI DIALECT (Central Kurdish):**
   - **STRICT SCRIPT RULE**: You MUST use the Sorani alphabet: (ئ، ۆ، ە، ڵ، ڕ، ێ). Pay attention to 'ڕ' (rolled R) and 'ڵ' (velarized L).
   - **Grammar**: Use Kurdish grammar structure (SOV). Do NOT use Persian sentence structure.
   - **Vocabulary - General**: Tablet (حەب), Syrup (شەربەت), Pain (ئازار), Infection (هەوکردن/ئیلتیهاب).
   - **Vocabulary - Specialist (MRI/Ultrasound)**:
     - Ultrasound: "سۆنەر" or "وێنەی دەنگی".
     - MRI: "وێنەی تیشکی موگناتیسی" or "MRI".
     - Mass/Tumor: "گرێ" or "ماس".
     - Cyst: "کیس".
     - Liver: "جگەر", Kidney: "گورچیلە", Gallbladder: "زراو", Lung: "سی".
     - Inflammation: "هەوکردن".
     - Findings: "دەرەنجامەکان" or "بینراوەکان".
     - Conclusion/Impression: "دەرئەنجام".
     - Normal: "ئاسایی", Abnormal: "نائاسایی".
   - **Specialist Analysis**: Translate this section as if a Kurdish doctor is writing to another doctor. Use formal, academic Sorani terms. Ensure the clinical significance is conveyed accurately.
   - **Lay Summary**: Use simple Sorani that a village elder would understand.

3. **For English (en):**
   - Use professional medical English for analysis and plain English for summary.

**Output JSON Structure:**
If Prescription:
{
  "language_target": "${targetLang}",
  "items_translated": [ ... ],
  "notes_translated": "string",
  "disclaimer": "string"
}

If Report:
{
  "language_target": "${targetLang}",
  "specialist_analysis_translated": "Translated Specialist Analysis (Full Professional Text)",
  "lay_summary_translated": "Translated Patient Summary (Simple Text)",
  "translated_text": "Full translation of raw text if applicable",
  "disclaimer": "string"
}
`;
};

export const PHARMACY_PROMPT_TEMPLATE = (targetLang: string) => {
  const langMap: Record<string, string> = {
    'fa': 'فارسی (Persian - Standard Iranian)',
    'ku': 'کوردی (Kurdish - Sorani/Central)',
    'en': 'انگلیسی (English - Medical)'
  };
  return `
Task: Analyze the drug name provided by the user. Identify the active ingredient, common brand names, category, and provide detailed usage instructions.
Target Language: ${langMap[targetLang] || targetLang}

Directives for Kurdish (Sorani):
- STRICTLY use Sorani script (ئ، ۆ، ە، ڵ، ڕ، ێ).
- Use terms like: "سودەکان" (Benefits/Uses), "چۆنیەتی بەکارهێنان" (Usage), "کاریگەرییە لاوەکییەکان" (Side effects).

Output JSON Schema:
{
  "drug_name_en": "Official generic name in English",
  "drug_name_local": "Name in target language (Sorani/Persian)",
  "brand_names": ["Common brand names"],
  "category": "Drug class (e.g., Antibiotic, NSAID)",
  "uses": "Detailed explanation of what it treats and benefits (Indication).",
  "mechanism": "Brief explanation of how it works (Mechanism of Action).",
  "usage_instructions": "General advice on how to take it (e.g., with food, time of day, form factor).",
  "side_effects": "Common side effects to watch for.",
  "warnings": "Key contraindications or warnings."
}
`;
};

export const SAFETY_CHECK_PROMPT = `
Review the output. Remove any direct medical advice ("You should take..."). Ensure the disclaimer "This is for educational purposes only; consult a doctor" is present in the target language.
`;

// --- UI TEXT ---

export const UI_TEXT = {
  [Language.EN]: {
    title: "Medical Assistant AI",
    uploadTitle: "Upload Medical Document",
    uploadDesc: "Drag & drop or use Camera for Prescriptions, Lab Reports, MRI, or QR Codes",
    uploadBtn: "Select File",
    cameraBtn: "Open Scanner",
    analyzing: "Analyzing document...",
    translating: "Translating content...",
    introDesc: "AI-powered medical assistant. Scan prescriptions, lab results, MRI/Ultrasounds, or QR Codes for instant expert analysis.",
    loadingMsg: "Processing image and generating medical analysis...",
    newScan: "Analyze another document",
    errorGeneric: "An error occurred. Please try again with a clearer image.",
    tryAgain: "Try Again",
    camera: {
      start: "Start Camera",
      capture: "Capture Scan",
      cancel: "Cancel",
      switch: "Switch Camera",
      permission: "Please allow camera access to scan documents."
    },
    modes: {
      scanner: "Smart Scanner",
      pharmacy: "Smart Pharmacy"
    },
    pharmacy: {
      title: "Smart Pharmacy Search",
      placeholder: "Enter drug name (e.g., Amoxicillin, Panadol, ASA)...",
      searchBtn: "Analyze Drug",
      searching: "Searching database...",
      labels: {
        name: "Drug Name",
        category: "Category",
        uses: "Benefits & Uses",
        mechanism: "Mechanism of Action",
        usage: "How to Use",
        sideEffects: "Side Effects",
        warnings: "Warnings"
      }
    },
    tabs: {
      extracted: "Extracted Data",
      translated: "Translation",
      original: "Original Image",
      summary: "Summary",
      specialist: "Specialist Analysis"
    },
    sections: {
        patientSummary: "Patient Summary",
        specialistAnalysis: "Medical Analysis (For Professionals)",
        keyFindings: "Key Findings"
    },
    disclaimer: "DISCLAIMER: This application provides educational information only. It does not provide medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.",
    developer: "Developer & Creator of Medical Assistant App: Sarhat Bahramand"
  },
  [Language.FA]: {
    title: "دستیار پزشکی Ai",
    uploadTitle: "بارگذاری یا اسکن سند",
    uploadDesc: "نسخه، آزمایش، MRI یا QR Code را بارگذاری یا اسکن کنید",
    uploadBtn: "انتخاب فایل",
    cameraBtn: "دوربین هوشمند",
    analyzing: "در حال تحلیل سند...",
    translating: "در حال ترجمه تخصصی...",
    introDesc: "دستیار هوشمند پزشکی. اسکن نسخه، آزمایش، عکس‌های رادیولوژی یا QR Code برای تحلیل دقیق.",
    loadingMsg: "در حال پردازش تصویر و تولید تحلیل پزشکی...",
    newScan: "تحلیل سند دیگر",
    errorGeneric: "خطایی رخ داد. لطفاً دوباره تلاش کنید.",
    tryAgain: "تلاش مجدد",
    camera: {
      start: "روشن کردن دوربین",
      capture: "ثبت تصویر",
      cancel: "لغو",
      switch: "چرخش دوربین",
      permission: "لطفاً برای اسکن مدارک دسترسی دوربین را تایید کنید."
    },
    modes: {
      scanner: "اسکنر هوشمند",
      pharmacy: "داروخانه هوشمند"
    },
    pharmacy: {
      title: "جستجوی پیشرفته دارو",
      placeholder: "نام دارو را وارد کنید (مثلا: آموکسی سیلین، استامینوفن...)",
      searchBtn: "تحلیل دارو",
      searching: "در حال جستجو...",
      labels: {
        name: "نام دارو",
        category: "دسته دارویی",
        uses: "فواید و موارد مصرف",
        mechanism: "مکانیسم اثر",
        usage: "نحوه مصرف",
        sideEffects: "عوارض جانبی",
        warnings: "هشدارها"
      }
    },
    tabs: {
      extracted: "داده‌های فنی",
      translated: "ترجمه و تحلیل",
      original: "تصویر اصلی",
      summary: "خلاصه",
      specialist: "تحلیل متخصص"
    },
    sections: {
        patientSummary: "خلاصه برای بیمار (به زبان ساده)",
        specialistAnalysis: "تحلیل تخصصی پزشکی (ویژه پزشکان)",
        keyFindings: "یافته‌های کلیدی"
    },
    disclaimer: "سلب مسئولیت: این برنامه صرفاً اطلاعات آموزشی ارائه می‌دهد و جایگزین نظر پزشک نیست.",
    developer: "توسعه دهنده و سازنده برنامه پزشک دستیار: سرهات بهره مند"
  },
  [Language.KU]: {
    title: "یاریدەدەری پزیشکی AI",
    uploadTitle: "بارکردن یان سکانکردن",
    uploadDesc: "ڕەچەتە، ڕاپۆرت، سۆنەر، MRI یان QR Code لێرە دابنێ",
    uploadBtn: "هەڵبژاردنی پەڕگە",
    cameraBtn: "سکانەری زیرەک",
    analyzing: "شیکارکردن...",
    translating: "وەرگێڕانی پسپۆڕی...",
    introDesc: "یاریدەدەری پزیشکی زیرەک. سکانی ڕەچەتە، پشکنین، وێنەی تیشکی یان کۆدی QR بکە بۆ شیکاری ورد.",
    loadingMsg: "پروانەکردنی وێنە و ئامادەکردنی شیکاری پزیشکی...",
    newScan: "شیکارکردنی تر",
    errorGeneric: "هەڵەیەک ڕوویدا. تکایە وێنەیەکی ڕوونتر باربکە.",
    tryAgain: "دووبارە هەوڵبدە",
    camera: {
      start: "کردنەوەی کامێرا",
      capture: "گرتنی وێنە",
      cancel: "پاشگەزبوونەوە",
      switch: "گۆڕینی کامێرا",
      permission: "تکایە ڕێگە بە کامێرا بدە بۆ سکانکردنی بەڵگەنامەکان."
    },
    modes: {
      scanner: "سکانەری زیرەک",
      pharmacy: "دەرمانخانەی زیرەک"
    },
    pharmacy: {
      title: "گەڕانی زیرەکی دەرمان",
      placeholder: "ناوی دەرمان بنووسە (نموونە: ئەموکسی سیلین، پاراسیتۆڵ...)",
      searchBtn: "شیکاری دەرمان",
      searching: "گەڕان...",
      labels: {
        name: "ناوی دەرمان",
        category: "جۆری دەرمان",
        uses: "سود و بەکارهێنان",
        mechanism: "شێوازی کارکردن",
        usage: "چۆنیەتی بەکارهێنان",
        sideEffects: "کاریگەرییە لاوەکییەکان",
        warnings: "ئاگادارییەکان"
      }
    },
    tabs: {
      extracted: "داتای تەکنیکی",
      translated: "وەرگێڕان و شیکاری",
      original: "وێنەی ڕەسەن",
      summary: "پوختە",
      specialist: "شیکاری پسپۆڕ"
    },
    sections: {
        patientSummary: "پوختە بۆ نەخۆش (بە زمانی سادە)",
        specialistAnalysis: "شیکاری پسپۆڕی پزیشکی (بۆ دکتۆر)",
        keyFindings: "دەرەنجامە سەرەکییەکان"
    },
    disclaimer: "بەرپرسیارێتی: ئەم بەرنامەیە تەنها زانیاری فێرکاری دەدات و جێگەی پزیشک ناگرێتەوە. تکایە سەردانی پزیشک بکە.",
    developer: "گەشەپێدەر و دروستکەری بەرنامەی پزیشکی یاریدەدەر: سەرهات بەهرەمەند"
  }
};