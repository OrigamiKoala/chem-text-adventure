import React, { useEffect } from 'react';

interface PeriodicTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  version: number;
  onToggleVersion: () => void;
}

export const PeriodicTableModal: React.FC<PeriodicTableModalProps> = ({
  isOpen,
  onClose,
  version,
  onToggleVersion,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const imageSrc =
    version === 1
      ? `${import.meta.env.BASE_URL}images/periodic-table1.png`
      : `${import.meta.env.BASE_URL}images/lego-periodic-table.jpeg`;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>⚛️ Periodic Table of Elements</h3>
            <span className="modal-subtitle">
              {version === 1 ? 'Standard Chart (V1)' : 'LEGO Interactive Chart (V2)'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button type="button" className="btn-brand-secondary" onClick={onToggleVersion}>
              Switch to V{version === 1 ? 2 : 1}
            </button>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close">
              &times;
            </button>
          </div>
        </div>

        <div
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '100%',
              overflow: 'auto',
              borderRadius: '16px',
              border: '2px solid var(--border-color)',
              backgroundColor: '#ffffff',
              padding: '12px',
              textAlign: 'center',
            }}
          >
            <img
              src={imageSrc}
              alt={`Periodic Table of Elements V${version}`}
              style={{
                maxWidth: '100%',
                height: 'auto',
                display: 'block',
                margin: '0 auto',
                borderRadius: '8px',
              }}
            />
          </div>

          <div
            style={{
              fontSize: '0.8rem',
              color: 'var(--tr-slate)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Source:</span>
            <a
              href="https://ptable.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--tr-forest)',
                fontWeight: 700,
                textDecoration: 'underline',
              }}
            >
              ptable.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
