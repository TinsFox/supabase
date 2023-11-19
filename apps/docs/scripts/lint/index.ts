import { mdxFromMarkdown } from 'mdast-util-mdx'
import { mdxjs } from 'micromark-extension-mdxjs'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { readFile } from 'fs/promises'
import { walk } from '../utils/walk'
import { extname } from 'path'
import { Content } from 'mdast'
import { headingsSentenceCase } from './rules/headings-sentence-case'
import { LintRule, isSuccess } from './rules'
import { parseArgs } from 'node:util'

const args = parseArgs({
  options: {
    fix: {
      type: 'boolean',
      short: 'f',
    },
  },
  allowPositionals: true,
})

interface Rules {
  byType: Partial<Record<Content['type'], LintRule[]>>
}

const rules: Rules = {
  byType: {
    heading: [headingsSentenceCase()],
  },
}

async function lint() {
  console.log(process.argv.slice(2))

  const pages = await walk('pages')
  const errors = []

  const result = pages.map(async (page) => {
    if (extname(page.path) !== '.mdx') {
      return
    }

    const contents = await readFile(page.path, 'utf8')

    const mdxTree = fromMarkdown(contents, {
      extensions: [mdxjs()],
      mdastExtensions: [mdxFromMarkdown()],
    })

    mdxTree.children.forEach((child) => {
      if (rules.byType[child.type]) {
        rules.byType[child.type].forEach((rule) => {
          const result = rule.runRule(child)
          if (!isSuccess(result)) {
            errors.push({ file: page.path, error: result })
          }
        })
      }
    })
  })

  await Promise.all(result)
  console.log(JSON.stringify(errors, null, 2))
}

lint()
