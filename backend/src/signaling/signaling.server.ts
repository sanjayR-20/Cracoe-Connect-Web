import { Server as HttpServer } from 'http';
import { Server as WebSocketServer, WebSocket } from 'ws';
import type { RawData } from 'ws';

type PeerState = {
  name?: string;
  designation?: string;
  profilePic?: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  handRaised: boolean;
  screenSharing: boolean;
};

type PeerInfo = {
  id: string;
  socket: WebSocket;
  state: PeerState;
};

type RoomSettings = {
  hostPeerId: string;
  lockAudio: boolean;
  lockVideo: boolean;
};

type RoomInfo = {
  peers: Map<string, PeerInfo>;
  settings: RoomSettings;
};

type SignalMessage = {
  type: 'join' | 'signal' | 'leave' | 'ping' | 'update-state';
  roomId?: string;
  peerId?: string;
  name?: string;
  targetId?: string;
  data?: unknown;
  state?: unknown;
};

type TrackedSocket = WebSocket & {
  isAlive?: boolean;
  skipCleanup?: boolean;
};

const rooms = new Map<string, RoomInfo>();

const send = (socket: WebSocket, payload: unknown) => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
};

const broadcast = (roomId: string, payload: unknown, excludeId?: string) => {
  const room = rooms.get(roomId);
  if (!room) return;
  room.peers.forEach((peer) => {
    if (excludeId && peer.id === excludeId) return;
    send(peer.socket, payload);
  });
};

const sanitizeStatePatch = (state: unknown): Partial<PeerState> => {
  if (!state || typeof state !== 'object') {
    return {};
  }

  const input = state as Record<string, unknown>;
  const patch: Partial<PeerState> = {};

  if (typeof input.name === 'string') {
    patch.name = input.name.trim() || undefined;
  }
  if (typeof input.designation === 'string') {
    patch.designation = input.designation;
  }
  if (typeof input.profilePic === 'string') {
    patch.profilePic = input.profilePic;
  }
  if (typeof input.audioEnabled === 'boolean') {
    patch.audioEnabled = input.audioEnabled;
  }
  if (typeof input.videoEnabled === 'boolean') {
    patch.videoEnabled = input.videoEnabled;
  }
  if (typeof input.handRaised === 'boolean') {
    patch.handRaised = input.handRaised;
  }
  if (typeof input.screenSharing === 'boolean') {
    patch.screenSharing = input.screenSharing;
  }

  return patch;
};

const sanitizeRoomSettingsPatch = (value: unknown): Partial<Pick<RoomSettings, 'lockAudio' | 'lockVideo'>> => {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const input = value as Record<string, unknown>;
  const patch: Partial<Pick<RoomSettings, 'lockAudio' | 'lockVideo'>> = {};

  if (typeof input.lockAudio === 'boolean') {
    patch.lockAudio = input.lockAudio;
  }
  if (typeof input.lockVideo === 'boolean') {
    patch.lockVideo = input.lockVideo;
  }

  return patch;
};

const buildInitialState = (patch: Partial<PeerState>, fallbackName?: string): PeerState => {
  return {
    name: patch.name ?? fallbackName,
    designation: patch.designation,
    profilePic: patch.profilePic,
    audioEnabled: patch.audioEnabled ?? true,
    videoEnabled: patch.videoEnabled ?? true,
    handRaised: patch.handRaised ?? false,
    screenSharing: patch.screenSharing ?? false,
  };
};

const applyLockPolicy = (state: PeerState, settings: RoomSettings, peerId: string): PeerState => {
  if (peerId === settings.hostPeerId) {
    return state;
  }

  const nextState = { ...state };
  if (settings.lockAudio) {
    nextState.audioEnabled = false;
  }
  if (settings.lockVideo) {
    nextState.videoEnabled = false;
    nextState.screenSharing = false;
  }

  return nextState;
};

const applyLockPolicyToPatch = (
  patch: Partial<PeerState>,
  settings: RoomSettings,
  peerId: string
): Partial<PeerState> => {
  if (peerId === settings.hostPeerId) {
    return patch;
  }

  const nextPatch = { ...patch };
  if (settings.lockAudio) {
    nextPatch.audioEnabled = false;
  }
  if (settings.lockVideo) {
    nextPatch.videoEnabled = false;
    nextPatch.screenSharing = false;
  }

  return nextPatch;
};

