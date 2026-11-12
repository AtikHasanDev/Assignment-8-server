import { Router } from "express";
import { z } from "zod";
import { HttpError } from "./errors.js";
import { objectId } from "./validation.js";

const bookingSchema = z.strictObject({
  studioId: z.string(),
  startsAt: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
  endsAt: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
});

export function bookingRoutes({ db, auth }) {
  const router = Router();
  const bookings = db.collection("bookings");
  const studios = db.collection("studios");

  router.post("/api/bookings", auth, async (req, res) => {
    const { studioId, startsAt, endsAt } = bookingSchema.parse(req.body);
    const id = objectId(studioId);
    if (startsAt.getTime() <= Date.now() || endsAt <= startsAt)
      throw new HttpError(400, "Choose a future start time and a later end time.");

    const studio = await studios.findOne(
      { _id: id },
      { projection: { title: 1, image: 1, location: 1, hourlyRate: 1, securityDeposit: 1 } },
    );
    if (!studio) throw new HttpError(404, "This studio could not be found.");

    const conflict = await bookings.findOne(
      {
        studioId: id,
        status: "Confirmed",
        startsAt: { $lt: endsAt },
        endsAt: { $gt: startsAt },
      },
      { projection: { _id: 1 } },
    );
    if (conflict)
      throw new HttpError(409, "This studio is already booked for part of that time.");

    const booking = {
      studioId: id,
      studioTitle: studio.title,
      studioImage: studio.image,
      studioLocation: studio.location,
      hourlyRate: studio.hourlyRate,
      securityDeposit: studio.securityDeposit,
      userId: req.user.id,
      startsAt,
      endsAt,
      status: "Pending",
      createdAt: new Date(),
    };
    const { insertedId } = await bookings.insertOne(booking);
    res.status(201).json({ ...booking, _id: insertedId });
  });

  router.get("/api/bookings", auth, async (req, res) => {
    const reservations = await bookings
      .find({ userId: req.user.id })
      .sort({ createdAt: -1, _id: -1 })
      .toArray();
    res.json(reservations);
  });

  router.patch("/api/bookings/:id/cancel", auth, async (req, res) => {
    const owner = { _id: objectId(req.params.id), userId: req.user.id };
    const booking = await bookings.findOneAndUpdate(
      { ...owner, status: "Pending" },
      { $set: { status: "Cancelled", cancelledAt: new Date() } },
      { returnDocument: "after" },
    );
    if (booking) return res.json(booking);

    const existing = await bookings.findOne(owner, { projection: { status: 1 } });
    if (!existing) throw new HttpError(404, "This booking could not be found.");
    throw new HttpError(409, "Only pending bookings can be cancelled.");
  });

  return router;
}
