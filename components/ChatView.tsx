
import React, { useContext, useEffect, useRef } from 'react';
import { AppContext } from '../App';
import ThemeSwitcher from './ThemeSwitcher';
import MessageBubble from './MessageBubble';
import LoadingSpinner from './LoadingSpinner';
import ModelIcon from './icons/ModelIcon';

const ChatView: React.FC = () => {
    const context = useContext(AppContext);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [context?.messages, context?.isLoading]);

    if (!context) {
        return <section className="card"></section>;
    }

    const { 
        theme, toggleTheme, messages, isLoading, 
        handleSourceClick, handleQuickReplyClick, handlePlayAudio, audioPlayingId 
    } = context;

    return (
        <section className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
                <h1 style={{ fontSize: '18px', margin: 0 }}>Asistente IA</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ThemeSwitcher theme={theme} toggleTheme={toggleTheme} />
                </div>
            </div>
            <div className="messages" style={{ height: '100%', flex: 1, minHeight: 0 }}>
                {messages.map(msg => (<MessageBubble key={msg.id} message={msg} onSourceClick={handleSourceClick} onQuickReplyClick={handleQuickReplyClick} onPlayAudio={handlePlayAudio} audioPlayingId={audioPlayingId} />))}
                {isLoading && (<div className="msg-container model"><div className="avatar model-avatar"><ModelIcon className="w-5 h-5"/></div><div className="msg model"><LoadingSpinner /></div></div>)}
                <div ref={messagesEndRef} />
            </div>
        </section>
    );
};

export default ChatView;
