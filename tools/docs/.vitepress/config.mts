import { defineConfig } from 'vitepress'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const sidebar = JSON.parse(
  readFileSync(resolve(__dirname, 'sidebar.json')).toString()
)

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'ja-JP',
  title: '柳営補任',
  base: '/edo-jinji/',
  description: '江戸幕府諸役人の任免記録',
  themeConfig: {
    nav: [
      {
        text: '索引',
        items: [
          {
            text: '役職名',
            link: 'index',
          },
        ],
      },
      {
        text: '原文',
        link: `/content/${sidebar[0].items[0].link}`,
      },
      {
        text: '本サイトについて',
        link: 'about',
      },
    ],
    sidebar: {
      '/content/': {
        base: '/content/',
        items: sidebar,
      },
    },
    outline: {
      level: 'deep',
      label: '目次',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Shenmin-Z/edo-jinji' },
    ],
    docFooter: {
      prev: '前のページ',
      next: '次のページ ',
    },
    search: {
      provider: 'local',
      options: {
        miniSearch: {
          options: {
            tokenize(s) {
              function tokenize(s: string): string[] {
                const length = s.length
                if (length === 5 && s.endsWith('守')) {
                  return [s.substring(0, 2), s.substring(2)]
                }
                return [s]
              }
              return s.split(' ').flatMap(tokenize)
            },
          },
        },
        detailedView: false,
        translations: {
          button: {
            buttonText: '検索',
            buttonAriaLabel: '検索',
          },
          modal: {
            noResultsText: '一致する検索結果がありません',
            footer: {
              navigateText: '移動',
              closeText: '閉じる',
              selectText: '選択',
            },
          },
        },
        _render(src, env, md) {
          // ignore indexing file itself
          if (env.path.includes('indexing')) return ''

          const newPath = env.path.replace('content', 'indexing')
          if (!existsSync(newPath)) {
            return ''
          }
          const newSrc = readFileSync(newPath).toString()
          return md.render(newSrc)
        },
      },
    },
  },
})