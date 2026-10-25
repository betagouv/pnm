import {Fragment} from 'react'
import {textBlocks} from '../format.ts'

type PlanTextProps = {
  readonly text: string
  // Only the first paragraph, as a glimpse
  readonly isFirstParagraphOnly?: boolean
}

// A text of the plan de gestion: its paragraphs and lists
export function PlanText({text, isFirstParagraphOnly = false}: PlanTextProps) {
  const blocks = textBlocks(text)
  const shown = isFirstParagraphOnly ? blocks.filter(block => block.type === 'paragraph').slice(0, 1) : blocks

  return shown.map((block, index) => block.type === 'list'
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
    ))
}
