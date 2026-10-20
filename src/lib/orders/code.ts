/** No 0/O or 1/I/L, so codes are easy to read aloud on WhatsApp. */
const alphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/** Short, human-friendly order codes like "MOR-7KQ2XA". */
export function orderCode(
  random: (max: number) => number = (max) => crypto.getRandomValues(new Uint32Array(1))[0]! % max,
) {
  let code = '';
  for (let i = 0; i < 6; i++) code += alphabet[random(alphabet.length)];
  return `MOR-${code}`;
}

export const orderCodePattern = /^MOR-[2-9A-HJKMNP-Z]{6}$/;
