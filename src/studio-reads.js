import { Router } from "express";
import { HttpError } from "./errors.js";
import { objectId } from "./validation.js";

const publicFields = { ownerEmail: 0, ownerId: 0 };

export function studioReads({ db, auth }) {
  const router = Router();
  const studios = db.collection("studios");

  router.get("/api/studios", async (req, res) => {
    const { category, limit: rawLimit } = req.query;
    const filter = {};
    if (category !== undefined) {
      if (typeof category !== "string" || !category.trim() || category.length > 80)
        throw new HttpError(400, "Choose a valid studio category.");
      filter.category = category.trim();
    }

    let limit = 0;
    if (rawLimit !== undefined) {
      if (typeof rawLimit !== "string" || !/^[1-9]\d?$|^100$/.test(rawLimit))
        throw new HttpError(400, "Limit must be between 1 and 100.");
      limit = Number(rawLimit);
    }

    const results = await studios
      .find(filter, { projection: publicFields })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .toArray();
    res.json(results);
  });

  router.get("/api/studios/mine", auth, async (req, res) => {
    const listings = await studios
      .find({ ownerId: req.user.id, ownerEmail: req.user.email })
      .sort({ createdAt: -1, _id: -1 })
      .toArray();
    res.json(listings);
  });


  router.get("/api/studios/:id", async (req, res) => {
    const studio = await studios.findOne(
      { _id: objectId(req.params.id) },
      { projection: publicFields },
    );
    if (!studio) throw new HttpError(404, "This studio could not be found.");
    res.json(studio);
  });

  return router;
}
