/**
 * SkilledSphere — batch asset generation (portraits + editorial covers).
 * Run: bun scripts/generate-images.ts
 */
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";

const OUT_ROOT = path.join(process.cwd(), "public", "images");
const PORTRAIT_DIR = path.join(OUT_ROOT, "portraits");
const COVER_DIR = path.join(OUT_ROOT, "covers");

const PORTRAIT_STYLE =
  "premium editorial portrait photograph, dignified confident expression, dark navy blue studio background, soft cinematic rim lighting, shallow depth of field, professional magazine photography, high quality, detailed";

const portraits: { file: string; prompt: string }[] = [
  { file: "amara-okafor.png", prompt: "Editorial portrait of a distinguished Kenyan woman in her mid-40s, AI research scientist, natural short curly hair, elegant navy blazer with subtle gold earrings" },
  { file: "elena-vasquez.png", prompt: "Editorial portrait of a Spanish woman in her late 30s, quantum computing researcher, dark wavy hair past shoulders, minimalist charcoal blazer, thoughtful expression" },
  { file: "kenji-watanabe.png", prompt: "Editorial portrait of a Japanese man in his mid-50s, robotics engineer, glasses with thin frames, grey-streaked hair, dark turtleneck and suit jacket, calm expression" },
  { file: "sofia-lindqvist.png", prompt: "Editorial portrait of a Swedish woman in her late 30s, blonde hair in a low bun, biomedical engineer, light grey tailored blazer over white top" },
  { file: "michael-chen.png", prompt: "Editorial portrait of a Chinese-American man in his mid-40s, venture capital investor, short neat black hair, charcoal three-piece suit with no tie, confident subtle smile" },
  { file: "priya-sharma.png", prompt: "Editorial portrait of an Indian woman in her mid-30s, data science entrepreneur, long dark hair, teal silk blouse, small gold studs, warm confident smile" },
  { file: "james-oneill.png", prompt: "Editorial portrait of a British man in his early 50s, cybersecurity expert, short greying hair, trimmed beard, dark navy suit with white shirt, serious composed expression" },
  { file: "isabelle-moreau.png", prompt: "Editorial portrait of a French woman in her early 40s, product design director, chic shoulder-length brown hair, black turtleneck with structured cream blazer, elegant parisian style" },
  { file: "lukas-weber.png", prompt: "Editorial portrait of a German man in his late 30s, software engineering leader, short brown hair, light stubble, slate grey henley shirt under dark jacket, approachable expression" },
  { file: "anna-keller.png", prompt: "Editorial portrait of a Swiss woman in her early 50s, economist and finance leader, sleek silver-blonde bob, pearl necklace with deep navy suit, composed authority" },
  { file: "daniel-kim.png", prompt: "Editorial portrait of a Korean man in his mid-30s, computer vision researcher, modern styled black hair, round thin glasses, minimal black jacket over grey tee" },
  { file: "sarah-mitchell.png", prompt: "Editorial portrait of a Canadian woman in her mid-40s, healthcare technology CEO, shoulder-length auburn hair, burgundy blouse under tailored cream blazer, confident warm expression" },
  { file: "lucas-ferreira.png", prompt: "Editorial portrait of a Brazilian man in his mid-30s, agtech founder, dark curly hair, light beard, olive linen shirt with dark blazer, energetic confident smile" },
  { file: "aisha-al-mansouri.png", prompt: "Editorial portrait of an Emirati woman in her late 30s, fintech executive, elegant dark hijab, tailored beige blazer with subtle gold bracelet, poised expression" },
  { file: "wei-zhang.png", prompt: "Editorial portrait of a Singaporean Chinese woman in her mid-40s, deep-tech investor, sleek black hair in a low ponytail, ivory mandarin-collar jacket, composed thoughtful expression" },
  { file: "oliver-bennett.png", prompt: "Editorial portrait of an Australian man in his mid-40s, sustainable architect, tousled light brown hair, stubble, indigo workshirt with rolled sleeves, relaxed confident look" },
  { file: "fatima-el-sayed.png", prompt: "Editorial portrait of an Egyptian woman in her early 40s, medical innovation leader, dark hair tucked in a smart hijab, white clinical coat over navy dress, caring professional expression" },
  { file: "emma-van-der-berg.png", prompt: "Editorial portrait of a Dutch woman in her late 30s, biotech scientist, blonde hair loose to shoulders, minimal white lab coat over grey top, bright intelligent expression" },
  { file: "david-cohen.png", prompt: "Editorial portrait of an Israeli man in his mid-40s, cybersecurity founder, short dark hair with grey at temples, close-cropped beard, black crew-neck sweater with dark blazer, intense focused gaze" },
  { file: "chidi-okonkwo.png", prompt: "Editorial portrait of a Nigerian man in his mid-50s, medical doctor and health innovator, short greying hair, rectangular glasses, deep navy suit with pocket square, dignified warm expression" },
  { file: "rachel-goldstein.png", prompt: "Editorial portrait of an American woman in her early 30s, genomics researcher, long straight brown hair, simple dark green blouse, small stud earrings, curious analytic expression" },
  { file: "wanjiru-kamau.png", prompt: "Editorial portrait of a young Kenyan woman in her late 20s, social entrepreneurship founder, braided hair pulled back, mustard yellow top with denim jacket, bright optimistic smile" },
  { file: "henrik-larsen.png", prompt: "Editorial portrait of a Danish man in his mid-50s, renewable energy executive, short silver-blond hair, clean shaven, forest green quarter-zip under charcoal blazer, steady nordic composure" },
  { file: "alejandra-cruz.png", prompt: "Editorial portrait of a Mexican woman in her mid-40s, industrial manufacturing executive, dark hair in an elegant updo, rust-orange blouse under black blazer, assured expression" },
];