const serializePeer = (peer: PeerInfo) => {
  return {
    id: peer.id,
    name: peer.state.name,
    designation: peer.state.designation,
    profilePic: peer.state.profilePic,
    audioEnabled: peer.state.audioEnabled,
    videoEnabled: peer.state.videoEnabled,
    handRaised: peer.state.handRaised,
    screenSharing: peer.state.screenSharing,
  };
};

const getOrCreateRoom = (roomId: string, hostPeerId: string): RoomInfo => {
  const existingRoom = rooms.get(roomId);
  if (existingRoom) {
    return existingRoom;
  }

  const room: RoomInfo = {
    peers: new Map(),
    settings: {
      hostPeerId,
      lockAudio: false,
      lockVideo: false,
    },
  };

  rooms.set(roomId, room);
  return room;
};

const resolveNextHostPeerId = (room: RoomInfo): string | undefined => {
  const peerIds = Array.from(room.peers.keys());
  if (peerIds.length === 0) {
    return undefined;
  }

  return peerIds.sort((firstPeerId, secondPeerId) => firstPeerId.localeCompare(secondPeerId))[0];
};

const buildRoomSettingsSignal = (settings: RoomSettings) => {
  return {
    type: 'signal',
    fromId: settings.hostPeerId,
    data: {
      kind: 'room-settings',
      settings: { ...settings },
    },
  };
};

const sendRoomSettings = (roomId: string, targetSocket?: WebSocket) => {
  const room = rooms.get(roomId);
  if (!room) {
    return;
  }

  const payload = buildRoomSettingsSignal(room.settings);
  if (targetSocket) {
    send(targetSocket, payload);
    return;
  }

  broadcast(roomId, payload);
};

const enforceRoomLocks = (roomId: string) => {
  const room = rooms.get(roomId);
  if (!room) {
    return;
  }

  room.peers.forEach((peer) => {
    const nextState = applyLockPolicy(peer.state, room.settings, peer.id);
    if (
      nextState.audioEnabled === peer.state.audioEnabled &&
      nextState.videoEnabled === peer.state.videoEnabled &&
      nextState.screenSharing === peer.state.screenSharing
    ) {
      return;
    }

    peer.state = nextState;
    broadcast(roomId, { type: 'peer-updated', peer: serializePeer(peer) });
  });
};

const cleanupPeer = (roomId: string | null, peerId: string | null) => {
  if (!roomId || !peerId) return;

  const room = rooms.get(roomId);
  if (!room) return;

  const wasHost = room.settings.hostPeerId === peerId;
  const removed = room.peers.delete(peerId);
  if (!removed) {
    return;
  }

  if (room.peers.size === 0) {
    rooms.delete(roomId);
    return;
  }

  broadcast(roomId, { type: 'peer-left', peerId }, peerId);

  if (wasHost) {
    const nextHostPeerId = resolveNextHostPeerId(room);
    if (nextHostPeerId && nextHostPeerId !== room.settings.hostPeerId) {
      room.settings.hostPeerId = nextHostPeerId;
      sendRoomSettings(roomId);
    }
  }
};

const getSignalKind = (data: unknown): string | null => {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const input = data as Record<string, unknown>;
  return typeof input.kind === 'string' ? input.kind : null;
};

const getMaxParticipants = () => {
  const value = Number(process.env.SIGNALING_MAX_PARTICIPANTS ?? '12');
  if (Number.isFinite(value) && value > 0) {
    return value;
  }
  return 12;
};

