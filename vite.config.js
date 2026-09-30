import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// EMAIL_ENDPOINT lives in .env; expose EMAIL_* to the client alongside VITE_*.
export default defineConfig({
  plugins: [react()],
  envPrefix: ["VITE_", "EMAIL_"],
});
