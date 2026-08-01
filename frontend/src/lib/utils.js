export function cn(...inputs) {
  return inputs
    .flatMap((input) => {
      if (!input) return [];
      if (typeof input === "string") return input;
      if (Array.isArray(input)) return input;
      if (typeof input === "object") {
        return Object.entries(input)
          .filter(([, enabled]) => Boolean(enabled))
          .map(([className]) => className);
      }
      return String(input);
    })
    .filter(Boolean)
    .join(" ");
}
