import React, { useState } from 'react';
import { Check, Copy, Eye, X } from 'lucide-react';
import { UI_TEXT } from '../i18n/translations';
import { InspectContent, Language } from '../types/game';

interface InspectModalProps {
  content: InspectContent | null;
  language: Language;
  onClose: () => void;
}

export const InspectModal: React.FC<InspectModalProps> = ({ content, language, onClose }) => {
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
              <h3>{content.title[language]}</h3>
              {content.subtitle && <p>{content.subtitle[language]}</p>}
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="inspect-body">
          <p className="inspect-text">{content.body[language]}</p>

          {content.code && (
            <div className="inspect-code-box">
              <code>{content.code}</code>
              <button className="copy-btn" onClick={copyCode} title={UI_TEXT.copyTooltip[language]}>
                {copied ? <Check size={15} /> : <Copy size={15} />}
              </button>
            </div>
          )}

          {content.footer && <p className="inspect-footer">{content.footer[language]}</p>}
        </div>

        <div className="inspect-actions">
          <button className="btn-primary" onClick={onClose}>
            {UI_TEXT.closeGotIt[language]}
          </button>
        </div>
      </div>
    </div>
  );
};
