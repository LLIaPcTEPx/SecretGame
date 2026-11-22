import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const PORT = Number(process.env.PORT || 3001);
const HOST = process.env.HOST || '127.0.0.1';

const AVATAR_COLORS = ['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ea580c', '#0891b2', '#db2777'];

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadDb() {
  ensureDataDir();
  if (!fs.existsSync(DB_PATH)) {
    return { users: {}, sessions: {}, friends: [], friendRequests: [] };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    return {
      users: parsed.users || {},
      sessions: parsed.sessions || {},
      friends: Array.isArray(parsed.friends) ? parsed.friends : [],
      friendRequests: Array.isArray(parsed.friendRequests) ? parsed.friendRequests : [],
    };
  } catch {
    return { users: {}, sessions: {}, friends: [], friendRequests: [] };
  }
}

const db = loadDb();

function saveDb() {
  ensureDataDir();
  const tmp = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmp, DB_PATH);
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 32).toString('hex');
}

function verifyPassword(password, salt, expectedHex) {
  const actual = Buffer.from(hashPassword(password, salt), 'hex');
  const expected = Buffer.from(expectedHex, 'hex');
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

function makePublicUser(u) {
  return {
    id: u.id,
    username: u.username,
    avatarColor: u.avatarColor,
    createdAt: u.createdAt,
  };
}

function isFriendPair(a, b) {
  return db.friends.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

function addFriendPair(a, b) {
  if (a === b || isFriendPair(a, b)) return;
  db.friends.push([a, b]);
}

function removeFriendPair(a, b) {
  db.friends = db.friends.filter(([x, y]) => !((x === a && y === b) || (x === b && y === a)));
}

// Active WebSocket connections by userId
const activeClients = new Map(); // userId -> { ws, player }

function getFriendsPayload(userId) {
  const friendIds = new Set();
  for (const [a, b] of db.friends) {
    if (a === userId) friendIds.add(b);
    else if (b === userId) friendIds.add(a);
  }

  const friends = [];
  for (const fid of friendIds) {
    const u = db.users[fid];
    if (!u) continue;
    const live = activeClients.get(fid);
    friends.push({
      id: u.id,
      username: u.username,
      avatarColor: u.avatarColor,
      online: Boolean(live),
      zone: live ? live.player.zone : null,
      secretCount: live ? live.player.secretCount : 0,
    });
  }
  friends.sort((a, b) => Number(b.online) - Number(a.online) || a.username.localeCompare(b.username));

  const incoming = db.friendRequests
    .filter((r) => r.toId === userId)
    .map((r) => {
      const from = db.users[r.fromId];
      return from
        ? {
            id: r.id,
            userId: from.id,
            username: from.username,
            avatarColor: from.avatarColor,
            createdAt: r.createdAt,
          }
        : null;
    })
    .filter(Boolean);

  const outgoing = db.friendRequests
    .filter((r) => r.fromId === userId)
    .map((r) => {
      const to = db.users[r.toId];
      return to
        ? {
            id: r.id,
            userId: to.id,
            username: to.username,
            avatarColor: to.avatarColor,
            createdAt: r.createdAt,
          }
        : null;
    })
    .filter(Boolean);

  return { friends, incoming, outgoing };
}

function sendJson(ws, payload) {
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify(payload));
  }
}

function broadcastAll(payload, exceptUserId = null) {
  const str = JSON.stringify(payload);
  for (const [uid, client] of activeClients.entries()) {
    if (uid === exceptUserId) continue;
    if (client.ws.readyState === 1) {
      client.ws.send(str);
    }
  }
}

function pushFriendsUpdate(userId) {
  const client = activeClients.get(userId);
  if (client) {
    sendJson(client.ws, { type: 'friends_updated', ...getFriendsPayload(userId) });
  }
}

