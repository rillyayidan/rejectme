import { VertexAI, GenerationConfig } from '@google-cloud/vertexai';
import { personas, PersonaId } from './personas';

// Inisialisasi Vertex AI (Pastikan Env terisi di GCP/Vercel)
const project = process.env.GOOGLE_CLOUD_PROJECT || '';
const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

const vertexAI = new VertexAI({ project, location });

// Gunakan Gemini 1.5 Flash untuk kecepatan dan efisiensi Credit (VibeCoding style!)
// Atau 1.5 Pro jika butuh analisis yang sangat mendalam
const model = vertexAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
});

const generationConfig: GenerationConfig = {
  temperature: 0.7,
  topP: 0.8,
  topK: 40,
  maxOutputTokens: 2048,
  responseMimeType: 'application/json', // MEMAKSA OUTPUT JSON
};

export async function getRoastStream(cvText: string, personaId: PersonaId) {
  const persona = personas[personaId];
  
  // Rancang Prompt yang sangat ketat
  const prompt = `
    ${persona.systemPrompt}

    RUBRIK PENILAIAN KAMU:
    ${persona.rubric.map(r => `- ${r.name}: ${r.description}`).join('\n')}

    BERIKAN PENILAIAN TERHADAP CV BERIKUT:
    ---
    ${cvText}
    ---

    OUTPUT HARUS DALAM FORMAT JSON BERIKUT:
    {
      "openingRoast": "Kalimat pembuka yang sangat pedas sesuai karaktermu",
      "survivalScore": 0-100 (angka),
      "breakdown": {
        "rubric1": 0-100,
        "rubric2": 0-100,
        "rubric3": 0-100
      },
      "critiques": [
        {
          "section": "Nama bagian CV",
          "issue": "Kritik pedas kamu",
          "fix": "Saran perbaikan yang konkret"
        }
      ],
      "closingStatement": "Kalimat penutup yang meremehkan tapi membangun"
    }
  `;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    });

    const response = result.response;
    return response.candidates?.[0].content.parts[0].text;
  } catch (error) {
    console.error('Error calling Vertex AI:', error);
    throw new Error('Gagal mendapatkan roast dari AI.');
  }
}

// Fungsi untuk memperbaiki bullet point tertentu
export async function getFixSuggestion(originalText: string, issue: string, personaId: PersonaId) {
  const persona = personas[personaId];
  
  const prompt = `
    Kamu adalah ${persona.name} (${persona.role}). 
    Sebelumnya kamu mengkritik bagian CV ini: "${originalText}"
    Kritikmu adalah: "${issue}"

    Tugasmu sekarang: Tuliskan ulang bagian tersebut agar sesuai dengan seleramu dan standar ${persona.id}.
    
    ATURAN:
    - Jangan terlalu panjang, tetap padat dan jelas.
    - Gunakan gaya bahasa yang sesuai dengan karaktermu.
    - Kembalikan HANYA teks perbaikannya saja tanpa komentar tambahan.
  `;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      // Kita tidak perlu responseMimeType JSON di sini karena kita cuma butuh teks bersih
    });

    // Cara akses teks yang benar di Vertex AI SDK:
    const response = result.response;
    const fixedText = response.candidates?.[0].content.parts[0].text;

    return fixedText || originalText; 
  } catch (error) {
    console.error('Error fixing text:', error);
    return originalText; // Fallback ke teks asli jika gagal
  }
}