const integerFormat = new Intl.NumberFormat('fr-FR', {maximumFractionDigits: 0})
const decimalFormat = new Intl.NumberFormat('fr-FR', {maximumFractionDigits: 1})

// A number and its unit stay on the same line
const space = '\u{A0}'

export function formatSurface(squareMeters: number): string {
  if (squareMeters < 10_000) {
    return `${integerFormat.format(squareMeters)}${space}m²`
  }

  return squareMeters < 1_000_000
    ? `${decimalFormat.format(squareMeters / 10_000)}${space}ha`
    : `${decimalFormat.format(squareMeters / 1_000_000)}${space}km²`
}

export function formatDistance(meters: number): string {
  return `${integerFormat.format(meters)}${space}m`
}

export type TextBlock =
  // Lines broken on purpose, each joined from the lines typed under it
  | {readonly type: 'paragraph', readonly lines: string[]}
  | {readonly type: 'list', readonly items: string[]}

// A text of the plan de gestion, as typed in Grist: paragraphs separated by a blank line, list items
// starting with "* " or "- ", and a backslash at the end of a line to break it. A single line break
// only wraps the text, as it often comes from a copied document
export function textBlocks(text: string): TextBlock[] {
  const blocks: TextBlock[] = []

  for (const chunk of text.split(/\n\s*\n/v)) {
    let lines: string[] = []
    let line = ''
    let items: string[] = []

    const endParagraph = () => {
      if (line !== '') {
        lines.push(line)
      }

      if (lines.length > 0) {
        blocks.push({type: 'paragraph', lines})
      }

      lines = []
      line = ''
    }

    const endList = () => {
      if (items.length > 0) {
        blocks.push({type: 'list', items})
      }

      items = []
    }

    for (const typed of chunk.split('\n')) {
      const isBreak = typed.trimEnd().endsWith('\\')
      const content = typed.trim().replace(/\\$/v, '').trim()
      const item = /^[*\-]\s+(?<text>\S.*)$/v.exec(content)?.groups?.text

      if (item !== undefined) {
        endParagraph()
        items.push(item)
      } else if (content !== '') {
        endList()
        line = line === '' ? content : `${line} ${content}`

        if (isBreak) {
          lines.push(line)
          line = ''
        }
      }
    }

    endParagraph()
    endList()
  }

  return blocks
}
