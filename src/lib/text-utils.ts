// Utility functions for text formatting

/**
 * Capitalizes the first letter of each word in a string
 * Useful for formatting brand and model names
 */
export function capitalizeWords(text: string | null | undefined): string {
  if (!text) return "";
  
  return text
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Formats product name with proper capitalization for brand and model
 */
export function formatProductName(
  brand: string | null | undefined,
  model: string | null | undefined,
  color?: string | null | undefined
): string {
  const parts: string[] = [];
  
  if (brand) {
    parts.push(capitalizeWords(brand));
  }
  
  if (model) {
    parts.push(capitalizeWords(model));
  }
  
  if (color) {
    parts.push(color);
  }
  
  return parts.join(" ");
}
