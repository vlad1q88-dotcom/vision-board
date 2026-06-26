export interface ParsedGoal {
  title: string
  description: string
  category?: string
}

const LIST_MARKER = /^\s*(?:[-*•]|\d+[.)])\s+/
const DESCRIPTION_SEPARATOR = ': '
const TRAILING_CATEGORY = /\s*\(([^()]+)\)\s*$/

function stripMarkdownEmphasis(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/__(.+?)__/g, '$1')
}

// A category in parentheses at the end of the line, e.g. "Цель: описание (Здоровье)".
function extractTrailingCategory(line: string): { line: string; category?: string } {
  const match = line.match(TRAILING_CATEGORY)
  if (!match) return { line }
  const category = match[1].trim()
  if (!category) return { line }
  return { line: line.slice(0, match.index).trim(), category }
}

function splitTitleAndDescription(line: string): Omit<ParsedGoal, 'category'> {
  const index = line.indexOf(DESCRIPTION_SEPARATOR)
  if (index > 0) {
    return {
      title: line.slice(0, index).trim(),
      description: line.slice(index + DESCRIPTION_SEPARATOR.length).trim(),
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
    .map((line) => {
      const { line: withoutCategory, category } = extractTrailingCategory(line)
      return { ...splitTitleAndDescription(withoutCategory), category }
    })
    .filter((goal) => goal.title.length > 0)
}
