type IllustratedStepsProps = {
  readonly steps: ReadonlyArray<{
    // The address of a decorative illustration
    readonly illustration: string
    readonly text: string
  }>
}

// Numbered steps side by side, each under its illustration. The illustrations sit on a common line
export function IllustratedSteps({steps}: IllustratedStepsProps) {
  return (
    <ol className='fr-grid-row fr-grid-row--gutters fr-raw-list'>
      {steps.map((step, index) => (
        <li key={step.text} className='fr-col-12 fr-col-sm-6 fr-col-md-3'>
          <div style={{height: '12rem', display: 'flex', alignItems: 'flex-end'}}>
            <img src={step.illustration} alt='' style={{maxWidth: '100%', maxHeight: '100%'}} />
          </div>
          <p className='fr-h1 fr-mt-3w fr-mb-1w' aria-hidden='true'>{index + 1}</p>
          <p className='fr-text--lg'>{step.text}</p>
        </li>
      ))}
    </ol>
  )
}
