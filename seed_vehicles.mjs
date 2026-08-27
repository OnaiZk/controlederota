import { ConvexHttpClient } from "convex/browser";
import fs from "fs";
import { api } from "./convex/_generated/api.js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function seed() {
  const data = JSON.parse(fs.readFileSync("vehicles.json", "utf-8"));
  console.log(`Inserting ${data.length} vehicles...`);
  
  // A inserção precisa ser por lotes ou tudo de uma vez. insertMany suporta array de vehicles
  const inserted = await client.mutation(api.vehicles.insertMany, { vehicles: data });
  
  console.log(`Successfully inserted ${inserted} vehicles!`);
}

seed().catch(console.error);
