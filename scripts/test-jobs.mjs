import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { jobFreshness, matchesJobFilters, moscowDate } from '../site/jobs-state.js';
import { renderJobs } from './jobs.mjs';

const job = {
  lastCheckedDate: '2026-11-07',
  status: 'source_accepting_applications_at_check',
  expiresAt: null
};
assert.equal(moscowDate(new Date('2026-11-10T21:00:00Z')), '2026-11-11');
assert.equal(jobFreshness(job, new Date('2026-11-10T20:59:59Z')), 'checked');
assert.equal(jobFreshness(job, new Date('2026-11-10T21:00:00Z')), 'pending');
assert.equal(jobFreshness(job, new Date('2026-11-13T21:00:00Z')), 'hidden');
assert.equal(jobFreshness({ ...job, status: 'closed' }, new Date('2026-11-07T10:00:00Z')), 'hidden');
assert.equal(jobFreshness({ ...job, lastCheckedDate: '2026-02-30' }), 'hidden');
assert.equal(jobFreshness({ ...job, lastCheckedDate: '2026-11-08' }, new Date('2026-11-07T10:00:00Z')), 'hidden');
assert.equal(jobFreshness({ ...job, verificationPending: true }, new Date('2026-11-07T10:00:00Z')), 'pending');
assert.equal(jobFreshness({ ...job, expiresAt: 'not-a-date' }, new Date('2026-11-07T10:00:00Z')), 'hidden');
const deadline = { ...job, expiresAt: '2026-11-08T23:59:59+01:00' };
assert.equal(jobFreshness(deadline, new Date('2026-11-08T22:59:58Z')), 'checked');
assert.equal(jobFreshness(deadline, new Date('2026-11-08T22:59:59Z')), 'hidden');

const search = { city: 'Barcelona', province: 'Barcelona', industry: 'reception', searchText: 'Recepción — Барселона, бронирования' };
assert(matchesJobFilters(search, { q: 'RECEPCION', city: 'Barcelona' }));
assert(matchesJobFilters(search, { q: 'барселона', industry: 'reception' }));
assert(!matchesJobFilters(search, { province: 'Madrid' }));
assert(!matchesJobFilters(search, { q: 'маникюр' }));

const data = JSON.parse(await readFile('content/jobs.json', 'utf8'));
const now = new Date();
const available = data.jobs.filter(job => jobFreshness(job, now) !== 'hidden');
const afterAllChecks = new Date(Math.max(...data.jobs.map(job => Date.parse(job.lastCheckedDate))) + 8 * 86400000);
for (const language of ['ru', 'es']) {
  const html = renderJobs(data, language, now);
  assert.equal((html.match(/ data-job /g) || []).length, available.length);
  assert.equal((html.match(/target="_blank" rel="noopener noreferrer"/g) || []).length, available.length);
  assert(html.includes('data-job-filters hidden'));
  assert.equal((html.match(/<tr data-job-row=/g)||[]).length,available.length);
  assert(html.includes('<table class="jobs-table">') && html.includes('<th scope="col">'));
  assert(html.includes('<dialog open class="jobs-dialog" data-job-dialog>'));
  assert(html.includes('data-job-back') && html.includes('data-job-locale'));
  assert(html.includes('class="jobs-method"') && html.includes('/life-in-spain/'));
  assert(!html.includes('library-course') && !html.includes('JobPosting'));
  for (const job of available) {
    assert(html.includes('href="#'+job.id+'"'));
    assert(html.includes('id="'+job.id+'" data-job'));
    assert(html.includes('data-last-checked-date="'+job.lastCheckedDate+'"'));
    assert(html.includes(job.sourceUrl.replaceAll('&','&amp;')));
  }
  assert(!html.includes('JobPosting') && !html.includes('type="email"'));
  const expired = renderJobs(data, language, afterAllChecks);
  assert(!expired.includes(' data-job '));
  assert(!expired.includes('<option value="Barcelona">'));
}
console.log('Jobs checks passed: freshness, Moscow date boundaries, source deadlines, failed checks, Unicode search, combined filters and no-JS listings.');
