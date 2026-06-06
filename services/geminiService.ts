import { GoogleGenAI, Type, Schema } from "@google/genai";
import { 
  SYSTEM_PROMPT, 
  CLASSIFICATION_PROMPT, 
  PRESCRIPTION_EXTRACTION_PROMPT, 
  REPORT_SUMMARY_PROMPT, 
  TRANSLATION_PROMPT_TEMPLATE, 
  PHARMACY_PROMPT_TEMPLATE,
  SAFETY_CHECK_PROMPT,
  QR_CODE_PROMPT
} from '../constants';
import { DocType, AnalysisResult, PrescriptionData, ReportSummary, TranslationData, PharmacyData } from '../types';

const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

/**
 * Image Preprocessing Helper
 * Applies Grayscale and Contrast Enhancement.
 * NOTE: Only used for text-heavy documents (Prescriptions, Lab Reports).
 * NOT used for MRI/Ultrasound to preserve soft tissue details.
 */
const preprocessImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    reader.onerror = reject;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(img.src.split(',')[1]);
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Moderate contrast for text legibility
      const contrast = 50; 
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        let enhanced = factor * (gray - 128) + 128;
        enhanced = Math.max(0, Math.min(255, enhanced));

        data[i] = enhanced;
        data[i + 1] = enhanced;
        data[i + 2] = enhanced;
      }

      ctx.putImageData(imageData, 0, 0);
      const processedBase64 = canvas.toDataURL(file.type).split(',')[1];
      resolve(processedBase64);
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Helper: Convert File to Raw Base64 (No Processing)
 */
const fileToBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Step 1: Classify the document
 */
async function classifyDocument(base64Data: string, mimeType: string): Promise<DocType> {
  const model = "gemini-2.5-flash";
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: CLASSIFICATION_PROMPT }
        ]
      },
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            classification: {
              type: Type.STRING,
              enum: [
                DocType.PRESCRIPTION,
                DocType.LAB_REPORT,
                DocType.ULTRASOUND_REPORT,
                DocType.MRI_REPORT,
                DocType.QR_CODE,
                DocType.GENERAL_TEXT
              ]
            },
            reason: { type: Type.STRING }
          },
          required: ["classification"]
        }
      }
    });
    
    const result = JSON.parse(response.text || "{}");
    return result.classification as DocType;
  } catch (error) {
    console.error("Classification failed:", error);
    return DocType.GENERAL_TEXT;
  }
}

/**
 * Step 2: Extract or Summarize based on type
 */
async function processDocumentContent(
  docType: DocType, 
  base64Data: string, 
  mimeType: string
): Promise<PrescriptionData | ReportSummary | { raw_text: string, qr_data?: string, qr_context?: string }> {
  
  const model = "gemini-2.5-flash"; 
  let prompt = "";
  let schema: Schema | undefined;

  if (docType === DocType.PRESCRIPTION) {
    prompt = PRESCRIPTION_EXTRACTION_PROMPT;
    schema = {
      type: Type.OBJECT,
      properties: {
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              drugnamesource: { type: Type.STRING },
              normalized_name: { type: Type.STRING, nullable: true },
              dose_value: { type: Type.NUMBER, nullable: true },
              dose_unit: { type: Type.STRING, nullable: true },
              frequency: { type: Type.STRING, nullable: true },
              duration: { type: Type.STRING, nullable: true },
              route: { type: Type.STRING, nullable: true },
              warnings: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        },
        notes: { type: Type.STRING, nullable: true },
        language_detected: { type: Type.STRING }
      }
    };
  } else if ([DocType.LAB_REPORT, DocType.MRI_REPORT, DocType.ULTRASOUND_REPORT].includes(docType)) {
    prompt = REPORT_SUMMARY_PROMPT;
    schema = {
      type: Type.OBJECT,
      properties: {
        key_findings: { type: Type.ARRAY, items: { type: Type.STRING } },
        specialist_analysis: { type: Type.STRING, description: "Detailed professional medical analysis" },
        lay_summary: { type: Type.STRING, description: "Simple patient explanation" },
        uncertainties: { type: Type.ARRAY, items: { type: Type.STRING } },
        disclaimer: { type: Type.STRING }
      }
    };
  } else if (docType === DocType.QR_CODE) {
    prompt = QR_CODE_PROMPT;
    schema = {
      type: Type.OBJECT,
      properties: {
        raw_text: { type: Type.STRING },
        qr_data: { type: Type.STRING },
        qr_context: { type: Type.STRING }
      }
    }
  } else {
    prompt = "Extract all text from this image as markdown.";
  }

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { mimeType, data: base64Data } },
        { text: prompt }
      ]
    },
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: schema ? "application/json" : "text/plain",
      responseSchema: schema
    }
  });

  if (schema) {
    return JSON.parse(response.text || "{}");
  } else {
    return { raw_text: response.text || "" };
  }
}

