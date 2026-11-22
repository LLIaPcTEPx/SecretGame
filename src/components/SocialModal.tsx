import React, { useState } from 'react';
import {
  Check,
  Navigation,
  Sparkles,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { ApiError } from '../network/MultiplayerClient';
import { AUTH_ERRORS_I18N, UI_TEXT, ZONE_NAMES_I18N } from '../i18n/translations';
import { AuthUser, FriendsState, Language, RemotePlayerData, ZoneId } from '../types/game';

interface SocialModalProps {
  selfUser: AuthUser;
  selfZone: ZoneId;
  selfSecretsCount: number;
  remotePlayers: RemotePlayerData[];
  friendsState: FriendsState;
  language: Language;
  onClose: () => void;
  onSendFriendRequest: (username: string) => Promise<'sent' | 'accepted'>;
  onAcceptRequest: (requestId: string) => Promise<void>;
  onDeclineRequest: (requestId: string) => Promise<void>;
  onRemoveFriend: (friendId: string) => Promise<void>;
  onTeleportToFriend: (friendId: string) => void;
}

export const SocialModal: React.FC<SocialModalProps> = ({
  selfUser,
  selfZone,
  selfSecretsCount,
  remotePlayers,
  friendsState,
  language,
  onClose,
  onSendFriendRequest,
  onAcceptRequest,
  onDeclineRequest,
  onRemoveFriend,
  onTeleportToFriend,
}) => {
  const [tab, setTab] = useState<'players' | 'friends' | 'requests'>(
    friendsState.incoming.length > 0 ? 'requests' : 'players'
  );
  const [usernameInput, setUsernameInput] = useState('');
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const friendIdSet = new Set(friendsState.friends.map((f) => f.id));
  const outgoingUserIdSet = new Set(friendsState.outgoing.map((r) => r.userId));
  const incomingByUserId = new Map(friendsState.incoming.map((r) => [r.userId, r]));

  const handleAddByUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = usernameInput.trim();
    if (!trimmed) return;
    setFeedback(null);
    setBusyId('add-form');
    try {
      const status = await onSendFriendRequest(trimmed);
      setUsernameInput('');
      setFeedback({
        kind: 'ok',
        text:
          status === 'accepted'
            ? UI_TEXT.friendRequestAccepted[language]
            : UI_TEXT.friendRequestSent[language],
      });
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'NETWORK_ERROR';
      const localized = AUTH_ERRORS_I18N[code] || AUTH_ERRORS_I18N.NETWORK_ERROR;
      setFeedback({ kind: 'err', text: localized[language] });
    } finally {
      setBusyId(null);
    }
  };

  const handleQuickAdd = async (username: string, uid: string) => {
    setFeedback(null);
    setBusyId(uid);
    try {
      const status = await onSendFriendRequest(username);
      setFeedback({
        kind: 'ok',
        text:
          status === 'accepted'
            ? UI_TEXT.friendRequestAccepted[language]
            : UI_TEXT.friendRequestSent[language],
      });
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'NETWORK_ERROR';
      const localized = AUTH_ERRORS_I18N[code] || AUTH_ERRORS_I18N.NETWORK_ERROR;
      setFeedback({ kind: 'err', text: localized[language] });
    } finally {
      setBusyId(null);
    }
  };

  const handleAccept = async (reqId: string) => {
    setBusyId(reqId);
    try {
      await onAcceptRequest(reqId);
    } finally {
      setBusyId(null);
    }
  };

  const handleDecline = async (reqId: string) => {
    setBusyId(reqId);
    try {
      await onDeclineRequest(reqId);
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (fid: string) => {
    setBusyId(fid);
    try {
      await onRemoveFriend(fid);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="social-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pause-header">
          <div className="pause-title-group">
            <Users size={22} color="#38bdf8" />
            <div>
              <h2>{UI_TEXT.socialTitle[language]}</h2>
              <p>{UI_TEXT.socialSubtitle[language]}</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Add Friend by Username Bar */}
        <form className="social-add-bar" onSubmit={handleAddByUsername}>
          <input
            type="text"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            placeholder={UI_TEXT.addFriendByName[language]}
            maxLength={18}
          />
          <button type="submit" className="btn-primary" disabled={busyId === 'add-form'}>
            <UserPlus size={15} />
            <span>{UI_TEXT.sendRequestBtn[language]}</span>
          </button>
        </form>

        {feedback && (
          <div className={`social-feedback social-feedback--${feedback.kind}`}>
            {feedback.text}
          </div>
        )}

        <div className="pause-tabs">
          <button
            className={`pause-tab ${tab === 'players' ? 'pause-tab--active' : ''}`}
            onClick={() => setTab('players')}
          >
            <Users size={15} />
            <span>
              {UI_TEXT.tabOnlinePlayers[language]} ({remotePlayers.length + 1})
            </span>
          </button>
          <button
            className={`pause-tab ${tab === 'friends' ? 'pause-tab--active' : ''}`}
            onClick={() => setTab('friends')}
          >
            <UserCheck size={15} />
            <span>
              {UI_TEXT.tabFriendsList[language]} ({friendsState.friends.length})
            </span>
          </button>
          <button
            className={`pause-tab ${tab === 'requests' ? 'pause-tab--active' : ''}`}
            onClick={() => setTab('requests')}
          >
            <UserPlus size={15} />
            <span>{UI_TEXT.tabRequests[language]}</span>
            {friendsState.incoming.length > 0 && (
              <span className="tab-badge">{friendsState.incoming.length}</span>
            )}
          </button>
        </div>

        <div className="social-body">
          {tab === 'players' && (
            <div className="social-list">
              {/* Self row */}
              <div className="social-row social-row--self">
                <div className="social-avatar" style={{ background: selfUser.avatarColor }}>
                  {selfUser.username.slice(0, 1).toUpperCase()}
                </div>
                <div className="social-row-info">
                  <div className="social-name">
                    {selfUser.username}
                    <span className="mini-tag mini-tag--you">{UI_TEXT.youBadge[language]}</span>
                  </div>
                  <div className="social-meta">
                    <span>{ZONE_NAMES_I18N[selfZone][language]}</span>
                    <span>•</span>
                    <span className="social-secrets-tag">
                      <Sparkles size={12} color="#facc15" /> {selfSecretsCount}/100
                    </span>
                  </div>
                </div>
              </div>

              {remotePlayers.length === 0 ? (
                <div className="social-empty">{UI_TEXT.noOtherPlayers[language]}</div>
              ) : (
                remotePlayers.map((p) => {
                  const isFriend = friendIdSet.has(p.userId);
                  const isPendingOut = outgoingUserIdSet.has(p.userId);
                  const incomingReq = incomingByUserId.get(p.userId);
                  return (
                    <div className="social-row" key={p.userId}>
                      <div className="social-avatar" style={{ background: p.avatarColor }}>
                        {p.username.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="social-row-info">
                        <div className="social-name">
                          {p.username}
                          {isFriend && (
                            <span className="mini-tag mini-tag--friend">
                              ★ {UI_TEXT.alreadyFriendBadge[language]}
                            </span>
                          )}
                        </div>
                        <div className="social-meta">
                          <span>{ZONE_NAMES_I18N[p.zone]?.[language] || p.zone}</span>
                          <span>•</span>
                          <span className="social-secrets-tag">
                            <Sparkles size={12} color="#facc15" /> {p.secretCount}/100
                          </span>
                        </div>
                      </div>

                      <div className="social-row-actions">
                        {isFriend ? (
                          <button
                            className="btn-mini btn-mini--accent"
                            onClick={() => {
                              onTeleportToFriend(p.userId);
                              onClose();
                            }}
                          >
                            <Navigation size={13} /> {UI_TEXT.teleportBtn[language]}
                          </button>
                        ) : incomingReq ? (
                          <button
                            className="btn-mini btn-mini--ok"
                            disabled={busyId === incomingReq.id}
                            onClick={() => handleAccept(incomingReq.id)}
                          >
                            <Check size={13} /> {UI_TEXT.acceptBtn[language]}
                          </button>
                        ) : isPendingOut ? (
                          <span className="mini-tag">{UI_TEXT.requestPendingBadge[language]}</span>
                        ) : (
                          <button
                            className="btn-mini"
                            disabled={busyId === p.userId}
                            onClick={() => handleQuickAdd(p.username, p.userId)}
                          >
                            <UserPlus size={13} /> {UI_TEXT.sendRequestBtn[language]}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {tab === 'friends' && (
            <div className="social-list">
              {friendsState.friends.length === 0 ? (
                <div className="social-empty">{UI_TEXT.noFriendsYet[language]}</div>
              ) : (
                friendsState.friends.map((f) => (
                  <div className="social-row" key={f.id}>
                    <div className="social-avatar" style={{ background: f.avatarColor }}>
                      {f.username.slice(0, 1).toUpperCase()}
                      <span
                        className={`status-dot ${f.online ? 'status-dot--on' : 'status-dot--off'}`}
                      />
                    </div>
                    <div className="social-row-info">
                      <div className="social-name">★ {f.username}</div>
                      <div className="social-meta">
                        {f.online ? (
                          <>
                            <span style={{ color: '#4ade80' }}>{UI_TEXT.serverOnline[language]}</span>
                            {f.zone && (
                              <>
                                <span>•</span>
                                <span>{ZONE_NAMES_I18N[f.zone]?.[language] || f.zone}</span>
                              </>
                            )}
                          </>
                        ) : (
                          <span>{UI_TEXT.offlineLabel[language]}</span>
                        )}
                      </div>
                    </div>

                    <div className="social-row-actions">
                      {f.online && (
                        <button
                          className="btn-mini btn-mini--accent"
                          onClick={() => {
                            onTeleportToFriend(f.id);
                            onClose();
                          }}
                        >
                          <Navigation size={13} /> {UI_TEXT.teleportBtn[language]}
                        </button>
                      )}
                      <button
                        className="btn-mini btn-mini--danger"
                        disabled={busyId === f.id}
                        onClick={() => handleRemove(f.id)}
                        title={UI_TEXT.removeFriendBtn[language]}
                      >
                        <UserMinus size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'requests' && (
            <div className="social-list">
              {friendsState.incoming.length === 0 && friendsState.outgoing.length === 0 ? (
                <div className="social-empty">{UI_TEXT.noRequests[language]}</div>
              ) : (
                <>
                  {friendsState.incoming.length > 0 && (
                    <>
                      <div className="social-section-label">{UI_TEXT.incomingRequests[language]}</div>
                      {friendsState.incoming.map((r) => (
                        <div className="social-row" key={r.id}>
                          <div className="social-avatar" style={{ background: r.avatarColor }}>
                            {r.username.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="social-row-info">
                            <div className="social-name">{r.username}</div>
                          </div>
                          <div className="social-row-actions">
                            <button
                              className="btn-mini btn-mini--ok"
                              disabled={busyId === r.id}
                              onClick={() => handleAccept(r.id)}
                            >
                              <Check size={13} /> {UI_TEXT.acceptBtn[language]}
                            </button>
                            <button
                              className="btn-mini btn-mini--danger"
                              disabled={busyId === r.id}
                              onClick={() => handleDecline(r.id)}
                            >
                              <X size={13} /> {UI_TEXT.declineBtn[language]}
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {friendsState.outgoing.length > 0 && (
                    <>
                      <div className="social-section-label">{UI_TEXT.outgoingRequests[language]}</div>
                      {friendsState.outgoing.map((r) => (
                        <div className="social-row" key={r.id}>
                          <div className="social-avatar" style={{ background: r.avatarColor }}>
                            {r.username.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="social-row-info">
                            <div className="social-name">{r.username}</div>
                            <div className="social-meta">
                              {UI_TEXT.requestPendingBadge[language]}
                            </div>
                          </div>
                          <div className="social-row-actions">
                            <button
                              className="btn-mini btn-mini--danger"
                              disabled={busyId === r.id}
                              onClick={() => handleDecline(r.id)}
                            >
                              {UI_TEXT.cancelBtn[language]}
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
