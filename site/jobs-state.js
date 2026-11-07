export function moscowDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(now);
  const value = type => parts.find(part => part.type === type).value;
  return value('year') + '-' + value('month') + '-' + value('day');
}

export function jobFreshness(job, now = new Date()) {
  const checked = job.lastCheckedDate;
  const date = Date.parse(checked + 'T00:00:00Z');
  const today = Date.parse(moscowDate(now) + 'T00:00:00Z');
  const days = (today - date) / 86400000;
  const expires = job.expiresAt ? Date.parse(job.expiresAt) : null;
  const invalidDate = !/^\d{4}-\d{2}-\d{2}$/.test(checked) ||
    !Number.isFinite(date) || new Date(date).toISOString().slice(0, 10) !== checked;
  if (invalidDate || days < 0 || days >= 7 ||
      job.status !== 'source_accepting_applications_at_check' ||
      (expires !== null && (!Number.isFinite(expires) || expires <= now.getTime()))) return 'hidden';
  return days >= 4 || job.verificationPending === true || job.verificationPending === 'true'
    ? 'pending' : 'checked';
}

export function matchesJobFilters(job, filters) {
  const normalize = value => (value || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  return (!filters.city || job.city === filters.city) &&
    (!filters.province || job.province === filters.province) &&
    (!filters.industry || job.industry === filters.industry) &&
    normalize(job.searchText).includes(normalize(filters.q).trim());
}
