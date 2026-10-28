/**
 * Seed / Sync Testimonials Script
 * 
 * STRICT PRODUCTION SAFETY:
 * - INSERT-ONLY and ADDITIVE. Never deletes, drops or overwrites existing documents.
 * - Respects DRY_RUN flag (DEFAULT = TRUE).
 * - Matches by company name (case-insensitive, trimmed).
 * - If company exists: ONLY sets clientName IF it is empty/falsy. Keeps existing quote, rating, order, and visible flags intact.
 * - If company does NOT exist: inserts with next available order number, rating 5, visible: false (unpublished).
 * 
 * Usage:
 *   npx tsx scripts/seed-testimonials.ts            # DRY RUN (Default, safe)
 *   npx tsx scripts/seed-testimonials.ts --execute  # LIVE RUN (Requires explicit flag)
 */

import mongoose from "mongoose";
import * as fs from "fs";
import * as path from "path";

// Load local environment safely without external dotenv
try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, "");
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch (err) {
  console.warn("Notice: Could not parse .env.local", err);
}

export interface ITestimonialSeedItem {
  company: string;
  clientName: string;
  quote: string;
}

export const SEED_TESTIMONIALS: ITestimonialSeedItem[] = [
  {
    company: "Arunima Couture",
    clientName: "Vanshika",
    quote: "Insertix captured our festive collection exactly the way we imagined it. The fabric details and lighting were stunning, and our enquiries went up noticeably after the shoot.",
  },
  {
    company: "Fondof Fashions",
    clientName: "Tarun Thakur",
    quote: "The visuals were clean, trendy and perfectly matched our brand mood. The team guided us on poses and styling, and engagement on our new collection posts clearly improved.",
  },
  {
    company: "Neti Neti",
    clientName: "Sonica Bansal",
    quote: "Insertix shot our body care range in a truly premium way, bringing out the textures and packaging beautifully. The product catalogue and reels were both delivered on time.",
  },
  {
    company: "Oov Lifestyle",
    clientName: "Shivani",
    quote: "Every angle and detail of our bags was shown beautifully. The shots were aesthetic and helped customers understand the products on our listings. A smooth and professional experience.",
  },
  {
    company: "Beatband",
    clientName: "Shivani",
    quote: "The headband shoot was fun and energetic. The lifestyle shots with models brought the product to life, and the reels gave us great reach on Instagram.",
  },
  {
    company: "S Cafe",
    clientName: "Shubham Tyagi",
    quote: "They captured the vibe of our cafe perfectly. The food and ambience visuals looked so inviting that people started visiting after seeing the reel. Great creativity and attention to detail.",
  },
  {
    company: "Two Hearts Cafe",
    clientName: "Anirudh Tyagi",
    quote: "The Garba Night coverage was fantastic. The energy, decor and crowd all came together in one highlight reel, and the turnaround was fast. We got the reel the very next day.",
  },
  {
    company: "No Siht",
    clientName: "Anuj Pratap Singh",
    quote: "The can shots were bold and scroll-stopping. The product shoot gave our brand a fresh, young look, and the visuals were a big help during our launch.",
  },
  {
    company: "In House Cafe",
    clientName: "Nikhil",
    quote: "They shot our menu and interiors so well that our social media feed instantly looked professional. The team was friendly and delivered on time.",
  },
];

