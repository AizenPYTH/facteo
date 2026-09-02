import {
  deriveElectronicStatusFromEvents,
  mapSuperPdpStatus,
} from './status-map.ts';

Deno.test('maps official SUPER PDP status codes', () => {
  if (mapSuperPdpStatus('fr:200') !== 'submitted') throw new Error('fr:200');
  if (mapSuperPdpStatus('api:invalid') !== 'error') throw new Error('api:invalid');
  if (mapSuperPdpStatus('fr:212') !== 'paid') throw new Error('fr:212');
  if (mapSuperPdpStatus('unknown') !== null) throw new Error('unknown');
});

Deno.test('derives summary status from event list with priority', () => {
  const status = deriveElectronicStatusFromEvents(['api:uploaded', 'fr:201', 'fr:205']);
  if (status !== 'accepted') throw new Error(`expected accepted, got ${status}`);
});

Deno.test('keeps rejected over earlier accepted when later', () => {
  const status = deriveElectronicStatusFromEvents(['fr:205', 'fr:210']);
  if (status !== 'rejected') throw new Error(`expected rejected, got ${status}`);
});
