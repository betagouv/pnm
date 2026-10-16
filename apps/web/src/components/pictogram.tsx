type PictogramProps = {
  readonly url: string
}

// The DSFR markup for a pictogram: its three layers take the colours of the current theme
export function Pictogram({url}: PictogramProps) {
  return (
    <svg aria-hidden='true' className='fr-artwork' viewBox='0 0 80 80' width='80px' height='80px'>
      <use className='fr-artwork-decorative' href={`${url}#artwork-decorative`} />
      <use className='fr-artwork-minor' href={`${url}#artwork-minor`} />
      <use className='fr-artwork-major' href={`${url}#artwork-major`} />
    </svg>
  )
}
