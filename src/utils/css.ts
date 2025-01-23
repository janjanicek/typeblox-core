export const toCssStyle = (jsStyleKey: string) => {
  return jsStyleKey?.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
};

export const convertToCamelCase = (property: string): string => {
  return property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
};
