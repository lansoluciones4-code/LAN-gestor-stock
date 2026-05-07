import { z } from 'zod';

/**
 * Converts any string/number input to a JS number.
 * Handles comma as decimal separator (e.g. "1,50" → 1.5).
 * Pipe to z.number() to apply further constraints.
 */
export const toNumber = () =>
   
  z.any().transform((v: any) => {
    if (typeof v === 'string') return Number(v.replace(',', '.'));
    return Number(v);
  });
