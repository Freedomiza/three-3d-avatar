import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { createHtmlPlugin } from "vite-plugin-html";
import path from "path";
import fonts from "./src/assets/inter-font.json";
export default defineConfig({
  // assetsInclude: ['**/*.gltf'],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @font-face {
            font-family: 'Inter'; 
            src: url(${fonts.inter}) format('woff2'); 
            font-weight: 400; 
            font-style: normal; 
            font-display: swap;
          }
        `,
      },
    },
  },
  plugins: [
    viteSingleFile(),
    createHtmlPlugin({
      minify: true,
    }),
  ],
  build: {
    target: "chrome58",
  },
});
