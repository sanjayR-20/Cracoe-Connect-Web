import { Server as HttpServer } from 'http';
import { Server as WebSocketServer, WebSocket } from 'ws';
import type { RawData } from 'ws';

type PeerInfo = {
  id: string;
  name?: string;
  socket: WebSocket;
};

type SignalMessage = {
  type: 'join' | 'signal' | 'leave' | 'ping';
  roomId?: string;
  peerId?: string;
  name?: string;
  targetId?: string;
  data?: unknown;
};

const rooms = new Map<string, Map<string, PeerInfo>>();

const send = (socket: WebSocket, payload: unknown) => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
};

const broadcast = (roomId: string, payload: unknown, excludeId?: string) => {
  const room = rooms.get(roomId);
  if (!room) return;
  room.forEach((peer) => {
    if (excludeId && peer.id === excludeId) return;
    send(peer.socket, payload);
  });
};

const cleanupPeer = (roomId: string | null, peerId: string | null) => {
  if (!roomId || !peerId) return;
  const room = rooms.get(roomId);
  if (!room) return;
  room.delete(peerId);
  if (room.size === 0) {
    rooms.delete(roomId);
  }
  broadcast(roomId, { type: 'peer-left', peerId }, peerId);
};

export const createSignalingServer = (server: HttpServer) => {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket: WebSocket) => {
    let currentRoomId: string | null = null;
    let currentPeerId: string | null = null;

    socket.on('message', (raw: RawData) => {
      let message: SignalMessage | null = null;
      try {
        message = JSON.parse(raw.toString());
      } catch (err) {
        send(socket, { type: 'error', message: 'Invalid JSON' });
        return;
      }

      if (!message) return;

      if (message.type === 'ping') {
        send(socket, { type: 'pong' });
        return;
      }

      if (message.type === 'join') {
        const roomId = message.roomId?.trim();
        const peerId = message.peerId?.trim();
        if (!roomId || !peerId) {
          send(socket, { type: 'error', message: 'Missing roomId or peerId' });
          return;
        }

        currentRoomId = roomId;
        currentPeerId = peerId;

        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Map());
        }

        const room = rooms.get(roomId)!;
        room.set(peerId, { id: peerId, name: message.name, socket });

        const peers = Array.from(room.values())
          .filter((peer) => peer.id !== peerId)
          .map((peer) => ({ id: peer.id, name: peer.name }));

        send(socket, { type: 'peers', peers });
        broadcast(roomId, { type: 'peer-joined', peer: { id: peerId, name: message.name } }, peerId);
        return;
      }

      if (message.type === 'signal') {
        const roomId = message.roomId || currentRoomId;
        const targetId = message.targetId;
        const peerId = message.peerId || currentPeerId;
        if (!roomId || !targetId || !peerId) {
          return;
        }
        const room = rooms.get(roomId);
        const target = room?.get(targetId);
        if (!target) {
          return;
        }
        send(target.socket, {
          type: 'signal',
          fromId: peerId,
          data: message.data,
        });
        return;
      }

      if (message.type === 'leave') {
        cleanupPeer(currentRoomId, currentPeerId);
        currentRoomId = null;
        currentPeerId = null;
      }
    });

    socket.on('close', () => {
      cleanupPeer(currentRoomId, currentPeerId);
      currentRoomId = null;
      currentPeerId = null;
    });
  });

  return wss;
};
