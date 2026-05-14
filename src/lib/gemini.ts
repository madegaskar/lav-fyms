
import { GoogleGenAI, Type } from "@google/genai";
import { GodResult } from "../types";

let ai: GoogleGenAI | null = null;

export async function analyzeFace(imageBase64: string, gender: string): Promise<GodResult> {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("API Key Gemini tidak ditemukan. Pastikan Anda telah menambahkan GEMINI_API_KEY di repository GitHub Secrets Anda.");
    }
    ai = new GoogleGenAI({ apiKey: apiKey as string });
  }

  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Analyze this person's facial features and "vibe" to match them with a specific Greek God or Goddess.
    IMPORTANT: The person has identified as ${gender.toUpperCase()}. 
    For "PRIA" (MALE), you MUST choose a Greek GOD from this list: Zeus, Poseidon, Apollon, Ares, Hephaestus, Hermes, Dionysus, Hades, Eros.
    For "WANITA" (FEMALE), you MUST choose a Greek GODDESS from this list: Hera, Demeter, Athena, Artemis, Aphrodite, Hestia, Persephone, Nike.
    For "LAINNYA" (OTHER), choose whichever feels most spiritually resonant from the combined list.

    Character References for your descriptions:
    - Zeus: Raja para dewa, penguasa langit, petir, dan hukum.
    - Hera: Ratu para dewa, dewi pernikahan, wanita, dan keluarga.
    - Poseidon: Dewa laut, gempa bumi, dan kuda.
    - Demeter: Dewi pertanian, panen, dan kesuburan tanah.
    - Athena: Dewi kebijaksanaan, strategi perang, dan kerajinan tangan.
    - Apollon: Dewa seni, musik, dan cahaya.
    - Artemis: Dewi perburuan, alam liar, dan bulan.
    - Ares: Dewa perang, keberanian, dan kemarahan.
    - Aphrodite: Dewi cinta, kecantikan, dan keinginan.
    - Hephaestus: Dewa pandai besi, api, dan kerajinan.
    - Hermes: Dewa pembawa pesan, perdagangan, dan pencuri.
    - Dionysus: Dewa anggur, pesta, dan teater.
    - Hades: Dewa dunia bawah dan kekayaan.
    - Hestia: Dewi perapian, rumah tangga, dan ketertiban.
    - Persephone: Ratu dunia bawah, dewi musim semi.
    - Eros: Dewa cinta dan gairah.
    - Nike: Dewi kemenangan.

    Be creative, eloquent, and encouraging. 
    Return the response strictly as a JSON object with the following structure:
    {
      "godName": "Name of the God/Goddess",
      "title": "Their divine title (e.g., God of the Sky)",
      "description": "A 2-3 sentence description of why their facial structure and vibe match this specific deity. Write in Indonesian.",
      "traits": ["Trait 1", "Trait 2", "Trait 3"],
      "careers": ["Career 1", "Career 2", "Career 3"]
    }
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/jpeg", data: imageBase64.split(",")[1] } }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          godName: { type: Type.STRING },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          traits: { type: Type.ARRAY, items: { type: Type.STRING } },
          careers: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["godName", "title", "description", "traits", "careers"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}
