// The habitats of the OFB layers, as surfaces fit for display and for crossing with a projet. The
// layers are kept whole, not cut to a parc: the surfaces can serve other uses. Each surface is tied
// by its code to a habitat élémentaire of the plans de gestion, in Grist. What is done of each layer
// is in layers/, the engine that does it in lib/
// npm run habitats -w @pnm/pipelines
import {
  mkdir,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'
import type {Cartographie} from '@pnm/shared'
import {readGristTable, text} from '../lib/grist.ts'
import {connectForLayers, processLayer} from '../lib/layer.ts'
import {publish} from '../lib/publish.ts'
import {type GristSource, plansGestion} from '../sources.ts'
import {habitatLayers} from './layers/index.ts'

// Derived data, regenerated from data/raw. The pivot file of each layer is kept from one run to the
// next; the rest is redone on every run
const workDir = fileURLToPath(new URL('../../../data/work/habitats/', import.meta.url))
const layersDir = join(workDir, 'layers')
const runDir = join(workDir, 'run')
const distDir = fileURLToPath(new URL('../../../data/dist/', import.meta.url))

// The codes habitat élémentaire of a plan de gestion
async function readCodes(source: GristSource): Promise<Set<string>> {
  const table = await readGristTable(source, 'Habitats')
  const type = table.columns.find(column => column.id === 'Code_habitat_elementaire')?.fields.type

  // Grist reads a code like 1110-5 as a date in any other type
  if (type !== 'Text') {
    throw new Error(`${source.docId}: Code_habitat_elementaire is typed ${String(type)}, not Text`)
  }

  return new Set(table.records.flatMap(({fields}) => text(fields.Code_habitat_elementaire) ?? []))
}

const rules = habitatLayers.flatMap(layer => layer.rules)

// A layer belongs to no parc: its habitats are those of every plan de gestion, and a habitat that
// none holds yet keeps its surfaces for later
const planCodes = await Promise.all(plansGestion.map(async source => readCodes(source)))
const codes = new Set(planCodes.flatMap(planCode => [...planCode]))
const unknown = rules.filter(rule => !codes.has(rule.habitat)).map(rule => rule.habitat)

if (unknown.length > 0) {
  console.warn(`In no plan de gestion, so crossed for no parc: ${unknown.join(', ')}`)
}

await rm(runDir, {recursive: true, force: true})
await mkdir(runDir, {recursive: true})
await mkdir(layersDir, {recursive: true})
await mkdir(distDir, {recursive: true})
const connection = await connectForLayers(join(runDir, 'habitats.duckdb'), join(runDir, 'tmp'))
const pieces: string[] = []

/* eslint-disable no-await-in-loop -- one layer after the other, to bound the memory */
for (const layer of habitatLayers) {
  const file = join(layersDir, `${layer.source.typeName.replace(':', '.')}.parquet`)
  await processLayer(connection, layer, file)
  pieces.push(file)
}
/* eslint-enable no-await-in-loop */

const parquet = join(distDir, 'habitats.parquet')
const pmtiles = join(distDir, 'habitats.pmtiles')
await publish(connection, {
  pieces, parquet, pmtiles, tileLayer: 'habitats', workDir: runDir,
})

// The habitats that the surfaces cover, and the layers they come from. What the plan de gestion
// says of them is the plan-gestion step's
const contents = join(distDir, 'habitats.json')
const cartographies: Cartographie[] = [...new Set(rules.map(rule => rule.habitat))].toSorted().map(code => ({
  code,
  layers: habitatLayers.filter(layer => layer.rules.some(rule => rule.habitat === code)).map(layer => layer.source.typeName),
}))
await writeFile(contents, JSON.stringify(cartographies, undefined, 2) + '\n')

const files = [parquet, pmtiles, contents]
const stats = await Promise.all(files.map(async file => stat(file)))

for (const [index, {size}] of stats.entries()) {
  console.log(`${files[index]}: ${(size / 1e6).toFixed(1)} MB`)
}
