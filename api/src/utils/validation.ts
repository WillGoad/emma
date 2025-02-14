export const isValidCurrency = (currency: string): boolean => {
    return /^[A-Z]{3}$/.test(currency);
  };