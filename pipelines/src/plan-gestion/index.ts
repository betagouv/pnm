// The plan de gestion of each parc, from its Grist document: the enjeux of the parc with their
// objectifs, its habitats, its actions, the activités a porteur de projet can pick and the
// recommandations to them. The tables that only sort the others give labels, not entries: the
// sous-enjeux
// npm run plan-gestion -w @pnm/pipelines
import {mkdir, writeFile} from 'node:fs/promises'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {
  type Action,
  type Activite,
  type Enjeu,
  type Espece,
  type Habitat,
  type PlanGestion,
  type Recommandation,
  planGestionSchema,
} from '@pnm/shared'
import type {GristRecord} from '@pnm/grist'
import {
  date,
  readGristTable,
  ref,
  refList,
  text,
} from '../lib/grist.ts'
import {type GristSource, plansGestion} from '../sources.ts'

const distDir = fileURLToPath(new URL('../../../data/dist/plan-de-gestion/', import.meta.url))

function isUrl(value: string): boolean {
  return /^https?:\/\//v.test(value)
}

// The values that a list of Grist ids refers to. An id that the plan does not hold stops here: left
// out, it would widen a recommandation to more projets
function lookUp<T>(ids: readonly number[], values: ReadonlyMap<number, T>, what: string): T[] {
  return ids.map(id => {
    const value = values.get(id)

    if (value === undefined) {
      throw new Error(`${what}: ${id} is not in the plan de gestion`)
    }

    return value
  })
}

