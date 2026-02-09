import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Link as LinkIcon,
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  PhoneOff,
  ShieldCheck,
  ShieldAlert,
  Radio,
  History,
  Users,
  Sparkles,
} from 'lucide-react';
import { useDataStore } from '../store/dataStore';
import '../styles/VideoMeet.css';

const sanitizeRoom = (value) =>
  value
    .trim()
    .replace(/[^a-zA-Z0-9-_\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();

const createPeerId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `peer_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

const SIGNALING_URL =
  process.env.REACT_APP_SIGNALING_URL ||
  process.env.NEXT_PUBLIC_SIGNALING_URL ||
  'ws://localhost:3000/ws';

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

export default function VideoMeetScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const roomFromUrl = params.get('room') || '';

  const currentUser = useDataStore((state) => state.getCurrentUser());
  const messages = useDataStore((state) => state.messages);
  const meetings = useDataStore((state) => state.meetings);
  const sendSharedMessage = useDataStore((state) => state.sendSharedMessage);
  const addMeeting = useDataStore((state) => state.addMeeting);
  const getUser = useDataStore((state) => state.getUser);

  const [roomName, setRoomName] = useState(roomFromUrl);
  const [displayName, setDisplayName] = useState(currentUser?.name || '');
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [joined, setJoined] = useState(false);
  const [hostMode, setHostMode] = useState(!roomFromUrl);
  const [lobbyEnabled, setLobbyEnabled] = useState(true);
  const [requestSent, setRequestSent] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('idle');
  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState([]);

  const localVideoRef = useRef(null);
  const wsRef = useRef(null);
  const peerIdRef = useRef(createPeerId());
  const peersRef = useRef(new Map());
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  const roomSlug = useMemo(() => sanitizeRoom(roomName), [roomName]);

  const meetingLink = useMemo(() => {
    if (!roomSlug) {
      return '';
    }
    return `${window.location.origin}/video-meet?room=${encodeURIComponent(roomSlug)}`;
  }, [roomSlug]);

  const hostSignal = useMemo(() => {
    const signals = messages
      .filter((msg) => msg.type === 'meeting_host' && msg.payload?.roomSlug === roomSlug)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return signals[signals.length - 1];
  }, [messages, roomSlug]);

  const lobbySignal = useMemo(() => {
    const signals = messages
      .filter((msg) => msg.type === 'meeting_lobby' && msg.payload?.roomSlug === roomSlug)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return signals[signals.length - 1];
  }, [messages, roomSlug]);

  const recordingSignal = useMemo(() => {
    const signals = messages
      .filter((msg) => msg.type === 'meeting_recording' && msg.payload?.roomSlug === roomSlug)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return signals[signals.length - 1];
  }, [messages, roomSlug]);

  const hostId = hostSignal?.payload?.hostId || null;
  const isHost = hostId ? hostId === currentUser?.id : hostMode;
  const lobbyRequired = lobbySignal?.payload?.enabled ?? lobbyEnabled;
  const recordingActive = recordingSignal?.payload?.action === 'start';

  const approvals = useMemo(
    () =>
      messages.filter(
        (msg) => msg.type === 'meeting_approved' && msg.payload?.roomSlug === roomSlug
      ),
    [messages, roomSlug]
  );

  const denials = useMemo(
    () =>
      messages.filter((msg) => msg.type === 'meeting_denied' && msg.payload?.roomSlug === roomSlug),
    [messages, roomSlug]
  );

  const approvedForCurrentUser = approvals.some(
    (msg) => msg.payload?.userId === currentUser?.id
  );
  const deniedForCurrentUser = denials.some((msg) => msg.payload?.userId === currentUser?.id);

  const pendingRequests = useMemo(() => {
    const approvedIds = new Set(approvals.map((msg) => msg.payload?.userId));
    return messages
      .filter((msg) => msg.type === 'meeting_request' && msg.payload?.roomSlug === roomSlug)
      .filter((msg) => !approvedIds.has(msg.payload?.userId));
  }, [messages, approvals, roomSlug]);

  const meetingHistory = useMemo(() => {
    return [...meetings]
      .sort(
        (a, b) =>
          new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()
      )
      .slice(-5)
      .reverse();
  }, [meetings]);

  const ensureLocalStream = useCallback(async () => {
    if (cameraStreamRef.current) {
      return cameraStreamRef.current;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !audioMuted;
    });
    stream.getVideoTracks().forEach((track) => {
      track.enabled = !videoMuted;
    });
    cameraStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, [audioMuted, videoMuted]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (!joined && !localStream) {
      ensureLocalStream().catch(() => {
        setError('Camera or microphone access is required to join.');
      });
    }
  }, [joined, localStream, ensureLocalStream]);

  useEffect(() => {
    if (!joined && lobbyRequired && approvedForCurrentUser) {
      setJoined(true);
      setError('');
    }
  }, [approvedForCurrentUser, lobbyRequired, joined]);

  useEffect(() => {
    if (deniedForCurrentUser) {
      setError('Your join request was denied by the host.');
      setRequestSent(false);
    }
  }, [deniedForCurrentUser]);

  const updatePeerStream = (peerId, stream, name) => {
    setPeers((prev) => {
      const existing = prev.find((peer) => peer.id === peerId);
      if (existing) {
        return prev.map((peer) =>
          peer.id === peerId ? { ...peer, stream, name: name || peer.name } : peer
        );
      }
      return [...prev, { id: peerId, stream, name }];
    });
  };

  const removePeer = (peerId) => {
    const entry = peersRef.current.get(peerId);
    if (entry?.pc) {
      entry.pc.close();
    }
    peersRef.current.delete(peerId);
    setPeers((prev) => prev.filter((peer) => peer.id !== peerId));
  };

  const sendSignal = (payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  };

  const createPeerConnection = async (peerId, peerName, isInitiator) => {
    if (peersRef.current.has(peerId)) {
      return peersRef.current.get(peerId).pc;
    }
    const local = await ensureLocalStream();
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    local.getTracks().forEach((track) => pc.addTrack(track, local));

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({
          type: 'signal',
          roomId: roomSlug,
          peerId: peerIdRef.current,
          targetId: peerId,
          data: { type: 'ice', candidate: event.candidate },
        });
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      updatePeerStream(peerId, stream, peerName);
    };

    peersRef.current.set(peerId, { pc, name: peerName });

    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal({
        type: 'signal',
        roomId: roomSlug,
        peerId: peerIdRef.current,
        targetId: peerId,
        data: { type: 'offer', sdp: offer },
      });
    }

    return pc;
  };

  const handleSignalMessage = async (fromId, data) => {
    if (!data) return;
    if (data.type === 'offer') {
      const pc = await createPeerConnection(fromId, null, false);
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal({
        type: 'signal',
        roomId: roomSlug,
        peerId: peerIdRef.current,
        targetId: fromId,
        data: { type: 'answer', sdp: answer },
      });
      return;
    }
    if (data.type === 'answer') {
      const entry = peersRef.current.get(fromId);
      if (entry?.pc) {
        await entry.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      }
      return;
    }
    if (data.type === 'ice') {
      const entry = peersRef.current.get(fromId);
      if (entry?.pc && data.candidate) {
        try {
          await entry.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          // Ignore late ICE candidates.
        }
      }
    }
  };

  const connectSocket = () => {
    if (wsRef.current) {
      return;
    }
    const ws = new WebSocket(SIGNALING_URL);
    wsRef.current = ws;
    setConnectionStatus('connecting');

    ws.onopen = () => {
      setConnectionStatus('connected');
      sendSignal({
        type: 'join',
        roomId: roomSlug,
        peerId: peerIdRef.current,
        name: displayName || currentUser?.name || 'Guest',
      });
    };

    ws.onmessage = async (event) => {
      let payload;
      try {
        payload = JSON.parse(event.data);
      } catch (err) {
        return;
      }
      if (!payload) return;

      if (payload.type === 'peers') {
        const peersList = payload.peers || [];
        await Promise.all(
          peersList.map((peer) => createPeerConnection(peer.id, peer.name, true))
        );
        return;
      }

      if (payload.type === 'peer-joined') {
        const peer = payload.peer;
        if (peer?.id) {
          await createPeerConnection(peer.id, peer.name, true);
        }
        return;
      }

      if (payload.type === 'peer-left') {
        if (payload.peerId) {
          removePeer(payload.peerId);
        }
        return;
      }

      if (payload.type === 'signal') {
        await handleSignalMessage(payload.fromId, payload.data);
      }
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
      wsRef.current = null;
    };
  };

  const handleJoin = async () => {
    if (!roomSlug) {
      setError('Enter a meeting name to continue.');
      return;
    }
    if (lobbyRequired && !isHost && !approvedForCurrentUser) {
      setError('This room requires approval. Request access to join.');
      return;
    }

    await ensureLocalStream();
    connectSocket();

    if (isHost) {
      sendSharedMessage('meeting_host', {
        roomSlug,
        hostId: currentUser?.id,
        hostName: currentUser?.name,
      });
      sendSharedMessage('meeting_lobby', {
        roomSlug,
        enabled: lobbyRequired,
        hostId: currentUser?.id,
      });

      const now = new Date();
      const date = now.toISOString().slice(0, 10);
      const time = now.toTimeString().slice(0, 5);
      const alreadyLogged = meetings.some((meeting) => meeting.title === roomSlug && meeting.date === date);
      if (!alreadyLogged) {
        addMeeting(roomSlug, date, time, currentUser?.id ? [currentUser.id] : []);
      }
    }

    setError('');
    setJoined(true);
  };

  const handleRequestAccess = () => {
    if (!roomSlug) {
      setError('Enter a meeting name to continue.');
      return;
    }
    if (!currentUser?.id) {
      setError('You must be logged in to request access.');
      return;
    }
    sendSharedMessage('meeting_request', {
      roomSlug,
      userId: currentUser.id,
      name: currentUser.name,
    });
    setRequestSent(true);
    setError('Request sent. Waiting for host approval.');
  };

  const handleLeave = () => {
    setJoined(false);
    setPeers([]);
    peersRef.current.forEach((entry) => entry.pc?.close());
    peersRef.current.clear();
    if (wsRef.current) {
      sendSignal({ type: 'leave', roomId: roomSlug, peerId: peerIdRef.current });
      wsRef.current.close();
      wsRef.current = null;
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setLocalStream(null);
    setScreenSharing(false);
  };

  const handleToggleLobby = () => {
    const nextValue = !lobbyEnabled;
    setLobbyEnabled(nextValue);
    if (roomSlug && isHost) {
      sendSharedMessage('meeting_lobby', {
        roomSlug,
        enabled: nextValue,
        hostId: currentUser?.id,
      });
    }
  };

  const handleApprove = (request) => {
    if (!request?.payload?.userId) {
      return;
    }
    sendSharedMessage('meeting_approved', {
      roomSlug,
      userId: request.payload.userId,
      name: request.payload.name,
      hostId: currentUser?.id,
    });
  };

  const handleDeny = (request) => {
    if (!request?.payload?.userId) {
      return;
    }
    sendSharedMessage('meeting_denied', {
      roomSlug,
      userId: request.payload.userId,
      name: request.payload.name,
      hostId: currentUser?.id,
    });
  };

  const handleRecording = (action) => {
    if (!roomSlug) {
      return;
    }
    sendSharedMessage('meeting_recording', {
      roomSlug,
      action,
      by: currentUser?.id,
      byName: currentUser?.name,
    });
  };

  const handleCopy = async () => {
    if (!meetingLink) {
      return;
    }
    try {
      await navigator.clipboard.writeText(meetingLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setCopied(false);
    }
  };

  const toggleMute = () => {
    const nextValue = !audioMuted;
    setAudioMuted(nextValue);
    const stream = cameraStreamRef.current || localStream;
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !nextValue;
      });
    }
  };

  const toggleVideo = () => {
    const nextValue = !videoMuted;
    setVideoMuted(nextValue);
    const stream = cameraStreamRef.current || localStream;
    if (stream) {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = !nextValue;
      });
    }
  };

  const toggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = displayStream;
        const screenTrack = displayStream.getVideoTracks()[0];
        const entryList = Array.from(peersRef.current.values());
        entryList.forEach((entry) => {
          const sender = entry.pc
            .getSenders()
            .find((track) => track.track && track.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = displayStream;
        }
        setScreenSharing(true);
        screenTrack.onended = () => {
          toggleScreenShare();
        };
      } catch (err) {
        // ignore
      }
      return;
    }

    const cameraStream = cameraStreamRef.current;
    if (cameraStream) {
      const cameraTrack = cameraStream.getVideoTracks()[0];
      const entryList = Array.from(peersRef.current.values());
      entryList.forEach((entry) => {
        const sender = entry.pc
          .getSenders()
          .find((track) => track.track && track.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(cameraTrack);
        }
      });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = cameraStream;
      }
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setScreenSharing(false);
  };

  return (
    <div className="meet-page">
      <div className="meet-topbar">
        <button className="meet-back" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={18} />
          Back to dashboard
        </button>
        <div className="meet-brand">
          <span className="meet-orb" />
          <div>
            <div className="meet-title">Cracoe Live</div>
            <div className="meet-subtitle">Original meeting experience</div>
          </div>
        </div>
        {joined ? (
          <button className="meet-leave" onClick={handleLeave}>
            Leave room
          </button>
        ) : null}
      </div>

      <div className="meet-shell">
        <div className="meet-left">
          <div className="meet-header">
            <div>
              <h1>Launch a live room</h1>
              <p>In-app WebRTC meetings with real-time audio, video, and collaboration.</p>
            </div>
            <span className="meet-badge">
              <Sparkles size={14} />
              Live
            </span>
          </div>

          {!joined ? (
            <div className="meet-card">
              <label className="meet-label">Meeting name</label>
              <input
                className="meet-input"
                placeholder="e.g., cracoe-sprint-sync"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
              />

              <label className="meet-label">Display name</label>
              <input
                className="meet-input"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />

              <div className="meet-preview">
                <video ref={localVideoRef} autoPlay muted playsInline />
                <span>{displayName || currentUser?.name || 'You'}</span>
              </div>

              <div className="meet-toggles">
                <button
                  type="button"
                  className={`meet-toggle ${audioMuted ? 'inactive' : ''}`}
                  onClick={toggleMute}
                >
                  {audioMuted ? <MicOff size={18} /> : <Mic size={18} />}
                  {audioMuted ? 'Mic off' : 'Mic on'}
                </button>
                <button
                  type="button"
                  className={`meet-toggle ${videoMuted ? 'inactive' : ''}`}
                  onClick={toggleVideo}
                >
                  {videoMuted ? <VideoOff size={18} /> : <Video size={18} />}
                  {videoMuted ? 'Cam off' : 'Cam on'}
                </button>
              </div>

              <div className="meet-options">
                <button
                  type="button"
                  className={`meet-toggle ${hostMode ? '' : 'inactive'}`}
                  onClick={() => setHostMode((prev) => !prev)}
                >
                  <ShieldCheck size={18} />
                  Host this room
                </button>
                <button
                  type="button"
                  className={`meet-toggle ${lobbyRequired ? '' : 'inactive'}`}
                  onClick={handleToggleLobby}
                  disabled={!hostMode && !isHost}
                >
                  <ShieldAlert size={18} />
                  Lobby approval
                </button>
              </div>

              {error ? <div className="meet-error">{error}</div> : null}

              <div className="meet-actions">
                {lobbyRequired && !isHost && !approvedForCurrentUser ? (
                  <button className="meet-primary" onClick={handleRequestAccess} disabled={requestSent}>
                    {requestSent ? 'Request sent' : 'Request access'}
                  </button>
                ) : (
                  <button className="meet-primary" onClick={handleJoin}>
                    Start meeting
                  </button>
                )}
                <button className="meet-secondary" onClick={handleCopy} disabled={!meetingLink}>
                  <LinkIcon size={16} />
                  {copied ? 'Link copied' : 'Copy invite'}
                </button>
              </div>

              <div className="meet-note">
                <Users size={16} />
                Share the invite to bring your team in instantly.
              </div>
            </div>
          ) : (
            <div className="meet-live">
              <div className="meet-live-header">
                <div>
                  <h2>{roomSlug}</h2>
                  <span>Connection: {connectionStatus}</span>
                </div>
                <div className="meet-live-actions">
                  {isHost ? (
                    <button
                      className={`meet-secondary ${recordingActive ? 'recording' : ''}`}
                      onClick={() => handleRecording(recordingActive ? 'stop' : 'start')}
                    >
                      <Radio size={16} />
                      {recordingActive ? 'Stop recording' : 'Start recording'}
                    </button>
                  ) : null}
                  <button className="meet-secondary" onClick={handleCopy}>
                    <LinkIcon size={16} />
                    {copied ? 'Link copied' : 'Copy invite'}
                  </button>
                </div>
              </div>

              <div className="meet-video-grid">
                <div className="meet-video-tile">
                  <video ref={localVideoRef} autoPlay muted playsInline />
                  <span>{displayName || currentUser?.name || 'You'}</span>
                </div>
                {peers.map((peer) => (
                  <div key={peer.id} className="meet-video-tile">
                    <video
                      autoPlay
                      playsInline
                      ref={(el) => {
                        if (el && peer.stream) {
                          el.srcObject = peer.stream;
                        }
                      }}
                    />
                    <span>{peer.name || 'Guest'}</span>
                  </div>
                ))}
              </div>

              <div className="meet-controls">
                <button className="meet-control" onClick={toggleMute}>
                  {audioMuted ? <MicOff size={18} /> : <Mic size={18} />}
                  {audioMuted ? 'Unmute' : 'Mute'}
                </button>
                <button className="meet-control" onClick={toggleVideo}>
                  {videoMuted ? <VideoOff size={18} /> : <Video size={18} />}
                  {videoMuted ? 'Start video' : 'Stop video'}
                </button>
                <button className="meet-control" onClick={toggleScreenShare}>
                  <MonitorUp size={18} />
                  {screenSharing ? 'Stop share' : 'Share screen'}
                </button>
                <button className="meet-control danger" onClick={handleLeave}>
                  <PhoneOff size={18} />
                  Leave
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="meet-right">
          <div className="meet-side-card">
            <h3>Live controls</h3>
            <p>
              This meeting runs entirely in Cracoe. Use the controls below to manage your mic,
              camera, screen, and room.
            </p>
            <div className="meet-status">
              <span className={`meet-status-pill ${recordingActive ? 'active' : ''}`}>
                {recordingActive ? 'Recording live' : 'Recording idle'}
              </span>
              {hostId ? (
                <span className="meet-status-host">Host: {getUser(hostId)?.name || 'Host'}</span>
              ) : null}
            </div>
          </div>
          {isHost && lobbyRequired ? (
            <div className="meet-side-card">
              <h3>Lobby approvals</h3>
              {pendingRequests.length === 0 ? (
                <p>No pending requests.</p>
              ) : (
                <div className="meet-requests">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="meet-request">
                      <div>
                        <strong>{request.payload?.name || 'Guest'}</strong>
                        <span>Request to join</span>
                      </div>
                      <div className="meet-request-actions">
                        <button onClick={() => handleApprove(request)}>Approve</button>
                        <button className="deny" onClick={() => handleDeny(request)}>
                          Deny
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
          <div className="meet-side-card">
            <h3>
              <History size={16} />
              Recent meeting history
            </h3>
            <div className="meet-history">
              {meetingHistory.length === 0 ? (
                <p>No meetings logged yet.</p>
              ) : (
                meetingHistory.map((meeting) => (
                  <div key={meeting.id} className="meet-history-item">
                    <div>
                      <strong>{meeting.title}</strong>
                      <span>
                        {meeting.date} • {meeting.time}
                      </span>
                    </div>
                    <button className="meet-history-link" onClick={() => setRoomName(meeting.title)}>
                      Reopen
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="meet-side-card gradient">
            <h3>Room guidelines</h3>
            <ul>
              <li>Choose a clear room name</li>
              <li>Invite only relevant teammates</li>
              <li>Keep notes in shared tasks</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
