import { isValidCurrency } from '../../utils/validation'; // adjust path as needed

describe('isValidCurrency', () => {
  it('returns true for valid 3-letter uppercase codes', () => {
    expect(isValidCurrency('USD')).toBe(true);
    expect(isValidCurrency('EUR')).toBe(true);
    expect(isValidCurrency('JPY')).toBe(true);
  });

  it('returns false for lowercase codes', () => {
    expect(isValidCurrency('usd')).toBe(false);
    expect(isValidCurrency('Eur')).toBe(false);
  });

  it('returns false for codes with non-letters', () => {
    expect(isValidCurrency('US1')).toBe(false);
    expect(isValidCurrency('12A')).toBe(false);
    expect(isValidCurrency('A$%')).toBe(false);
  });

  it('returns false for wrong length strings', () => {
    expect(isValidCurrency('US')).toBe(false);
    expect(isValidCurrency('USDE')).toBe(false);
    expect(isValidCurrency('')).toBe(false);
  });

  it('returns false for strings with spaces or punctuation', () => {
    expect(isValidCurrency('U S')).toBe(false);
    expect(isValidCurrency('U-S')).toBe(false);
    expect(isValidCurrency('U_S')).toBe(false);
  });
});