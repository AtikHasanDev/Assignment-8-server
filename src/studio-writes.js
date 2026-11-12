import { Router } from "express";
import { HttpError } from "./errors.js";
import { studioSchema, studioUpdateSchema } from "./studio-validation.js";
import { objectId } from "./validation.js";

export function studioWrites({ db, auth }) {
  const router = Router();
  const studios = db.collection("studios");

  router.post("/api/studios", auth, async (req, res) => {
    const input = studioSchema.parse(req.body);
    const studio = {
      ...input,
      ownerId: req.user.id,
      ownerEmail: req.user.email,
      ownerName: req.user.name,
      rating: 0,
      createdAt: new Date(),
    };
    const { insertedId } = await studios.insertOne(studio);
    res.status(201).json({ ...studio, _id: insertedId });
  });

  router.patch("/api/studios/:id", auth, async (req, res) => {
    const id = objectId(req.params.id);
    const input = studioUpdateSchema.parse(req.body);
    const studio = await studios.findOneAndUpdate(
      { _id: id, ownerId: req.user.id, ownerEmail: req.user.email },
      { $set: { ...input, updatedAt: new Date() } },
      { returnDocument: "after" },
    );
    if (!studio) throw new HttpError(404, "This studio could not be found.");
    res.json(studio);
  });

  router.delete("/api/studios/:id", auth, async (req, res) => {
    const id = objectId(req.params.id);
    const { deletedCount } = await studios.deleteOne({
      _id: id,
      ownerId: req.user.id,
      ownerEmail: req.user.email,
    });
    if (!deletedCount)
      throw new HttpError(404, "This studio could not be found.");
    res.status(204).end();
  });

  return router;
}
