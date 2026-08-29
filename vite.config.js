import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  root: "src",
  base: "./",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    // Inline every asset (fonts, images, the QR svg) as a base64 data: URI,
    // regardless of size, so the built file has zero external requests.
    assetsInlineLimit: Infinity,
    cssCodeSplit: false,
  },
  plugins: [viteSingleFile()],
});
