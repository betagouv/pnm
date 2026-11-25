import {z} from 'zod'
import {habitatSchema} from './habitats.ts'

// The ids of the plan de gestion are those of its Grist document
const idSchema = z.number().int().positive()

const textSchema = z.string().min(1)

// A DSFR pictogram, as "<category>/<name>": "institutions/navy-anchor"
const pictogrammeSchema = z.string().regex(/^[a-z]+\/[a-z]+(?:-[a-z]+)*$/v)

export const indicateurSchema = z.object({
  code: textSchema,
  libelle: textSchema,
})

export const sousObjectifSchema = z.object({
  id: idSchema,
  libelle: textSchema,
  // What has to be reached
  niveauExigence: textSchema.optional(),
  // The sous-objectif for everyone, in paragraphs separated by a blank line
  synthese: textSchema.optional(),
  indicateurs: z.array(indicateurSchema),
})

export const objectifSchema = z.object({
  id: idSchema,
  libelle: textSchema,
  // A label that sorts the objectifs of an enjeu, nothing more
  sousEnjeu: textSchema.optional(),
  // The objectif for everyone, in paragraphs separated by a blank line
  synthese: textSchema.optional(),
  // What has to be reached, for an objectif that the plan does not divide into sous-objectifs
  niveauExigence: textSchema.optional(),
  sousObjectifs: z.array(sousObjectifSchema),
})

export const enjeuSchema = z.object({
  id: idSchema,
  libelle: textSchema,
  // The enjeu as the plan de gestion words it
  formulation: textSchema.optional(),
  // In paragraphs separated by a blank line
  synthese: textSchema.optional(),
  // A few sentences that present it
  description: textSchema.optional(),
  // What the enjeu brings to the sea and to the territory, one per line
  beneficesMer: textSchema.optional(),
  beneficesTerritoire: textSchema.optional(),
  pictogramme: pictogrammeSchema.optional(),
  objectifs: z.array(objectifSchema),
})

// An action of the parc, a study or a follow-up
export const actionSchema = z.object({
  id: idSchema,
  libelle: textSchema,
  // Its kind in the nomenclature of the actions: "Amélioration de la connaissance"
  categorie: textSchema.optional(),
  // What the action does and how, in paragraphs separated by a blank line
  synthese: textSchema.optional(),
  // The days it starts and ends: 2026-02-25
  debut: z.iso.date().optional(),
  fin: z.iso.date().optional(),
  porteur: textSchema.optional(),
  operateurTechnique: textSchema.optional(),
  acteurOperationnel: textSchema.optional(),
  financement: textSchema.optional(),
  // What it serves: the enjeux, directly or through the objectifs
  enjeux: z.array(idSchema),
  objectifs: z.array(idSchema),
  sousObjectifs: z.array(idSchema),
})

// A species that the plan de gestion follows, under one of its sous-objectifs
export const especeSchema = z.object({
  id: idSchema,
  nom: textSchema,
  nomScientifique: textSchema.optional(),
  // A short presentation, in paragraphs separated by a blank line
  synthese: textSchema.optional(),
  sousObjectif: idSchema.optional(),
})

// An activité that a porteur de projet can pick in the parc
export const activiteSchema = z.object({
  id: idSchema,
  nom: textSchema,
  description: textSchema.optional(),
  pictogramme: pictogrammeSchema.optional(),
})

// Advice of the plan de gestion to the porteurs de projet. It may be meant for some activités, for
// some habitats, or both: a projet gets it when it has one of these activités and concerns one of
// these habitats. Without either, it is meant for every projet
export const recommandationSchema = z.object({
  id: idSchema,
  titre: textSchema.optional(),
  description: textSchema,
  // Where it stands in the plan, as precisely as the plan says: the enjeu it serves, and its
  // objectif and sous-objectif when the plan names them
  enjeu: idSchema.optional(),
  objectif: idSchema.optional(),
  sousObjectif: idSchema.optional(),
  activites: z.array(idSchema),
  // By code habitat élémentaire
  habitats: z.array(habitatSchema.shape.code),
})

export const planGestionSchema = z.object({
  // The plan de gestion as adopted and published
  document: z.url().optional(),
  enjeux: z.array(enjeuSchema),
  habitats: z.array(habitatSchema),
  especes: z.array(especeSchema),
  actions: z.array(actionSchema),
  activites: z.array(activiteSchema),
  recommandations: z.array(recommandationSchema),
}).refine(
  plan => new Set(plan.habitats.map(habitat => habitat.code)).size === plan.habitats.length,
  'Duplicate habitat code',
).refine(
  plan => {
    const enjeux = new Set(plan.enjeux.map(enjeu => enjeu.id))
    const habitats = new Set(plan.habitats.map(habitat => habitat.code))
    const activites = new Set(plan.activites.map(activite => activite.id))
    return plan.recommandations.every(recommandation => (recommandation.enjeu === undefined || enjeux.has(recommandation.enjeu))
      && recommandation.habitats.every(code => habitats.has(code))
      && recommandation.activites.every(id => activites.has(id)))
  },
  // Left out, a habitat or an activité would widen the recommandation to more projets
  'A recommandation refers to an enjeu, a habitat or an activité that the plan does not hold',
)

export type Indicateur = z.infer<typeof indicateurSchema>
export type SousObjectif = z.infer<typeof sousObjectifSchema>
export type Objectif = z.infer<typeof objectifSchema>
export type Enjeu = z.infer<typeof enjeuSchema>
export type Action = z.infer<typeof actionSchema>
export type Espece = z.infer<typeof especeSchema>
export type Activite = z.infer<typeof activiteSchema>
export type Recommandation = z.infer<typeof recommandationSchema>
export type PlanGestion = z.infer<typeof planGestionSchema>
