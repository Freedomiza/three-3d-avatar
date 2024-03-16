import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { createHtmlPlugin } from "vite-plugin-html";
import path from "path";
import fonts from "./src/assets/inter-font.json";
export default defineConfig({
  base: "/three-3d-avatar/",
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
            src: url(${fonts.interRegular}) format('woff2'); 
            font-weight: 400; 
            font-style: normal; 
            font-display: swap;
          }

          @font-face {
              font-family: 'Inter';
              src: url(${fonts.interBold}) format('woff2');
              font-weight: bold;
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
