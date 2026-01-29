import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  assetsInclude: ["**/*.JPEG"], // Add support for JPEG files
  define: {
    "process.env.BACKEND_URL": JSON.stringify(process.env.BACKEND_URL),
  },
});
