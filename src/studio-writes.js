import { Router } from "express";
import { studioSchema } from "./studio-validation.js";

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

  return router;
}
