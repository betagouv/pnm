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

// The days are in UTC, as they come: 2026-02-25 stays the 25th wherever the page is read
const dayFormat = new Intl.DateTimeFormat('fr-FR', {dateStyle: 'long', timeZone: 'UTC'})

// From its first day to its last, either of which may be unknown: "du 25 février 2026 au 28 février 2027"
export function formatPeriode({debut, fin}: {readonly debut?: string, readonly fin?: string}): string | undefined {
  const start = debut === undefined ? undefined : dayFormat.format(new Date(debut))
  const end = fin === undefined ? undefined : dayFormat.format(new Date(fin))

  if (start !== undefined && end !== undefined) {
    return `du ${start} au ${end}`
  }

  if (start !== undefined) {
    return `depuis le ${start}`
  }

  return end === undefined ? undefined : `jusqu’au ${end}`
}

// A text that Mon Parc Marin wrote where the plan de gestion lacks one starts with a mark, for the
// parc to read it over and remove it: written from the labels of the plan alone, or summed up from
// the plan de gestion as adopted
export type TextMark = 'generated' | 'resume'

const marks: ReadonlyArray<{readonly mark: TextMark, readonly pattern: RegExp}> = [
  {mark: 'generated', pattern: /^\s*\[Texte généré\]\s*/v},
  {mark: 'resume', pattern: /^\s*\[Résumé du plan\]\s*/v},
]

export type MarkedText = {
  readonly text: string
  readonly mark?: TextMark
}

export function unmarkText(text: string): MarkedText {
  const found = marks.find(({pattern}) => pattern.test(text))
  return found ? {text: text.replace(found.pattern, ''), mark: found.mark} : {text}
}

// One item per line, as the bénéfices of an enjeu are typed
export function textLines(text: string): string[] {
  return text.split('\n').map(line => line.trim()).filter(line => line !== '')
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
