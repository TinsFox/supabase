import { Content, Text } from 'mdast'
import { stripSymbols } from '../utils/words'
import { capitalizedWords } from '../config/words'
import { ErrorSeverity, LintRule, error, success } from '.'

function headingsSentenceCaseCheck(node: Content) {
  if (!('children' in node)) {
    return success()
  }

  const textNode = node.children.find((child) => child.type === 'text') as Text
  if (!textNode) {
    return success()
  }
  const text = textNode.value

  let errorLevel: ErrorSeverity[] = []
  let errorMessage: string[] = []

  const words = text.split(/s+/)

  for (let i = 0; i < words.length; i++) {
    const word = stripSymbols(words[i])
    if (!word) {
      continue
    }

    if (i === 0) {
      if (/[a-z]/.test(word[0])) {
        errorLevel.push(ErrorSeverity.Error)
        errorMessage.push('First word in heading should be capitalized.')
      }
      continue
    }

    if (/[A-Z]/.test(word[0]) && !capitalizedWords.has(word)) {
      errorLevel.push(ErrorSeverity.Error)
      errorMessage.push('Heading should be in sentence case.')
      break
    }
  }

  return errorLevel.length ? error(errorMessage.join(' '), Math.min(...errorLevel)) : success()
}

export function headingsSentenceCase() {
  return new LintRule({
    check: headingsSentenceCaseCheck,
    nodeTypes: 'heading',
  })
}
