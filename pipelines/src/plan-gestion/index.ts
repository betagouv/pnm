// The plan de gestion of each parc, from its Grist document: the enjeux of the parc with their
// objectifs, its habitats, its actions and the activités a porteur de projet can pick. The tables
// that only sort the others give labels, not entries: the sous-enjeux
// npm run plan-gestion -w @pnm/pipelines
import {mkdir, writeFile} from 'node:fs/promises'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {
  type Action,
  type Activite,
  type Enjeu,
  type Habitat,
  type PlanGestion,
  planGestionSchema,
} from '@pnm/shared'
import type {GristRecord} from '@pnm/grist'
import {
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
    actions,
    activites,
    guide,
  ] = await Promise.all([
    readRecords('Table_des_enjeux'),
    readRecords('Objectifs_Long_Terme'),
    readRecords('Sous_Objectifs_Long_Terme'),
    readRecords('Indicateurs'),
    readRecords('Habitats'),
    readRecords('Actions_recupere_depuis_EVA_'),
    readRecords('Activites_MPM_'),
    readRecords('Guide_d_utilisation'),
  ])

  // Grist refers to a record by its id, which these tables also hold as their own id
  const objectifEnjeu = new Map(objectifs.map(({id, fields}) => [id, ref(fields.id_enjeu)]))

  const planEnjeux: Enjeu[] = enjeux.map(enjeu => ({
    id: enjeu.id,
    libelle: text(enjeu.fields.Libelle_enjeu) ?? `Enjeu ${enjeu.id}`,
    formulation: text(enjeu.fields.libelle_enjeu_plandegestion),
    synthese: text(enjeu.fields.Synthese_enjeu),
    objectifs: objectifs.filter(objectif => ref(objectif.fields.id_enjeu) === enjeu.id).map(objectif => ({
      id: objectif.id,
      libelle: text(objectif.fields.Libelle_objectif) ?? `Objectif ${objectif.id}`,
      sousEnjeu: text(objectif.fields.libelle_sous_enjeu),
      sousObjectifs: sousObjectifs.filter(sousObjectif => ref(sousObjectif.fields.id_objectif) === objectif.id).map(sousObjectif => ({
        id: sousObjectif.id,
        libelle: text(sousObjectif.fields.Libelle_sousobjectif) ?? `Sous-objectif ${sousObjectif.id}`,
        niveauExigence: text(sousObjectif.fields.Niveau_exigence_sous_finalite),
        indicateurs: indicateurs
          .filter(indicateur => ref(indicateur.fields.id_sousobjectif) === sousObjectif.id)
          .flatMap(({fields}) => {
            const code = text(fields.code_indica)
            const libelle = text(fields.Libelle_indicateur)
            return code === undefined || libelle === undefined ? [] : [{code, libelle}]
          }),
      })),
    })),
  }))

  const planHabitats: Habitat[] = habitats.flatMap(({fields}) => {
    const code = text(fields.Code_habitat_elementaire)
    const nom = text(fields.Habitat_elementaire)

    if (code === undefined || nom === undefined) {
      return []
    }

    const codeGenerique = text(fields.Code_habitat_generique)
    const nomGenerique = text(fields.Habitat_generique)

    return [{
      code,
      nom,
      habitatGenerique: codeGenerique === undefined || nomGenerique === undefined
        ? undefined
        : {code: codeGenerique, nom: nomGenerique},
      synthese: text(fields.Synthese_habitat),
      sousObjectif: ref(fields.Simplifie_sousobjectif),
    }]
  })

  const planActivites: Activite[] = activites.flatMap(({id, fields}) => {
    const nom = text(fields.Nom_de_l_activite)
    return nom === undefined
      ? []
      : [{
        id,
        nom,
        description: text(fields.Description),
        pictogramme: text(fields.Pictogramme),
      }]
  })

  const planActions: Action[] = actions.map(({id, fields}) => {
    const actionObjectifs = refList(fields.id_objectif)
    // An action may name its enjeu directly, as a number
    const enjeu = ref(fields.id_enjeu)
    const actionEnjeux = new Set([
      ...(enjeu === undefined ? [] : [enjeu]),
      ...actionObjectifs.flatMap(objectif => objectifEnjeu.get(objectif) ?? []),
    ])

    return {
      id,
      libelle: text(fields.libelle_action) ?? `Action ${id}`,
      synthese: text(fields.Synthese_protocole_action),
      periode: text(fields.Periode_action),
      porteur: text(fields.Porteur),
      operateurTechnique: text(fields.Operateur_technique),
      acteurOperationnel: text(fields.Acteur_op_action),
      financement: text(fields.Financement),
      enjeux: [...actionEnjeux].toSorted((a, b) => a - b),
      objectifs: actionObjectifs,
      sousObjectifs: refList(fields.id_sousobjectif),
    }
  })

  const document = guide.map(({fields}) => text(fields.Plan_de_gestion)).find(url => url !== undefined && isUrl(url))

  // What does not fit the schema stops here, rather than in the API
  return planGestionSchema.parse({
    document,
    enjeux: planEnjeux,
    habitats: planHabitats,
    actions: planActions,
    activites: planActivites,
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
    `${plan.actions.length} actions`,
    `${plan.activites.length} activités`,
  ]
  console.log(`${file}: ${counts.join(', ')}`)
}
