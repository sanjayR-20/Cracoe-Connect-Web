"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSignalingServer = void 0;
const ws_1 = require("ws");
const rooms = new Map();
const send = (socket, payload) => {
    if (socket.readyState === ws_1.WebSocket.OPEN) {
        socket.send(JSON.stringify(payload));
    }
};
const broadcast = (roomId, payload, excludeId) => {
    const room = rooms.get(roomId);
    if (!room)
        return;
    room.forEach((peer) => {
        if (excludeId && peer.id === excludeId)
            return;
        send(peer.socket, payload);
    });
};
const cleanupPeer = (roomId, peerId) => {
    if (!roomId || !peerId)
        return;
    const room = rooms.get(roomId);
    if (!room)
        return;
    room.delete(peerId);
    if (room.size === 0) {
        rooms.delete(roomId);
    }
    broadcast(roomId, { type: 'peer-left', peerId }, peerId);
};
const createSignalingServer = (server) => {
    const wss = new ws_1.Server({ server, path: '/ws' });
    wss.on('connection', (socket) => {
        let currentRoomId = null;
        let currentPeerId = null;
        socket.on('message', (raw) => {
            let message = null;
            try {
                message = JSON.parse(raw.toString());
            }
            catch (err) {
                send(socket, { type: 'error', message: 'Invalid JSON' });
                return;
            }
            if (!message)
                return;
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
                const room = rooms.get(roomId);
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
exports.createSignalingServer = createSignalingServer;
//# sourceMappingURL=signaling.server.js.map