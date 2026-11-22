import React, { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, Clock, Lock, Search, Sparkles, Tag, X } from 'lucide-react';
import { CATEGORY_LABELS, DIFFICULTIES, DIFFICULTY_ORDER } from '../data/difficulties';
import { SECRETS } from '../data/secrets';
import { DifficultyId, SecretDef } from '../types/game';

interface IndexModalProps {
  unlockedIds: Set<number>;
  onClose: () => void;
  onSearchChange: (q: string) => void;
  onCounterClicks: (count: number) => void;
  onWelcomeBadgeClick: () => void;
}

export const IndexModal: React.FC<IndexModalProps> = ({
  unlockedIds,
  onClose,
  onSearchChange,
  onCounterClicks,
  onWelcomeBadgeClick,
}) => {
  const [selectedDiff, setSelectedDiff] = useState<DifficultyId | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [query, setQuery] = useState('');
  const [activeSecret, setActiveSecret] = useState<SecretDef | null>(SECRETS[0]);
  const [counterClicks, setCounterClicks] = useState(0);
  const [welcomeClicks, setWelcomeClicks] = useState(0);

  const countsByDiff = useMemo(() => {
    const map: Record<DifficultyId, { total: number; unlocked: number }> = {
      easy: { total: 0, unlocked: 0 },
      medium: { total: 0, unlocked: 0 },
      hard: { total: 0, unlocked: 0 },
      amazing: { total: 0, unlocked: 0 },
      okay: { total: 0, unlocked: 0 },
      best: { total: 0, unlocked: 0 },
    };
    for (const s of SECRETS) {
      map[s.difficulty].total++;
      if (unlockedIds.has(s.id)) map[s.difficulty].unlocked++;
    }
    return map;
  }, [unlockedIds]);

  const filteredSecrets = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SECRETS.filter((s) => {
      if (selectedDiff !== 'all' && s.difficulty !== selectedDiff) return false;
      const isUnlocked = unlockedIds.has(s.id);
      if (statusFilter === 'unlocked' && !isUnlocked) return false;
      if (statusFilter === 'locked' && isUnlocked) return false;
      if (q) {
        return (
          s.title.toLowerCase().includes(q) ||
          s.hint.toLowerCase().includes(q) ||
          String(s.id) === q ||
          (CATEGORY_LABELS[s.category] || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedDiff, statusFilter, query, unlockedIds]);

  const handleQueryInput = (val: string) => {
    setQuery(val);
    onSearchChange(val);
  };

  const handleCounterClick = () => {
    const next = counterClicks + 1;
    setCounterClicks(next);
    onCounterClicks(next);
  };

  const handleBadgeClick = (secret: SecretDef) => {
    if (secret.id === 1) {
      const next = welcomeClicks + 1;
      setWelcomeClicks(next);
      if (next >= 3) {
        onWelcomeBadgeClick();
      }
    }
  };

  const totalPercent = Math.round((unlockedIds.size / SECRETS.length) * 100);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="index-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="index-header">
          <div className="index-header-left">
            <div className="index-logo">
              <BookOpen size={22} />
            </div>
            <div>
              <h2>SECRET INDEX</h2>
              <p>Difficulty Chart • 100 уникальных секретов</p>
            </div>
          </div>

          <div className="index-header-right">
            <button
              className="index-counter-pill"
              onClick={handleCounterClick}
              title="Найдено секретов"
            >
              <Sparkles size={16} />
              <span>
                {unlockedIds.size} / {SECRETS.length} ({totalPercent}%)
              </span>
            </button>
            <button className="modal-close-btn" onClick={onClose} title="Закрыть (Tab / Esc)">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="index-progress-track">
          <div className="index-progress-fill" style={{ width: `${totalPercent}%` }} />
        </div>

        {/* Difficulty Chart Tabs */}
        <div className="diff-tabs">
          <button
            className={`diff-tab ${selectedDiff === 'all' ? 'diff-tab--active' : ''}`}
            onClick={() => setSelectedDiff('all')}
          >
            <span className="diff-dot" style={{ background: 'linear-gradient(135deg,#22c55e,#eab308,#ef4444,#a855f7,#09090d)' }} />
            <span>Все</span>
            <span className="diff-count">
              {unlockedIds.size}/{SECRETS.length}
            </span>
          </button>

          {DIFFICULTY_ORDER.map((diffId) => {
            const d = DIFFICULTIES[diffId];
            const c = countsByDiff[diffId];
            const active = selectedDiff === diffId;
            return (
              <button
                key={diffId}
                className={`diff-tab ${active ? 'diff-tab--active' : ''} ${diffId === 'best' ? 'diff-tab--best' : ''}`}
                style={{
                  borderColor: active ? d.borderColor : 'rgba(255,255,255,0.1)',
                  background: active ? d.bgColor : undefined,
                  boxShadow: active ? d.glow : undefined,
                }}
                onClick={() => setSelectedDiff(diffId)}
              >
                <span
                  className="diff-dot"
                  style={{
                    background: d.color,
                    border: diffId === 'best' ? '1.5px solid #f8fafc' : undefined,
                  }}
                />
                <span style={{ color: active ? d.textColor : undefined }}>{d.name}</span>
                <span className="diff-count">
                  {c.unlocked}/{c.total}
                </span>
              </button>
            );
          })}
        </div>

        {/* Toolbar: Search + Filter */}
        <div className="index-toolbar">
          <div className="index-search">
            <Search size={16} />
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryInput(e.target.value)}
              placeholder="Поиск по названию, подсказке, номеру..."
            />
            {query && (
              <button className="search-clear" onClick={() => handleQueryInput('')}>
                <X size={14} />
              </button>
            )}
          </div>

          <div className="status-filters">
            {(['all', 'unlocked', 'locked'] as const).map((st) => (
              <button
                key={st}
                className={`filter-pill ${statusFilter === st ? 'filter-pill--active' : ''}`}
                onClick={() => setStatusFilter(st)}
              >
                {st === 'all' ? 'Все' : st === 'unlocked' ? 'Найденные' : 'Не найденные'}
              </button>
            ))}
          </div>
        </div>

        {/* Body: Grid + Details Sidebar */}
        <div className="index-body">
          <div className="secret-grid">
            {filteredSecrets.map((s) => {
              const d = DIFFICULTIES[s.difficulty];
              const isUnlocked = unlockedIds.has(s.id);
              const isSelected = activeSecret?.id === s.id;
              return (
                <button
                  key={s.id}
                  className={`secret-card ${isUnlocked ? 'secret-card--unlocked' : 'secret-card--locked'} ${
                    isSelected ? 'secret-card--selected' : ''
                  } ${s.difficulty === 'best' ? 'secret-card--best' : ''}`}
                  style={{
                    borderColor: isSelected ? d.borderColor : isUnlocked ? `${d.borderColor}88` : undefined,
                    boxShadow: isSelected ? d.glow : undefined,
                  }}
                  onClick={() => setActiveSecret(s)}
                >
                  <div className="secret-card-top">
                    <span className="secret-id">#{s.id}</span>
                    <span
                      className="secret-diff-pill"
                      style={{
                        background: d.color,
                        color: s.difficulty === 'medium' || s.difficulty === 'easy' ? '#09090d' : '#ffffff',
                        border: s.difficulty === 'best' ? '1px solid #e2e8f0' : undefined,
                      }}
                    >
                      {d.name}
                    </span>
                  </div>
                  <div className="secret-card-title">{s.title}</div>
                  <div className="secret-card-footer">
                    <span className="secret-cat">{CATEGORY_LABELS[s.category]}</span>
                    {isUnlocked ? (
                      <CheckCircle2 size={15} color={d.textColor} />
                    ) : (
                      <Lock size={14} color="#64748b" />
                    )}
                  </div>
                </button>
              );
            })}
            {filteredSecrets.length === 0 && (
              <div className="empty-state">По твоему запросу секретов не найдено.</div>
            )}
          </div>

          {/* Detail Panel */}
          {activeSecret && (
            <div className="secret-detail">
              {(() => {
                const d = DIFFICULTIES[activeSecret.difficulty];
                const isUnlocked = unlockedIds.has(activeSecret.id);
                return (
                  <>
                    <div className="detail-top-row">
                      <span className="detail-num">СЕКРЕТ #{activeSecret.id}</span>
                      <button
                        className="detail-diff-badge"
                        style={{
                          background: d.color,
                          color:
                            activeSecret.difficulty === 'medium' || activeSecret.difficulty === 'easy'
                              ? '#09090d'
                              : '#ffffff',
                          border: activeSecret.difficulty === 'best' ? '1.5px solid #f8fafc' : undefined,
                          boxShadow: d.glow,
                        }}
                        onClick={() => handleBadgeClick(activeSecret)}
                        title="Сложность"
                      >
                        {d.name} ({d.ruLabel})
                      </button>
                    </div>

                    <h3 className="detail-title">{activeSecret.title}</h3>

                    <div className="detail-meta">
                      <span>
                        <Tag size={14} /> {CATEGORY_LABELS[activeSecret.category]}
                      </span>
                      <span>
                        <Clock size={14} /> ~{activeSecret.timeEstimate}
                      </span>
                    </div>

                    <div className={`detail-status ${isUnlocked ? 'detail-status--ok' : ''}`}>
                      {isUnlocked ? (
                        <>
                          <CheckCircle2 size={16} /> Открыто!
                        </>
                      ) : (
                        <>
                          <Lock size={16} /> Ещё не найдено
                        </>
                      )}
                    </div>

                    <div className="detail-box">
                      <div className="detail-box-label">ПОДСКАЗКА</div>
                      <p>{activeSecret.hint}</p>
                    </div>

                    {isUnlocked ? (
                      <div className="detail-box detail-box--lore">
                        <div className="detail-box-label">ЗАПИСЬ ХРАНИТЕЛЯ</div>
                        <p>{activeSecret.lore}</p>
                      </div>
                    ) : (
                      <div className="detail-box detail-box--locked-lore">
                        <div className="detail-box-label">ЗАПИСЬ ХРАНИТЕЛЯ</div>
                        <p>Найди этот секрет в мире, чтобы открыть его историю!</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
