

import React, { useState, useEffect, useRef, useCallback, createContext } from 'react';
// FIX: Moved getWikipediaSummary import to wikipediaService
import { analyzeLocalDocument, analyzeDriveDocument } from './services/apiService';
import { searchWikipedia, getWikipediaSummary } from './services/wikipediaService';
import { generateImage, generateSpeech, translateText } from './services/geminiService';
import { ChatMessage, MessageRole, DriveFile, HistoryItem, GroundingSource } from './types';
import HistoryPanel from './components/HistoryPanel';
import ConfirmationDialog from './components/ConfirmationDialog';
import SetupGuide from './components/SetupGuide';
import InfoIcon from './components/icons/InfoIcon';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';


// --- Audio Helper Functions ---
function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}


declare global {
  interface Window {
    GOOGLE_CONFIG: {
      API_KEY: string;
      CLIENT_ID: string;
      SCOPE: string;
    };
    gapi: any;
    google: any;
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface AppContextType {
    // State
    messages: ChatMessage[];
    promptInput: string;
    isLoading: boolean;
    analysisMode: 'ia' | 'wiki' | 'imagen' | 'traductor';
    history: HistoryItem[];
    theme: 'light' | 'dark';
    isConfirmOpen: boolean;
    isClearAllConfirmOpen: boolean;
    showSetupGuide: boolean;
    googleConfig: Window['GOOGLE_CONFIG'] | null;
    oauthToken: string | null;
    pickerApiLoaded: boolean;
    selectedDriveFile: DriveFile | null;
    selectedLocalFile: File | null;
    isDraggingOver: boolean;
    isSummarizing: boolean;
    isRecording: boolean;
    audioPlayingId: string | null;
    voiceLanguage: string;
    targetLanguage: string;
    sourceLanguage: string;
    
    // Refs
    fileInputRef: React.RefObject<HTMLInputElement>;
    
    // Setters & Handlers
    setPromptInput: React.Dispatch<React.SetStateAction<string>>;
    setAnalysisMode: React.Dispatch<React.SetStateAction<'ia' | 'wiki' | 'imagen' | 'traductor'>>;
    toggleTheme: () => void;
    setShowSetupGuide: React.Dispatch<React.SetStateAction<boolean>>;
    setVoiceLanguage: React.Dispatch<React.SetStateAction<string>>;
    setTargetLanguage: React.Dispatch<React.SetStateAction<string>>;
    setSourceLanguage: React.Dispatch<React.SetStateAction<string>>;

    handleLocalFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleDragEnter: (e: React.DragEvent) => void;
    handleDragLeave: (e: React.DragEvent) => void;
    handleDrop: (e: React.DragEvent) => void;
    handleRemoveFile: (e: React.MouseEvent) => void;
    
    handleAuthClick: () => void;
    openPicker: () => void;
    
    handleSourceClick: (source: GroundingSource) => Promise<void>;
    handleQuickReplyClick: (reply: string) => void;
    handleSubmit: () => Promise<void>;
    
    handleSelectHistory: (item: HistoryItem) => void;
    handleOpenConfirmDialog: (id: string) => void;
    handleOpenClearAllDialog: () => void;

    toggleRecording: () => void;
    handlePlayAudio: (message: ChatMessage) => Promise<void>;
}

export const AppContext = createContext<AppContextType | null>(null);


const App: React.FC = () => {
    // State management
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [promptInput, setPromptInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [analysisMode, setAnalysisMode] = useState<'ia' | 'wiki' | 'imagen' | 'traductor'>('ia');
    const [history, setHistory] = useState<HistoryItem[]>(() => {
        try {
            const savedHistory = localStorage.getItem('analysisSuiteHistory');
            return savedHistory ? JSON.parse(savedHistory) : [];
        } catch (error) {
            console.error("Error al cargar el historial:", error);
            return [];
        }
    });
    
    // Theme and Dialog State
    const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'dark');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);
    const [showSetupGuide, setShowSetupGuide] = useState(false);
    const [googleConfig, setGoogleConfig] = useState<Window['GOOGLE_CONFIG'] | null>(null);


    // Drive & File State
    const [oauthToken, setOauthToken] = useState<string | null>(null);
    const [pickerApiLoaded, setPickerApiLoaded] = useState(false);
    const [selectedDriveFile, setSelectedDriveFile] = useState<DriveFile | null>(null);
    const [selectedLocalFile, setSelectedLocalFile] = useState<File | null>(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentFileSessionId, setCurrentFileSessionId] = useState<string | null>(null);
    const [isSummarizing, setIsSummarizing] = useState(false);


    // Audio & Language State
    const [isRecording, setIsRecording] = useState(false);
    const [audioPlayingId, setAudioPlayingId] = useState<string | null>(null);
    const [voiceLanguage, setVoiceLanguage] = useState('es-ES');
    const [targetLanguage, setTargetLanguage] = useState('English');
    const [sourceLanguage, setSourceLanguage] = useState('Auto');
    const recognitionRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    useEffect(() => { localStorage.setItem('analysisSuiteHistory', JSON.stringify(history)); }, [history]);
    useEffect(() => {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    }, [theme]);
    
    // Load config on startup and check if setup is needed.
    useEffect(() => {
      const storedApiKey = localStorage.getItem('googleApiKey');
      const storedClientId = localStorage.getItem('googleClientId');
      
      let config = window.GOOGLE_CONFIG;
      if (storedApiKey && storedClientId) {
          config = { API_KEY: storedApiKey, CLIENT_ID: storedClientId, SCOPE: window.GOOGLE_CONFIG.SCOPE };
      }
      setGoogleConfig(config);

      const keysArePlaceholders = config.API_KEY.includes('TU_GOOGLE_API_KEY') || config.CLIENT_ID.includes('TU_GOOGLE_CLIENT_ID');
      if (keysArePlaceholders) {
          setShowSetupGuide(true);
      }
        
      if (messages.length === 0 && !selectedLocalFile && !selectedDriveFile) {
        addMessage("¡Hola! ¿Cómo puedo ayudarte hoy? Elige un modo para empezar.", MessageRole.MODEL);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const addMessage = useCallback((content: string, role: MessageRole, options: Partial<ChatMessage> = {}) => {
        setMessages(prev => [...prev, { id: Date.now().toString(), role, content, ...options }]);
    }, []);

    const addToHistory = useCallback((prompt: string, response: string, type: HistoryItem['type'], options: { imageUrl?: string, fileName?: string } = {}) => {
        const newItem: HistoryItem = { id: Date.now().toString(), type, prompt, response, timestamp: Date.now(), ...options };
        setHistory(prev => [newItem, ...prev]);
    }, []);

    const getFileName = useCallback(() => selectedLocalFile?.name || selectedDriveFile?.name || null, [selectedLocalFile, selectedDriveFile]);


    // Effect for automatic document summarization
    useEffect(() => {
        const file = selectedLocalFile || selectedDriveFile;

        if (!file) {
            if (currentFileSessionId) setCurrentFileSessionId(null);
            return;
        }

        if (selectedDriveFile && !oauthToken) {
            return; // Wait for auth token for Drive files
        }

        const fileId = selectedLocalFile ? `${selectedLocalFile.name}-${selectedLocalFile.size}` : selectedDriveFile!.id;

        if (fileId === currentFileSessionId) {
            return; // Already processed this file in the current session
        }

        const summarizeDocument = async () => {
            setCurrentFileSessionId(fileId);
            setIsSummarizing(true);
            setIsLoading(true);
            setMessages([]); // Start with a clean slate for the new document

            try {
                const summaryPrompt = "Proporciona un resumen conciso y bien estructurado de este documento.";
                let summary = '';
                if (selectedLocalFile) {
                    summary = await analyzeLocalDocument(selectedLocalFile, summaryPrompt);
                } else if (selectedDriveFile && oauthToken) {
                    summary = await analyzeDriveDocument(selectedDriveFile, oauthToken, summaryPrompt);
                }
                addMessage(summary, MessageRole.MODEL, { quickReplies: ["¿Cuáles son los puntos clave?", "¿Quién es el autor?", "Explica el propósito principal."]});
                addToHistory(summaryPrompt, summary, 'ia', { fileName: getFileName() });

            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error al generar el resumen.';
                addMessage(errorMessage, MessageRole.ERROR);
                setSelectedLocalFile(null);
                setSelectedDriveFile(null);
                setCurrentFileSessionId(null);
            } finally {
                setIsSummarizing(false);
                setIsLoading(false);
            }
        };

        summarizeDocument();
    }, [selectedLocalFile, selectedDriveFile, oauthToken, currentFileSessionId, addMessage, addToHistory, getFileName]);

    const toggleTheme = useCallback(() => setTheme(prev => prev === 'dark' ? 'light' : 'dark'), []);
    
    const initClient = useCallback(() => {
        if (window.gapi && googleConfig) {
            window.gapi.client.init({
                apiKey: googleConfig.API_KEY,
                clientId: googleConfig.CLIENT_ID,
                scope: googleConfig.SCOPE,
                discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
            }).then(() => {
                window.gapi.load('picker', () => {
                    setPickerApiLoaded(true);
                });
            }).catch((error: any) => {
                console.error("Error initializing GAPI client", error);
                addMessage("No se pudo inicializar la API de Google. Revisa la configuración de tus credenciales y la consola del navegador.", MessageRole.ERROR);
            });
        }
    }, [googleConfig, addMessage]);

    // Initialize GAPI client only when config is valid.
    useEffect(() => {
        if (googleConfig) {
            const keysArePlaceholders = googleConfig.API_KEY.includes('TU_GOOGLE_API_KEY') || googleConfig.CLIENT_ID.includes('TU_GOOGLE_CLIENT_ID');
            if (!keysArePlaceholders && window.gapi) {
                window.gapi.load('client:auth2', initClient);
            }
        }
    }, [googleConfig, initClient]);
    
    const handleAuthClick = useCallback(async () => {
      if (showSetupGuide) {
        addMessage("Por favor, completa la guía de configuración para conectar con Google Drive.", MessageRole.ERROR);
        return;
      }
      try {
        const authInstance = window.gapi.auth2.getAuthInstance();
        if (!authInstance) {
            addMessage("La instancia de autenticación de Google no está lista. Inténtalo de nuevo en un momento.", MessageRole.ERROR);
            return;
        }
        const authResult = await authInstance.signIn();
        setOauthToken(authResult.getAuthResponse().access_token);
      } catch (err: any) {
        console.error("Auth error", err);
        const reason = err?.details || "La autenticación fue cancelada o falló.";
        addMessage(`Error de autenticación con Google Drive: ${reason}`, MessageRole.ERROR);
      }
    }, [showSetupGuide, addMessage]);

    const pickerCallback = useCallback((data: any) => {
        if (data.action === window.google.picker.Action.PICKED) {
            const doc = data.docs[0];
            const file: DriveFile = {
                id: doc.id,
                name: doc.name,
                mimeType: doc.mimeType,
            };
            setSelectedDriveFile(file);
            setSelectedLocalFile(null);
        }
    }, []);

    const openPicker = useCallback(() => {
        if (!oauthToken || !pickerApiLoaded || !googleConfig) return;
        
        const view = new window.google.picker.View(window.google.picker.ViewId.DOCS);
        view.setMimeTypes([
            "application/vnd.google-apps.document", "application/vnd.google-apps.presentation", "application/vnd.google-apps.spreadsheet",
            "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain", "text/csv", "text/html", "application/json", "text/xml", "application/rtf", "application/epub+zip"
        ].join(','));
        
        const picker = new window.google.picker.PickerBuilder()
            .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
            .setAppId(googleConfig.CLIENT_ID.split('-')[0])
            .setOAuthToken(oauthToken)
            .addView(view)
            .addView(new window.google.picker.DocsUploadView())
            .setDeveloperKey(googleConfig.API_KEY)
            .setCallback(pickerCallback)
            .build();
        picker.setVisible(true);
    }, [oauthToken, pickerApiLoaded, googleConfig, pickerCallback]);

    const handleSourceClick = useCallback(async (source: GroundingSource) => {
        const userPrompt = `Dime más sobre "${source.title}"`;
        addMessage(userPrompt, MessageRole.USER);
        setIsLoading(true);
        try {
            const summary = await getWikipediaSummary(source.title);
            const quickReplies = [`¿Quién fue ${source.title.split(' ')[0]}?`, `Principales logros de ${source.title}`, `¿Cuál es el legado de ${source.title}?`];
            addMessage(summary, MessageRole.MODEL, { quickReplies });
            addToHistory(userPrompt, summary, 'wiki');
        } catch (err) {
            addMessage(err instanceof Error ? err.message : 'Ocurrió un error.', MessageRole.ERROR);
        } finally {
            setIsLoading(false);
        }
    }, [addMessage, addToHistory]);

    const handleQuickReplyClick = useCallback((reply: string) => {
        setPromptInput(reply);
        setTimeout(() => document.getElementById('submit-button')?.click(), 50);
    }, []);
    
    const handleSubmit = useCallback(async () => {
      const prompt = promptInput.trim();
      if (!prompt) return;
      if (analysisMode === 'ia' && !selectedLocalFile && !selectedDriveFile) return addMessage("Por favor, selecciona un archivo.", MessageRole.ERROR);

      setIsLoading(true);
      addMessage(prompt, MessageRole.USER);
      setPromptInput('');

      try {
          if (analysisMode === 'ia') {
              let response = '';
              if (selectedLocalFile) response = await analyzeLocalDocument(selectedLocalFile, prompt);
              else if (selectedDriveFile && oauthToken) response = await analyzeDriveDocument(selectedDriveFile, oauthToken, prompt);
              addMessage(response, MessageRole.MODEL);
              addToHistory(prompt, response, 'ia', { fileName: getFileName() });
          } else if (analysisMode === 'wiki') {
              const wikiResult = await searchWikipedia(prompt);
              if (wikiResult.sources && wikiResult.sources.length > 0) {
                  const topResult = wikiResult.sources[0];
                  const summary = await getWikipediaSummary(topResult.title);
                  const relatedSources = wikiResult.sources.slice(1);
                  addMessage(summary, MessageRole.MODEL, { sources: relatedSources });
                  addToHistory(prompt, summary, 'wiki');
              } else {
                  addMessage(wikiResult.content, MessageRole.MODEL);
                  addToHistory(prompt, wikiResult.content, 'wiki');
              }
          } else if (analysisMode === 'imagen') {
              const imageUrl = await generateImage(prompt);
              addMessage("Aquí está la imagen que pediste.", MessageRole.MODEL, { imageUrl });
              addToHistory(prompt, "Imagen generada.", 'imagen', { imageUrl });
          } else if (analysisMode === 'traductor') {
              const translation = await translateText(prompt, targetLanguage, sourceLanguage);
              addMessage(translation, MessageRole.MODEL);
              addToHistory(prompt, translation, 'traductor');
          }
      } catch (err) {
          addMessage(err instanceof Error ? err.message : 'Ocurrió un error.', MessageRole.ERROR);
      } finally {
          setIsLoading(false);
      }
    }, [promptInput, analysisMode, selectedLocalFile, selectedDriveFile, addMessage, oauthToken, getFileName, addToHistory, targetLanguage, sourceLanguage]);

    const handleFileSelect = useCallback((file: File | null) => {
        if (file) {
            setSelectedLocalFile(file);
            setSelectedDriveFile(null);
        }
    }, []);

    const handleLocalFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleFileSelect(e.target.files?.[0] ?? null), [handleFileSelect]);
    const handleDragEnter = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }, []);
    const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false); }, []);
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    }, [handleFileSelect]);

    const handleRemoveFile = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedLocalFile(null);
        setSelectedDriveFile(null);
        setMessages([]);
        addMessage("Selecciona un archivo para empezar a analizar.", MessageRole.MODEL);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, [addMessage]);
    
    const handleSelectHistory = useCallback((item: HistoryItem) => {
      const userMsg = { id: `hist-u-${item.id}`, role: MessageRole.USER, content: item.prompt };
      const modelMsg = { id: `hist-m-${item.id}`, role: MessageRole.MODEL, content: item.response, imageUrl: item.imageUrl };
      setMessages([userMsg, modelMsg]);
    }, []);
    
    const handleOpenConfirmDialog = useCallback((id: string) => { setItemToDelete(id); setIsConfirmOpen(true); }, []);
    const handleCloseConfirmDialog = useCallback(() => { setItemToDelete(null); setIsConfirmOpen(false); }, []);
    const handleConfirmDelete = useCallback(() => {
      if (itemToDelete) setHistory(prev => prev.filter(item => item.id !== itemToDelete));
      handleCloseConfirmDialog();
    }, [itemToDelete, handleCloseConfirmDialog]);
    
    const handleOpenClearAllDialog = useCallback(() => setIsClearAllConfirmOpen(true), []);
    const handleCloseClearAllDialog = useCallback(() => setIsClearAllConfirmOpen(false), []);
    const handleConfirmClearAll = useCallback(() => {
        setHistory([]);
        handleCloseClearAllDialog();
    }, [handleCloseClearAllDialog]);

    const toggleRecording = useCallback(() => {
        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
            return;
        }

        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
            addMessage("La API de reconocimiento de voz no es compatible con este navegador.", MessageRole.ERROR);
            return;
        }

        recognitionRef.current = new SpeechRecognitionAPI();
        recognitionRef.current.lang = voiceLanguage;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.continuous = true;

        recognitionRef.current.onresult = (event: any) => {
            const transcript = Array.from(event.results).map((result: any) => result[0]).map((result) => result.transcript).join('');
            setPromptInput(transcript);
        };
        recognitionRef.current.onend = () => setIsRecording(false);
        recognitionRef.current.onerror = (event: any) => {
            addMessage(`Error de reconocimiento de voz: ${event.error}`, MessageRole.ERROR);
            setIsRecording(false);
        };

        recognitionRef.current.start();
        setIsRecording(true);
    }, [isRecording, addMessage, voiceLanguage]);

    const handlePlayAudio = useCallback(async (message: ChatMessage) => {
        if (audioPlayingId) {
            currentAudioSourceRef.current?.stop();
            currentAudioSourceRef.current = null;
            setAudioPlayingId(null);
            if (audioPlayingId === message.id) return;
        }
        
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }

        setAudioPlayingId(message.id);
        try {
            const base64Audio = await generateSpeech(message.content);
            const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
            
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            source.onended = () => {
                setAudioPlayingId(null);
                currentAudioSourceRef.current = null;
            };
            source.start();
            currentAudioSourceRef.current = source;
        } catch (err) {
            addMessage(err instanceof Error ? err.message : "Error al reproducir audio", MessageRole.ERROR);
            setAudioPlayingId(null);
        }
    }, [audioPlayingId, addMessage]);

    const contextValue: AppContextType = {
        messages, promptInput, isLoading, analysisMode, history, theme, isConfirmOpen,
        isClearAllConfirmOpen, showSetupGuide, googleConfig, oauthToken, pickerApiLoaded,
        selectedDriveFile, selectedLocalFile, isDraggingOver, isSummarizing, isRecording,
        audioPlayingId, voiceLanguage, targetLanguage, sourceLanguage, fileInputRef,
        setPromptInput, setAnalysisMode, toggleTheme, setShowSetupGuide, setVoiceLanguage,
        setTargetLanguage, setSourceLanguage, handleLocalFileChange, handleDragEnter,
        handleDragLeave, handleDrop, handleRemoveFile, handleAuthClick, openPicker,
        handleSourceClick, handleQuickReplyClick, handleSubmit, handleSelectHistory,
        handleOpenConfirmDialog, handleOpenClearAllDialog, toggleRecording, handlePlayAudio
    };

    return (
        <AppContext.Provider value={contextValue}>
            <div style={{ padding: '18px', height: '100vh', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                {showSetupGuide && <SetupGuide onClose={() => setShowSetupGuide(false)} />}
                
                <button onClick={() => setShowSetupGuide(true)} title="Mostrar guía de configuración" style={{ position: 'absolute', top: '18px', right: '18px', zIndex: 50, padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px' }}>
                    <InfoIcon className="w-5 h-5" />
                </button>
                
                <HistoryPanel history={history} onSelectHistory={handleSelectHistory} onDeleteItem={handleOpenConfirmDialog} onClearAllHistory={handleOpenClearAllDialog}/>
                <main style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '16px', flex: 1, minHeight: 0 }}>
                    <Sidebar />
                    <ChatView />
                </main>
                <ConfirmationDialog isOpen={isConfirmOpen} onConfirm={handleConfirmDelete} onCancel={handleCloseConfirmDialog} title="Confirmar Eliminación">
                    ¿Estás seguro de que quieres eliminar este elemento del historial?
                </ConfirmationDialog>
                 <ConfirmationDialog isOpen={isClearAllConfirmOpen} onConfirm={handleConfirmClearAll} onCancel={handleCloseClearAllDialog} title="Limpiar Historial">
                    ¿Estás seguro de que quieres eliminar TODO el historial? Esta acción no se puede deshacer.
                </ConfirmationDialog>
            </div>
        </AppContext.Provider>
    );
};

export default App;