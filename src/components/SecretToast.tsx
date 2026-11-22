import React from 'react';
import { Award } from 'lucide-react';
import { DIFFICULTIES } from '../data/difficulties';
import { UI_TEXT } from '../i18n/translations';
import { Language, SecretDef } from '../types/game';

interface SecretToastProps {
  secret: SecretDef | null;
  totalUnlocked: number;
  language: Language;
}

export const SecretToast: React.FC<SecretToastProps> = ({ secret, totalUnlocked, language }) => {
  if (!secret) return null;
  const d = DIFFICULTIES[secret.difficulty];

  return (
    <div
      className={`secret-toast ${secret.difficulty === 'best' ? 'secret-toast--best' : ''}`}
      style={{
        borderColor: d.borderColor,
        boxShadow: d.glow,
      }}
    >
      <div
        className="secret-toast-icon"
        style={{
          background: d.color,
          color: secret.difficulty === 'easy' || secret.difficulty === 'medium' ? '#09090d' : '#ffffff',
          border: secret.difficulty === 'best' ? '1.5px solid #f8fafc' : undefined,
        }}
      >
        <Award size={26} />
      </div>
      <div className="secret-toast-body">
        <div className="secret-toast-kicker">
          <span>
            {UI_TEXT.secretFound[language]} #{secret.id}
          </span>
          <span
            className="secret-toast-diff"
            style={{
              background: d.color,
              color: secret.difficulty === 'easy' || secret.difficulty === 'medium' ? '#09090d' : '#ffffff',
              border: secret.difficulty === 'best' ? '1px solid #f8fafc' : undefined,
            }}
          >
            {d.name}
          </span>
        </div>
        <div className="secret-toast-title">{secret.title[language]}</div>
        <div className="secret-toast-sub">
          {secret.lore[language]} • <strong>{totalUnlocked} / 100</strong>
        </div>
      </div>
    </div>
  );
};
