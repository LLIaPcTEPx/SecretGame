import React, { useState } from 'react';
import { Globe, LogIn, Sparkles, UserPlus } from 'lucide-react';
import { ApiError, authApi } from '../network/MultiplayerClient';
import { AUTH_ERRORS_I18N, UI_TEXT } from '../i18n/translations';
import { AuthUser, Language } from '../types/game';

const AVATAR_COLORS = [
  '#2563eb',
  '#16a34a',
  '#dc2626',
  '#9333ea',
  '#ea580c',
  '#0891b2',
  '#db2777',
];

interface AuthScreenProps {
  language: Language;
  onChangeLanguage: (lang: Language) => void;
  onAuthenticated: (token: string, user: AuthUser) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  language,
  onChangeLanguage,
  onAuthenticated,
}) => {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const res =
        mode === 'register'
          ? await authApi.register(username.trim(), password, avatarColor)
          : await authApi.login(username.trim(), password);
      onAuthenticated(res.token, res.user);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'NETWORK_ERROR';
      const localized = AUTH_ERRORS_I18N[code] || AUTH_ERRORS_I18N.NETWORK_ERROR;
      setErrorMsg(localized[language]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-stars" />

      <div className="auth-lang-toggle">
        <Globe size={15} />
        <button
          type="button"
          className={language === 'en' ? 'active' : ''}
          onClick={() => onChangeLanguage('en')}
        >
          English
        </button>
        <button
          type="button"
          className={language === 'ru' ? 'active' : ''}
          onClick={() => onChangeLanguage('ru')}
        >
          Русский
        </button>
      </div>

      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">
            <Sparkles size={26} color="#fde047" />
          </div>
          <h1>SECRET UNIVERSE 3D</h1>
          <p>{UI_TEXT.authSubtitle[language]}</p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === 'register' ? 'auth-tab--active' : ''}`}
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
          >
            <UserPlus size={16} />
            <span>{UI_TEXT.authRegisterTab[language]}</span>
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'login' ? 'auth-tab--active' : ''}`}
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
          >
            <LogIn size={16} />
            <span>{UI_TEXT.authLoginTab[language]}</span>
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>{UI_TEXT.authUsernameLabel[language]}</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={UI_TEXT.authUsernamePlaceholder[language]}
              autoComplete="username"
              maxLength={18}
              required
              autoFocus
            />
          </label>

          <label className="auth-field">
            <span>{UI_TEXT.authPasswordLabel[language]}</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={UI_TEXT.authPasswordPlaceholder[language]}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              maxLength={64}
              required
            />
          </label>

          {mode === 'register' && (
            <div className="auth-field">
              <span>{UI_TEXT.authAvatarColor[language]}</span>
              <div className="color-picker-row">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`color-swatch ${avatarColor === c ? 'color-swatch--active' : ''}`}
                    style={{ background: c }}
                    onClick={() => setAvatarColor(c)}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>
          )}

          {errorMsg && <div className="auth-error">{errorMsg}</div>}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading
              ? UI_TEXT.authConnecting[language]
              : mode === 'register'
                ? UI_TEXT.authCreateAndJoin[language]
                : UI_TEXT.authEnterServer[language]}
          </button>
        </form>

        <div className="auth-note">{UI_TEXT.authClientNote[language]}</div>
      </div>
    </div>
  );
};
