import React from 'react';

const ModelIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => {
  return (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className}
    >
        <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 019.75 22.5a.75.75 0 01-.75-.75v-7.19c0-.861.41-1.632 1.085-2.126zM15 6.75a.75.75 0 00-.75.75v7.5a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75z" clipRule="evenodd" />
        <path d="M3 9.75a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75zM3 12.75a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75zM3 15.75a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z" />
    </svg>
  );
};

export default ModelIcon;