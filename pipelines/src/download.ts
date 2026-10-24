// Downloads the sources of the processing chain into data/raw, as they are on the server.
// npm run download -w @pnm/pipelines [typeName…]
import {
  rename,
  rm,
  writeFile,
} from 'node:fs/promises'
import {join} from 'node:path'
import process from 'node:process'
import {downloadLayer} from '@pnm/wfs'
import {
  type DownloadRecord,
  downloadFile,
  rawDir,
  sources,
} from './sources.ts'

const requested = process.argv.slice(2)
const unknown = requested.filter(typeName => sources.every(source => source.typeName !== typeName))

if (unknown.length > 0) {
  throw new Error(`Unknown sources: ${unknown.join(', ')}`)
}

const selected = requested.length > 0 ? sources.filter(source => requested.includes(source.typeName)) : sources

// One layer after the other: each one already sends several requests at once
for (const source of selected) {
  const dir = rawDir(source)
  // A download that fails leaves the previous one in place
  const partial = `${dir}.partial`
  /* eslint-disable no-await-in-loop -- one layer after the other, see above */
  await rm(partial, {recursive: true, force: true})
  const download = await downloadLayer({
    url: source.url,
    typeName: source.typeName,
    sortBy: source.sortBy,
    outDir: partial,
  })
  const record: DownloadRecord = {
    ...source,
    features: download.features,
    pages: download.pages.length,
    downloadedAt: new Date().toISOString(),
  }
  await writeFile(join(partial, downloadFile), JSON.stringify(record, undefined, 2) + '\n')
  await rm(dir, {recursive: true, force: true})
  await rename(partial, dir)
  /* eslint-enable no-await-in-loop */

  const bytes = download.pages.reduce((sum, page) => sum + page.bytes, 0)
  console.log(`${source.typeName}: ${download.features} features, ${(bytes / 1e6).toFixed(0)} MB, ${download.seconds.toFixed(0)} s`)
}
