import { GoogleGenAI } from '@google/genai';
import type { DevicePassportResult, MaterialEntry, HazardEntry } from '../types/devicePassport';

// VITE_ prefix is required for Vite to expose the variable to the browser bundle.
const GEMINI_API_KEY: string = (import.meta.env.VITE_GEMINI_API_KEY as string) || '';

// Build Gemini client
function getClient(): GoogleGenAI | null {
  const key = GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY' || key.length < 10) return null;
  return new GoogleGenAI({ apiKey: key });
}

/**
 * Convert File to base64 inline data for Gemini vision
 */
async function fileToBase64(file: File): Promise<{ inlineData: { data: string; mimeType: string } }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve({ inlineData: { data: base64, mimeType: file.type } });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Parse raw error (string, Error, or JSON body) into a short human-readable message.
 * Never lets raw JSON bleed into the UI.
 */
function parseErrorMessage(err: unknown): { message: string; type: 'api_key' | 'network' | 'quota' | 'unknown' } {
  const raw = err instanceof Error ? err.message : String(err);

  // Try to parse JSON body that some SDK versions embed in the message
  try {
    // The SDK sometimes returns the full JSON response as the error message
    const jsonStart = raw.indexOf('{');
    if (jsonStart !== -1) {
      const parsed = JSON.parse(raw.slice(jsonStart)) as {
        error?: { code?: number; message?: string; status?: string };
      };
      const apiMsg = parsed?.error?.message || '';
      const status = parsed?.error?.status || '';
      const code = parsed?.error?.code || 0;

      if (status === 'INVALID_ARGUMENT' || apiMsg.toLowerCase().includes('api key not valid') || apiMsg.toLowerCase().includes('api_key_invalid')) {
        return {
          message: 'Your Gemini API key is invalid. Please check your .env file and make sure VITE_GEMINI_API_KEY is set to a valid key from Google AI Studio.',
          type: 'api_key',
        };
      }
      if (code === 429 || status === 'RESOURCE_EXHAUSTED') {
        return {
          message: 'You have exceeded the Gemini API rate limit or quota. Please wait a moment and try again.',
          type: 'quota',
        };
      }
      if (apiMsg) {
        return { message: apiMsg, type: 'unknown' };
      }
    }
  } catch {
    // not JSON — fall through to string checks
  }

  if (raw.toLowerCase().includes('api key') || raw.toLowerCase().includes('invalid_argument')) {
    return {
      message: 'Your Gemini API key is invalid. Please check your .env file.',
      type: 'api_key',
    };
  }
  if (raw.toLowerCase().includes('fetch') || raw.toLowerCase().includes('network') || raw.toLowerCase().includes('failed to fetch')) {
    return {
      message: 'Network error — please check your internet connection and try again.',
      type: 'network',
    };
  }
  if (raw.toLowerCase().includes('quota') || raw.toLowerCase().includes('rate limit')) {
    return {
      message: 'API rate limit reached. Please wait a moment and try again.',
      type: 'quota',
    };
  }

  return { message: 'Something went wrong with the AI request. Please try again.', type: 'unknown' };
}

const IDENTIFICATION_PROMPT = (userHint: string) => `
You are an expert electronics materials analyst. Analyze this device image${userHint ? ` (user says: "${userHint}")` : ''}.

Return ONLY a valid JSON object with this exact schema (no markdown, no prose):
{
  "identified": true | false,
  "confidence": "high" | "medium" | "low",
  "category": "mobile" | "laptop" | "tablet" | "desktop" | "charger_cable" | "battery" | "audio_wearable" | "home_appliance" | "crt_display" | "other",
  "brand": "string or null",
  "model": "string or null",
  "approximateYear": number | null,
  "approximateWeightKg": number | null,
  "weightSource": "string describing source / methodology",
  "materials": [
    {
      "name": "string (e.g. Lithium, Copper, Gold, Cobalt, Plastic, Steel, Aluminum, Lead, Mercury)",
      "estimatedMinGrams": number,
      "estimatedMaxGrams": number,
      "unit": "grams" | "milligrams" | "kg" | "percent",
      "isHazardous": true | false,
      "source": "string citing the actual published study or dataset, e.g. 'UNEP 2019 Global E-waste Monitor' or 'EU JRC 2020 Critical Raw Materials'",
      "notes": "string explaining variability or uncertainty"
    }
  ],
  "hazards": [
    {
      "type": "lithium_battery" | "lead" | "mercury" | "cadmium" | "crt" | "pcb_flame_retardant" | "beryllium" | "other",
      "present": true | false,
      "severity": "critical" | "high" | "medium" | "low",
      "safetyInstructions": ["array of specific safety steps for pickup/handling"]
    }
  ],
  "dataLimitations": "string explaining what data is approximate and why",
  "needsMoreInfo": true | false,
  "clarificationQuestion": "string or null — question to ask user if identification is uncertain"
}

CRITICAL RULES:
1. Only include materials for which you have legitimate published research backing.
2. Never invent exact numbers — always provide a min/max range.
3. Cite real sources (UNEP, EU JRC, EPA, peer-reviewed journals, WEEE Forum data).
4. If you cannot identify the device or find reliable material data, set "identified": false and explain in "dataLimitations".
5. If image is unclear, set "needsMoreInfo": true.
6. Material composition varies by manufacturing batch — say so in notes.
`;

