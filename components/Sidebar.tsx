
import React, { useContext } from 'react';
import { AppContext } from '../App';
import Switch from './Switch';
import InputForm from './InputForm';
import DocumentIcon from './icons/DocumentIcon';
import TrashIcon from './icons/TrashIcon';
import { DriveFile } from '../types';

const targetLanguages = [
    { code: 'English', name: 'Inglés' },
    { code: 'Spanish', name: 'Español' },
    { code: 'French', name: 'Francés' },
    { code: 'German', name: 'Alemán' },
    { code: 'Italian', name: 'Italiano' },
    { code: 'Portuguese', name: 'Portugués' },
    { code: 'Japanese', name: 'Japonés' },
    { code: 'Chinese', name: 'Chino' },
];

const sourceLanguages = [
    { code: 'Auto', name: 'Detectar Idioma' },
    ...targetLanguages,
];

const bytesToSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const Sidebar: React.FC = () => {
    const context = useContext(AppContext);

    if (!context) {
        return <aside className="card"></aside>;
    }

    const {
        analysisMode, setAnalysisMode,
        selectedLocalFile, selectedDriveFile, isDraggingOver, fileInputRef,
        handleDragEnter, handleDragLeave, handleDrop, handleLocalFileChange, handleRemoveFile,
        oauthToken, pickerApiLoaded, showSetupGuide, openPicker, handleAuthClick,
        sourceLanguage, setSourceLanguage, targetLanguage, setTargetLanguage,
    } = context;

    return (
        <aside className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Paso 1: Elige el modo</div>
                <Switch mode={analysisMode} setMode={setAnalysisMode} />
            </div>
            {analysisMode === 'ia' && (
                <div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Paso 2: Selecciona un archivo</div>
                     <div 
                        onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragEnter} onDrop={handleDrop}
                        onClick={() => !selectedLocalFile && fileInputRef.current?.click()}
                        style={{ border: `2px dashed ${isDraggingOver ? 'var(--accent)' : 'var(--border-color)'}`, borderRadius: '8px', padding: '16px', textAlign: 'center', cursor: selectedLocalFile ? 'default' : 'pointer', transition: 'border-color 0.2s, background-color 0.2s', backgroundColor: isDraggingOver ? 'rgba(59, 130, 246, 0.1)' : 'var(--glass-bg)', marginBottom: '10px' }}
                    >
                        <input type="file" ref={fileInputRef} onChange={handleLocalFileChange} style={{display: 'none'}} accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.csv,.html,.json,.xml,.txt,.rtf,.epub" />
                        {selectedLocalFile ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
                                <DocumentIcon className="w-8 h-8 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                                <div style={{ overflow: 'hidden', flex: 1 }}>
                                    <p style={{ margin: 0, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '14px' }}>{selectedLocalFile.name}</p>
                                    <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: '12px' }}>{bytesToSize(selectedLocalFile.size)}</p>
                                </div>
                                <button onClick={handleRemoveFile} title="Quitar archivo" style={{ background: 'transparent', border: 'none', padding: '4px', color: 'var(--text-muted)' }}><TrashIcon className="w-4 h-4" /></button>
                            </div>
                        ) : (
                            <div style={{ color: 'var(--text-muted)' }}>Arrastra un archivo aquí <br/> o haz clic para seleccionar</div>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                        <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color)' }} /> O <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color)' }} />
                    </div>
                    <button onClick={oauthToken ? openPicker : handleAuthClick} className={oauthToken ? "muted" : "primary"} style={{width: '100%', marginTop: '10px'}} disabled={!!(oauthToken && !pickerApiLoaded) || showSetupGuide}>
                        {oauthToken ? (selectedDriveFile ? selectedDriveFile.name : "Seleccionar de Drive") : "Conectar Drive"}
                    </button>
                </div>
            )}
             {analysisMode === 'traductor' && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px', alignItems: 'center' }}>
                        <select value={sourceLanguage} onChange={e => setSourceLanguage(e.target.value)} title="Idioma de origen" style={{fontSize: '13px'}}>
                            {sourceLanguages.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                        </select>
                        <span style={{color: 'var(--text-muted)'}}>→</span>
                        <select value={targetLanguage} onChange={e => setTargetLanguage(e.target.value)} title="Idioma de destino" style={{fontSize: '13px'}}>
                            {targetLanguages.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                        </select>
                    </div>
                </div>
            )}
            <InputForm />
        </aside>
    );
};

export default Sidebar;
