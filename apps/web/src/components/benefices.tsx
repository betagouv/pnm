import {fr} from '@codegouvfr/react-dsfr'
import {textLines, unmarkText} from '../format.ts'
import {TextMarkBadge} from './text-mark-badge.tsx'

type BeneficesProps = {
  readonly titre: string
  // One bénéfice per line
  readonly text: string
}

// What an enjeu brings to the sea or to the territory. The DSFR has no card for a list: a bordered
// box, underlined like its cards
export function Benefices({titre, text}: BeneficesProps) {
  const {text: content, mark} = unmarkText(text)

  return (
    <div
      className='fr-p-3w fr-mb-2w'
      style={{
        border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
        borderBottom: `4px solid ${fr.colors.decisions.border.plain.grey.default}`,
      }}
    >
      <h4 className='fr-h6 fr-mb-1w'>{titre}</h4>
      {mark !== undefined && <TextMarkBadge mark={mark} />}
      <ul className='fr-mb-0'>
        {textLines(content).map(line => <li key={line}>{line}</li>)}
      </ul>
    </div>
  )
}
