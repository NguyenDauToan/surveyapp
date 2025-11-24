// vite.config.ts
import { defineConfig } from "file:///D:/TTTN/surveyapp/node_modules/vite/dist/node/index.js";
import react from "file:///D:/TTTN/surveyapp/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///D:/TTTN/surveyapp/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "D:\\TTTN\\surveyapp";
var vite_config_default = defineConfig(({ mode }) => ({
  base: "/surveyapp/",
  // thêm dòng này để deploy lên GitHub Pages
  server: {
    host: "::",
    port: 5173,
    proxy: {
      "/api": {
        target: "https://survey-server-m884.onrender.com/api",
        changeOrigin: true,
        secure: false
      }
    }
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  optimizeDeps: {
    include: [
      "@radix-ui/react-tabs",
      "lucide-react"
      // chắc chắn Vite pre-bundle các package này
    ]
  }
  // Nếu bạn không dùng SSR, xóa luôn phần ssr.noExternal
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxUVFROXFxcXHN1cnZleWFwcFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcVFRUTlxcXFxzdXJ2ZXlhcHBcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L1RUVE4vc3VydmV5YXBwL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xyXG4gIGJhc2U6IFwiL3N1cnZleWFwcC9cIiwgLy8gdGhcdTAwRUFtIGRcdTAwRjJuZyBuXHUwMEUweSBcdTAxMTFcdTFFQzMgZGVwbG95IGxcdTAwRUFuIEdpdEh1YiBQYWdlc1xyXG4gIHNlcnZlcjoge1xyXG4gICAgaG9zdDogXCI6OlwiLFxyXG4gICAgcG9ydDogNTE3MyxcclxuICAgIHByb3h5OiB7XHJcbiAgICAgIFwiL2FwaVwiOiB7XHJcbiAgICAgICAgdGFyZ2V0OiBcImh0dHBzOi8vc3VydmV5LXNlcnZlci1tODg0Lm9ucmVuZGVyLmNvbVwiLFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICB9LFxyXG4gIHBsdWdpbnM6IFtyZWFjdCgpLCBtb2RlID09PSBcImRldmVsb3BtZW50XCIgJiYgY29tcG9uZW50VGFnZ2VyKCldLmZpbHRlcihCb29sZWFuKSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBvcHRpbWl6ZURlcHM6IHtcclxuICAgIGluY2x1ZGU6IFtcclxuICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtdGFic1wiLFxyXG4gICAgICBcImx1Y2lkZS1yZWFjdFwiIC8vIGNoXHUxRUFGYyBjaFx1MUVBRm4gVml0ZSBwcmUtYnVuZGxlIGNcdTAwRTFjIHBhY2thZ2Ugblx1MDBFMHlcclxuICAgIF0sXHJcbiAgfSxcclxuICAvLyBOXHUxRUJGdSBiXHUxRUExbiBraFx1MDBGNG5nIGRcdTAwRjluZyBTU1IsIHhcdTAwRjNhIGx1XHUwMEY0biBwaFx1MUVBN24gc3NyLm5vRXh0ZXJuYWxcclxufSkpO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTJPLFNBQVMsb0JBQW9CO0FBQ3hRLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFIaEMsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQSxFQUN6QyxNQUFNO0FBQUE7QUFBQSxFQUNOLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFFBQVE7QUFBQSxNQUNWO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVMsQ0FBQyxNQUFNLEdBQUcsU0FBUyxpQkFBaUIsZ0JBQWdCLENBQUMsRUFBRSxPQUFPLE9BQU87QUFBQSxFQUM5RSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixTQUFTO0FBQUEsTUFDUDtBQUFBLE1BQ0E7QUFBQTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUE7QUFFRixFQUFFOyIsCiAgIm5hbWVzIjogW10KfQo=