function notifyFriendsOnlineChange(userId) {
  for (const [a, b] of db.friends) {
    if (a === userId) pushFriendsUpdate(b);
    else if (b === userId) pushFriendsUpdate(a);
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 64 * 1024) {
        reject(new Error('Body too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function respondJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(data));
}

function getAuthUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;
  const session = db.sessions[token];
  if (!session) return null;
  const user = db.users[session.userId];
  return user ? { user, token } : null;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  const method = req.method || 'GET';

  try {
    if (method === 'GET' && pathname === '/api/health') {
      return respondJson(res, 200, { ok: true, onlineCount: activeClients.size });
    }

    if (method === 'POST' && pathname === '/api/auth/register') {
      const body = await readBody(req);
      const rawName = String(body.username || '').trim();
      const password = String(body.password || '');
      const color = AVATAR_COLORS.includes(body.avatarColor)
        ? body.avatarColor
        : AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

      if (!/^[A-Za-z0-9_а-яА-ЯёЁ-]{3,18}$/.test(rawName)) {
        return respondJson(res, 400, { errorCode: 'INVALID_USERNAME' });
      }
      if (password.length < 4 || password.length > 64) {
        return respondJson(res, 400, { errorCode: 'INVALID_PASSWORD' });
      }

      const lower = rawName.toLowerCase();
      const exists = Object.values(db.users).some((u) => u.usernameLower === lower);
      if (exists) {
        return respondJson(res, 409, { errorCode: 'USERNAME_TAKEN' });
      }

      const id = crypto.randomUUID();
      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = hashPassword(password, salt);
      const user = {
        id,
        username: rawName,
        usernameLower: lower,
        passwordHash,
        salt,
        avatarColor: color,
        createdAt: Date.now(),
      };
      db.users[id] = user;

      const token = crypto.randomBytes(24).toString('hex');
      db.sessions[token] = { userId: id, createdAt: Date.now() };
      saveDb();

      return respondJson(res, 201, { token, user: makePublicUser(user) });
    }

    if (method === 'POST' && pathname === '/api/auth/login') {
      const body = await readBody(req);
      const rawName = String(body.username || '').trim();
      const password = String(body.password || '');
      const lower = rawName.toLowerCase();

      const user = Object.values(db.users).find((u) => u.usernameLower === lower);
      if (!user || !verifyPassword(password, user.salt, user.passwordHash)) {
        return respondJson(res, 401, { errorCode: 'INVALID_CREDENTIALS' });
      }

      const token = crypto.randomBytes(24).toString('hex');
      db.sessions[token] = { userId: user.id, createdAt: Date.now() };
      saveDb();

      return respondJson(res, 200, { token, user: makePublicUser(user) });
    }

    if (method === 'GET' && pathname === '/api/auth/me') {
      const auth = getAuthUser(req);
      if (!auth) return respondJson(res, 401, { errorCode: 'UNAUTHORIZED' });
      return respondJson(res, 200, { user: makePublicUser(auth.user) });
    }

    if (method === 'POST' && pathname === '/api/auth/logout') {
      const auth = getAuthUser(req);
      if (auth) {
        delete db.sessions[auth.token];
        saveDb();
      }
      return respondJson(res, 200, { ok: true });
    }

    if (method === 'GET' && pathname === '/api/friends') {
      const auth = getAuthUser(req);
      if (!auth) return respondJson(res, 401, { errorCode: 'UNAUTHORIZED' });
      return respondJson(res, 200, getFriendsPayload(auth.user.id));
    }

    if (method === 'POST' && pathname === '/api/friends/request') {
      const auth = getAuthUser(req);
      if (!auth) return respondJson(res, 401, { errorCode: 'UNAUTHORIZED' });

      const body = await readBody(req);
      const targetName = String(body.username || '').trim().toLowerCase();
      if (!targetName) return respondJson(res, 400, { errorCode: 'USER_NOT_FOUND' });

      const target = Object.values(db.users).find((u) => u.usernameLower === targetName);
      if (!target) return respondJson(res, 404, { errorCode: 'USER_NOT_FOUND' });
      if (target.id === auth.user.id) return respondJson(res, 400, { errorCode: 'CANNOT_ADD_SELF' });
      if (isFriendPair(auth.user.id, target.id)) {
        return respondJson(res, 409, { errorCode: 'ALREADY_FRIENDS' });
      }

      // If target already sent us a request, auto-accept!
      const reverseReq = db.friendRequests.find(
        (r) => r.fromId === target.id && r.toId === auth.user.id
      );
      if (reverseReq) {
        db.friendRequests = db.friendRequests.filter((r) => r.id !== reverseReq.id);
        addFriendPair(auth.user.id, target.id);
        saveDb();
        pushFriendsUpdate(auth.user.id);
        pushFriendsUpdate(target.id);
        const targetClient = activeClients.get(target.id);
        if (targetClient) {
          sendJson(targetClient.ws, {
            type: 'friend_notification',
            kind: 'accepted',
            username: auth.user.username,
          });
        }
        return respondJson(res, 200, {
          status: 'accepted',
          ...getFriendsPayload(auth.user.id),
        });
      }

      const duplicate = db.friendRequests.find(
        (r) => r.fromId === auth.user.id && r.toId === target.id
      );
      if (duplicate) {
        return respondJson(res, 409, { errorCode: 'REQUEST_ALREADY_SENT' });
      }

      db.friendRequests.push({
        id: crypto.randomUUID(),
        fromId: auth.user.id,
        toId: target.id,
        createdAt: Date.now(),
      });
      saveDb();

      pushFriendsUpdate(auth.user.id);
      pushFriendsUpdate(target.id);
      const targetClient = activeClients.get(target.id);
      if (targetClient) {
        sendJson(targetClient.ws, {
          type: 'friend_notification',
          kind: 'request',
          username: auth.user.username,
        });
      }

      return respondJson(res, 201, {
        status: 'sent',
        ...getFriendsPayload(auth.user.id),
      });
    }

    if (method === 'POST' && pathname === '/api/friends/accept') {
      const auth = getAuthUser(req);
      if (!auth) return respondJson(res, 401, { errorCode: 'UNAUTHORIZED' });

      const body = await readBody(req);
      const requestId = String(body.requestId || '');
      const found = db.friendRequests.find((r) => r.id === requestId && r.toId === auth.user.id);
      if (!found) return respondJson(res, 404, { errorCode: 'REQUEST_NOT_FOUND' });

      db.friendRequests = db.friendRequests.filter((r) => r.id !== found.id);
      addFriendPair(found.fromId, found.toId);
      saveDb();

      pushFriendsUpdate(auth.user.id);
      pushFriendsUpdate(found.fromId);
      const senderClient = activeClients.get(found.fromId);
      if (senderClient) {
        sendJson(senderClient.ws, {
          type: 'friend_notification',
          kind: 'accepted',
          username: auth.user.username,
        });
      }

      return respondJson(res, 200, getFriendsPayload(auth.user.id));
    }

    if (method === 'POST' && pathname === '/api/friends/decline') {
      const auth = getAuthUser(req);
      if (!auth) return respondJson(res, 401, { errorCode: 'UNAUTHORIZED' });

      const body = await readBody(req);
      const requestId = String(body.requestId || '');
      const found = db.friendRequests.find(
        (r) => r.id === requestId && (r.toId === auth.user.id || r.fromId === auth.user.id)
      );
      if (!found) return respondJson(res, 404, { errorCode: 'REQUEST_NOT_FOUND' });

      db.friendRequests = db.friendRequests.filter((r) => r.id !== found.id);
      saveDb();

      pushFriendsUpdate(found.fromId);
      pushFriendsUpdate(found.toId);
      return respondJson(res, 200, getFriendsPayload(auth.user.id));
    }

    if (method === 'POST' && pathname === '/api/friends/remove') {
      const auth = getAuthUser(req);
      if (!auth) return respondJson(res, 401, { errorCode: 'UNAUTHORIZED' });

      const body = await readBody(req);
      const friendId = String(body.friendId || '');
      removeFriendPair(auth.user.id, friendId);
      saveDb();

      pushFriendsUpdate(auth.user.id);
      pushFriendsUpdate(friendId);
      return respondJson(res, 200, getFriendsPayload(auth.user.id));
    }

    respondJson(res, 404, { errorCode: 'NOT_FOUND' });
  } catch (err) {
    console.error('[API Error]', err);
    respondJson(res, 500, { errorCode: 'SERVER_ERROR' });
  }
});

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  if (url.pathname !== '/ws') {
    socket.destroy();
    return;
  }
  const token = url.searchParams.get('token') || '';
  const session = db.sessions[token];
  const user = session ? db.users[session.userId] : null;
  if (!user) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req, user);
  });
});

