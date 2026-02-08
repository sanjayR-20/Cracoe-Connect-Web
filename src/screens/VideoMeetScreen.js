import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Link as LinkIcon,
  Video,
  Mic,
  MicOff,
  VideoOff,
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
  const [joined, setJoined] = useState(false);
  const [hostMode, setHostMode] = useState(!roomFromUrl);
  const [lobbyEnabled, setLobbyEnabled] = useState(true);
  const [requestSent, setRequestSent] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const roomSlug = useMemo(() => sanitizeRoom(roomName), [roomName]);

  const meetingUrl = useMemo(() => {
    if (!roomSlug) {
      return '';
    }
    const safeName = displayName.replace(/"/g, "'").trim();
    const configParts = [
      `config.startWithAudioMuted=${audioMuted ? 'true' : 'false'}`,
      `config.startWithVideoMuted=${videoMuted ? 'true' : 'false'}`,
      'config.prejoinPageEnabled=false',
      'config.disableDeepLinking=true',
      safeName ? `userInfo.displayName="${encodeURIComponent(safeName)}"` : null,
    ].filter(Boolean);

    return `https://meet.jit.si/${encodeURIComponent(roomSlug)}#${configParts.join('&')}`;
  }, [roomSlug, audioMuted, videoMuted, displayName]);

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

  const approvals = useMemo(
    () =>
      messages.filter(
        (msg) => msg.type === 'meeting_approved' && msg.payload?.roomSlug === roomSlug
      ),
    [messages, roomSlug]
  );

  const denials = useMemo(
    () =>
      messages.filter(
        (msg) => msg.type === 'meeting_denied' && msg.payload?.roomSlug === roomSlug
      ),
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
      .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
      .slice(-5)
      .reverse();
  }, [meetings]);

  const recordingActive = recordingSignal?.payload?.action === 'start';

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

  const handleJoin = () => {
    if (!roomSlug) {
      setError('Enter a meeting name to continue.');
      return;
    }
    if (lobbyRequired && !isHost && !approvedForCurrentUser) {
      setError('This room requires approval. Request access to join.');
      return;
    }

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
              <p>Built for your team. Instant audio, video, and shared context.</p>
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

              <div className="meet-toggles">
                <button
                  type="button"
                  className={`meet-toggle ${audioMuted ? 'inactive' : ''}`}
                  onClick={() => setAudioMuted((prev) => !prev)}
                >
                  {audioMuted ? <MicOff size={18} /> : <Mic size={18} />}
                  {audioMuted ? 'Mic off' : 'Mic on'}
                </button>
                <button
                  type="button"
                  className={`meet-toggle ${videoMuted ? 'inactive' : ''}`}
                  onClick={() => setVideoMuted((prev) => !prev)}
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
                  <span>Live meeting</span>
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
              <div className="meet-frame">
                {meetingUrl ? (
                  <iframe
                    title="Cracoe Live Meeting"
                    src={meetingUrl}
                    allow="camera; microphone; fullscreen; display-capture; autoplay"
                  />
                ) : (
                  <div className="meet-placeholder">Meeting link unavailable.</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="meet-right">
          <div className="meet-side-card">
            <h3>Live controls</h3>
            <p>
              Use the in-room toolbar to share screen, chat, raise hand, or record. Your session stays
              synchronized in real time.
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
                    <button
                      className="meet-history-link"
                      onClick={() => setRoomName(meeting.title)}
                    >
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
