export interface ParsedGoal {
  title: string
  description: string
}

const LIST_MARKER = /^\s*(?:[-*•]|\d+[.)])\s+/
const SEPARATORS = [' — ', ' – ', ' - ', ': ']

function stripMarkdownEmphasis(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/__(.+?)__/g, '$1')
}

function splitTitleAndDescription(line: string): ParsedGoal {
  for (const separator of SEPARATORS) {
    const index = line.indexOf(separator)
    if (index > 0) {
      return {
        title: line.slice(0, index).trim(),
        description: line.slice(index + separator.length).trim(),
      }
    }
  }
  return { title: line.trim(), description: '' }
}

// Parses a pasted markdown/plain-text list (one goal per line, list markers and bold
// markup optional) into goal title/description pairs. Used by the "import from text" flow.
export function parseGoalsText(text: string): ParsedGoal[] {
  return text
    .split('\n')
    .map((line) => stripMarkdownEmphasis(line.replace(LIST_MARKER, '')).trim())
    .filter((line) => line.length > 0)
    .map(splitTitleAndDescription)
    .filter((goal) => goal.title.length > 0)
}
