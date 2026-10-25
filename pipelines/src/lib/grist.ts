// Reading the tables of a Grist document downloaded in data/raw, and its values as Grist stores them
import {readFile} from 'node:fs/promises'
import {join} from 'node:path'
import type {Table} from '@pnm/grist'
import {type GristSource, gristRawDir} from '../sources.ts'

export async function readGristTable(source: GristSource, tableId: string): Promise<Table> {
  const file = join(gristRawDir(source), `${tableId}.json`)

  try {
    return JSON.parse(await readFile(file, 'utf8')) as Table
  } catch {
    throw new Error(`${source.docId} is not downloaded: npm run download -w @pnm/pipelines`)
  }
}

// A text that says something, trimmed
export function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined
}

// A reference to a record of another table: Grist stores 0 for none
export function ref(value: unknown): number | undefined {
  return typeof value === 'number' && value > 0 ? value : undefined
}

// A list of references, which Grist stores as ['L', ...ids]
export function refList(value: unknown): number[] {
  return Array.isArray(value) && value[0] === 'L'
    ? (value as unknown[]).slice(1).filter((id): id is number => typeof id === 'number' && id > 0)
    : []
}
