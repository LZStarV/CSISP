export function toCamel(input: any): any {
  if (Array.isArray(input)) return input.map(toCamel);
  if (input && typeof input === 'object') {
    const out: any = {};
    for (const k of Object.keys(input)) {
      const ck = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      out[ck] = toCamel(input[k]);
    }
    return out;
  }
  return input;
}
