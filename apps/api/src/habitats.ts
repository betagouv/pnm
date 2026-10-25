import {DuckDBInstance} from '@duckdb/node-api'
import {type Cartographie, cartographiesSchema} from '@pnm/shared'
import express from 'express'
import {
  duckdbLocation,
  isPresent,
  lazily,
  readJson,
} from './data.ts'

// The tiles of the habitats, which the browser reads itself from the data folder
export const habitatsTilesFile = 'habitats.pmtiles'

// The habitats produced by the processing chain (pipelines/)
export type HabitatsData = {
  // The habitats that the surfaces cover
  readonly cartographies: () => Promise<Cartographie[]>
  // Holds the surfaces of each habitat, in WGS 84, in a table named habitats. A request has its
  // own connection, and its own tables
  readonly surfaces: () => Promise<DuckDBInstance>
  // Fails unless all of them are there and valid, tiles included
  readonly check: () => Promise<void>
}

async function loadSurfaces(instance: DuckDBInstance, url: URL): Promise<void> {
  const connection = await instance.connect()

  try {
    await connection.run('INSTALL spatial; LOAD spatial; INSTALL httpfs; LOAD httpfs')
    await connection.run('CREATE TABLE habitats AS SELECT habitat, geometry, bbox FROM read_parquet($location)', {location: duckdbLocation(url)})
  } finally {
    connection.closeSync()
  }
}

export function createHabitatsData(dataUrl: URL): HabitatsData {
  const cartographies = lazily(async () => {
    const url = new URL('habitats.json', dataUrl)
    const cartographies = await readJson(url, cartographiesSchema)

    if (cartographies === undefined) {
      throw new Error(`${url.href}: not found`)
    }

    return cartographies
  })
  const surfaces = lazily(async () => {
    const instance = await DuckDBInstance.create()

    try {
      await loadSurfaces(instance, new URL('habitats.parquet', dataUrl))
    } catch (error) {
      instance.closeSync()
      throw error
    }

    return instance
  })

  async function checkTiles(): Promise<void> {
    const url = new URL(habitatsTilesFile, dataUrl)

    if (!await isPresent(url)) {
      throw new Error(`${url.href}: not found`)
    }
  }

  return {
    cartographies,
    surfaces,
    async check() {
      await Promise.all([cartographies(), surfaces(), checkTiles()])
    },
  }
}

export function createHabitatsRouter(habitats: HabitatsData): express.Router {
  const router = express.Router() // eslint-disable-line new-cap

  router.get('/', async (_request, response) => {
    response.json(await habitats.cartographies())
  })

  return router
}