wss.on('connection', (ws, _req, user) => {
  // Replace any older socket for the same user cleanly
  const existing = activeClients.get(user.id);
  if (existing && existing.ws !== ws) {
    try {
      existing.ws.close(4000, 'Reconnected elsewhere');
    } catch {
      // ignore
    }
    activeClients.delete(user.id);
  }

  const player = {
    userId: user.id,
    username: user.username,
    avatarColor: user.avatarColor,
    x: 0,
    y: 0.5,
    z: 10,
    yaw: Math.PI,
    speed: 0,
    grounded: true,
    velY: 0,
    zone: 'plaza',
    secretCount: 0,
  };

  activeClients.set(user.id, { ws, player });

  const otherPlayers = [];
  for (const [uid, client] of activeClients.entries()) {
    if (uid !== user.id) {
      otherPlayers.push(client.player);
    }
  }

  // Send welcome snapshot & initial friends payload
  sendJson(ws, {
    type: 'welcome',
    self: makePublicUser(user),
    players: otherPlayers,
    onlineCount: activeClients.size,
  });
  sendJson(ws, {
    type: 'friends_updated',
    ...getFriendsPayload(user.id),
  });

  // Announce join to everyone else
  broadcastAll(
    {
      type: 'player_join',
      player,
      onlineCount: activeClients.size,
    },
    user.id
  );
  notifyFriendsOnlineChange(user.id);

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      return;
    }

    if (msg.type === 'state') {
      const prevZone = player.zone;
      player.x = Number(msg.x) || 0;
      player.y = Number(msg.y) || 0;
      player.z = Number(msg.z) || 0;
      player.yaw = Number(msg.yaw) || 0;
      player.speed = Number(msg.speed) || 0;
      player.grounded = Boolean(msg.grounded);
      player.velY = Number(msg.velY) || 0;
      player.zone = typeof msg.zone === 'string' ? msg.zone : 'plaza';
      player.secretCount = Math.max(0, Math.min(100, Number(msg.secretCount) || 0));

      broadcastAll(
        {
          type: 'player_state',
          userId: user.id,
          x: player.x,
          y: player.y,
          z: player.z,
          yaw: player.yaw,
          speed: player.speed,
          grounded: player.grounded,
          velY: player.velY,
          zone: player.zone,
          secretCount: player.secretCount,
        },
        user.id
      );

      if (prevZone !== player.zone) {
        notifyFriendsOnlineChange(user.id);
      }
      return;
    }

    if (msg.type === 'emote') {
      const emote = String(msg.emote || '').slice(0, 20);
      if (!emote) return;
      broadcastAll(
        {
          type: 'player_emote',
          userId: user.id,
          username: user.username,
          emote,
          x: player.x,
          y: player.y,
          z: player.z,
          ts: Date.now(),
        },
        user.id
      );
      return;
    }

    if (msg.type === 'chat') {
      const text = String(msg.text || '').trim().slice(0, 140);
      if (!text) return;
      broadcastAll(
        {
          type: 'chat',
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          userId: user.id,
          sender: user.username,
          avatarColor: user.avatarColor,
          text,
          timestamp: Date.now(),
        },
        user.id
      );
      return;
    }

    if (msg.type === 'high_five') {
      const targetId = String(msg.targetUserId || '');
      const target = activeClients.get(targetId);
      if (!target) return;

      const payload = {
        type: 'high_five',
        fromUserId: user.id,
        fromUsername: user.username,
        toUserId: target.player.userId,
        toUsername: target.player.username,
        ts: Date.now(),
      };
      sendJson(ws, payload);
      sendJson(target.ws, payload);
      return;
    }
  });

  ws.on('close', () => {
    const current = activeClients.get(user.id);
    if (current && current.ws === ws) {
      activeClients.delete(user.id);
      broadcastAll({
        type: 'player_leave',
        userId: user.id,
        username: user.username,
        onlineCount: activeClients.size,
      });
      notifyFriendsOnlineChange(user.id);
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`[SecretUniverse Multiplayer] Listening on http://${HOST}:${PORT} (HTTP + WS /ws)`);
});
