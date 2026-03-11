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
} from 'lucide-react';
import { useDataStore } from '../store/dataStore';
import { supabase } from '../lib/supabaseClient';
import '../styles/VideoMeet.css';

// Generate unique room ID (Google Meet style: abc-defg-hij)
const generateRoomId = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const segments = [];
  for (let i = 0; i < 3; i++) {
    let segment = '';
    const len = i === 1 ? 4 : 3;
    for (let j = 0; j < len; j++) {
      segment += chars[Math.floor(Math.random() * chars.length)];
    }
    segments.push(segment);
  }
  return segments.join('-');
};

// Generate unique peer ID
const generatePeerId = () => {
  return `peer_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

// ICE servers for WebRTC
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
];

export default function VideoMeetScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const roomFromUrl = params.get('room') || '';

  const currentUser = useDataStore((state) => state.getCurrentUser());

  // State
  const [view, setView] = useState(roomFromUrl ? 'preview' : 'home'); // home, preview, meeting
  const [roomId, setRoomId] = useState(roomFromUrl || '');
  const [joinRoomId, setJoinRoomId] = useState('');
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

  // Refs
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const channelRef = useRef(null);
  const peerIdRef = useRef(generatePeerId());
  const messagesEndRef = useRef(null);

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
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: {
            fromPeerId: peerIdRef.current,
            toPeerId: remotePeerId,
            candidate: event.candidate,
          },
        });
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
  }, []);

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
        // New peer joined, create offer
        const pc = createPeerConnection(fromPeerId, fromName, fromDesignation, fromProfilePic);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'offer',
            payload: {
              fromPeerId: peerIdRef.current,
              fromName: currentUser?.name || 'Guest',
              fromDesignation: currentUser?.designation || '',
              fromProfilePic: currentUser?.profilePic || '',
              toPeerId: fromPeerId,
              sdp: offer,
            },
          });
        }
        break;
      }
      
      case 'offer': {
        const pc = createPeerConnection(fromPeerId, fromName, fromDesignation, fromProfilePic);
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'answer',
            payload: {
              fromPeerId: peerIdRef.current,
              fromName: currentUser?.name || 'Guest',
              fromDesignation: currentUser?.designation || '',
              fromProfilePic: currentUser?.profilePic || '',
              toPeerId: fromPeerId,
              sdp: answer,
            },
          });
        }
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
  }, [createPeerConnection, removePeer, currentUser]);

  // Join meeting room
  const joinRoom = useCallback(async (meetingRoomId) => {
    if (!meetingRoomId) {
      setError('Please enter a meeting code');
      return;
    }

    setConnectionStatus('connecting');
    setError('');
    
    // Subscribe to Supabase realtime channel
    const channel = supabase.channel(`meeting:${meetingRoomId}`, {
      config: {
        broadcast: { self: false },
      },
    });

    channel
      .on('broadcast', { event: 'join' }, ({ payload }) => {
        handleSignalingMessage({ type: 'join', ...payload });
      })
      .on('broadcast', { event: 'offer' }, ({ payload }) => {
        handleSignalingMessage({ type: 'offer', ...payload });
      })
      .on('broadcast', { event: 'answer' }, ({ payload }) => {
        handleSignalingMessage({ type: 'answer', ...payload });
      })
      .on('broadcast', { event: 'ice-candidate' }, ({ payload }) => {
        handleSignalingMessage({ type: 'ice-candidate', ...payload });
      })
      .on('broadcast', { event: 'leave' }, ({ payload }) => {
        handleSignalingMessage({ type: 'leave', ...payload });
      })
      .on('broadcast', { event: 'chat' }, ({ payload }) => {
        handleSignalingMessage({ type: 'chat', ...payload });
      })
      .on('broadcast', { event: 'hand-raised' }, ({ payload }) => {
        handleSignalingMessage({ type: 'hand-raised', ...payload });
      })
      .on('broadcast', { event: 'media-state' }, ({ payload }) => {
        handleSignalingMessage({ type: 'media-state', ...payload });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          channelRef.current = channel;
          setConnectionStatus('connected');
          setView('meeting');
          setRoomId(meetingRoomId);
          
          // Announce presence
          channel.send({
            type: 'broadcast',
            event: 'join',
            payload: {
              fromPeerId: peerIdRef.current,
              fromName: currentUser?.name || 'Guest',
              fromDesignation: currentUser?.designation || '',
              fromProfilePic: currentUser?.profilePic || '',
            },
          });
        } else if (status === 'CHANNEL_ERROR') {
          setError('Failed to join meeting. Please try again.');
          setConnectionStatus('error');
        }
      });
  }, [handleSignalingMessage, currentUser]);

  // Leave meeting
  const leaveRoom = useCallback(() => {
    // Notify peers
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'leave',
        payload: {
          fromPeerId: peerIdRef.current,
          fromName: currentUser?.name || 'Guest',
        },
      });
      
      supabase.removeChannel(channelRef.current);
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
    navigate('/dashboard');
  }, [currentUser, navigate]);

  // Broadcast media state change
  const broadcastMediaState = useCallback((audio, video) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'media-state',
        payload: {
          fromPeerId: peerIdRef.current,
          audio,
          video,
        },
      });
    }
  }, []);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const newState = !audioEnabled;
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = newState;
      });
      setAudioEnabled(newState);
      broadcastMediaState(newState, videoEnabled);
    }
  }, [audioEnabled, videoEnabled, broadcastMediaState]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const newState = !videoEnabled;
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = newState;
      });
      setVideoEnabled(newState);
      broadcastMediaState(audioEnabled, newState);
    }
  }, [videoEnabled, audioEnabled, broadcastMediaState]);

  // Toggle screen sharing
  const toggleScreenShare = useCallback(async () => {
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
      } catch (err) {
        console.error('Error sharing screen:', err);
        if (err.name !== 'NotAllowedError') {
          setError('Unable to share screen');
        }
      }
    }
  }, [screenSharing]);

  // Toggle hand raise
  const toggleHandRaise = useCallback(() => {
    const newState = !handRaised;
    setHandRaised(newState);
    
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'hand-raised',
        payload: {
          fromPeerId: peerIdRef.current,
          fromName: currentUser?.name || 'Guest',
          raised: newState,
        },
      });
    }
  }, [handRaised, currentUser]);

  // Send chat message
  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || !channelRef.current) return;

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
    channelRef.current.send({
      type: 'broadcast',
      event: 'chat',
      payload: messageData,
    });

    setNewMessage('');
  }, [newMessage, currentUser]);

  // Copy meeting link
  const copyMeetingLink = useCallback(async () => {
    const link = `${window.location.origin}/video-meet?room=${roomId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [roomId]);

  // Scroll chat to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Create new meeting
  const createMeeting = () => {
    const newRoomId = generateRoomId();
    setRoomId(newRoomId);
    setView('preview');
  };

  // Join existing meeting
  const joinMeeting = () => {
    if (joinRoomId.trim()) {
      setRoomId(joinRoomId.trim().toLowerCase());
      setView('preview');
    }
  };

  // Start meeting from preview
  const startMeeting = () => {
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
              <p>We re-created Cracoe Meet—secure video calling for all your team's meetings.</p>
              
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
            <p className="meeting-code">Meeting code: <strong>{roomId}</strong></p>
            
            {error && <div className="error-message">{error}</div>}

            <div className="preview-actions">
              <button className="btn-primary" onClick={startMeeting}>
                Join now
              </button>
            </div>

            <div className="share-link">
              <p>Share this link with others you want in the meeting</p>
              <div className="link-box">
                <span>{window.location.origin}/video-meet?room={roomId}</span>
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
                      className={!videoEnabled ? 'video-off' : ''}
                    />
                    {!videoEnabled && (
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
                      className={!spotlightPeer.videoEnabled ? 'video-off' : ''}
                    />
                    {!spotlightPeer.videoEnabled && (
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
                  {!spotlightPeer.audioEnabled && <MicOff size={16} />}
                  {spotlightPeer.handRaised && <Hand size={16} className="hand-icon" />}
                </div>
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
                          className={!videoEnabled ? 'video-off' : ''}
                        />
                        {!videoEnabled && (
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
                          className={!participant.videoEnabled ? 'video-off' : ''}
                        />
                        {!participant.videoEnabled && (
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
                  className={!videoEnabled ? 'video-off' : ''}
                />
                {!videoEnabled && (
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
                    className={!participant.videoEnabled ? 'video-off' : ''}
                  />
                  {!participant.videoEnabled && (
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
                    {!participant.audioEnabled && <MicOff size={16} />}
                    {participant.handRaised && <Hand size={16} className="hand-icon" />}
                  </div>
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
              {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
            </span>
          </div>
          
          <div className="controls-center">
            <button
              className={`control-btn ${!audioEnabled ? 'off' : ''}`}
              onClick={toggleAudio}
              title={audioEnabled ? 'Turn off microphone' : 'Turn on microphone'}
            >
              {audioEnabled ? <Mic size={22} /> : <MicOff size={22} />}
            </button>
            
            <button
              className={`control-btn ${!videoEnabled ? 'off' : ''}`}
              onClick={toggleVideo}
              title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
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
                <span className="participant-name">{currentUser?.name || 'You'} (You)</span>
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
                  <span className="participant-name">{participant.name}</span>
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

          <div className="share-section">
            <h4>Share meeting info</h4>
            <div className="share-link-box">
              <span>{roomId}</span>
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
