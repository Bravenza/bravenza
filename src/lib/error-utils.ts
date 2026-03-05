/**
 * Safely extracts an error message from an unknown catch value.
 *
 * Usage:
 *   catch (err) {
 *     toast.error(getErrorMessage(err, "Fallback message"));
 *   }
 */
export function getErrorMessage(error: unknown, fallback = "Ocorreu um erro inesperado"): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (
    error !== null &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
}

/**
 * Type guard: checks if an error has a `name` property (e.g. AbortError).
 */
export function isErrorWithName(error: unknown, name: string): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "name" in error &&
    (error as { name: unknown }).name === name
  );
}
