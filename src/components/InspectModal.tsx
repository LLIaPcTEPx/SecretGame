import React, { useState } from 'react';
import { Check, Copy, Eye, X } from 'lucide-react';
import { InspectContent } from '../types/game';

interface InspectModalProps {
  content: InspectContent | null;
  onClose: () => void;
}

export const InspectModal: React.FC<InspectModalProps> = ({ content, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!content) return null;

  const copyCode = () => {
    if (!content.code) return;
    navigator.clipboard?.writeText(content.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="inspect-modal"
        style={{ borderColor: content.accentColor ?? '#38bdf8' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="inspect-header">
          <div className="inspect-title-wrap">
            <Eye size={19} color={content.accentColor ?? '#38bdf8'} />
            <div>
              <h3>{content.title}</h3>
              {content.subtitle && <p>{content.subtitle}</p>}
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="inspect-body">
          <p className="inspect-text">{content.body}</p>

          {content.code && (
            <div className="inspect-code-box">
              <code>{content.code}</code>
              <button className="copy-btn" onClick={copyCode} title="Скопировать">
                {copied ? <Check size={15} /> : <Copy size={15} />}
              </button>
            </div>
          )}

          {content.footer && <p className="inspect-footer">{content.footer}</p>}
        </div>

        <div className="inspect-actions">
          <button className="btn-primary" onClick={onClose}>
            Понятно (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
