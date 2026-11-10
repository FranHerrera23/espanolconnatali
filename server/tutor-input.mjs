export function learnerVariables(name) {
  if (typeof name !== 'string') throw new TypeError('Enter a name');
  const clean = name.normalize('NFC').trim().replace(/\s+/gu, ' ');
  if (!clean || [...clean].length > 60 || !/^[\p{L}\p{M} .’'\-]+$/u.test(clean)) {
    throw new TypeError('Enter a name of up to 60 letters');
  }
  return { user_name: clean };
}

