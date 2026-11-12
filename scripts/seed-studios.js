import { pathToFileURL } from "node:url";
import { MongoClient, ObjectId } from "mongodb";
import { studioSchema } from "../src/studio-validation.js";

const samples = [
  {
    id: "8a0000000000000000000001",
    title: "Softbox Daylight Studio",
    category: "Photo Studio",
    location: "Brooklyn, NY",
    hourlyRate: 75,
    securityDeposit: 100,
    maxCapacity: 10,
    photo: "1648740678671-c37d78567ea8", // KOBU Agency
    amenities: ["Backdrop stand", "Softboxes", "Changing area"],
    description: "A compact photography studio with a neutral backdrop and movable lighting. The layout suits portraits, small editorial teams, and interview setups.",
  },
  {
    id: "8a0000000000000000000002",
    title: "White Cyc Stage",
    category: "Film Stage",
    location: "Queens, NY",
    hourlyRate: 160,
    securityDeposit: 300,
    maxCapacity: 30,
    photo: "1745193308101-faf4ddc81ad3", // Lens Head Media
    amenities: ["Cyclorama", "Lighting grid", "Equipment staging"],
    description: "A white cyclorama stage with space for camera movement and crew staging. Set it up for commercials, interviews, or small music video shoots.",
  },
  {
    id: "8a0000000000000000000003",
    title: "After Hours Podcast Room",
    category: "Podcast Lounge",
    location: "Manhattan, NY",
    hourlyRate: 55,
    securityDeposit: 75,
    maxCapacity: 6,
    photo: "1764664035176-8e92ff4f128e", // Detail .co
    amenities: ["Broadcast microphones", "Headphones", "Video lighting"],
    description: "An intimate interview room with tabletop microphones and a lighting setup for video podcasts. Bring your own storage to take the session files with you.",
  },
  {
    id: "8a0000000000000000000004",
    title: "Overtone Recording Suite",
    category: "Music Suite",
    location: "Brooklyn, NY",
    hourlyRate: 90,
    securityDeposit: 150,
    maxCapacity: 8,
    photo: "1634286051376-940ff8525141", // TStudio_lv
    amenities: ["Vocal microphone", "MIDI keyboard", "Studio monitors"],
    description: "An acoustically treated recording room for vocal takes, demos, and music production. The keyboard and monitoring setup are included in the hourly rate.",
  },
  {
    id: "8a0000000000000000000005",
    title: "Kiln and Clay Workshop",
    category: "Workshop",
    location: "Jersey City, NJ",
    hourlyRate: 65,
    securityDeposit: 100,
    maxCapacity: 14,
    photo: "1759847365004-8c17665602a6", // Martin Baron
    amenities: ["Worktables", "Utility sink", "Drying shelves"],
    description: "A shared ceramics workshop with washable worktables and shelves for drying pieces. It works well for hand-building sessions and small group classes.",
  },
  {
    id: "8a0000000000000000000006",
    title: "Color Lab Product Studio",
    category: "Photo Studio",
    location: "Queens, NY",
    hourlyRate: 70,
    securityDeposit: 100,
    maxCapacity: 6,
    photo: "1765372860684-69f0e2524694", // Erfan Ro
    amenities: ["Product table", "RGB lights", "Tripod"],
    description: "A tabletop set for product photos and short-form video. Adjustable color lighting lets you reset the look quickly between takes.",
  },
];

export async function seedStudios(studios) {
  const now = Date.now();
  const operations = samples.map(({ id, photo, ...fields }, index) => ({
    updateOne: {
      filter: { _id: new ObjectId(id) },
      update: {
        $setOnInsert: {
          ...studioSchema.parse({
            ...fields,
            image: `https://images.unsplash.com/photo-${photo}?auto=format&fit=crop&w=1200&q=80`,
          }),
          ownerId: "studiospace-demo",
          ownerName: "StudioSpace Demo",
          ownerEmail: "demo@example.com",
          rating: 0,
          createdAt: new Date(now - index * 60_000),
        },
      },
      upsert: true,
    },
  }));
  const { upsertedCount } = await studios.bulkWrite(operations);
  return upsertedCount;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is required.");

  const client = new MongoClient(uri);
  try {
    const db = client.db(process.env.MONGODB_DB || "Booknook");
    const inserted = await seedStudios(db.collection("studios"));
    console.log(`StudioSpace sample catalog ready. Inserted ${inserted} of ${samples.length} studios.`);
  } finally {
    await client.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
