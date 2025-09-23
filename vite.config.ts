import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  base: "/surveyapp/", // thêm dòng này để deploy lên GitHub Pages
  server: {
    host: "::",
    port: 5173,
    proxy: {
      "/api": {
        target: "https://survey-server-m884.onrender.com",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: [
      "@radix-ui/react-tabs",
      "lucide-react" // chắc chắn Vite pre-bundle các package này
    ],
  },
  // Nếu bạn không dùng SSR, xóa luôn phần ssr.noExternal
}));