/**
 * Step 3: Translate the processed data
 */
async function translateContent(
  extractedData: any, 
  targetLang: string,
  docType: DocType
): Promise<TranslationData> {
  const model = "gemini-2.5-flash";
  const prompt = TRANSLATION_PROMPT_TEMPLATE(targetLang);
  
  const context = JSON.stringify(extractedData);

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { text: `Original Data: ${context}` },
        { text: prompt },
        { text: SAFETY_CHECK_PROMPT }
      ]
    },
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          language_target: { type: Type.STRING },
          items_translated: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                drug_display: { type: Type.STRING },
                dose_display: { type: Type.STRING, nullable: true },
                frequency_display: { type: Type.STRING, nullable: true },
                duration_display: { type: Type.STRING, nullable: true },
                route_display: { type: Type.STRING, nullable: true }
              }
            },
            nullable: true
          },
          notes_translated: { type: Type.STRING, nullable: true },
          specialist_analysis_translated: { type: Type.STRING, nullable: true },
          lay_summary_translated: { type: Type.STRING, nullable: true },
          translated_text: { type: Type.STRING, nullable: true },
          disclaimer: { type: Type.STRING }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

/**
 * Pharmacy Feature: Analyze Drug Name
 */
export async function analyzeDrug(drugName: string, targetLang: string): Promise<PharmacyData> {
  const model = "gemini-2.5-flash";
  const prompt = PHARMACY_PROMPT_TEMPLATE(targetLang);

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { text: `Query: ${drugName}` },
        { text: prompt }
      ]
    },
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          drug_name_en: { type: Type.STRING },
          drug_name_local: { type: Type.STRING },
          brand_names: { type: Type.ARRAY, items: { type: Type.STRING } },
          category: { type: Type.STRING },
          uses: { type: Type.STRING },
          mechanism: { type: Type.STRING },
          usage_instructions: { type: Type.STRING },
          side_effects: { type: Type.STRING },
          warnings: { type: Type.STRING }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

/**
 * Main Orchestrator
 */
export async function analyzeDocument(
  file: File, 
  targetLang: string
): Promise<AnalysisResult> {
  // 1. Get RAW Base64 first for classification
  const rawBase64 = await fileToBase64(file);
  const mimeType = file.type;

  // 2. Classify
  const docType = await classifyDocument(rawBase64, mimeType);
  
  // 3. Intelligent Processing Decision
  let dataToProcess = rawBase64;

  // Only preprocess (Contrast/Grayscale) if it is a text document (Prescription/Lab Report).
  // DO NOT preprocess MRI, Ultrasound, or QR CODES. QR codes need clean edges.
  if (docType === DocType.PRESCRIPTION || docType === DocType.LAB_REPORT) {
    if (mimeType.startsWith('image/')) {
      try {
        dataToProcess = await preprocessImage(file);
      } catch (e) {
        console.warn("Preprocessing failed, using raw", e);
      }
    }
  }

  // 4. Extract/Structure
  const structuredData = await processDocumentContent(docType, dataToProcess, mimeType);

  // 5. Translate
  const translation = await translateContent(structuredData, targetLang, docType);

  return {
    docType,
    structuredData: (structuredData as any),
    translation
  };
}