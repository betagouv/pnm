type PictogramProps = {
  readonly url: string
  // In pixels: 80 as the DSFR draws it
  readonly size?: number
}

// The DSFR markup for a pictogram: its three layers take the colours of the current theme
export function Pictogram({url, size = 80}: PictogramProps) {
  return (
    <svg aria-hidden='true' className='fr-artwork' viewBox='0 0 80 80' width={`${size}px`} height={`${size}px`}>
      <use className='fr-artwork-decorative' href={`${url}#artwork-decorative`} />
      <use className='fr-artwork-minor' href={`${url}#artwork-minor`} />
      <use className='fr-artwork-major' href={`${url}#artwork-major`} />
    </svg>
  )
}
