import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);

// Error boundary fallback
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      backgroundColor: '#f9fafb',
      fontFamily: 'Cairo, sans-serif',
      direction: 'rtl'
    }}>
      <h1 style={{ color: '#dc2626', marginBottom: '1rem' }}>
        خطأ في تحميل التطبيق
      </h1>
      <pre style={{ 
        backgroundColor: '#fef2f2',
        padding: '1rem',
        borderRadius: '6px',
        fontSize: '0.875rem',
        maxWidth: '90%',
        overflow: 'auto'
      }}>
        {error.message}
      </pre>
      <button 
        onClick={() => window.location.reload()}
        style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        إعادة تحميل الصفحة
      </button>
    </div>
  );
}

try {
  root.render(<App />);
} catch (error) {
  console.error('Error rendering app:', error);
  root.render(<ErrorFallback error={error as Error} />);
}
