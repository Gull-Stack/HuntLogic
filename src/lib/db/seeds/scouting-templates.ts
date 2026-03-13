// =============================================================================
// Scouting Templates Seed Data
// Run: npx tsx src/lib/db/seeds/scouting-templates.ts
// =============================================================================

import { db } from "@/lib/db";
import { appConfig } from "@/lib/db/schema";

const templates = [
  {
    namespace: "scouting",
    key: "gear.rifle_alpine",
    description: "Gear checklist for rifle hunting in alpine terrain",
    value: {
      items: [
        { id: "ra1", label: "Rifle (sighted in at 200-300 yards)", category: "weapon", required: true },
        { id: "ra2", label: "Ammunition (40+ rounds including practice)", category: "weapon", required: true },
        { id: "ra3", label: "Bipod or shooting sticks", category: "weapon", required: true },
        { id: "ra4", label: "Binoculars (10x42 recommended)", category: "optics", required: true },
        { id: "ra5", label: "Spotting scope (20-60x)", category: "optics", required: true },
        { id: "ra6", label: "Rangefinder", category: "optics", required: true },
        { id: "ra7", label: "GPS device or phone with offline maps", category: "navigation", required: true },
        { id: "ra8", label: "Compass + topo map as backup", category: "navigation", required: true },
        { id: "ra9", label: "Headlamp with extra batteries", category: "essentials", required: true },
        { id: "ra10", label: "Multi-tool/knife set", category: "essentials", required: true },
        { id: "ra11", label: "Game bags (lightweight, breathable)", category: "processing", required: true },
        { id: "ra12", label: "Skinning/caping knives", category: "processing", required: true },
        { id: "ra13", label: "Pack frame (70L+ capacity)", category: "packing", required: true },
        { id: "ra14", label: "Layering system: merino base, insulated mid, shell outer", category: "clothing", required: true },
        { id: "ra15", label: "Insulated hunting boots (rated to 0°F)", category: "clothing", required: true },
        { id: "ra16", label: "Gaiters", category: "clothing", required: true },
        { id: "ra17", label: "Rain gear (jacket + pants)", category: "clothing", required: true },
        { id: "ra18", label: "Gloves (2 pairs: liner + insulated)", category: "clothing", required: true },
        { id: "ra19", label: "First aid kit (SAM splint, tourniquet, blister kit)", category: "safety", required: true },
        { id: "ra20", label: "Water purification (filter or tablets)", category: "hydration", required: true },
        { id: "ra21", label: "Emergency shelter (bivy/tarp)", category: "safety", required: true, notes: "In case you get caught out overnight" },
        { id: "ra22", label: "Fire starting kit (lighter + ferro rod)", category: "safety", required: true },
        { id: "ra23", label: "Trekking poles", category: "mobility", required: false, notes: "Essential above 10,000 ft" },
        { id: "ra24", label: "Bear spray (if in grizzly country)", category: "safety", required: false },
      ],
    },
  },
  {
    namespace: "scouting",
    key: "gear.archery_timber",
    description: "Gear checklist for archery hunting in timber terrain",
    value: {
      items: [
        { id: "at1", label: "Bow (tuned and paper-tested)", category: "weapon", required: true },
        { id: "at2", label: "Arrows (12+ with broadheads)", category: "weapon", required: true },
        { id: "at3", label: "Extra broadheads (3+ practice, 6+ hunting)", category: "weapon", required: true },
        { id: "at4", label: "Bow-mounted quiver", category: "weapon", required: true },
        { id: "at5", label: "String wax and spare string", category: "weapon", required: true },
        { id: "at6", label: "Rangefinder (angle-compensating)", category: "optics", required: true },
        { id: "at7", label: "Binoculars (8x42 for timber)", category: "optics", required: true },
        { id: "at8", label: "Cow elk calls / bugles", category: "calling", required: true, notes: "Practice before the hunt" },
        { id: "at9", label: "Diaphragm calls (3+ varieties)", category: "calling", required: true },
        { id: "at10", label: "Scent elimination spray", category: "concealment", required: true },
        { id: "at11", label: "Camo face paint or mask", category: "concealment", required: true },
        { id: "at12", label: "Tree stand or saddle (where legal)", category: "setup", required: false },
        { id: "at13", label: "Ground blind", category: "setup", required: false },
        { id: "at14", label: "Quiet clothing (soft fleece/wool)", category: "clothing", required: true },
        { id: "at15", label: "Rubber-soled boots (scent-free)", category: "clothing", required: true },
        { id: "at16", label: "Game bags", category: "processing", required: true },
        { id: "at17", label: "Skinning knives", category: "processing", required: true },
        { id: "at18", label: "GPS with offline maps", category: "navigation", required: true },
        { id: "at19", label: "Headlamp (red light mode)", category: "essentials", required: true },
        { id: "at20", label: "First aid kit", category: "safety", required: true },
      ],
    },
  },
  {
    namespace: "scouting",
    key: "gear.muzzleloader_prairie",
    description: "Gear checklist for muzzleloader hunting in prairie/desert terrain",
    value: {
      items: [
        { id: "mp1", label: "Muzzleloader (sighted in at 100-150 yards)", category: "weapon", required: true },
        { id: "mp2", label: "Powder charges (30+ pre-measured)", category: "weapon", required: true },
        { id: "mp3", label: "Bullets/sabots (20+)", category: "weapon", required: true },
        { id: "mp4", label: "Primers (50+)", category: "weapon", required: true },
        { id: "mp5", label: "Cleaning supplies (solvent, patches, rod)", category: "weapon", required: true },
        { id: "mp6", label: "Waterproof storage for powder", category: "weapon", required: true },
        { id: "mp7", label: "Binoculars (10x42 or 12x50)", category: "optics", required: true },
        { id: "mp8", label: "Spotting scope", category: "optics", required: true },
        { id: "mp9", label: "Rangefinder", category: "optics", required: true },
        { id: "mp10", label: "Shooting sticks or tripod", category: "weapon", required: true },
        { id: "mp11", label: "Sun protection (hat, sunscreen, sunglasses)", category: "clothing", required: true },
        { id: "mp12", label: "Lightweight breathable clothing", category: "clothing", required: true },
        { id: "mp13", label: "Snake boots or gaiters", category: "clothing", required: false, notes: "Depending on region" },
        { id: "mp14", label: "Extra water capacity (3L+)", category: "hydration", required: true },
        { id: "mp15", label: "Game bags (breathable for warm temps)", category: "processing", required: true },
        { id: "mp16", label: "Ice/cooler in vehicle", category: "processing", required: true, notes: "Essential in warm weather" },
        { id: "mp17", label: "GPS with offline maps", category: "navigation", required: true },
        { id: "mp18", label: "First aid kit (include snake bite kit)", category: "safety", required: true },
      ],
    },
  },
  {
    namespace: "scouting",
    key: "physical.alpine",
    description: "Physical training plan for alpine hunting",
    value: {
      items: [
        { id: "pa1", label: "Start training 12 weeks before hunt", category: "timeline", required: true },
        { id: "pa2", label: "Cardio: 4-5 days/week — running, stair climber, incline treadmill", category: "cardio", required: true, notes: "Build to 45-60 min sessions" },
        { id: "pa3", label: "Weighted pack hikes: 2x/week — start 30lb, build to 60lb", category: "strength", required: true, notes: "Find hilly terrain, simulate hunt conditions" },
        { id: "pa4", label: "Leg work: squats, lunges, step-ups, Bulgarian splits — 3x/week", category: "strength", required: true },
        { id: "pa5", label: "Core: planks, dead bugs, farmer carries — every session", category: "strength", required: true },
        { id: "pa6", label: "Upper body: rows, pullups, shoulder press for pack carrying", category: "strength", required: true },
        { id: "pa7", label: "Altitude simulation: if possible, sleep in altitude tent", category: "altitude", required: false, notes: "Or plan to arrive 2 days early" },
        { id: "pa8", label: "Shooting practice: 3x/week at varied distances, positions, and conditions", category: "shooting", required: true },
        { id: "pa9", label: "Practice shooting with elevated heart rate", category: "shooting", required: true, notes: "Run 50 yards then shoot to simulate field conditions" },
      ],
    },
  },
  {
    namespace: "scouting",
    key: "physical.prairie",
    description: "Physical training plan for prairie/flatland hunting",
    value: {
      items: [
        { id: "pp1", label: "Start training 8 weeks before hunt", category: "timeline", required: true },
        { id: "pp2", label: "Cardio: 3-4 days/week — walking, light jogging, cycling", category: "cardio", required: true, notes: "Build to 30-45 min sessions" },
        { id: "pp3", label: "Leg endurance: long walks, standing desk, calf raises", category: "strength", required: true, notes: "Prairie hunts mean lots of walking and glassing" },
        { id: "pp4", label: "Core: planks, sits — for steady shooting posture", category: "strength", required: true },
        { id: "pp5", label: "Shooting practice: 2-3x/week including long-range (300+ yards)", category: "shooting", required: true },
        { id: "pp6", label: "Practice shooting from prone, sitting, and kneeling positions", category: "shooting", required: true },
        { id: "pp7", label: "Practice with wind: shoot on windy days to learn wind reading", category: "shooting", required: false },
      ],
    },
  },
  {
    namespace: "scouting",
    key: "timeline.western_elk",
    description: "Scouting timeline for western elk hunting",
    value: {
      items: [
        { id: "we1", label: "6 months out: study maps, identify 3-5 target areas", category: "planning", required: true, notes: "Use satellite imagery to find meadows, timber edges, water" },
        { id: "we2", label: "4 months out: research unit harvest stats and draw odds", category: "research", required: true },
        { id: "we3", label: "3 months out: contact local biologist for herd reports", category: "intel", required: false },
        { id: "we4", label: "2 months out: set trail cameras on water/wallows (if legal)", category: "field", required: false },
        { id: "we5", label: "6 weeks out: pre-season scouting trip if possible", category: "field", required: false, notes: "Glass from vantage points, check access roads" },
        { id: "we6", label: "4 weeks out: check trail cam images, refine target areas", category: "field", required: false },
        { id: "we7", label: "2 weeks out: verify road conditions and access points", category: "access", required: true },
        { id: "we8", label: "1 week out: final gear check, test all equipment", category: "prep", required: true },
        { id: "we9", label: "2 days out: arrive and scout, glass morning/evening", category: "field", required: true, notes: "Locate animals and plan hunt day approach" },
      ],
    },
  },
  {
    namespace: "scouting",
    key: "timeline.whitetail",
    description: "Scouting timeline for whitetail deer hunting",
    value: {
      items: [
        { id: "wt1", label: "Spring: walk properties, find shed antlers, identify bedding areas", category: "field", required: false },
        { id: "wt2", label: "Summer: set trail cameras on food sources", category: "field", required: true },
        { id: "wt3", label: "2 months out: identify travel corridors between bedding and food", category: "field", required: true },
        { id: "wt4", label: "6 weeks out: hang stands or set ground blind sites", category: "setup", required: true, notes: "Let stands sit to reduce scent pressure" },
        { id: "wt5", label: "4 weeks out: review camera data, pattern target bucks", category: "intel", required: true },
        { id: "wt6", label: "2 weeks out: trim shooting lanes (minimal disturbance)", category: "setup", required: false },
        { id: "wt7", label: "1 week out: check wind patterns for stand selection", category: "planning", required: true },
        { id: "wt8", label: "Day before: set entry/exit routes to minimize scent", category: "field", required: true },
      ],
    },
  },
];

export async function seedScoutingTemplates() {
  console.log("[seed] Seeding scouting templates...");

  for (const template of templates) {
    await db
      .insert(appConfig)
      .values(template)
      .onConflictDoUpdate({
        target: [appConfig.namespace, appConfig.key],
        set: {
          value: template.value,
          description: template.description,
          updatedAt: new Date(),
        },
      });
  }

  console.log(`[seed] Seeded ${templates.length} scouting templates`);
}
