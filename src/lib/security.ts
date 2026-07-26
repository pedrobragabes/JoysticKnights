export function safeSecretEqual(value: string | null | undefined, expected: string | null | undefined) {
  if (!value || !expected || value.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < value.length; index += 1) {
    difference |= value.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}
