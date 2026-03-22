import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Copy,
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  PhoneOff,
  Users,
  MessageSquare,
  Send,
  X,
  Check,
  Hand,
  Grid,
  Maximize2,
  Lock,
  Unlock,
} from 'lucide-react';
import { useDataStore } from '../store/dataStore';
import {
  buildMeetingJoinLink,
  generateMeetingRoomCode,
  getMeetingTiming,
  normalizeMeetingRoomCode,
  parseMeetingInput,
} from '../lib/meetingUtils';
import '../styles/VideoMeet.css';

// Generate unique peer ID
const generatePeerId = () => {
  return `peer_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

const parseCsv = (value = '') => {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
};

const DEFAULT_STUN_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
];

const buildIceServers = () => {
  const turnUrls = parseCsv(
    process.env.REACT_APP_TURN_URLS || process.env.NEXT_PUBLIC_TURN_URLS || ''
  );
  const turnUsername = process.env.REACT_APP_TURN_USERNAME || process.env.NEXT_PUBLIC_TURN_USERNAME || '';
  const turnCredential = process.env.REACT_APP_TURN_CREDENTIAL || process.env.NEXT_PUBLIC_TURN_CREDENTIAL || '';

  const servers = [...DEFAULT_STUN_SERVERS];

  if (turnUrls.length > 0 && turnUsername && turnCredential) {
    servers.push({
      urls: turnUrls,
      username: turnUsername,
      credential: turnCredential,
    });
  }

  return servers;
};

const ICE_SERVERS = buildIceServers();

const getSignalingUrl = () => {
  const explicit = process.env.REACT_APP_SIGNALING_URL || process.env.NEXT_PUBLIC_SIGNALING_URL;
  if (explicit) {
    return explicit;
  }

  if (typeof window !== 'undefined') {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${wsProtocol}://${window.location.hostname}:3000/ws`;
  }

  return 'ws://localhost:3000/ws';
};

const shouldInitiateOffer = (localPeerId, remotePeerId) => {
  return localPeerId.localeCompare(remotePeerId) > 0;
};

const normalizeParticipant = (peer) => {
  return {
    peerId: peer?.id || '',
    name: peer?.name || 'Participant',
    designation: peer?.designation || '',
    profilePic: peer?.profilePic || '',
    audioEnabled: peer?.audioEnabled !== false,
    videoEnabled: peer?.videoEnabled !== false,
    handRaised: Boolean(peer?.handRaised),
    screenSharing: Boolean(peer?.screenSharing),
  };
};