const TEXT_IDENTIFICATION_PROMPT = (brand: string, model: string) => `
You are an expert electronics materials analyst. The user wants a Device Passport for: "${brand} ${model}".

Return ONLY a valid JSON object with this exact schema (no markdown, no prose):
{
  "identified": true | false,
  "confidence": "high" | "medium" | "low",
  "category": "mobile" | "laptop" | "tablet" | "desktop" | "charger_cable" | "battery" | "audio_wearable" | "home_appliance" | "crt_display" | "other",
  "brand": "string or null",
  "model": "string or null",
  "approximateYear": number | null,
  "approximateWeightKg": number | null,
  "weightSource": "string",
  "materials": [
    {
      "name": "string",
      "estimatedMinGrams": number,
      "estimatedMaxGrams": number,
      "unit": "grams" | "milligrams" | "kg" | "percent",
      "isHazardous": true | false,
      "source": "string citing published study or dataset",
      "notes": "string"
    }
  ],
  "hazards": [
    {
      "type": "lithium_battery" | "lead" | "mercury" | "cadmium" | "crt" | "pcb_flame_retardant" | "beryllium" | "other",
      "present": true | false,
      "severity": "critical" | "high" | "medium" | "low",
      "safetyInstructions": ["array of specific safety steps"]
    }
  ],
  "dataLimitations": "string",
  "needsMoreInfo": true | false,
  "clarificationQuestion": "string or null"
}

CRITICAL RULES:
1. Only include materials backed by legitimate published research.
2. Always provide min/max ranges, never single exact values.
3. Cite real sources (UNEP, EU JRC, EPA, peer-reviewed journals).
4. If you cannot find reliable material data for this specific model, set "identified": false.
5. Material composition varies by manufacturing batch — note this.
6. Be honest about uncertainty — this is for e-waste processing safety.
`;

export type AIErrorType = 'api_key' | 'network' | 'quota' | 'unknown' | 'not_configured';

export interface AIIdentificationResult {
  raw: DevicePassportResult;
  isApiAvailable: boolean;
  errorType?: AIErrorType;
  errorMessage?: string;
}

export async function identifyDeviceFromImage(
  file: File,
  userHint?: string
): Promise<AIIdentificationResult> {
  const client = getClient();
  if (!client) {
    return {
      raw: buildUnavailableResult(''),
      isApiAvailable: false,
      errorType: 'not_configured',
      errorMessage: 'Gemini API key not configured.',
    };
  }

  try {
    const imagePart = await fileToBase64(file);
    const response = await client.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: IDENTIFICATION_PROMPT(userHint || '') },
            imagePart,
          ],
        },
      ],
    });

    const text = response.text ?? '';
    const parsed = extractJSON(text);
    return { raw: parsed, isApiAvailable: true };
  } catch (err: unknown) {
    const { message, type } = parseErrorMessage(err);
    return {
      raw: buildUnavailableResult(''),
      isApiAvailable: true,
      errorType: type,
      errorMessage: message,
    };
  }
}

export async function identifyDeviceFromText(
  brand: string,
  model: string
): Promise<AIIdentificationResult> {
  const client = getClient();
  if (!client) {
    return {
      raw: buildUnavailableResult(''),
      isApiAvailable: false,
      errorType: 'not_configured',
      errorMessage: 'Gemini API key not configured.',
    };
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: TEXT_IDENTIFICATION_PROMPT(brand, model) }],
        },
      ],
    });

    const text = response.text ?? '';
    const parsed = extractJSON(text);
    return { raw: parsed, isApiAvailable: true };
  } catch (err: unknown) {
    const { message, type } = parseErrorMessage(err);
    return {
      raw: buildUnavailableResult(''),
      isApiAvailable: true,
      errorType: type,
      errorMessage: message,
    };
  }
}

function extractJSON(text: string): DevicePassportResult {
  const stripped = text.replace(/```json?\n?/gi, '').replace(/```/g, '').trim();
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start === -1 || end === -1) {
    return buildUnavailableResult('AI returned an unreadable response. Please try again.');
  }
  try {
    return JSON.parse(stripped.slice(start, end + 1)) as DevicePassportResult;
  } catch {
    return buildUnavailableResult('Could not parse AI response. Please try again with clearer input.');
  }
}

function buildUnavailableResult(message: string): DevicePassportResult {
  return {
    identified: false,
    confidence: 'low',
    category: 'other',
    brand: null,
    model: null,
    approximateYear: null,
    approximateWeightKg: null,
    weightSource: 'Unavailable',
    materials: [],
    hazards: [],
    dataLimitations: message,
    needsMoreInfo: true,
    clarificationQuestion: 'Could you tell us the brand and exact model number of your device?',
  };
}

// Re-export types
export type { DevicePassportResult, MaterialEntry, HazardEntry };
