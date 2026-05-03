export const clearStorageWhiteList: string[] = [
  "user-preferences",
  "theme-storage",
];

export function clearStorageExcept(whitelist: string[]): void {
  const keysToKeep = new Set(whitelist);
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && !keysToKeep.has(key)) toRemove.push(key);
  }
  for (const key of toRemove) localStorage.removeItem(key);
  sessionStorage.clear();
}