async function readPlan(source: GristSource): Promise<PlanGestion> {
  async function readRecords(tableId: string): Promise<GristRecord[]> {
    const table = await readGristTable(source, tableId)
    return table.records
  }

  const [
    enjeux,
    objectifs,
    sousObjectifs,
    indicateurs,
    habitats,
    especes,
    actions,
    recommandations,
    activites,
    planGestion,
  ] = await Promise.all([
    readRecords('Enjeux'),
    readRecords('Objectifs'),
    readRecords('Sous_objectifs'),
    readRecords('Indicateurs'),
    readRecords('Habitats'),
    readRecords('Especes'),
    readRecords('Actions'),
    readRecords('Recommandations'),
    readRecords('Activites'),
    readRecords('Plan_de_gestion'),
  ])

  // The ids of the plan de gestion are those of the Grist records, which references point to
  const objectifEnjeu = new Map(objectifs.map(({id, fields}) => [id, ref(fields.enjeu)]))

  const planEnjeux: Enjeu[] = enjeux.map(enjeu => ({
    id: enjeu.id,
    libelle: text(enjeu.fields.libelle) ?? `Enjeu ${enjeu.id}`,
    formulation: text(enjeu.fields.formulation),
    synthese: text(enjeu.fields.synthese),
    description: text(enjeu.fields.description),
    beneficesMer: text(enjeu.fields.beneficesMer),
    beneficesTerritoire: text(enjeu.fields.beneficesTerritoire),
    pictogramme: text(enjeu.fields.pictogramme),
    objectifs: objectifs.filter(objectif => ref(objectif.fields.enjeu) === enjeu.id).map(objectif => ({
      id: objectif.id,
      libelle: text(objectif.fields.libelle) ?? `Objectif ${objectif.id}`,
      sousEnjeu: text(objectif.fields.sousEnjeu),
      synthese: text(objectif.fields.synthese),
      niveauExigence: text(objectif.fields.niveauExigence),
      sousObjectifs: sousObjectifs.filter(sousObjectif => ref(sousObjectif.fields.objectif) === objectif.id).map(sousObjectif => ({
        id: sousObjectif.id,
        libelle: text(sousObjectif.fields.libelle) ?? `Sous-objectif ${sousObjectif.id}`,
        niveauExigence: text(sousObjectif.fields.niveauExigence),
        synthese: text(sousObjectif.fields.synthese),
        indicateurs: indicateurs
          .filter(indicateur => ref(indicateur.fields.sousObjectif) === sousObjectif.id)
          .flatMap(({fields}) => {
            const code = text(fields.code)
            const libelle = text(fields.libelle)
            return code === undefined || libelle === undefined ? [] : [{code, libelle}]
          }),
      })),
    })),
  }))

  // With their Grist id, which the recommandations refer to
  const keptHabitats: Array<{id: number, habitat: Habitat}> = habitats.flatMap(({id, fields}) => {
    const code = text(fields.code)
    const nom = text(fields.nom)

    if (code === undefined || nom === undefined) {
      return []
    }

    const codeGenerique = text(fields.codeHabitatGenerique)
    const nomGenerique = text(fields.nomHabitatGenerique)

    return [{
      id,
      habitat: {
        code,
        nom,
        habitatGenerique: codeGenerique === undefined || nomGenerique === undefined
          ? undefined
          : {code: codeGenerique, nom: nomGenerique},
        synthese: text(fields.synthese),
        sousObjectif: ref(fields.sousObjectif),
      },
    }]
  })
  const habitatCodes = new Map(keptHabitats.map(({id, habitat}) => [id, habitat.code]))

  const planEspeces: Espece[] = especes.flatMap(({id, fields}) => {
    const nom = text(fields.nom)
    return nom === undefined
      ? []
      : [{
        id,
        nom,
        nomScientifique: text(fields.nomScientifique),
        synthese: text(fields.synthese),
        sousObjectif: ref(fields.sousObjectif),
      }]
  })

  const planActivites: Activite[] = activites.flatMap(({id, fields}) => {
    const nom = text(fields.nom)
    return nom === undefined
      ? []
      : [{
        id,
        nom,
        description: text(fields.description),
        pictogramme: text(fields.pictogramme),
      }]
  })
  const activiteIds = new Map(planActivites.map(({id}) => [id, id]))
  const sousObjectifObjectif = new Map(sousObjectifs.map(({id, fields}) => [id, ref(fields.objectif)]))

  // A recommandation names its most precise place in the plan: a sous-objectif, else an objectif,
  // else an enjeu. Its enjeu follows from it
  function recommandationEnjeu(id: number, fields: GristRecord['fields']): number | undefined {
    const sousObjectif = ref(fields.sousObjectif)
    const objectif = sousObjectif === undefined ? ref(fields.objectif) : sousObjectifObjectif.get(sousObjectif)
    const enjeu = objectif === undefined ? ref(fields.enjeu) : objectifEnjeu.get(objectif)
    // A less precise place, named as well, must agree
    const isConsistent = (ref(fields.objectif) ?? objectif) === objectif && (ref(fields.enjeu) ?? enjeu) === enjeu

    if (!isConsistent) {
      throw new Error(`Recommandation ${id}: its sous-objectif, objectif and enjeu disagree`)
    }

    return enjeu
  }

  const planRecommandations: Recommandation[] = recommandations.flatMap(({id, fields}) => {
    const description = text(fields.description)

    if (description === undefined) {
      return []
    }

    return [{
      id,
      titre: text(fields.titre),
      description,
      enjeu: recommandationEnjeu(id, fields),
      activites: lookUp(refList(fields.activites), activiteIds, `Recommandation ${id}, activités`),
      habitats: lookUp(refList(fields.habitats), habitatCodes, `Recommandation ${id}, habitats`),
    }]
  })

  const planActions: Action[] = actions.map(({id, fields}) => {
    const actionObjectifs = refList(fields.objectifs)
    // An action may name its enjeu directly, besides those of its objectifs
    const enjeu = ref(fields.enjeu)
    const actionEnjeux = new Set([
      ...(enjeu === undefined ? [] : [enjeu]),
      ...actionObjectifs.flatMap(objectif => objectifEnjeu.get(objectif) ?? []),
    ])

    return {
      id,
      libelle: text(fields.libelle) ?? `Action ${id}`,
      categorie: text(fields.categorie),
      synthese: text(fields.synthese),
      debut: date(fields.debut),
      fin: date(fields.fin),
      porteur: text(fields.porteur),
      operateurTechnique: text(fields.operateurTechnique),
      acteurOperationnel: text(fields.acteurOperationnel),
      financement: text(fields.financement),
      enjeux: [...actionEnjeux].toSorted((a, b) => a - b),
      objectifs: actionObjectifs,
      sousObjectifs: refList(fields.sousObjectifs),
    }
  })

  const document = planGestion.map(({fields}) => text(fields.document)).find(url => url !== undefined && isUrl(url))

  // What does not fit the schema stops here, rather than in the API
  return planGestionSchema.parse({
    document,
    enjeux: planEnjeux,
    habitats: keptHabitats.map(({habitat}) => habitat),
    especes: planEspeces,
    actions: planActions,
    activites: planActivites,
    recommandations: planRecommandations,
  })
}

// A parc has one plan de gestion in force
const parcs = plansGestion.map(source => source.parc)
const repeated = new Set(parcs.filter((parc, index) => parcs.indexOf(parc) !== index))

if (repeated.size > 0) {
  throw new Error(`More than one plan de gestion for ${[...repeated].join(', ')}`)
}

await mkdir(distDir, {recursive: true})

for (const source of plansGestion) {
  // eslint-disable-next-line no-await-in-loop -- a handful of parcs
  const plan = await readPlan(source)
  const file = join(distDir, `${source.parc}.json`)
  // eslint-disable-next-line no-await-in-loop
  await writeFile(file, JSON.stringify(plan, undefined, 2) + '\n')
  const sousObjectifCount = plan.enjeux.flatMap(enjeu => enjeu.objectifs.flatMap(objectif => objectif.sousObjectifs)).length
  const counts = [
    `${plan.enjeux.length} enjeux`,
    `${sousObjectifCount} sous-objectifs`,
    `${plan.habitats.length} habitats`,
    `${plan.especes.length} espèces`,
    `${plan.actions.length} actions`,
    `${plan.activites.length} activités`,
    `${plan.recommandations.length} recommandations`,
  ]
  console.log(`${file}: ${counts.join(', ')}`)
}
