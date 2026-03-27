const ROOM_PATTERN = /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/;
const ROOM_ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

const toIsoIfValid = (value) => {
  const raw = normalizeText(value);
  if (!raw) {
    return '';
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  return parsed.toISOString();
};

const seededRoomFromText = (value) => {
  const seed = normalizeText(value);
  if (!seed) {
    return generateMeetingRoomCode();
  }

  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = (hash * 16777619) >>> 0;
  }

  let state = hash || 1;
  const nextChar = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return ROOM_ALPHABET[state % ROOM_ALPHABET.length];
  };

  const segments = [3, 4, 3].map((length) => {
    let segment = '';
    for (let index = 0; index < length; index += 1) {
      segment += nextChar();
    }
    return segment;
  });

  return segments.join('-');
};

export const isMeetingRoomCode = (value) => ROOM_PATTERN.test(normalizeText(value).toLowerCase());

export const generateMeetingRoomCode = () => {
  const segments = [3, 4, 3].map((length) => {
    let segment = '';
    for (let index = 0; index < length; index += 1) {
      segment += ROOM_ALPHABET[Math.floor(Math.random() * ROOM_ALPHABET.length)];
    }
    return segment;
  });
  return segments.join('-');
};

export const normalizeMeetingRoomCode = (value) => {
  const normalized = normalizeText(value).toLowerCase().replace(/[^a-z0-9-]/g, '');
  return normalized;
};

export const extractMeetingRoomCodeFromId = (meetingId = '') => {
  const normalizedId = normalizeText(meetingId);
  if (!normalizedId) {
    return '';
  }

  const parts = normalizedId.split('_');
  const lastPart = parts[parts.length - 1] || '';
  if (isMeetingRoomCode(lastPart)) {
    return lastPart.toLowerCase();
  }

  return '';
};

export const getMeetingRoomCode = (meeting) => {
  const explicitRoomCode = normalizeMeetingRoomCode(meeting?.roomId || '');
  if (isMeetingRoomCode(explicitRoomCode)) {
    return explicitRoomCode;
  }

  const roomFromId = extractMeetingRoomCodeFromId(meeting?.id || '');
  if (roomFromId) {
    return roomFromId;
  }

  const seedText = `${meeting?.id || ''}|${meeting?.title || ''}|${meeting?.date || ''}|${meeting?.time || ''}`;
  return seededRoomFromText(seedText);
};

export const getMeetingStartsAt = (meeting) => {
  const explicit = toIsoIfValid(meeting?.startsAt || '');
  if (explicit) {
    return explicit;
  }

  const date = normalizeText(meeting?.date || '');
  const time = normalizeText(meeting?.time || '');
  if (!date || !time) {
    return '';
  }

  const combined = new Date(`${date}T${time}`);
  if (Number.isNaN(combined.getTime())) {
    return '';
  }

  return combined.toISOString();
};

export const buildMeetingJoinLink = (meeting, originInput = '') => {
  const roomId = getMeetingRoomCode(meeting);
  if (!roomId) {
    return '';
  }

  const params = new URLSearchParams();
  params.set('room', roomId);

  const startsAt = getMeetingStartsAt(meeting);
  if (startsAt) {
    params.set('start', startsAt);
  }
  if (meeting?.id) {
    params.set('meeting', meeting.id);
  }
  if (meeting?.title) {
    params.set('title', meeting.title);
  }

  const relativePath = `/video-meet?${params.toString()}`;
  if (originInput) {
    return `${originInput}${relativePath}`;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${relativePath}`;
  }

  return relativePath;
};

export const getMeetingTiming = (meetingOrStart, nowMs = Date.now()) => {
  const startIso =
    typeof meetingOrStart === 'string' ? toIsoIfValid(meetingOrStart) : getMeetingStartsAt(meetingOrStart);

  if (!startIso) {
    return {
      status: 'unknown',
      startIso: '',
      msUntilStart: null,
      label: '',
    };
  }

  const startMs = new Date(startIso).getTime();
  if (Number.isNaN(startMs)) {
    return {
      status: 'unknown',
      startIso: '',
      msUntilStart: null,
      label: '',
    };
  }

  const msUntilStart = startMs - nowMs;
  if (msUntilStart <= 0) {
    return {
      status: 'live',
      startIso,
      msUntilStart,
      label: 'Live now',
    };
  }

  const totalMinutes = Math.floor(msUntilStart / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);

  return {
    status: 'upcoming',
    startIso,
    msUntilStart,
    label: `Starts in ${parts.join(' ')}`,
  };
};

export const parseMeetingInput = (input = '') => {
  const rawInput = normalizeText(input);
  if (!rawInput) {
    return {
      roomId: '',
      start: '',
      title: '',
      meetingId: '',
    };
  }

  const parseFromUrl = (value) => {
    try {
      const parsed = new URL(value);
      const normalizedRoomId = normalizeMeetingRoomCode(parsed.searchParams.get('room') || '');
      return {
        roomId: isMeetingRoomCode(normalizedRoomId) ? normalizedRoomId : '',
        start: toIsoIfValid(parsed.searchParams.get('start') || ''),
        title: parsed.searchParams.get('title') || '',
        meetingId: parsed.searchParams.get('meeting') || '',
      };
    } catch (error) {
      return null;
    }
  };

  let parsed = null;
  if (/^https?:\/\//i.test(rawInput)) {
    parsed = parseFromUrl(rawInput);
  } else if (rawInput.includes('/video-meet?')) {
    const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'https://local';
    parsed = parseFromUrl(`${origin}${rawInput.startsWith('/') ? '' : '/'}${rawInput}`);
  }

  if (parsed && parsed.roomId) {
    return parsed;
  }

  if (/[?&]room=/i.test(rawInput)) {
    try {
      const query = rawInput.includes('?') ? rawInput.split('?')[1] : rawInput;
      const queryParams = new URLSearchParams(query);
      const normalizedRoomId = normalizeMeetingRoomCode(queryParams.get('room') || '');
      return {
        roomId: isMeetingRoomCode(normalizedRoomId) ? normalizedRoomId : '',
        start: toIsoIfValid(queryParams.get('start') || ''),
        title: queryParams.get('title') || '',
        meetingId: queryParams.get('meeting') || '',
      };
    } catch (error) {
      return {
        roomId: '',
        start: '',
        title: '',
        meetingId: '',
      };
    }
  }

  const roomId = normalizeMeetingRoomCode(rawInput);
  return {
    roomId: isMeetingRoomCode(roomId) ? roomId : '',
    start: '',
    title: '',
    meetingId: '',
  };
};

export const extractUrlsFromText = (text = '') => {
  if (!text) {
    return [];
  }
  const matches = String(text).match(/https?:\/\/[^\s]+/g);
  return matches || [];
};
