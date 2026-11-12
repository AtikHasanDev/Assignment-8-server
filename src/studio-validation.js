import { z } from "zod";

export const studioCategories = [
  "Photo Studio",
  "Film Stage",
  "Podcast Lounge",
  "Music Suite",
  "Workshop",
];

const imageUrl = z.url({
  protocol: /^https$/,
  error: "Use a valid HTTPS image URL.",
});

const money = (field, minimum) =>
  z
    .number({ error: `Enter a valid ${field}.` })
    .min(minimum, `${field} must be at least $${minimum}.`)
    .multipleOf(0.01, `${field} can have up to two decimal places.`);

const studioFields = z.strictObject({
  title: z.string().trim().min(1, "Enter a studio title.").max(160),
  category: z.enum(studioCategories, { error: "Choose a studio category." }),
  hourlyRate: money("Hourly rate", 0.01),
  securityDeposit: money("Security deposit", 0),
  maxCapacity: z.number().int().positive("Capacity must be at least one person."),
  location: z.string().trim().min(1, "Enter the studio location.").max(240),
  image: imageUrl,
  gallery: z.array(imageUrl).max(12),
  amenities: z.array(z.string().trim().min(1).max(80)).max(30),
  description: z.string().trim().min(10, "Describe the studio in at least 10 characters.").max(4000),
});

export const studioSchema = studioFields.extend({
  gallery: studioFields.shape.gallery.default([]),
});

export const studioUpdateSchema = studioFields.partial().refine(
  (fields) => Object.keys(fields).length > 0,
  "Enter at least one studio field to update.",
);
