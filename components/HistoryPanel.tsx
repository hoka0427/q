import React, { useState } from 'react';
import { HistoryItem } from '../types';
import TrashIcon from './icons/TrashIcon';
import DocumentIcon from './icons/DocumentIcon';
import WikipediaIcon from './icons/WikipediaIcon';
import ImageIcon from './icons/ImageIcon';
import TranslateIcon from './icons/TranslateIcon';

interface HistoryPanelProps {
  history: HistoryItem[];
  onSelectHistory: (item: HistoryItem) => void;
  onDeleteItem: (id: string) => void;
  onClearAllHistory: () => void;
}

const formatRelativeTime = (timestamp: number) => {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - timestamp) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return `hace ${Math.floor(interval)} años`;
  interval = seconds / 2592000;
  if (interval > 1) return `hace ${Math.floor(interval)} meses`;
  interval = seconds / 86400;
  if (interval > 1) return `hace ${Math.floor(interval)} días`;
  interval = seconds / 3600;
  if (interval > 1) return `hace ${Math.floor(interval)} horas`;
  interval = seconds / 60;
  if (interval > 1) return `hace ${Math.floor(interval)} minutos`;
  return `hace pocos segundos`;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onSelectHistory, onDeleteItem, onClearAllHistory }) => {
  const [activeTab, setActiveTab] = useState<HistoryItem['type']>('ia');
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  const filteredHistory = history.filter(item => item.type === activeTab);

  const getIconForType = (type: HistoryItem['type']) => {
    switch(type) {
      case 'ia': return <DocumentIcon className="w-5 h-5" />;
      case 'wiki': return <WikipediaIcon className="w-5 h-5" />;
      case 'imagen': return <ImageIcon className="w-5 h-5" />;
      case 'traductor': return <TranslateIcon className="w-5 h-5" />;
      default: return null;
    }
  }

  const tabButtonStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '6px 12px', border: 'none', background: isActive ? 'var(--button-hover-bg)' : 'transparent',
    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer', borderRadius: '6px',
    fontWeight: 500, transition: 'all 0.2s', fontSize: '13px',
  });

  const historyItemStyle: React.CSSProperties = {
    padding: '10px 8px', borderRadius: '6px', cursor: 'pointer', transition: 'background-color 0.2s',
    display: 'flex', alignItems: 'center', gap: '12px',
  };

  return (
    <div className="card" style={{ height: '220px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '16px', margin: 0 }}>Historial</h2>
            <button onClick={onClearAllHistory} title="Limpiar todo el historial" style={{ padding: '4px', color: 'var(--text-muted)', border: 'none', background: 'transparent' }}>
                <TrashIcon className="w-4 h-4" />
            </button>
        </div>
        <div>
          <button style={tabButtonStyle(activeTab === 'ia')} onClick={() => setActiveTab('ia')}>Documento</button>
          <button style={tabButtonStyle(activeTab === 'wiki')} onClick={() => setActiveTab('wiki')}>Wikipedia</button>
          <button style={tabButtonStyle(activeTab === 'imagen')} onClick={() => setActiveTab('imagen')}>Imagen</button>
          <button style={tabButtonStyle(activeTab === 'traductor')} onClick={() => setActiveTab('traductor')}>Traductor</button>
        </div>
      </div>
      <div style={{ overflowY: 'auto', marginTop: '10px', flex: 1 }}>
        {filteredHistory.length > 0 ? (
          filteredHistory.map(item => (
            <div 
              key={item.id} 
              style={historyItemStyle}
              onMouseEnter={() => setHoveredItemId(item.id)}
              onMouseLeave={() => setHoveredItemId(null)}
              onClick={() => onSelectHistory(item)}
              title={item.prompt}
            >
              <div style={{ color: 'var(--text-muted)' }}>{getIconForType(item.type)}</div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '13px' }}>
                  {item.prompt}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.type === 'ia' && item.fileName && <span>{item.fileName} &bull; </span>}
                  <span>{formatRelativeTime(item.timestamp)}</span>
                </div>
              </div>
              {hoveredItemId === item.id && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }}
                  title="Eliminar elemento"
                  style={{ padding: '4px', color: 'var(--text-muted)', background: 'transparent', border: 'none', marginLeft: '8px' }}
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', paddingTop: '20px' }}>
            No hay historial para esta categoría.
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;