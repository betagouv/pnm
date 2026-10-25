// Downloads the sources of the processing chain into data/raw, as they are at their source.
// npm run download -w @pnm/pipelines [typeName or docId…]
import {
  rename,
  rm,
  writeFile,
} from 'node:fs/promises'
import {join} from 'node:path'
import process from 'node:process'
import {downloadDocument} from '@pnm/grist'
import {downloadLayer} from '@pnm/wfs'
import {
  type DownloadRecord,
  type GristDownloadRecord,
  downloadFile,
  gristRawDir,
  gristSources,
  rawDir,
  sources,
} from './sources.ts'

const requested = process.argv.slice(2)
const known = new Set([...sources.map(source => source.typeName), ...gristSources.map(source => source.docId)])
const unknown = requested.filter(id => !known.has(id))

if (unknown.length > 0) {
  throw new Error(`Unknown sources: ${unknown.join(', ')}`)
}

function isSelected(id: string): boolean {
  return requested.length === 0 || requested.includes(id)
}

// Downloads next to the previous download, and replaces it only once complete: a download that
// fails leaves the previous one in place
async function replaceWhenComplete(dir: string, download: (partial: string) => Promise<DownloadRecord | GristDownloadRecord>): Promise<void> {
  const partial = `${dir}.partial`
  await rm(partial, {recursive: true, force: true})
  const record = await download(partial)
  await writeFile(join(partial, downloadFile), JSON.stringify(record, undefined, 2) + '\n')
  await rm(dir, {recursive: true, force: true})
  await rename(partial, dir)
}

// One source after the other: each one already sends several requests at once
/* eslint-disable no-await-in-loop -- one source after the other, see above */
for (const source of sources) {
  if (!isSelected(source.typeName)) {
    continue
  }

  await replaceWhenComplete(rawDir(source), async partial => {
    const download = await downloadLayer({
      url: source.url,
      typeName: source.typeName,
      sortBy: source.sortBy,
      outDir: partial,
    })
    const bytes = download.pages.reduce((sum, page) => sum + page.bytes, 0)
    console.log(`${source.typeName}: ${download.features} features, ${(bytes / 1e6).toFixed(0)} MB, ${download.seconds.toFixed(0)} s`)
    return {
      ...source,
      features: download.features,
      pages: download.pages.length,
      downloadedAt: new Date().toISOString(),
    }
  })
}

const documents = gristSources.filter(source => isSelected(source.docId))
// Personal: kept in .env at the root of the repository, which git ignores
const apiKey = process.env.GRIST_API_KEY ?? ''

if (apiKey === '' && documents.length > 0) {
  throw new Error('GRIST_API_KEY is missing: add it to .env at the root of the repository')
}

for (const source of documents) {
  await replaceWhenComplete(gristRawDir(source), async partial => {
    const download = await downloadDocument({...source, apiKey}, partial)
    const records = Object.values(download.tables).reduce((sum, count) => sum + count, 0)
    console.log(`${source.docId}: ${Object.keys(download.tables).length} tables, ${records} records, ${download.seconds.toFixed(0)} s`)
    // The key stays out of the record
    return {...source, tables: download.tables, downloadedAt: new Date().toISOString()}
  })
}
/* eslint-enable no-await-in-loop */
