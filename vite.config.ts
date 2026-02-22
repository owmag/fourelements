import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5555,
    host: true, // Listen on 0.0.0.0 so you can access from phone on same network
  },
  preview: {
    port: 5555,
  },
});
