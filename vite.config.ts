// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    target: "es2020",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-mui-material": [
            "@mui/material",
            "@emotion/react",
            "@emotion/styled",
          ],
          "vendor-mui-icons": ["@mui/icons-material"],
          "vendor-mui-pickers": ["@mui/x-date-pickers"],
          "vendor-router": ["react-router-dom"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-charts": ["recharts"],
          "vendor-forms": [
            "react-hook-form",
            "@hookform/resolvers",
            "zod",
          ],
          "vendor-utils": [
            "dayjs",
            "dompurify",
            "axios",
            "react-helmet-async",
            "framer-motion",
            "date-fns",
          ],
        },
      },
    },
  },
});
