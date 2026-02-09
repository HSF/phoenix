import { z } from 'zod';

/**
 * Validates the structure of the 'Types' object in CMS event data.
 * The keys are collection names, and the values are arrays of attribute definitions.
 * Each attribute definition is an array where the first element is the attribute name.
 */
export const CMSTypesSchema = z.record(
  z.string(),
  z.array(z.tuple([z.string()]).rest(z.union([z.string(), z.number()]))),
);

/**
 * Validates the structure of the 'Collections' object in CMS event data.
 * The keys are collection names, and the values are arrays of objects (rows).
 * Each row is an array of values corresponding to the attributes defined in 'Types'.
 */
export const CMSCollectionsSchema = z.record(
  z.string(),
  z.array(z.array(z.union([z.number(), z.string()]))),
);

/**
 * Validates a single item in an Association.
 * Typically a tuple of [unknown, index].
 */
export const CMSAssociationItemSchema = z.array(
  z.tuple([z.number(), z.number()]),
);

/**
 * Validates the structure of the 'Associations' object in CMS event data.
 */
export const CMSAssociationsSchema = z.record(
  z.string(),
  z.array(CMSAssociationItemSchema),
);

/**
 * Main schema for a CMS Event.
 */
export const CMSEventSchema = z
  .object({
    Types: CMSTypesSchema,
    Collections: CMSCollectionsSchema,
    Associations: CMSAssociationsSchema.optional(),
  })
  .passthrough(); // Allow other properties like 'run number' etc if they exist at top level (though usually they are extracted)

export type CMSEvent = z.infer<typeof CMSEventSchema>;