export default function VideoMeetScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const roomFromUrl = normalizeMeetingRoomCode(params.get('room') || '');
  const startFromUrl = params.get('start') || '';
  const titleFromUrl = params.get('title') || '';
  const meetingIdFromUrl = params.get('meeting') || '';

  const currentUser = useDataStore((state) => state.getCurrentUser());

  // State
  const [view, setView] = useState(roomFromUrl ? 'preview' : 'home'); // home, preview, meeting
  const [roomId, setRoomId] = useState(roomFromUrl || '');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [scheduledStartAt, setScheduledStartAt] = useState(startFromUrl);
  const [linkMeetingTitle, setLinkMeetingTitle] = useState(titleFromUrl);
  const [linkMeetingId, setLinkMeetingId] = useState(meetingIdFromUrl);
  const [clockNow, setClockNow] = useState(Date.now());
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [layout, setLayout] = useState('grid'); // grid, spotlight
  const [handRaised, setHandRaised] = useState(false);
  const [pinnedPeer, setPinnedPeer] = useState(null);
  const [roomSettings, setRoomSettings] = useState({
    hostPeerId: '',
    lockAudio: false,
    lockVideo: false,
  });

  // Refs
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const channelRef = useRef(null);
  const peerIdRef = useRef(generatePeerId());
  const messagesEndRef = useRef(null);
  const roomIdRef = useRef(roomFromUrl || '');
  const manualLeaveRef = useRef(false);

  useEffect(() => {
    const parsedInput = parseMeetingInput(`/video-meet${location.search || ''}`);
    if (parsedInput.roomId) {
      setRoomId(parsedInput.roomId);
      roomIdRef.current = parsedInput.roomId;
      setView((currentView) => (currentView === 'meeting' ? currentView : 'preview'));
    }
    setScheduledStartAt(parsedInput.start || '');
    setLinkMeetingTitle(parsedInput.title || '');
    setLinkMeetingId(parsedInput.meetingId || '');
  }, [location.search]);

  useEffect(() => {
    setRoomSettings((prev) =>
      prev.hostPeerId
        ? prev
        : {
            ...prev,
            hostPeerId: peerIdRef.current,
        }
    );
  }, []);

  const meetingTiming = getMeetingTiming(scheduledStartAt, clockNow);
  const canJoinScheduledMeeting = meetingTiming.status !== 'upcoming';
  const scheduledStartLabel = meetingTiming.startIso
    ? new Date(meetingTiming.startIso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
    : '';
  const shareableMeetingLink = buildMeetingJoinLink({
    roomId,
    startsAt: meetingTiming.startIso || scheduledStartAt,
    title: linkMeetingTitle,
    id: linkMeetingId,
  });

  useEffect(() => {
    if (!scheduledStartAt) {
      return undefined;
    }
    const timer = setInterval(() => {
      setClockNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [scheduledStartAt]);

  // Get local media stream
  const getLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });
      
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Apply initial mute states
      stream.getAudioTracks().forEach(track => {
        track.enabled = audioEnabled;
      });
      stream.getVideoTracks().forEach(track => {
        track.enabled = videoEnabled;
      });

      return stream;
    } catch (err) {
      console.error('Error accessing media devices:', err);
      setError('Unable to access camera or microphone. Please check permissions.');
      return null;
    }
  }, [audioEnabled, videoEnabled]);

  // Initialize local stream on preview
  useEffect(() => {
    if (view === 'preview' || view === 'meeting') {
      getLocalStream();
    }
    
    return () => {
      if (localStreamRef.current && view !== 'meeting') {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [view, getLocalStream]);

  // Update video element when stream changes
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [view]);

  // Remove peer helper (stable ref to avoid circular deps)
  const removePeerRef = useRef(null);
  removePeerRef.current = (peerId) => {
    const peerData = peerConnectionsRef.current.get(peerId);
    if (peerData) {
      peerData.pc.close();
      peerConnectionsRef.current.delete(peerId);
    }
    setParticipants(prev => prev.filter(p => p.peerId !== peerId));
    setPinnedPeer(prev => prev === peerId ? null : prev);
  };

  const sendSignalEvent = useCallback((kind, payload = {}, targetPeerId) => {
    const socket = channelRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN || !roomIdRef.current) {
      return;
    }

    const message = {
      type: 'signal',
      roomId: roomIdRef.current,
      peerId: peerIdRef.current,
      data: {
        kind,
        ...payload,
      },
    };

    if (targetPeerId) {
      message.targetId = targetPeerId;
    }

    socket.send(JSON.stringify(message));
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback((remotePeerId, remoteName, remoteDesignation, remoteProfilePic) => {
    if (peerConnectionsRef.current.has(remotePeerId)) {
      return peerConnectionsRef.current.get(remotePeerId).pc;
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignalEvent('ice-candidate', { candidate: event.candidate }, remotePeerId);
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setParticipants(prev => {
        const existing = prev.find(p => p.peerId === remotePeerId);
        if (existing) {
          return prev.map(p => 
            p.peerId === remotePeerId 
              ? { ...p, stream: remoteStream }
              : p
          );
        }
        return [...prev, {
          peerId: remotePeerId,
          name: remoteName || 'Participant',
          designation: remoteDesignation || '',
          profilePic: remoteProfilePic || '',
          stream: remoteStream,
          audioEnabled: true,
          videoEnabled: true,
        }];
      });
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        removePeerRef.current?.(remotePeerId);
      }
    };

    peerConnectionsRef.current.set(remotePeerId, { pc, name: remoteName });
    return pc;
  }, [sendSignalEvent]);

  // Remove peer (wrapper for external use)
  const removePeer = useCallback((peerId) => {
    removePeerRef.current?.(peerId);
  }, []);

  // Handle signaling messages
  const handleSignalingMessage = useCallback(async (payload) => {
    const { type, fromPeerId, fromName, fromDesignation, fromProfilePic, toPeerId, sdp, candidate } = payload;

    // Ignore messages not meant for us
    if (toPeerId && toPeerId !== peerIdRef.current) return;
    // Ignore our own messages
    if (fromPeerId === peerIdRef.current) return;

    switch (type) {
      case 'join': {
        if (!shouldInitiateOffer(peerIdRef.current, fromPeerId)) {
          createPeerConnection(fromPeerId, fromName, fromDesignation, fromProfilePic);
          break;
        }

        // New peer joined, create offer
        const pc = createPeerConnection(fromPeerId, fromName, fromDesignation, fromProfilePic);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        sendSignalEvent(
          'offer',
          {
            fromName: currentUser?.name || 'Guest',
            fromDesignation: currentUser?.designation || '',
            fromProfilePic: currentUser?.profilePic || '',
            sdp: offer,
          },
          fromPeerId
        );
        break;
      }
      
      case 'offer': {
        const pc = createPeerConnection(fromPeerId, fromName, fromDesignation, fromProfilePic);
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        sendSignalEvent(
          'answer',
          {
            fromName: currentUser?.name || 'Guest',
            fromDesignation: currentUser?.designation || '',
            fromProfilePic: currentUser?.profilePic || '',
            sdp: answer,
          },
          fromPeerId
        );
        break;
      }
      
      case 'answer': {
        const peerData = peerConnectionsRef.current.get(fromPeerId);
        if (peerData?.pc) {
          await peerData.pc.setRemoteDescription(new RTCSessionDescription(sdp));
        }
        break;
      }
      
      case 'ice-candidate': {
        const peerData = peerConnectionsRef.current.get(fromPeerId);
        if (peerData?.pc && candidate) {
          try {
            await peerData.pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            // Ignore late ICE candidates
          }
        }
        break;
      }
      
      case 'leave': {
        removePeer(fromPeerId);
        break;
      }
      
      case 'chat': {
        setMessages(prev => [...prev, {
          id: Date.now(),
          fromPeerId,
          fromName,
          message: payload.message,
          timestamp: new Date().toISOString(),
        }]);
        break;
      }
      
      case 'hand-raised': {
        setParticipants(prev => prev.map(p => 
          p.peerId === fromPeerId 
            ? { ...p, handRaised: payload.raised }
            : p
        ));
        break;
      }

      case 'media-state': {
        setParticipants(prev => prev.map(p =>
          p.peerId === fromPeerId
            ? { ...p, audioEnabled: payload.audio, videoEnabled: payload.video }
            : p
        ));
        break;
      }
      
      default:
        break;
    }
  }, [createPeerConnection, removePeer, currentUser, sendSignalEvent]);

  // Join meeting room
  const joinRoom = useCallback(async (meetingRoomId) => {
    if (!meetingRoomId) {
      setError('Please enter a meeting code');
      return;
    }

    const normalizedRoomId = normalizeMeetingRoomCode(meetingRoomId);
    if (!normalizedRoomId) {
      setError('Please enter a valid meeting code');
      setConnectionStatus('error');
      return;
    }

    setConnectionStatus('connecting');
    setError('');

    const stream = localStreamRef.current || (await getLocalStream());
    if (!stream) {
      setConnectionStatus('error');
      return;
    }

    if (channelRef.current) {
      channelRef.current.close();
      channelRef.current = null;
    }

    peerConnectionsRef.current.forEach(({ pc }) => pc.close());
    peerConnectionsRef.current.clear();
    setParticipants([]);

    roomIdRef.current = normalizedRoomId;
    manualLeaveRef.current = false;

    let socket;
    try {
      socket = new WebSocket(getSignalingUrl());
    } catch (err) {
      setError('Failed to initialize meeting connection.');
      setConnectionStatus('error');
      return;
    }

    channelRef.current = socket;

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: 'join',
          roomId: normalizedRoomId,
          peerId: peerIdRef.current,
          state: {
            name: currentUser?.name || 'Guest',
            designation: currentUser?.designation || '',
            profilePic: currentUser?.profilePic || '',
            audioEnabled,
            videoEnabled,
            handRaised,
            screenSharing,
          },
        })
      );
    };

    socket.onmessage = ({ data }) => {
      let message;
      try {
        message = JSON.parse(data);
      } catch (err) {
        return;
      }

      if (message.type === 'peers') {
        setConnectionStatus('connected');
        setView('meeting');
        setRoomId(normalizedRoomId);
        const peers = Array.isArray(message.peers) ? message.peers : [];
        setRoomSettings((prev) => ({
          ...prev,
          hostPeerId: peers.length > 0 ? peers[0].id : peerIdRef.current,
        }));
        setParticipants((prev) =>
          peers.map((peer) => {
            const existing = prev.find((participant) => participant.peerId === peer.id);
            return {
              ...normalizeParticipant(peer),
              stream: existing?.stream,
            };
          })
        );
        peers.forEach((peer) => {
          handleSignalingMessage({
            type: 'join',
            fromPeerId: peer.id,
            fromName: peer.name,
            fromDesignation: peer.designation,
            fromProfilePic: peer.profilePic,
          });
        });
        return;
      }

      if (message.type === 'peer-joined') {
        if (message.peer?.id) {
          setParticipants((prev) => {
            const existing = prev.find((participant) => participant.peerId === message.peer.id);
            if (existing) {
              return prev.map((participant) =>
                participant.peerId === message.peer.id
                  ? {
                      ...participant,
                      ...normalizeParticipant(message.peer),
                      stream: participant.stream,
                    }
                  : participant
              );
            }
            return [...prev, normalizeParticipant(message.peer)];
          });
        }

        handleSignalingMessage({
          type: 'join',
          fromPeerId: message.peer?.id,
          fromName: message.peer?.name,
          fromDesignation: message.peer?.designation,
          fromProfilePic: message.peer?.profilePic,
        });

        return;
      }

      if (message.type === 'peer-left') {
        handleSignalingMessage({
          type: 'leave',
          fromPeerId: message.peerId,
        });
        return;
      }

      if (message.type === 'peer-updated' && message.peer?.id) {
        setParticipants((prev) => {
          const existing = prev.find((participant) => participant.peerId === message.peer.id);
          if (!existing) {
            return [
              ...prev,
              {
                ...normalizeParticipant(message.peer),
              },
            ];
          }

          return prev.map((participant) =>
            participant.peerId === message.peer.id
              ? {
                  ...participant,
                  name: message.peer.name || participant.name,
                  designation: message.peer.designation || participant.designation,
                  profilePic: message.peer.profilePic || participant.profilePic,
                  audioEnabled: message.peer.audioEnabled !== false,
                  videoEnabled: message.peer.videoEnabled !== false,
                  handRaised: Boolean(message.peer.handRaised),
                  screenSharing: Boolean(message.peer.screenSharing),
                }
              : participant
          );
        });
        return;
      }

      if (message.type === 'signal' && message.fromId && message.data?.kind) {
        const signalPayload = message.data;
        if (signalPayload.kind === 'room-settings' && signalPayload.settings) {
          setRoomSettings((prev) => {
            const nextSettings =
              signalPayload.settings && typeof signalPayload.settings === 'object'
                ? signalPayload.settings
                : {};
            const resolvedHostPeerId =
              typeof nextSettings.hostPeerId === 'string' && nextSettings.hostPeerId.trim()
                ? nextSettings.hostPeerId.trim()
                : prev.hostPeerId || message.fromId;
            if (
              prev.hostPeerId &&
              message.fromId !== prev.hostPeerId &&
              message.fromId !== resolvedHostPeerId
            ) {
              return prev;
            }
            return {
              ...prev,
              hostPeerId: resolvedHostPeerId,
              lockAudio: Boolean(nextSettings.lockAudio),
              lockVideo: Boolean(nextSettings.lockVideo),
            };
          });
          return;
        }

        handleSignalingMessage({
          type: signalPayload.kind,
          fromPeerId: message.fromId,
          fromName: signalPayload.fromName || signalPayload.peer?.name,
          fromDesignation: signalPayload.fromDesignation || signalPayload.peer?.designation,
          fromProfilePic: signalPayload.fromProfilePic || signalPayload.peer?.profilePic,
          candidate: signalPayload.candidate,
          sdp: signalPayload.sdp,
          message: signalPayload.message,
          raised: signalPayload.raised,
          audio: signalPayload.audio,
          video: signalPayload.video,
        });
        return;
      }

      if (message.type === 'error') {
        if (message.code === 'NOT_HOST') {
          setError(message.message || 'Only the host can control this setting.');
          return;
        }
        setConnectionStatus('error');
        setError(message.message || 'Meeting server error.');
      }
    };

    socket.onerror = () => {
      setError('Failed to connect to meeting server.');
      setConnectionStatus('error');
    };

    socket.onclose = () => {
      if (manualLeaveRef.current) {
        return;
      }
      peerConnectionsRef.current.forEach(({ pc }) => pc.close());
      peerConnectionsRef.current.clear();
      setParticipants([]);
      setConnectionStatus('disconnected');
      setError('Connection lost. Please rejoin the meeting.');
      channelRef.current = null;
    };
  }, [
    handleSignalingMessage,
    currentUser,
    audioEnabled,
    videoEnabled,
    handRaised,
    screenSharing,
    getLocalStream,
  ]);

  // Leave meeting
  const leaveRoom = useCallback(() => {
    // Notify peers
    if (channelRef.current) {
      manualLeaveRef.current = true;
      if (channelRef.current.readyState === WebSocket.OPEN) {
        channelRef.current.send(
          JSON.stringify({
            type: 'leave',
            roomId: roomIdRef.current,
            peerId: peerIdRef.current,
          })
        );
      }
      channelRef.current.close();
      channelRef.current = null;
    }

    // Close all peer connections
    peerConnectionsRef.current.forEach(({ pc }) => pc.close());
    peerConnectionsRef.current.clear();

    // Stop local streams
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    setParticipants([]);
    setMessages([]);
    setConnectionStatus('disconnected');
    setScreenSharing(false);
    setPinnedPeer(null);
    roomIdRef.current = '';
    navigate('/dashboard');
  }, [navigate]);

  useEffect(() => {
    const peerConnections = peerConnectionsRef.current;

    return () => {
      manualLeaveRef.current = true;
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
      }
      peerConnections.forEach(({ pc }) => pc.close());
      peerConnections.clear();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }
    };
  }, []);

  // Broadcast media state change
  const broadcastMediaState = useCallback((audio, video, overrides = {}) => {
    const socket = channelRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: 'update-state',
          roomId: roomIdRef.current,
          peerId: peerIdRef.current,
          state: {
            name: currentUser?.name || 'Guest',
            designation: currentUser?.designation || '',
            profilePic: currentUser?.profilePic || '',
            audioEnabled: audio,
            videoEnabled: video,
            handRaised: typeof overrides.handRaised === 'boolean' ? overrides.handRaised : handRaised,
            screenSharing:
              typeof overrides.screenSharing === 'boolean' ? overrides.screenSharing : screenSharing,
          },
        })
      );
    }
  }, [currentUser, handRaised, screenSharing]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    const lockedForThisPeer = roomSettings.lockAudio && roomSettings.hostPeerId !== peerIdRef.current;
    if (lockedForThisPeer) {
      return;
    }

    if (localStreamRef.current) {
      const newState = !audioEnabled;
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = newState;
      });
      setAudioEnabled(newState);
      broadcastMediaState(newState, videoEnabled);
    }
  }, [audioEnabled, videoEnabled, broadcastMediaState, roomSettings.lockAudio, roomSettings.hostPeerId]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    const lockedForThisPeer = roomSettings.lockVideo && roomSettings.hostPeerId !== peerIdRef.current;
    if (lockedForThisPeer) {
      return;
    }

    if (localStreamRef.current) {
      const newState = !videoEnabled;
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = newState;
      });
      setVideoEnabled(newState);
      broadcastMediaState(audioEnabled, newState);
    }
  }, [videoEnabled, audioEnabled, broadcastMediaState, roomSettings.lockVideo, roomSettings.hostPeerId]);

  // Toggle screen sharing
  const toggleScreenShare = useCallback(async () => {
    const videoLockedForThisPeer = roomSettings.lockVideo && roomSettings.hostPeerId !== peerIdRef.current;
    if (videoLockedForThisPeer && !screenSharing) {
      return;
    }

    if (screenSharing) {
      // Stop screen sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      
      // Replace screen track with camera track
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        peerConnectionsRef.current.forEach(({ pc }) => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack);
          }
        });
        
        // Update local video preview
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      }
      
      setScreenSharing(false);
      broadcastMediaState(audioEnabled, videoEnabled, { screenSharing: false });
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: false,
        });
        
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];
        
        // Replace camera track with screen track
        peerConnectionsRef.current.forEach(({ pc }) => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        // Update local video preview
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        // Handle when user stops sharing via browser UI
        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setScreenSharing(true);
        broadcastMediaState(audioEnabled, videoEnabled, { screenSharing: true });
      } catch (err) {
        console.error('Error sharing screen:', err);
        if (err.name !== 'NotAllowedError') {
          setError('Unable to share screen');
        }
      }
    }
  }, [
    screenSharing,
    audioEnabled,
    videoEnabled,
    broadcastMediaState,
    roomSettings.lockVideo,
    roomSettings.hostPeerId,
  ]);

  // Toggle hand raise
  const toggleHandRaise = useCallback(() => {
    const newState = !handRaised;
    setHandRaised(newState);
    broadcastMediaState(audioEnabled, videoEnabled, { handRaised: newState });
  }, [handRaised, audioEnabled, videoEnabled, broadcastMediaState]);

  // Send chat message
  const sendMessage = useCallback(() => {
    if (!newMessage.trim()) return;

    const messageData = {
      fromPeerId: peerIdRef.current,
      fromName: currentUser?.name || 'Guest',
      message: newMessage.trim(),
    };

    // Add to local messages
    setMessages(prev => [...prev, {
      id: Date.now(),
      ...messageData,
      timestamp: new Date().toISOString(),
    }]);

    // Broadcast to others
    sendSignalEvent('chat', messageData);

    setNewMessage('');
  }, [newMessage, currentUser, sendSignalEvent]);

  const isHost = roomSettings.hostPeerId === peerIdRef.current;

  const updateRoomSettings = useCallback(
    (updates) => {
      if (!isHost) {
        return;
      }

      setRoomSettings((prev) => {
        const nextSettings = {
          ...prev,
          ...updates,
          hostPeerId: prev.hostPeerId || peerIdRef.current,
        };
        sendSignalEvent('room-settings', { settings: nextSettings });
        return nextSettings;
      });
    },
    [isHost, sendSignalEvent]
  );

  useEffect(() => {
    setRoomSettings((prev) => {
      const activePeerIds = [
        peerIdRef.current,
        ...participants.map((participant) => participant.peerId).filter(Boolean),
      ];
      if (prev.hostPeerId && activePeerIds.includes(prev.hostPeerId)) {
        return prev;
      }

      const sortedPeerIds = [...activePeerIds].sort((firstPeerId, secondPeerId) =>
        firstPeerId.localeCompare(secondPeerId)
      );
      return {
        ...prev,
        hostPeerId: sortedPeerIds[0] || peerIdRef.current,
      };
    });
  }, [participants]);

  useEffect(() => {
    if (isHost || !localStreamRef.current) {
      return;
    }

    let nextAudioEnabled = audioEnabled;
    let nextVideoEnabled = videoEnabled;
    let nextScreenSharing = screenSharing;
    let changed = false;

    if (roomSettings.lockAudio && nextAudioEnabled) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
      nextAudioEnabled = false;
      setAudioEnabled(false);
      changed = true;
    }

    if (roomSettings.lockVideo && nextVideoEnabled) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = false;
      });
      nextVideoEnabled = false;
      setVideoEnabled(false);
      changed = true;
    }

    if (roomSettings.lockVideo && nextScreenSharing && screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;

      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        peerConnectionsRef.current.forEach(({ pc }) => {
          const sender = pc.getSenders().find((entry) => entry.track?.kind === 'video');
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack);
          }
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      }

      nextScreenSharing = false;
      setScreenSharing(false);
      changed = true;
    }

    if (changed) {
      broadcastMediaState(nextAudioEnabled, nextVideoEnabled, {
        handRaised,
        screenSharing: nextScreenSharing,
      });
    }
  }, [
    isHost,
    roomSettings.lockAudio,
    roomSettings.lockVideo,
    audioEnabled,
    videoEnabled,
    handRaised,
    screenSharing,
    broadcastMediaState,
  ]);

  // Copy meeting link
  const copyMeetingLink = useCallback(async () => {
    const link = shareableMeetingLink || `${window.location.origin}/video-meet?room=${roomId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [roomId, shareableMeetingLink]);

  // Scroll chat to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Create new meeting
  const createMeeting = () => {
    const newRoomId = generateMeetingRoomCode();
    setRoomId(newRoomId);
    roomIdRef.current = newRoomId;
    setScheduledStartAt('');
    setLinkMeetingTitle('');
    setLinkMeetingId('');
    setClockNow(Date.now());
    setView('preview');
  };

  // Join existing meeting
  const joinMeeting = () => {
    if (!joinRoomId.trim()) {
      return;
    }

    const parsedInput = parseMeetingInput(joinRoomId.trim());
    if (!parsedInput.roomId) {
      setError('Enter a valid meeting code or full meeting link');
      return;
    }

    setError('');
    setRoomId(parsedInput.roomId);
    roomIdRef.current = parsedInput.roomId;
    setScheduledStartAt(parsedInput.start || '');
    setLinkMeetingTitle(parsedInput.title || '');
    setLinkMeetingId(parsedInput.meetingId || '');
    setClockNow(Date.now());
    setView('preview');
  };

  // Start meeting from preview
  const startMeeting = () => {
    setClockNow(Date.now());
    if (!canJoinScheduledMeeting) {
      if (scheduledStartLabel) {
        setError(`This meeting starts at ${scheduledStartLabel}. You can stay in preview until then.`);
      } else {
        setError('This meeting has not started yet.');
      }
      return;
    }
    joinRoom(roomId);
  };

  // Pin/unpin participant
  const togglePinParticipant = (peerId) => {
    setPinnedPeer(prev => prev === peerId ? null : peerId);
  };

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // HOME VIEW
  if (view === 'home') {
    return (
      <div className="video-meet-container">
        <header className="video-meet-header">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={20} /> Back
          </button>
          <h1>Cracoe Meet</h1>
        </header>

        <div className="home-content">
          <div className="home-hero">
            <div className="hero-left">
              <h2>Premium video meetings. Now free for everyone.</h2>
              <p>We re-created Cracoe Meet - secure video calling for all your team's meetings.</p>
              
              <div className="action-buttons">
                <button className="btn-primary" onClick={createMeeting}>
                  <Video size={20} />
                  New meeting
                </button>
                
                <div className="join-input-group">
                  <input
                    type="text"
                    placeholder="Enter a code or link"
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && joinMeeting()}
                  />
                  <button 
                    className="btn-secondary"
                    onClick={joinMeeting}
                    disabled={!joinRoomId.trim()}
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>

            <div className="hero-right">
              <div className="hero-illustration">
                <div className="illustration-grid">
                  <div className="illustration-card"></div>
                  <div className="illustration-card"></div>
                  <div className="illustration-card"></div>
                  <div className="illustration-card"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="features-section">
            <h3>Features</h3>
            <div className="features-grid">
              <div className="feature-card">
                <Video size={32} />
                <h4>HD Video</h4>
                <p>Crystal clear video quality for all participants</p>
              </div>
              <div className="feature-card">
                <MonitorUp size={32} />
                <h4>Screen Sharing</h4>
                <p>Share your screen with one click</p>
              </div>
              <div className="feature-card">
                <MessageSquare size={32} />
                <h4>In-call Chat</h4>
                <p>Send messages during the meeting</p>
              </div>
              <div className="feature-card">
                <Users size={32} />
                <h4>Multiple Participants</h4>
                <p>Connect with your entire team</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PREVIEW VIEW
  if (view === 'preview') {
    return (
      <div className="video-meet-container">
        <header className="video-meet-header">
          <button className="back-btn" onClick={() => setView('home')}>
            <ArrowLeft size={20} /> Back
          </button>
          <h1>Ready to join?</h1>
        </header>

        <div className="preview-content">
          <div className="preview-video-container">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`preview-video ${!videoEnabled ? 'video-off' : ''}`}
            />
            {!videoEnabled && (
              <div className="video-placeholder">
                <div className="avatar-large">
                  {currentUser?.profilePic ? (
                    <img src={currentUser.profilePic} alt={currentUser.name} />
                  ) : (
                    getInitials(currentUser?.name)
                  )}
                </div>
              </div>
            )}
            
            <div className="preview-controls">
              <button
                className={`control-btn ${!audioEnabled ? 'off' : ''}`}
                onClick={toggleAudio}
                title={audioEnabled ? 'Turn off microphone' : 'Turn on microphone'}
              >
                {audioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
              </button>
              <button
                className={`control-btn ${!videoEnabled ? 'off' : ''}`}
                onClick={toggleVideo}
                title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
              >
                {videoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
              </button>
            </div>
          </div>

          <div className="preview-info">
            <h2>{currentUser?.name || 'Guest'}</h2>
            {linkMeetingTitle && <p className="scheduled-title">{linkMeetingTitle}</p>}
            <p className="meeting-code">Meeting code: <strong>{roomId}</strong></p>
            {meetingTiming.startIso && (
              <div className={`scheduled-chip ${meetingTiming.status}`}>
                <span>Start: {scheduledStartLabel}</span>
                {meetingTiming.status === 'upcoming' && <strong>{meetingTiming.label}</strong>}
                {meetingTiming.status === 'live' && <strong>Meeting is live</strong>}
              </div>
            )}
            
            {error && <div className="error-message">{error}</div>}

            <div className="preview-actions">
              <button
                className="btn-primary"
                onClick={startMeeting}
                disabled={!canJoinScheduledMeeting}
              >
                {canJoinScheduledMeeting ? 'Join now' : 'Waiting for start time'}
              </button>
            </div>

            <div className="share-link">
              <p>Share this link with others you want in the meeting</p>
              <div className="link-box">
                <span>{shareableMeetingLink || `${window.location.origin}/video-meet?room=${roomId}`}</span>
                <button onClick={copyMeetingLink}>
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MEETING VIEW
  const allParticipants = [
    { 
      peerId: 'local', 
      name: currentUser?.name || 'You', 
      isLocal: true,
      audioEnabled,
      videoEnabled,
      handRaised,
      profilePic: currentUser?.profilePic,
      designation: currentUser?.designation,
    },
    ...participants
  ];

  const spotlightPeer = pinnedPeer 
    ? allParticipants.find(p => p.peerId === pinnedPeer) 
    : allParticipants[0];

  return (
    <div className={`video-meet-container meeting-view ${showChat || showParticipants ? 'sidebar-open' : ''}`}>
      <div className="meeting-main">
        <div className={`video-grid ${layout} ${allParticipants.length === 1 ? 'single' : allParticipants.length === 2 ? 'two' : allParticipants.length <= 4 ? 'four' : 'many'}`}>
          {layout === 'spotlight' && spotlightPeer ? (
            <>
              {/* Spotlight video */}
              <div className="video-tile spotlight">
                {spotlightPeer.isLocal ? (
                  <>
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className={!videoEnabled && !screenSharing ? 'video-off' : ''}
                    />
                    {!videoEnabled && !screenSharing && (
                      <div className="video-placeholder">
                        <div className="avatar-xlarge">
                          {currentUser?.profilePic ? (
                            <img src={currentUser.profilePic} alt={currentUser.name} />
                          ) : (
                            getInitials(currentUser?.name)
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <video
                      autoPlay
                      playsInline
                      ref={(el) => {
                        if (el && spotlightPeer.stream) {
                          el.srcObject = spotlightPeer.stream;
                        }
                      }}
                      className={!spotlightPeer.videoEnabled && !spotlightPeer.screenSharing ? 'video-off' : ''}
                    />
                    {!spotlightPeer.videoEnabled && !spotlightPeer.screenSharing && (
                      <div className="video-placeholder">
                        <div className="avatar-xlarge">
                          {spotlightPeer.profilePic ? (
                            <img src={spotlightPeer.profilePic} alt={spotlightPeer.name} />
                          ) : (
                            getInitials(spotlightPeer.name)
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div className="tile-info">
                  <span className="tile-name">{spotlightPeer.name} {spotlightPeer.isLocal ? '(You)' : ''}</span>
                  {((spotlightPeer.isLocal && isHost) ||
                    (!spotlightPeer.isLocal && roomSettings.hostPeerId === spotlightPeer.peerId)) && (
                    <span className="tile-chip">Host</span>
                  )}
                  {!spotlightPeer.audioEnabled && <MicOff size={16} />}
                  {spotlightPeer.handRaised && <Hand size={16} className="hand-icon" />}
                </div>
                {spotlightPeer.screenSharing && <div className="sharing-badge">Presenting</div>}
              </div>
              
              {/* Thumbnail strip */}
              <div className="thumbnail-strip">
                {allParticipants.filter(p => p.peerId !== spotlightPeer.peerId).map((participant) => (
                  <div 
                    key={participant.peerId} 
                    className="video-tile thumbnail"
                    onClick={() => togglePinParticipant(participant.peerId)}
                  >
                    {participant.isLocal ? (
                      <>
                        <video
                          autoPlay
                          playsInline
                          muted
                          ref={(el) => {
                            if (el && localStreamRef.current) {
                              el.srcObject = screenSharing ? screenStreamRef.current : localStreamRef.current;
                            }
                          }}
                          className={!videoEnabled && !screenSharing ? 'video-off' : ''}
                        />
                        {!videoEnabled && !screenSharing && (
                          <div className="video-placeholder">
                            <div className="avatar-small">
                              {currentUser?.profilePic ? (
                                <img src={currentUser.profilePic} alt={currentUser.name} />
                              ) : (
                                getInitials(currentUser?.name)
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <video
                          autoPlay
                          playsInline
                          ref={(el) => {
                            if (el && participant.stream) {
                              el.srcObject = participant.stream;
                            }
                          }}
                          className={!participant.videoEnabled && !participant.screenSharing ? 'video-off' : ''}
                        />
                        {!participant.videoEnabled && !participant.screenSharing && (
                          <div className="video-placeholder">
                            <div className="avatar-small">
                              {participant.profilePic ? (
                                <img src={participant.profilePic} alt={participant.name} />
                              ) : (
                                getInitials(participant.name)
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    <div className="tile-info-mini">
                      <span>{participant.isLocal ? 'You' : participant.name?.split(' ')[0]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            // Grid layout
            <>
              {/* Local video */}
              <div 
                className={`video-tile ${pinnedPeer === 'local' ? 'pinned' : ''}`}
                onClick={() => togglePinParticipant('local')}
              >
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={!videoEnabled && !screenSharing ? 'video-off' : ''}
                />
                {!videoEnabled && !screenSharing && (
                  <div className="video-placeholder">
                    <div className="avatar-medium">
                      {currentUser?.profilePic ? (
                        <img src={currentUser.profilePic} alt={currentUser.name} />
                      ) : (
                        getInitials(currentUser?.name)
                      )}
                    </div>
                  </div>
                )}
                <div className="tile-info">
                  <span className="tile-name">{currentUser?.name || 'You'} (You)</span>
                  {isHost && <span className="tile-chip">Host</span>}
                  {!audioEnabled && <MicOff size={16} />}
                  {handRaised && <Hand size={16} className="hand-icon" />}
                </div>
                {screenSharing && <div className="sharing-badge">Presenting</div>}
                {pinnedPeer === 'local' && <div className="pinned-badge"><Maximize2 size={14} /></div>}
              </div>

              {/* Remote participants */}
              {participants.map((participant) => (
                <div 
                  key={participant.peerId} 
                  className={`video-tile ${pinnedPeer === participant.peerId ? 'pinned' : ''}`}
                  onClick={() => togglePinParticipant(participant.peerId)}
                >
                  <video
                    autoPlay
                    playsInline
                    ref={(el) => {
                      if (el && participant.stream) {
                        el.srcObject = participant.stream;
                      }
                    }}
                    className={!participant.videoEnabled && !participant.screenSharing ? 'video-off' : ''}
                  />
                  {!participant.videoEnabled && !participant.screenSharing && (
                    <div className="video-placeholder">
                      <div className="avatar-medium">
                        {participant.profilePic ? (
                          <img src={participant.profilePic} alt={participant.name} />
                        ) : (
                          getInitials(participant.name)
                        )}
                      </div>
                    </div>
                  )}
                  <div className="tile-info">
                    <span className="tile-name">{participant.name}</span>
                    {roomSettings.hostPeerId === participant.peerId && <span className="tile-chip">Host</span>}
                    {!participant.audioEnabled && <MicOff size={16} />}
                    {participant.handRaised && <Hand size={16} className="hand-icon" />}
                  </div>
                  {participant.screenSharing && <div className="sharing-badge">Presenting</div>}
                  {pinnedPeer === participant.peerId && <div className="pinned-badge"><Maximize2 size={14} /></div>}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Meeting controls */}
        <div className="meeting-controls">
          <div className="controls-left">
            <span className="meeting-time">{roomId}</span>
            <span className={`connection-status ${connectionStatus}`}>
              {connectionStatus === 'connected'
                ? 'Connected'
                : connectionStatus === 'connecting'
                  ? 'Connecting...'
                  : connectionStatus === 'error'
                    ? 'Error'
                    : 'Disconnected'}
            </span>
            {isHost && <span className="connection-status connected">Host</span>}
            {!isHost && roomSettings.lockAudio && <span className="connection-status error">Mic Locked</span>}
            {!isHost && roomSettings.lockVideo && <span className="connection-status error">Cam Locked</span>}
          </div>
          
          <div className="controls-center">
            <button
              className={`control-btn ${!audioEnabled ? 'off' : ''}`}
              onClick={toggleAudio}
              title={
                !isHost && roomSettings.lockAudio
                  ? 'Host has locked microphones'
                  : audioEnabled
                    ? 'Turn off microphone'
                    : 'Turn on microphone'
              }
              disabled={!isHost && roomSettings.lockAudio}
            >
              {audioEnabled ? <Mic size={22} /> : <MicOff size={22} />}
            </button>
            
            <button
              className={`control-btn ${!videoEnabled ? 'off' : ''}`}
              onClick={toggleVideo}
              title={
                !isHost && roomSettings.lockVideo
                  ? 'Host has locked cameras'
                  : videoEnabled
                    ? 'Turn off camera'
                    : 'Turn on camera'
              }
              disabled={!isHost && roomSettings.lockVideo}
            >
              {videoEnabled ? <Video size={22} /> : <VideoOff size={22} />}
            </button>
            
            <button
              className={`control-btn ${screenSharing ? 'active' : ''}`}
              onClick={toggleScreenShare}
              title={screenSharing ? 'Stop presenting' : 'Present now'}
            >
              <MonitorUp size={22} />
            </button>
            
            <button
              className={`control-btn ${handRaised ? 'active' : ''}`}
              onClick={toggleHandRaise}
              title={handRaised ? 'Lower hand' : 'Raise hand'}
            >
              <Hand size={22} />
            </button>
            
            <button
              className="control-btn leave"
              onClick={leaveRoom}
              title="Leave call"
            >
              <PhoneOff size={22} />
            </button>
          </div>
          
          <div className="controls-right">
            <button
              className={`control-btn icon-only ${showChat ? 'active' : ''}`}
              onClick={() => { setShowChat(!showChat); setShowParticipants(false); }}
              title="Chat"
            >
              <MessageSquare size={22} />
              {messages.length > 0 && <span className="badge">{messages.length}</span>}
            </button>
            
            <button
              className={`control-btn icon-only ${showParticipants ? 'active' : ''}`}
              onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}
              title="Participants"
            >
              <Users size={22} />
              <span className="badge">{participants.length + 1}</span>
            </button>
            
            <button
              className={`control-btn icon-only ${layout === 'spotlight' ? 'active' : ''}`}
              onClick={() => setLayout(layout === 'grid' ? 'spotlight' : 'grid')}
              title={layout === 'grid' ? 'Spotlight view' : 'Grid view'}
            >
              {layout === 'grid' ? <Maximize2 size={22} /> : <Grid size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Chat sidebar */}
      {showChat && (
        <div className="sidebar chat-sidebar">
          <div className="sidebar-header">
            <h3>In-call messages</h3>
            <button onClick={() => setShowChat(false)}>
              <X size={20} />
            </button>
          </div>
          
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="no-messages">
                <MessageSquare size={48} />
                <p>Messages can only be seen by people in the call</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`chat-message ${msg.fromPeerId === peerIdRef.current ? 'own' : ''}`}
                >
                  <div className="message-header">
                    <span className="sender-name">
                      {msg.fromPeerId === peerIdRef.current ? 'You' : msg.fromName}
                    </span>
                    <span className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="message-text">{msg.message}</p>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="chat-input">
            <input
              type="text"
              placeholder="Send a message to everyone"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button onClick={sendMessage} disabled={!newMessage.trim()}>
              <Send size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Participants sidebar */}
      {showParticipants && (
        <div className="sidebar participants-sidebar">
          <div className="sidebar-header">
            <h3>People ({participants.length + 1})</h3>
            <button onClick={() => setShowParticipants(false)}>
              <X size={20} />
            </button>
          </div>
          
          <div className="participants-list">
            {/* Local user */}
            <div className="participant-item">
              <div className="participant-avatar">
                {currentUser?.profilePic ? (
                  <img src={currentUser.profilePic} alt={currentUser.name} />
                ) : (
                  getInitials(currentUser?.name)
                )}
              </div>
              <div className="participant-info">
                <div className="participant-name-row">
                  <span className="participant-name">{currentUser?.name || 'You'} (You)</span>
                  {isHost && <span className="participant-chip">Host</span>}
                </div>
                <span className="participant-status">
                  {currentUser?.designation || 'Guest'}
                </span>
              </div>
              <div className="participant-icons">
                {!audioEnabled && <MicOff size={16} />}
                {!videoEnabled && <VideoOff size={16} />}
                {handRaised && <Hand size={16} className="hand-raised" />}
              </div>
            </div>
            
            {/* Remote participants */}
            {participants.map((participant) => (
              <div key={participant.peerId} className="participant-item">
                <div className="participant-avatar">
                  {participant.profilePic ? (
                    <img src={participant.profilePic} alt={participant.name} />
                  ) : (
                    getInitials(participant.name)
                  )}
                </div>
                <div className="participant-info">
                  <div className="participant-name-row">
                    <span className="participant-name">{participant.name}</span>
                    {roomSettings.hostPeerId === participant.peerId && (
                      <span className="participant-chip">Host</span>
                    )}
                  </div>
                  {participant.designation && (
                    <span className="participant-status">{participant.designation}</span>
                  )}
                </div>
                <div className="participant-icons">
                  {!participant.audioEnabled && <MicOff size={16} />}
                  {!participant.videoEnabled && <VideoOff size={16} />}
                  {participant.handRaised && <Hand size={16} className="hand-raised" />}
                </div>
              </div>
            ))}
          </div>

          <div className="host-controls-section">
            <h4>Host controls</h4>
            {isHost ? (
              <>
                <div className="host-control-grid">
                  <button
                    className={`host-control-btn ${roomSettings.lockAudio ? 'active' : ''}`}
                    onClick={() => updateRoomSettings({ lockAudio: !roomSettings.lockAudio })}
                  >
                    {roomSettings.lockAudio ? <Lock size={16} /> : <Unlock size={16} />}
                    <span>{roomSettings.lockAudio ? 'Unlock microphones' : 'Lock microphones'}</span>
                  </button>
                  <button
                    className={`host-control-btn ${roomSettings.lockVideo ? 'active' : ''}`}
                    onClick={() => updateRoomSettings({ lockVideo: !roomSettings.lockVideo })}
                  >
                    {roomSettings.lockVideo ? <Lock size={16} /> : <Unlock size={16} />}
                    <span>{roomSettings.lockVideo ? 'Unlock cameras' : 'Lock cameras'}</span>
                  </button>
                </div>
                <p className="host-controls-note">Locks apply to everyone except the host.</p>
              </>
            ) : (
              <p className="host-controls-note">
                {roomSettings.lockAudio || roomSettings.lockVideo
                  ? `Host has ${
                      roomSettings.lockAudio && roomSettings.lockVideo
                        ? 'locked microphones and cameras'
                        : roomSettings.lockAudio
                          ? 'locked microphones'
                          : 'locked cameras'
                    } for this call.`
                  : 'Host controls are managed by the meeting host.'}
              </p>
            )}
          </div>

          <div className="share-section">
            <h4>Share meeting info</h4>
            <div className="share-link-box">
              <span>{shareableMeetingLink || roomId}</span>
              <button onClick={copyMeetingLink} title="Copy meeting link">
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
