import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { ChatMessage, Language } from '../types/game';
import { UI_TEXT } from '../i18n/translations';

interface ChatBoxProps {
  messages: ChatMessage[];
  language: Language;
  onSend: (text: string) => void;
  focusTrigger: { seq: number; prefix: string } | null;
  onInputFocusChange: (focused: boolean) => void;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  language,
  onSend,
  focusTrigger,
  onInputFocusChange,
}) => {
  const [open, setOpen] = useState(true);
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  useEffect(() => {
    if (!focusTrigger) return;
    setOpen(true);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        if (focusTrigger.prefix) {
          setValue(focusTrigger.prefix);
        }
      }
    }, 10);
  }, [focusTrigger]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSend(value);
      setValue('');
    }
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      inputRef.current?.blur();
    }
  };

  if (!open) {
    return (
      <button
        className="hud-chip chat-collapsed-btn"
        onClick={() => setOpen(true)}
        title={UI_TEXT.chatOpenTitle[language]}
      >
        <MessageSquare size={16} />
        <span>{UI_TEXT.chatCollapsed[language]}</span>
      </button>
    );
  }

  return (
    <div className={`chat-box ${focused ? 'chat-box--active' : ''}`}>
      <div className="chat-header">
        <div className="chat-title">
          <MessageSquare size={14} />
          <span>{UI_TEXT.chatHeader[language]}</span>
        </div>
        <button className="chat-close" onClick={() => setOpen(false)} title={UI_TEXT.chatCollapseTitle[language]}>
          <X size={14} />
        </button>
      </div>

      <div className="chat-messages" ref={listRef}>
        {messages.map((m) => (
          <div key={m.id} className={`chat-msg chat-msg--${m.type}`}>
            {m.type === 'player' && (
              <span className="chat-sender" style={m.color ? { color: m.color } : undefined}>
                {m.sender}:{' '}
              </span>
            )}
            {m.type === 'secret' && <span className="chat-sender">★ </span>}
            {m.type === 'whisper' && <span className="chat-sender">◈ </span>}
            <span className="chat-text">{m.text}</span>
          </div>
        ))}
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => {
            setFocused(true);
            onInputFocusChange(true);
          }}
          onBlur={() => {
            setFocused(false);
            onInputFocusChange(false);
          }}
          onKeyDown={handleKeyDown}
          placeholder={UI_TEXT.chatPlaceholder[language]}
          maxLength={120}
        />
        <button type="submit" className="chat-send" title={UI_TEXT.chatSendTitle[language]}>
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};
