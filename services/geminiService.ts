import { GoogleGenAI, Modality } from "@google/genai";

// Asume que process.env.API_KEY está disponible en el entorno de ejecución.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

/**
 * Genera una imagen utilizando el modelo Imagen.
 * @param prompt El prompt de texto que describe la imagen.
 * @returns Una promesa que se resuelve con la URL de datos de la imagen en base64.
 */
export const generateImage = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: '1:1',
            },
        });
        
        if (!response.generatedImages || response.generatedImages.length === 0) {
            throw new Error("La API no devolvió ninguna imagen.");
        }

        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/png;base64,${base64ImageBytes}`;

    } catch (error) {
        console.error("Error al generar la imagen con Gemini:", error);
        if (error instanceof Error) {
            throw new Error(`Error al generar la imagen: ${error.message}`);
        }
        throw new Error("Ocurrió un error desconocido al generar la imagen.");
    }
};

/**
 * Genera audio a partir de texto utilizando el modelo TTS de Gemini.
 * @param text El texto a convertir en audio.
 * @returns Una promesa que se resuelve con los datos de audio en formato base64.
 */
export const generateSpeech = async (text: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!audioData) {
            throw new Error("La API no devolvió datos de audio.");
        }
        return audioData;
    } catch (error) {
        console.error("Error al generar el audio con Gemini:", error);
        if (error instanceof Error) {
            throw new Error(`Error al generar el audio: ${error.message}`);
        }
        throw new Error("Ocurrió un error desconocido al generar el audio.");
    }
};

/**
 * Traduce texto a un idioma de destino utilizando Gemini.
 * @param text El texto a traducir.
 * @param targetLanguageName El nombre del idioma de destino (ej. "Inglés", "Francés").
 * @param sourceLanguageName El nombre del idioma de origen o "Auto" para la detección automática.
 * @returns Una promesa que se resuelve con el texto traducido.
 */
export const translateText = async (text: string, targetLanguageName: string, sourceLanguageName: string): Promise<string> => {
    try {
        const prompt = sourceLanguageName === 'Auto'
            ? `Translate the following text to ${targetLanguageName}: "${text}"`
            : `Translate the following text from ${sourceLanguageName} to ${targetLanguageName}: "${text}"`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response.text;
    } catch (error) {
        console.error("Error al traducir texto con Gemini:", error);
        if (error instanceof Error) {
            throw new Error(`Error al traducir: ${error.message}`);
        }
        throw new Error("Ocurrió un error desconocido durante la traducción.");
    }
};