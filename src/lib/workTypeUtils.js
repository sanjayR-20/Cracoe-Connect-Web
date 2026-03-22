export const WORK_TYPE_OPTIONS = ['developer', 'tester', 'both'];

export const normalizeWorkType = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (WORK_TYPE_OPTIONS.includes(normalized)) {
    return normalized;
  }
  return 'both';
};

export const getWorkTypeLabel = (value) => {
  const normalized = normalizeWorkType(value);
  if (normalized === 'developer') return 'Developer';
  if (normalized === 'tester') return 'Tester';
  return 'Developer + Tester';
};

export const getWorkTypeShortLabel = (value) => {
  const normalized = normalizeWorkType(value);
  if (normalized === 'developer') return 'Dev';
  if (normalized === 'tester') return 'QA';
  return 'Dev + QA';
};

export const extractWorkType = (user) => {
  return normalizeWorkType(
    user?.workType ||
      user?.permissions?.workType ||
      user?.permissions?.work_type ||
      'both'
  );
};
