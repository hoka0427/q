import React from 'react';

const WikipediaIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c1.354 0 2.665-.256 3.86-.734M12 21c-1.354 0-2.665-.256-3.86-.734M12 3c1.354 0 2.665.256 3.86.734M12 3c-1.354 0-2.665.256-3.86.734M12 3a9.004 9.004 0 00-8.716 6.747M12 3a9.004 9.004 0 018.716 6.747M3.75 12h16.5M12 3v18" />
        </svg>
    );
};

export default WikipediaIcon;