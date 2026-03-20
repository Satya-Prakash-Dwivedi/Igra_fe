import React from 'react';

interface PageShellProps {
  title: string;
  subtitle: string;
  placeholder: string;
}

const PageShell: React.FC<PageShellProps> = ({ title, subtitle, placeholder }) => {
  return (
    <div className="flex-1 p-6 bg-bg-dark min-h-screen">
      <div className="mb-8">
        <h1 className="text-text-main text-2xl font-bold">{title}</h1>
        <p className="text-text-muted text-sm mt-1">{subtitle}</p>
      </div>
      
      <div className="rounded-xl border border-border bg-bg-card h-[calc(100vh-200px)] flex items-center justify-center">
        <p className="text-text-muted text-sm italic">{placeholder}</p>
      </div>
    </div>
  );
};

export default PageShell;