export const createSignalingServer = (server: HttpServer) => {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket: WebSocket) => {
    let currentRoomId: string | null = null;
    let currentPeerId: string | null = null;

    const trackedSocket = socket as TrackedSocket;
    trackedSocket.isAlive = true;

    socket.on('pong', () => {
      trackedSocket.isAlive = true;
    });

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

        if (currentRoomId && currentPeerId && (currentRoomId !== roomId || currentPeerId !== peerId)) {
          cleanupPeer(currentRoomId, currentPeerId);
        }

        const room = getOrCreateRoom(roomId, peerId);
        const maxParticipants = getMaxParticipants();
        if (!room.peers.has(peerId) && room.peers.size >= maxParticipants) {
          send(socket, {
            type: 'error',
            code: 'ROOM_FULL',
            message: `Room is full (max ${maxParticipants} participants).`,
          });
          return;
        }

        const previous = room.peers.get(peerId);
        if (previous && previous.socket !== socket) {
          const previousTrackedSocket = previous.socket as TrackedSocket;
          previousTrackedSocket.skipCleanup = true;
          send(previous.socket, {
            type: 'error',
            code: 'PEER_REPLACED',
            message: 'Peer reconnected from another client.',
          });
          previous.socket.close();
        }

        currentRoomId = roomId;
        currentPeerId = peerId;

        const statePatch = sanitizeStatePatch(message.state);
        const initialState = applyLockPolicy(
          buildInitialState(statePatch, message.name),
          room.settings,
          peerId
        );
        room.peers.set(peerId, { id: peerId, socket, state: initialState });

        const peers = Array.from(room.peers.values())
          .filter((peer) => peer.id !== peerId)
          .map((peer) => serializePeer(peer));

        send(socket, { type: 'peers', peers });
        sendRoomSettings(roomId, socket);
        broadcast(roomId, { type: 'peer-joined', peer: serializePeer(room.peers.get(peerId)!) }, peerId);
        return;
      }

      if (message.type === 'update-state') {
        const roomId = message.roomId?.trim() || currentRoomId;
        const peerId = message.peerId?.trim() || currentPeerId;
        if (!roomId || !peerId) {
          return;
        }

        const room = rooms.get(roomId);
        const peer = room?.peers.get(peerId);
        if (!room || !peer) {
          return;
        }

        const patch = sanitizeStatePatch(message.state);
        const policyPatch = applyLockPolicyToPatch(patch, room.settings, peerId);
        peer.state = applyLockPolicy(
          {
            ...peer.state,
            ...policyPatch,
          },
          room.settings,
          peerId
        );

        broadcast(roomId, { type: 'peer-updated', peer: serializePeer(peer) });
        return;
      }

      if (message.type === 'signal') {
        const roomId = message.roomId?.trim() || currentRoomId;
        const peerId = message.peerId?.trim() || currentPeerId;
        if (!roomId || !peerId || message.data === undefined) {
          return;
        }

        const room = rooms.get(roomId);
        if (!room || !room.peers.has(peerId)) {
          return;
        }

        const signalKind = getSignalKind(message.data);
        if (signalKind === 'room-settings') {
          if (peerId !== room.settings.hostPeerId) {
            send(socket, {
              type: 'error',
              code: 'NOT_HOST',
              message: 'Only the host can update room settings.',
            });
            return;
          }

          const dataRecord = message.data as Record<string, unknown>;
          const settingsPatch = sanitizeRoomSettingsPatch(dataRecord.settings);
          const nextSettings: RoomSettings = {
            ...room.settings,
            ...settingsPatch,
            hostPeerId: room.settings.hostPeerId,
          };

          if (
            nextSettings.lockAudio === room.settings.lockAudio &&
            nextSettings.lockVideo === room.settings.lockVideo
          ) {
            return;
          }

          room.settings = nextSettings;
          enforceRoomLocks(roomId);
          sendRoomSettings(roomId);
          return;
        }

        if (message.targetId) {
          const target = room.peers.get(message.targetId);
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

        broadcast(
          roomId,
          {
            type: 'signal',
            fromId: peerId,
            data: message.data,
          },
          peerId
        );
        return;
      }

      if (message.type === 'leave') {
        cleanupPeer(currentRoomId, currentPeerId);
        currentRoomId = null;
        currentPeerId = null;
      }
    });

    socket.on('close', () => {
      if (trackedSocket.skipCleanup) {
        trackedSocket.skipCleanup = false;
        return;
      }

      cleanupPeer(currentRoomId, currentPeerId);
      currentRoomId = null;
      currentPeerId = null;
    });
  });

  const heartbeat = setInterval(() => {
    wss.clients.forEach((client) => {
      const trackedClient = client as TrackedSocket;
      if (trackedClient.isAlive === false) {
        trackedClient.terminate();
        return;
      }

      trackedClient.isAlive = false;
      trackedClient.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeat);
  });

  return wss;
};
