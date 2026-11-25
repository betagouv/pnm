import {Fragment} from 'react'
import {textBlocks, unmarkText} from '../format.ts'
import {TextMarkBadge} from './text-mark-badge.tsx'

type PlanTextProps = {
  readonly text: string
  // Only the first paragraph, as a glimpse
  readonly isFirstParagraphOnly?: boolean
}

// A text of the plan de gestion: its paragraphs and lists. A text that Mon Parc Marin wrote says so
export function PlanText({text, isFirstParagraphOnly = false}: PlanTextProps) {
  const {text: content, mark} = unmarkText(text)
  const blocks = textBlocks(content)
  const shown = isFirstParagraphOnly ? blocks.filter(block => block.type === 'paragraph').slice(0, 1) : blocks

  return (
    <>
      {mark !== undefined && <TextMarkBadge mark={mark} />}
      {shown.map((block, index) => block.type === 'list'
        ? (
          // The blocks of a text do not move: their place is their key
          <ul key={index}>
            {block.items.map(item => <li key={item}>{item}</li>)}
          </ul>
        )
        : (
          <p key={index}>
            {block.lines.map((line, lineIndex) => (
              <Fragment key={line}>
                {lineIndex > 0 && <br />}
                {line}
              </Fragment>
            ))}
          </p>
        ))}
    </>
  )
}
