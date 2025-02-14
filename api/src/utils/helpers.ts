// Function to replace spaces with underscores
export const replaceSpacesWithUnderscores = (str: string): string => {
  return str.replace(/\s/g, "_");
};

export const sanitizeKongName = (name: string): string => {
  return name
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .toLowerCase();
};

export const sanitizeRoutePath = (path: string): string => {
  return path
    .replace(/\/+/g, '/') // Remove duplicate slashes
    .replace(/\/$/, '') // Remove trailing slash
    .toLowerCase();
};
