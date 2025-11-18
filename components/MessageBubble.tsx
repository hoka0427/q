import React, { useState } from 'react';
import { ChatMessage, MessageRole, GroundingSource } from '../types';
import ClipboardIcon from './icons/ClipboardIcon';
import CheckIcon from './icons/CheckIcon';
import UserIcon from './icons/UserIcon';
import ModelIcon from './icons/ModelIcon';
import SpeakerIcon from './icons/SpeakerIcon';
import LoadingSpinner from './LoadingSpinner';

interface MessageBubbleProps {
  message: ChatMessage;
  onSourceClick?: (source: GroundingSource) => void;
  onQuickReplyClick?: (reply: string) => void;
  onPlayAudio?: (message: ChatMessage) => void;
  audioPlayingId?: string | null;
}

const renderContentWithBold = (content: string) => {
    return content.split('\n').map((line, lineIndex, arr) => (
      <React.Fragment key={`line-${lineIndex}`}>
        {line.split('**').map((part, partIndex) => (
          partIndex % 2 === 1 ? <strong key={partIndex}>{part}</strong> : part
        ))}
        {lineIndex < arr.length - 1 && <br />}
      </React.Fragment>
    ));
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onSourceClick, onQuickReplyClick, onPlayAudio, audioPlayingId }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const isModel = message.role === MessageRole.MODEL;
  const isUser = message.role === MessageRole.USER;
  const isError = message.role === MessageRole.ERROR;
  const hasTextContent = message.content && message.content.trim() !== '';
  const isAudioLoading = audioPlayingId === message.id;

  if (isError) {
    return <div className="msg error">{message.content}</div>;
  }
  
  const iconButtonStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    padding: '6px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    color: 'var(--text-muted)',
    cursor: 'pointer'
  };

  return (
    <div className={`msg-container ${message.role}`}>
      <div className={`avatar ${isUser ? 'user-avatar' : 'model-avatar'}`}>
        {isUser ? <UserIcon className="w-5 h-5" /> : <ModelIcon className="w-5 h-5" />}
      </div>
      <div className={`msg ${message.role}`} style={{ position: 'relative' }}>

        {isModel && hasTextContent && (
          <div style={{ position: 'absolute', top: '4px', right: '4px', display: 'flex', gap: '4px' }}>
            {onPlayAudio && (
              <button
                onClick={() => onPlayAudio(message)}
                title="Leer en voz alta"
                disabled={isAudioLoading}
                style={iconButtonStyle}
              >
                {isAudioLoading ? <LoadingSpinner /> : <SpeakerIcon className="w-5 h-5" />}
              </button>
            )}
            <button
              onClick={handleCopy}
              title={isCopied ? 'Copiado' : 'Copiar respuesta'}
              style={{ ...iconButtonStyle, color: isCopied ? 'var(--ok)' : 'var(--text-muted)' }}
            >
              {isCopied ? <CheckIcon className="w-5 h-5" /> : <ClipboardIcon className="w-5 h-5" />}
            </button>
          </div>
        )}

        {hasTextContent && <div style={{ paddingRight: isModel ? '70px' : '0' }}>{renderContentWithBold(message.content)}</div>}

        {message.imageUrl && (
          <img src={message.imageUrl} alt="Imagen generada" style={{ maxWidth: '100%', borderRadius: '8px', marginTop: hasTextContent ? '8px' : '0' }}/>
        )}

        {message.sources && onSourceClick && message.sources.length > 0 && (
          <div className="sources-container">
            <h4>Fuentes</h4>
            <div className="sources-list">
              {message.sources.map((source, index) => (
                <button key={`source-${index}`} onClick={() => onSourceClick(source)} className="muted" title={`Ver resumen de ${source.title}`}>
                  {source.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {message.quickReplies && onQuickReplyClick && message.quickReplies.length > 0 && (
          <div className="quick-replies-container">
            <h4>Respuestas Rápidas</h4>
            <div className="quick-replies-list">
              {message.quickReplies.map((reply, index) => (
                <button key={`qr-${index}`} onClick={() => onQuickReplyClick(reply)} className="muted">
                  {reply}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
