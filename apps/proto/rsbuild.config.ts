import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/rspack'

export default defineConfig({
  plugins: [pluginReact()],
  server: {
    base: '/white-boards'
  },
  html: {
    title: 'Prototype',
    template: 'index.html'
  },
  environments: {
    web: {},
    fallback: {
      output: {
        filename: {
          html: '404.html'
        }
      }
    },
  },
  tools: {
    rspack: {
      plugins: [
        tanstackRouter({
          target: 'react',
          autoCodeSplitting: true,
        }),
      ],
    },
  },
})
