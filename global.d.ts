export {};

declare global {
  interface Window {
    google?: any; // ✅ dấu ? nếu có thể chưa load script
  }
}
