import {z} from 'zod'
import {habitatSchema} from './habitats.ts'

// The ids of the plan de gestion are those of its Grist document
const idSchema = z.number().int().positive()

const textSchema = z.string().min(1)

export const indicateurSchema = z.object({
  code: textSchema,
  libelle: textSchema,
})

export const sousObjectifSchema = z.object({
  id: idSchema,
  libelle: textSchema,
  // What has to be reached
  niveauExigence: textSchema.optional(),
  indicateurs: z.array(indicateurSchema),
})

export const objectifSchema = z.object({
  id: idSchema,
  libelle: textSchema,
  // A label that sorts the objectifs of an enjeu, nothing more
  sousEnjeu: textSchema.optional(),
  sousObjectifs: z.array(sousObjectifSchema),
})

export const enjeuSchema = z.object({
  id: idSchema,
  libelle: textSchema,
  // The enjeu as the plan de gestion words it
  formulation: textSchema.optional(),
  // In paragraphs separated by a blank line
  synthese: textSchema.optional(),
  objectifs: z.array(objectifSchema),
})

// An action of the parc, a study or a follow-up
export const actionSchema = z.object({
  id: idSchema,
  libelle: textSchema,
  // What the action does and how, in paragraphs separated by a blank line
  synthese: textSchema.optional(),
  periode: textSchema.optional(),
  porteur: textSchema.optional(),
  operateurTechnique: textSchema.optional(),
  acteurOperationnel: textSchema.optional(),
  financement: textSchema.optional(),
  // What it serves: the enjeux, directly or through the objectifs
  enjeux: z.array(idSchema),
  objectifs: z.array(idSchema),
  sousObjectifs: z.array(idSchema),
})

// An activité that a porteur de projet can pick in the parc
export const activiteSchema = z.object({
  id: idSchema,
  nom: textSchema,
  description: textSchema.optional(),
  // A DSFR pictogram, as "<category>/<name>": "institutions/navy-anchor"
  pictogramme: z.string().regex(/^[a-z]+\/[a-z]+(?:-[a-z]+)*$/v).optional(),
})

export const planGestionSchema = z.object({
  // The plan de gestion as adopted and published
  document: z.url().optional(),
  enjeux: z.array(enjeuSchema),
  habitats: z.array(habitatSchema),
  actions: z.array(actionSchema),
  activites: z.array(activiteSchema),
}).refine(
  plan => new Set(plan.habitats.map(habitat => habitat.code)).size === plan.habitats.length,
  'Duplicate habitat code',
)

export type Indicateur = z.infer<typeof indicateurSchema>
export type SousObjectif = z.infer<typeof sousObjectifSchema>
export type Objectif = z.infer<typeof objectifSchema>
export type Enjeu = z.infer<typeof enjeuSchema>
export type Action = z.infer<typeof actionSchema>
export type Activite = z.infer<typeof activiteSchema>
export type PlanGestion = z.infer<typeof planGestionSchema>