// Helper to normalize strings for comparison
export function normalizeCompany(name: string): string {
  return (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function run() {
  const isDryRun = !process.argv.includes("--execute");

  console.log("=================================================");
  console.log(`MODE: ${isDryRun ? "🛡️ DRY RUN (No database modifications)" : "🚨 LIVE EXECUTION"}`);
  console.log("=================================================");

  // 1. Validate quotes length <= 280
  console.log("\n[1] Verifying quote lengths (Max 280 chars):");
  let quotesValid = true;
  SEED_TESTIMONIALS.forEach((item) => {
    const len = item.quote.length;
    const ok = len <= 280;
    if (!ok) quotesValid = false;
    console.log(`  - ${item.company}: ${len}/280 chars [${ok ? "PASS" : "FAIL"}]`);
  });

  if (!quotesValid) {
    console.error("Quote length validation failed!");
    process.exit(1);
  }

  // 2. Connect to MongoDB
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("No MONGODB_URI found in environment");
    process.exit(1);
  }

  console.log("\n[2] Connecting to database:");
  const maskedUri = uri.replace(/\/\/[^:]+:[^@]+@/, "//***:***@");
  console.log(`  URI: ${maskedUri}`);

  await mongoose.connect(uri);
  const col = mongoose.connection.db!.collection("testimonials");

  const existingDocs = await col.find({}).sort({ order: 1 }).toArray();
  console.log(`  Existing documents in 'testimonials': ${existingDocs.length}`);

  let maxOrder = existingDocs.reduce((acc, doc) => Math.max(acc, doc.order || 0), 0);

  // 3. Dry-Run Analysis / Planning
  console.log("\n[3] Planned Actions Table:");
  const plan: Array<{
    company: string;
    action: "insert" | "update clientName only" | "skip";
    existingOrder: number | string;
    finalVisible: boolean;
    reason: string;
  }> = [];

  let nextOrder = maxOrder;

  for (const item of SEED_TESTIMONIALS) {
    const norm = normalizeCompany(item.company);
    const existing = existingDocs.find((doc) => normalizeCompany(doc.company) === norm);

    if (existing) {
      const existingClientName = (existing.clientName || "").trim();
      if (!existingClientName) {
        plan.push({
          company: item.company,
          action: "update clientName only",
          existingOrder: existing.order ?? "-",
          finalVisible: existing.visible ?? true,
          reason: `Match found for '${existing.company}' (id: ${existing.id}). ClientName is currently empty -> will set to '${item.clientName}'. Quote and order untouched.`,
        });
      } else {
        plan.push({
          company: item.company,
          action: "skip",
          existingOrder: existing.order ?? "-",
          finalVisible: existing.visible ?? true,
          reason: `Match found for '${existing.company}'. Already has clientName '${existing.clientName}' -> skip to prevent overwriting existing data.`,
        });
      }
    } else {
      nextOrder += 1;
      plan.push({
        company: item.company,
        action: "insert",
        existingOrder: `New (#${nextOrder})`,
        finalVisible: false,
        reason: `New partner -> insert with order: ${nextOrder}, rating: 5, visible: false (unpublished).`,
      });
    }
  }

  console.table(
    plan.map((p) => ({
      Company: p.company,
      Action: p.action,
      "Order / Assigned": p.existingOrder,
      "Final Visible": p.finalVisible,
    }))
  );

  console.log("\nDetails:");
  plan.forEach((p, idx) => {
    console.log(`  ${idx + 1}. [${p.action.toUpperCase()}] ${p.company} -> ${p.reason}`);
  });

  if (isDryRun) {
    console.log("\n🛡️ Dry-run completed safely. No database writes were performed.");
    await mongoose.disconnect();
    return;
  }

  // 4. Live execution (only reached if --execute was explicitly passed)
  console.log("\n🚨 Executing database writes...");
  let insertedCount = 0;
  let updatedCount = 0;

  for (const p of plan) {
    const item = SEED_TESTIMONIALS.find((s) => s.company === p.company)!;
    const norm = normalizeCompany(item.company);
    const existing = existingDocs.find((doc) => normalizeCompany(doc.company) === norm);

    if (p.action === "update clientName only" && existing) {
      await col.updateOne(
        { _id: existing._id },
        { $set: { clientName: item.clientName.trim() } }
      );
      updatedCount++;
      console.log(`  ✅ Updated clientName for '${existing.company}' -> '${item.clientName.trim()}'`);
    } else if (p.action === "insert") {
      const orderNum = typeof p.existingOrder === "string" ? parseInt(p.existingOrder.replace(/\D/g, ""), 10) : p.existingOrder;
      const newDoc = {
        id: `test-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        company: item.company.trim(),
        clientName: item.clientName.trim(),
        role: "",
        content: item.quote.trim(),
        avatar: "",
        rating: 5,
        order: orderNum,
        visible: false,
        focalX: 50,
        focalY: 50,
        zoom: 1,
        createdAt: new Date().toISOString(),
      };
      await col.insertOne(newDoc);
      insertedCount++;
      console.log(`  ✅ Inserted new unpublished testimonial for '${item.company}' (order: ${orderNum})`);
    }
  }

  console.log(`\n🎉 Execution complete: ${insertedCount} inserted, ${updatedCount} updated.`);
  await mongoose.disconnect();
}

if (require.main === module) {
  run().catch((err) => {
    console.error("Execution error:", err);
    process.exit(1);
  });
}
