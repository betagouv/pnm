// Every DSFR pictogram becomes a file of the build, downloaded only when a page shows it.
// Not inlined: a pictogram is drawn by referring to its file
const urls = import.meta.glob<string>('dsfr-pictograms/*/*.svg', {
  query: '?url&no-inline',
  import: 'default',
  eager: true,
})

const urlsByName = new Map(Object.entries(urls).map(([path, url]) => [
  path.replace(/^.*\/(?<name>[a-z]+\/[\-a-z]+)\.svg$/v, '$<name>'),
  url,
]))

// Undefined for a name the DSFR does not know, e.g. "institutions/navy-anchor"
export function pictogramUrl(name: string): string | undefined {
  return urlsByName.get(name)
}
