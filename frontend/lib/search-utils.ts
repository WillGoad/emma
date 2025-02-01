import { DataProduct } from "./types";

type SearchOptions = {
  fields: (keyof DataProduct)[]; // Fields to search in
  caseSensitive?: boolean; // Default: false
  fuzzy?: boolean; // Default: false
};

export const searchProducts = (
  products: DataProduct[],
  searchTerm: string,
  options: SearchOptions = {
    fields: ["name", "description"],
    caseSensitive: false,
    fuzzy: true,
  },
): DataProduct[] => {
  if (!searchTerm.trim()) return products; // Return all if search term is empty

  const { fields, caseSensitive, fuzzy } = options;

  const normalize = (text: string) =>
    caseSensitive ? text : text.toLowerCase();

  const term = normalize(searchTerm);

  return products.filter((product) => {
    return fields.some((field) => {
      const fieldValue = product[field];
      if (!fieldValue) return false; // Skip if field is not present

      // Normalize the field value for comparison
      const value = Array.isArray(fieldValue)
        ? fieldValue.join(" ") // Flatten arrays like tags
        : String(fieldValue);

      const normalizedValue = normalize(value);

      // Exact or partial match
      if (normalizedValue.includes(term)) return true;

      // Fuzzy match (basic Levenshtein distance example)
      if (fuzzy && isFuzzyMatch(term, normalizedValue)) return true;

      return false;
    });
  });
};

// Utility function: Basic Levenshtein distance for fuzzy matching
const isFuzzyMatch = (term: string, value: string, threshold = 2): boolean => {
  const levenshtein = (a: string, b: string): number => {
    const dp = Array.from({ length: a.length + 1 }, (_, i) =>
      Array.from({ length: b.length + 1 }, (_, j) =>
        i === 0 ? j : j === 0 ? i : 0,
      ),
    );

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        dp[i][j] =
          a[i - 1] === b[j - 1]
            ? dp[i - 1][j - 1]
            : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }

    return dp[a.length][b.length];
  };

  return levenshtein(term, value) <= threshold;
};
