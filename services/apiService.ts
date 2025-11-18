
import { DriveFile } from '../types';
import { GoogleGenAI } from "@google/genai";

// Inicializa el cliente de Gemini directamente en el servicio.
// Asume que process.env.API_KEY está disponible a través de la configuración en App.tsx que lo establece.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
const model = 'gemini-2.5-flash'; // Usamos un modelo que soporta multimodalidad

const HIGHLIGHT_INSTRUCTION = " Resalta los términos, nombres, fechas y datos más importantes en tu respuesta en negrita usando Markdown (**texto**).";

// --- Funciones de Ayuda ---

/**
 * Convierte un objeto File a una cadena de datos base64.
 * @param file El archivo a convertir.
 * @returns Una promesa que se resuelve con la URL de datos en base64.
 */
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

/**
 * Función centralizada para llamar a la API de Gemini con contenido de documento.
 * @param base64Data Los datos del archivo en formato base64.
 * @param mimeType El tipo MIME del archivo.
 * @param question La pregunta del usuario sobre el documento.
 * @returns Una promesa que se resuelve con la respuesta del modelo.
 */
const analyzeDocumentContent = async (base64Data: string, mimeType: string, question: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64Data,
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: question + HIGHLIGHT_INSTRUCTION,
                    },
                ],
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error al analizar el documento con Gemini:", error);
        if (error instanceof Error) {
            throw new Error(`Error de la API de Gemini: ${error.message}`);
        }
        throw new Error("Ocurrió un error desconocido durante el análisis.");
    }
};

// --- Funciones Exportadas ---

/**
 * Analiza un archivo local enviándolo directamente a la API de Gemini.
 * @param file El archivo a analizar.
 * @param question La pregunta sobre el documento.
 * @returns Una promesa que se resuelve con la respuesta de la IA.
 */
export const analyzeLocalDocument = async (file: File, question: string): Promise<string> => {
    try {
        const dataUrl = await fileToBase64(file);
        const base64String = dataUrl.split(',')[1]; // Extrae solo los datos base64
        return await analyzeDocumentContent(base64String, file.type, question);
    } catch (error) {
        console.error("Error procesando el archivo local:", error);
        throw new Error("No se pudo leer o procesar el archivo local.");
    }
};

/**
 * Descarga y analiza un archivo de Google Drive directamente en el navegador.
 * @param file El objeto DriveFile con id, name, y mimeType.
 * @param accessToken El token de acceso OAuth2 del usuario.
 * @param question La pregunta sobre el documento.
 * @returns Una promesa que se resuelve con la respuesta de la IA.
 */
export const analyzeDriveDocument = async (file: DriveFile, accessToken: string, question:string): Promise<string> => {
    const isGoogleDoc = file.mimeType.includes('google-apps');
    const exportMimeType = 'application/pdf'; // Exportar documentos de Google como PDF

    try {
        let fileContentResponse;
        if (isGoogleDoc) {
            // Para documentos nativos de Google, necesitamos exportarlos
            fileContentResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=${exportMimeType}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
        } else {
            // Para archivos binarios (PDF, DOCX, etc.), los obtenemos directamente
            fileContentResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
        }

        if (!fileContentResponse.ok) {
            const errorData = await fileContentResponse.json().catch(() => ({}));
            throw new Error(`No se pudo obtener el archivo de Drive: ${errorData?.error?.message || fileContentResponse.statusText}`);
        }

        // Convertir el contenido del archivo a base64
        const blob = await fileContentResponse.blob();
        const reader = new FileReader();
        const base64String = await new Promise<string>((resolve, reject) => {
            reader.onload = () => {
                const dataUrl = reader.result as string;
                resolve(dataUrl.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

        const effectiveMimeType = isGoogleDoc ? exportMimeType : file.mimeType;
        return await analyzeDocumentContent(base64String, effectiveMimeType, question);
    } catch (error) {
        console.error("Error al procesar el archivo de Drive:", error);
        if (error instanceof Error) {
            throw new Error(`Error con Google Drive: ${error.message}`);
        }
        throw new Error("Ocurrió un error desconocido al acceder al archivo de Drive.");
    }
};
