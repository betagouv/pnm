import {type Cartographie, cartographiesSchema} from '@pnm/shared'
import express from 'express'
import {isPresent, lazily, readJson} from './data.ts'

// The tiles of the habitats, which the browser reads itself from the data folder
export const habitatsTilesFile = 'habitats.pmtiles'

// The habitats produced by the processing chain (pipelines/)
export type HabitatsData = {
  // The habitats that the surfaces cover
  readonly cartographies: () => Promise<Cartographie[]>
  // Fails unless all of them are there and valid, tiles included
  readonly check: () => Promise<void>
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

  async function checkTiles(): Promise<void> {
    const url = new URL(habitatsTilesFile, dataUrl)

    if (!await isPresent(url)) {
      throw new Error(`${url.href}: not found`)
    }
  }

  return {
    cartographies,
    async check() {
      await Promise.all([cartographies(), checkTiles()])
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
