import { ConvexHttpClient } from "convex/browser";
import fs from "fs";
import { api } from "./convex/_generated/api.js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function seed() {
  console.log("Removing all current vehicles...");
  const removed = await client.mutation(api.vehicles.removeAll, {});
  console.log(`Removed ${removed} existing vehicles.`);

  const data = JSON.parse(fs.readFileSync("vehicles.json", "utf-8"));
  console.log(`Inserting ${data.length} vehicles...`);
  
  const inserted = await client.mutation(api.vehicles.insertMany, { vehicles: data });
  console.log(`Successfully inserted ${inserted} vehicles!`);
}

seed().catch(console.error);
