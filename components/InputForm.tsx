
import React, { useContext } from 'react';
import { AppContext } from '../App';
import LoadingSpinner from './LoadingSpinner';
import SendIcon from './icons/SendIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';

const voiceLanguages = [
    { code: 'es-ES', name: 'Español' },
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'fr-FR', name: 'Français' },
    { code: 'de-DE', name: 'Deutsch' },
    { code: 'it-IT', name: 'Italiano' },
    { code: 'pt-BR', name: 'Português (BR)'},
];

const InputForm: React.FC = () => {
    const context = useContext(AppContext);

    if (!context) {
        return null;
    }

    const {
        analysisMode,
        isSummarizing,
        selectedLocalFile,
        selectedDriveFile,
        promptInput,
        setPromptInput,
        voiceLanguage,
        setVoiceLanguage,
        isRecording,
        toggleRecording,
        isLoading,
        handleSubmit,
    } = context;

    const getPlaceholderText = () => {
        if (analysisMode === 'ia') {
          if (!selectedLocalFile && !selectedDriveFile) return "Selecciona un archivo para resumir...";
          if (isSummarizing) return "Generando resumen del documento...";
          return "Haz una pregunta sobre el documento...";
        }
        if (analysisMode === 'wiki') return "¿Qué es la computación cuántica?";
        if (analysisMode === 'traductor') return "Hola, ¿cómo estás?";
        return "Un astronauta a caballo en Marte...";
    };

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', marginTop: analysisMode === 'imagen' || analysisMode === 'wiki' ? 'auto' : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ fontSize: '13px', color: 'var(--text-muted)'}}>{analysisMode === 'ia' ? 'Paso 3: Haz una pregunta' : 'Paso 2: Escribe tu instrucción'}</div>
               <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                    <span style={{fontSize: '11px', color: 'var(--text-muted)'}}>Voz:</span>
                    <select value={voiceLanguage} onChange={e => setVoiceLanguage(e.target.value)} style={{fontSize: '11px', padding: '2px 4px', width: 'auto'}}>
                        {voiceLanguages.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                    </select>
               </div>
            </div>
            <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
              <textarea 
                value={promptInput} 
                onChange={(e) => setPromptInput(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }}} 
                rows={6} 
                placeholder={getPlaceholderText()} 
                style={{ flex: 1, resize: 'none', paddingRight: '40px' }} 
                disabled={analysisMode === 'ia' && (!selectedLocalFile && !selectedDriveFile || isSummarizing)}
              />
              <button onClick={toggleRecording} className={isRecording ? 'recording' : ''} title="Grabar voz" style={{ position: 'absolute', right: '8px', bottom: '8px', width: '36px', height: '36px', padding: '6px' }}><MicrophoneIcon/></button>
            </div>
            <button id="submit-button" onClick={handleSubmit} className="primary" disabled={isLoading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {isLoading && !isSummarizing ? <LoadingSpinner /> : <SendIcon />}
                {isLoading && !isSummarizing ? 'Procesando...' : 'Enviar'}
            </button>
        </div>
    );
};

export default InputForm;
