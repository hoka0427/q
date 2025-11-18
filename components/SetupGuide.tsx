import React, { useState } from 'react';
import InfoIcon from './icons/InfoIcon';

interface SetupGuideProps {
  onClose: () => void;
}

const SetupGuide: React.FC<SetupGuideProps> = ({ onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [clientId, setClientId] = useState('');

  const handleSave = () => {
    if (!apiKey.trim() || !clientId.trim()) {
      alert('Por favor, introduce tanto la Clave de API como el ID de Cliente.');
      return;
    }
    localStorage.setItem('googleApiKey', apiKey.trim());
    localStorage.setItem('googleClientId', clientId.trim());

    const button = document.getElementById('save-config-btn');
    if (button) {
      button.innerText = 'Guardado. Recargando...';
      button.setAttribute('disabled', 'true');
    }
    setTimeout(() => window.location.reload(), 500);
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="setup-guide-content" onClick={(e) => e.stopPropagation()}>
        <h2>
          <InfoIcon className="w-6 h-6" />
          Guía de Configuración Rápida
        </h2>
        <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
          Para usar las funciones de Google Drive, necesitas configurar tus credenciales. Pega tus claves a continuación. Se guardarán de forma segura en tu navegador.
        </p>

        <div style={{ margin: '24px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
                <label htmlFor="apiKey" style={{ display: 'block', marginBottom: '6px', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500 }}>
                    Pega tu Clave de API (API Key)
                </label>
                <input 
                    id="apiKey"
                    type="text" 
                    value={apiKey} 
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..." 
                />
            </div>
            
            <div>
                <label htmlFor="clientId" style={{ display: 'block', marginBottom: '6px', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500 }}>
                    Pega tu ID de Cliente OAuth 2.0
                </label>
                <input 
                    id="clientId"
                    type="text" 
                    value={clientId} 
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="...apps.googleusercontent.com" 
                />
            </div>
        </div>
        
        <strong style={{fontSize: '13px'}}>¿Cómo obtener estas claves?</strong>
        <ol style={{ fontSize: '13px', lineHeight: 1.7, paddingLeft: '20px' }}>
            <li>
                Ve a la <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">página de Credenciales</a> en Google Cloud.
            </li>
            <li>
                Habilita las APIs necesarias:
                <ul style={{ paddingLeft: '20px', margin: '8px 0', listStyleType: 'disc' }}>
                    <li><a href="https://console.cloud.google.com/apis/library/drive.googleapis.com" target="_blank" rel="noopener noreferrer">Google Drive API</a></li>
                    <li><a href="https://console.cloud.google.com/apis/library/picker.googleapis.com" target="_blank" rel="noopener noreferrer">Google Picker API</a></li>
                </ul>
            </li>
            <li>
                En la página de Credenciales, crea una <strong>Clave de API</strong> y un <strong>ID de cliente OAuth 2.0</strong> (tipo "Aplicación web").
            </li>
            <li>
                Al configurar el ID de cliente OAuth, añade <code>{window.location.origin}</code> a los "Orígenes de JavaScript autorizados".
            </li>
        </ol>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button id="save-config-btn" onClick={handleSave} className="primary">Guardar y Recargar</button>
        </div>
      </div>
    </div>
  );
};

export default SetupGuide;