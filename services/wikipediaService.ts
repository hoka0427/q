
import { GroundingSource } from '../types';

/**
 * Searches Wikipedia for a given term.
 * @param searchTerm The term to search for.
 * @returns A promise that resolves to an object with a content message and a list of sources.
 */
export const searchWikipedia = async (searchTerm: string): Promise<{ content: string; sources: GroundingSource[] }> => {
    const WIKI_API_URL = "https://es.wikipedia.org/w/api.php";
    const params = new URLSearchParams({
        action: 'query',
        list: 'search',
        srsearch: searchTerm,
        format: 'json',
        origin: '*',
        srlimit: '3',
    });

    try {
        const response = await fetch(`${WIKI_API_URL}?${params.toString()}`);
        if (!response.ok) throw new Error(`La API de Wikipedia respondió con el estado: ${response.status}`);
        
        const data = await response.json();
        if (data.error) throw new Error(`Error de la API de Wikipedia: ${data.error.info}`);

        const searchResults = data.query.search;
        if (searchResults.length === 0) {
            return {
                content: `No se encontraron resultados en Wikipedia para "${searchTerm}".`,
                sources: []
            };
        }

        const sources: GroundingSource[] = searchResults.map((result: any) => ({
            title: result.title,
            uri: `https://es.wikipedia.org/wiki/${encodeURIComponent(result.title.replace(/ /g, '_'))}`,
        }));
        
        return {
            content: "He encontrado estos resultados. ¿Sobre cuál quieres saber más?",
            sources: sources
        };

    } catch (error) {
        console.error("Error al buscar en Wikipedia:", error);
        if (error instanceof Error && error.message.includes('Failed to fetch')) {
             throw new Error('No se pudo conectar con Wikipedia. Revisa tu conexión a internet.');
        }
        throw error;
    }
};

/**
 * Fetches the introductory summary of a Wikipedia article.
 * @param title The title of the article.
 * @returns A promise that resolves to the article's summary.
 */
export const getWikipediaSummary = async (title: string): Promise<string> => {
    const WIKI_API_URL = "https://es.wikipedia.org/w/api.php";
    const params = new URLSearchParams({
        action: 'query',
        prop: 'extracts',
        exintro: 'true',
        explaintext: 'true',
        format: 'json',
        origin: '*',
        titles: title,
        redirects: '1',
    });

    try {
        const response = await fetch(`${WIKI_API_URL}?${params.toString()}`);
        if (!response.ok) throw new Error(`La API de Wikipedia respondió con el estado: ${response.status}`);

        const data = await response.json();
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];
        
        if (pageId === '-1' || !pages[pageId].extract) {
            return `No se pudo encontrar un resumen para "${title}".`;
        }

        return pages[pageId].extract;
    } catch (error) {
        console.error("Error al obtener el resumen de Wikipedia:", error);
        throw new Error("No se pudo obtener el resumen del artículo.");
    }
};
