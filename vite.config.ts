import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import Components from 'unplugin-vue-components/vite'
import MotionResolver from 'motion-v/resolver'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // 这里声明 jeep-sqlite 是自定义元素
          isCustomElement: (tag) => tag === 'jeep-sqlite'
        }
      }
    }),
    vueJsx(),
    // vueDevTools(),
    Components({
      dts: true,
      resolvers: [
        MotionResolver()
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      // 将以 /webdav_proxy 开头的请求代理到坚果云
      '/webdav_proxy': {
        target: 'https://dav.jianguoyun.com', // 目标服务器
        changeOrigin: true, // 必须设置为 true，表示修改请求头的 Origin 字段
        secure: false,      // 如果目标服务器是 HTTPS 且证书有问题，可能需要设为 false（谨慎使用）
        rewrite: (path) => path.replace(/^\/webdav_proxy/, ''), // 重写路径：移除代理前缀
        // 可选：如果需要，可以在这里配置代理行为，比如添加额外的请求头
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[DEV Proxy] Sending request to target: ${options.target}${proxyReq.path}`);
            // 你可以打印更多信息，比如请求头
            // console.log('[DEV Proxy] Request Headers:', proxyReq.getHeaders());
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log(`[DEV Proxy] Received response from target: ${proxyRes.statusCode}`);
          });
          proxy.on('error', (err, req, res) => {
            console.error('[DEV Proxy] Proxy error:', err);
          });
        }
      }
    }
  }
})


