import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Link as LinkIcon,
  Video,
  Mic,
  MicOff,
  VideoOff,
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

  const [roomName, setRoomName] = useState(roomFromUrl);
  const [displayName, setDisplayName] = useState(currentUser?.name || '');
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [joined, setJoined] = useState(false);
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

  const handleJoin = () => {
    if (!roomSlug) {
      setError('Enter a meeting name to continue.');
      return;
    }
    setError('');
    setJoined(true);
  };

  const handleLeave = () => {
    setJoined(false);
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

              {error ? <div className="meet-error">{error}</div> : null}

              <div className="meet-actions">
                <button className="meet-primary" onClick={handleJoin}>
                  Start meeting
                </button>
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
                <button className="meet-secondary" onClick={handleCopy}>
                  <LinkIcon size={16} />
                  {copied ? 'Link copied' : 'Copy invite'}
                </button>
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