const coverStyle =
  "premium editorial magazine cover photography, cinematic composition, deep navy and champagne gold tones, sophisticated, high quality, detailed, no text";

const covers: { file: string; prompt: string; size: string }[] = [
  { file: "story-quantum.png", prompt: "Abstract photograph of a futuristic quantum computer core, golden chandelier-like structure of wires and discs suspended in dark navy cryostat", size: "1344x768" },
  { file: "story-ai-medicine.png", prompt: "Moody photograph of a researcher silhouette examining glowing medical hologram data in a dark laboratory, navy and amber light", size: "1344x768" },
  { file: "story-robotics.png", prompt: "Cinematic close-up of an elegant white robotic arm hand reaching toward light in a dark studio, dramatic chiaroscuro", size: "1344x768" },
  { file: "story-leadership.png", prompt: "Photograph of a confident executive standing at a floor-to-ceiling window of a skyscraper office at dusk overlooking a glowing city, back view with strong posture", size: "1344x768" },
  { file: "story-fintech.png", prompt: "Macro photograph of gold coins and circuit board merging with flowing data light streams on dark navy background", size: "1344x768" },
  { file: "story-energy.png", prompt: "Photograph of offshore wind turbines in golden mist at dawn, calm sea, cinematic minimalism", size: "1344x768" },
  { file: "story-design.png", prompt: "Photograph of a minimalist architect studio with models, drafting tools and warm light on dark walls, crafted elegant atmosphere", size: "1344x768" },
  { file: "story-founders.png", prompt: "Cinematic photograph of two startup founders walking through a moody industrial loft office, motion and determination, navy tones", size: "1344x768" },
  { file: "collection-30u30.png", prompt: "Elegant abstract composition of champagne gold light streaks rising diagonally across deep midnight navy, dynamic and young energy, minimal luxury", size: "1152x864" },
  { file: "collection-ai-leaders.png", prompt: "Abstract neural network constellation of golden nodes and fine lines over dark navy globe silhouette, premium and futuristic", size: "1152x864" },
  { file: "collection-women-leaders.png", prompt: "Fine-art photograph of golden light through grand marble architecture columns, dignified and powerful, dark shadows and warm gold", size: "1152x864" },
  { file: "collection-innovators.png", prompt: "Abstract macro photograph of crystalline structures growing with gold and deep blue refractions, innovation metaphor, luxury editorial", size: "1152x864" },
];

async function main() {
  // Sharding support: bun scripts/generate-images.ts <shard> <totalShards>
  const shard = parseInt(process.argv[2] ?? "0", 10);
  const shards = parseInt(process.argv[3] ?? "1", 10);
  const inShard = (i: number) => i % shards === shard;

  fs.mkdirSync(PORTRAIT_DIR, { recursive: true });
  fs.mkdirSync(COVER_DIR, { recursive: true });
  const zai = await ZAI.create();

  const skip = new Set<string>();
  for (const p of portraits) {
    const out = path.join(PORTRAIT_DIR, p.file);
    if (fs.existsSync(out) && fs.statSync(out).size > 10000) skip.add(p.file);
  }
  for (const c of covers) {
    const out = path.join(COVER_DIR, c.file);
    if (fs.existsSync(out) && fs.statSync(out).size > 10000) skip.add(c.file);
  }

  let done = 0;
  const total = portraits.length + covers.length - skip.size;

  for (const [idx, p] of portraits.entries()) {
    const out = path.join(PORTRAIT_DIR, p.file);
    if (skip.has(p.file) || !inShard(idx)) continue;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await zai.images.generations.create({
          prompt: `${p.prompt}, ${PORTRAIT_STYLE}`,
          size: "864x1152",
        });
        const b64 = res.data?.[0]?.base64;
        if (!b64) throw new Error("empty response");
        fs.writeFileSync(out, Buffer.from(b64, "base64"));
        done++; console.log(`[${done}/${total}] portrait ${p.file}`);
        break;
      } catch (e) {
        const msg = (e as Error).message;
        console.error(`attempt ${attempt} failed for ${p.file}:`, msg);
        if (attempt === 3) console.error(`GIVING UP on ${p.file}`);
        else await new Promise((r) => setTimeout(r, msg.includes("429") ? 20000 * attempt : 1500 * attempt));
      }
    }
  }

  for (const [idx, c] of covers.entries()) {
    const out = path.join(COVER_DIR, c.file);
    if (skip.has(c.file) || !inShard(idx + portraits.length)) continue;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await zai.images.generations.create({
          prompt: `${c.prompt}, ${coverStyle}`,
          size: c.size as never,
        });
        const b64 = res.data?.[0]?.base64;
        if (!b64) throw new Error("empty response");
        fs.writeFileSync(out, Buffer.from(b64, "base64"));
        done++; console.log(`[${done}/${total}] cover ${c.file}`);
        break;
      } catch (e) {
        const msg = (e as Error).message;
        console.error(`attempt ${attempt} failed for ${c.file}:`, msg);
        if (attempt === 3) console.error(`GIVING UP on ${c.file}`);
        else await new Promise((r) => setTimeout(r, msg.includes("429") ? 20000 * attempt : 1500 * attempt));
      }
    }
  }

  console.log(`DONE. ${done} images generated.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
