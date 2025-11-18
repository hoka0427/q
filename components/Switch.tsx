
import React from 'react';

type Mode = 'ia' | 'wiki' | 'imagen' | 'traductor';

interface SwitchProps {
    mode: Mode;
    setMode: (mode: Mode) => void;
}

const Switch: React.FC<SwitchProps> = ({ mode, setMode }) => {
    const baseStyle: React.CSSProperties = {
        flex: 1,
        padding: '8px 12px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'background-color 0.2s, color 0.2s',
        borderRadius: '6px',
        fontWeight: 500,
        fontSize: '13px',
    };

    const activeStyle: React.CSSProperties = {
        ...baseStyle,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        color: 'var(--text-primary)',
    };

    const inactiveStyle: React.CSSProperties = {
        ...baseStyle,
        backgroundColor: 'transparent',
        color: 'var(--text-muted)',
    };

    const modes: { id: Mode, label: string }[] = [
        { id: 'ia', label: 'IA' },
        { id: 'wiki', label: 'Wikipedia' },
        { id: 'imagen', label: 'Imagen' },
        { id: 'traductor', label: 'Traductor' },
    ];

    return (
        <div style={{ 
            display: 'flex', 
            gap: '4px', 
            padding: '4px', 
            borderRadius: '8px', 
            background: 'var(--glass)',
            border: '1px solid rgba(255,255,255,0.04)',
        }}>
            {modes.map(m => (
                <div 
                    key={m.id}
                    style={mode === m.id ? activeStyle : inactiveStyle}
                    onClick={() => setMode(m.id)}
                >
                    {m.label}
                </div>
            ))}
        </div>
    );
};

export default Switch;