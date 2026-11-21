/**
 * SkilledSphere — database seed with realistic international sample data.
 * Run: bun prisma/seed.ts
 */
import { PrismaClient } from "@prisma/client";
import worldCountries from "world-countries";

const db = new PrismaClient();

const COUNTRY_CODES = ["US","GB","DE","FR","CA","JP","SG","AU","CH","IN","BR","KR","NL","SE","KE","AE","NG","IL","ES","EG","DK","MX"] as const;
type Code = (typeof COUNTRY_CODES)[number];

const wc = worldCountries as Array<{ cca2: string; name: { common: string }; flag: string; latlng: [number, number] }>;
const byCode = new Map(wc.map((c) => [c.cca2, c]));

function countryInfo(code: Code) {
  const c = byCode.get(code);
  if (!c) throw new Error(`Unknown country code ${code}`);
  return { code, name: c.name.common, flag: c.flag, latitude: c.latlng[0], longitude: c.latlng[1] };
}

async function main() {
  console.log("Seeding SkilledSphere…");

  // wipe in dependency order
  await db.featuredSchedule.deleteMany();
  await db.featuredApplication.deleteMany();
  await db.storyExpertise.deleteMany();
  await db.storyProfessional.deleteMany();
  await db.story.deleteMany();
  await db.collectionMember.deleteMany();
  await db.collection.deleteMany();
  await db.professionalIndustry.deleteMany();
  await db.professionalExpertise.deleteMany();
  await db.professional.deleteMany();
  await db.expertise.deleteMany();
  await db.industry.deleteMany();
  await db.country.deleteMany();

  // ---------- Countries ----------
  const countries: Record<Code, { id: string }> = {} as never;
  for (const code of COUNTRY_CODES) {
    const info = countryInfo(code);
    const row = await db.country.create({ data: info });
    (countries as never as Record<string, { id: string }>)[code] = { id: row.id };
  }

  // ---------- Expertise ----------
  const expertiseDefs: {
    slug: string; name: string; cluster: string; description: string; parent?: string; order: number;
  }[] = [
    { slug: "artificial-intelligence", name: "Artificial Intelligence", cluster: "Technology", description: "Building intelligent systems that perceive, reason, and act — from foundation models to applied AI products.", order: 1 },
    { slug: "machine-learning", name: "Machine Learning", cluster: "Technology", description: "Statistical learning systems, deep learning architectures, and large-scale model training.", parent: "artificial-intelligence", order: 2 },
    { slug: "computer-vision", name: "Computer Vision", cluster: "Technology", description: "Machines that see: visual recognition, scene understanding, and multimodal perception.", parent: "artificial-intelligence", order: 3 },
    { slug: "natural-language-processing", name: "Natural Language Processing", cluster: "Technology", description: "Language understanding, generation, and translation at scale.", parent: "artificial-intelligence", order: 4 },
    { slug: "data-science", name: "Data Science", cluster: "Technology", description: "Extracting insight and decisions from complex, large-scale data.", order: 5 },
    { slug: "software-engineering", name: "Software Engineering", cluster: "Technology", description: "Designing and operating resilient, large-scale software systems.", order: 6 },
    { slug: "cybersecurity", name: "Cybersecurity", cluster: "Technology", description: "Defending digital infrastructure, data, and trust at global scale.", order: 7 },
    { slug: "robotics", name: "Robotics", cluster: "Technology", description: "Autonomous machines, precision manipulation, and human-robot collaboration.", order: 8 },
    { slug: "quantum-computing", name: "Quantum Computing", cluster: "Technology", description: "Quantum processors, error correction, and the future of computation.", order: 9 },
    { slug: "entrepreneurship", name: "Entrepreneurship", cluster: "Business", description: "Founding and scaling ventures from idea to global impact.", order: 10 },
    { slug: "business-strategy", name: "Business Strategy", cluster: "Business", description: "Positioning, growth architecture, and long-horizon competitive thinking.", order: 11 },
    { slug: "executive-leadership", name: "Executive Leadership", cluster: "Business", description: "Leading organizations through growth, transformation, and change.", order: 12 },
    { slug: "venture-capital", name: "Venture Capital", cluster: "Business", description: "Backing exceptional founders and shaping technology markets.", order: 13 },
    { slug: "management", name: "Management", cluster: "Business", description: "Building teams, systems, and cultures that perform.", order: 14 },
    { slug: "biomedical-engineering", name: "Biomedical Engineering", cluster: "Science & Research", description: "Engineering at the intersection of medicine, biology, and devices.", order: 15 },
    { slug: "biotechnology", name: "Biotechnology", cluster: "Science & Research", description: "Harnessing biology to treat disease and transform industry.", order: 16 },
    { slug: "scientific-research", name: "Scientific Research", cluster: "Science & Research", description: "Rigorous inquiry that expands the frontier of knowledge.", order: 17 },
    { slug: "medical-innovation", name: "Medical Innovation", cluster: "Science & Research", description: "Novel therapies, diagnostics, and health systems innovation.", order: 18 },
    { slug: "sustainable-energy", name: "Sustainable Energy", cluster: "Science & Research", description: "Clean power generation, storage, and the energy transition.", order: 19 },
    { slug: "product-design", name: "Product Design", cluster: "Creative", description: "Crafting products people love with clarity and intent.", order: 20 },
    { slug: "ux-ui-design", name: "UX/UI Design", cluster: "Creative", description: "Human-centered interfaces and digital experiences.", order: 21 },
    { slug: "architecture", name: "Architecture", cluster: "Creative", description: "Designing spaces and structures for how people live and work.", order: 22 },
    { slug: "digital-creativity", name: "Digital Creativity", cluster: "Creative", description: "Interactive media, brand worlds, and creative technology.", order: 23 },
    { slug: "investment", name: "Investment", cluster: "Finance", description: "Capital allocation across public and private markets.", order: 24 },
    { slug: "financial-analysis", name: "Financial Analysis", cluster: "Finance", description: "Valuation, risk, and rigorous financial judgment.", order: 25 },
    { slug: "economics", name: "Economics", cluster: "Finance", description: "Understanding markets, policy, and economic systems.", order: 26 },
    { slug: "fintech", name: "Fintech", cluster: "Finance", description: "Technology reshaping payments, lending, and financial services.", order: 27 },
  ];
  const expIds: Record<string, string> = {};
  for (const def of expertiseDefs) {
    const { parent, ...data } = def;
    const row = await db.expertise.create({
      data: { ...data, parentId: parent ? expIds[parent] : null },
    });
    expIds[def.slug] = row.id;
  }

  // ---------- Industries ----------
  const industryDefs: { slug: string; name: string; description: string }[] = [
    { slug: "technology", name: "Technology", description: "Software, AI, cloud, and the infrastructure of the digital world." },
    { slug: "healthcare", name: "Healthcare", description: "Medicine, biotech, and the future of human health." },
    { slug: "finance", name: "Finance", description: "Banking, capital markets, insurance, and fintech." },
    { slug: "education", name: "Education", description: "Learning, universities, and human capital development." },
    { slug: "engineering", name: "Engineering", description: "Industrial, mechanical, and systems engineering at scale." },
    { slug: "energy", name: "Energy", description: "Power generation, renewables, and the global energy transition." },
    { slug: "manufacturing", name: "Manufacturing", description: "Advanced manufacturing, robotics, and industrial supply chains." },
    { slug: "media", name: "Media", description: "Publishing, entertainment, and the creator economy." },
    { slug: "science", name: "Science", description: "Fundamental and applied research institutions." },
    { slug: "consulting", name: "Consulting", description: "Strategy, advisory, and professional services." },
    { slug: "architecture", name: "Architecture", description: "Built environment, design studios, and urbanism." },
    { slug: "entrepreneurship", name: "Entrepreneurship", description: "Startups, venture building, and early-stage ecosystems." },
  ];
  const indIds: Record<string, string> = {};
  for (const [i, def] of industryDefs.entries()) {
    const row = await db.industry.create({ data: { ...def, order: i } });
    indIds[def.slug] = row.id;
  }

  // ---------- Professionals ----------
  type ProfSeed = {
    slug: string; fullName: string; professionalTitle: string; city: string; countryCode: Code;
    organization?: string; summary: string; biography: string[];
    achievements: string[]; expertise: string[]; industries: string[];
    experience: { role: string; org: string; period: string; description: string }[];
    education: { degree: string; institution: string; year: string }[];
    projects?: { name: string; description: string; year: string }[];
    publications?: { title: string; venue: string; year: string }[];
    awards?: { title: string; org: string; year: string }[];
    links: { label: string; url: string }[];
  };

  const profs: ProfSeed[] = [
    {
      slug: "amara-okafor", fullName: "Dr. Amara Okafor", professionalTitle: "Chief AI Scientist & Director of Machine Intelligence Research",
      city: "Nairobi", countryCode: "KE", organization: "Africa Institute for Intelligent Systems",
      summary: "One of Africa's most cited AI researchers, leading work on low-resource language models and AI for public health across the continent.",
      biography: [
        "Amara Okafor grew up in Lagos and Nairobi, teaching herself to program on a borrowed laptop before earning a doctorate in machine learning at ETH Zürich. Her doctoral thesis on efficient multilingual models became foundational reading for researchers building AI outside the English-speaking world.",
        "After a decade leading research labs in Europe, she returned to Nairobi to found the Africa Institute for Intelligent Systems, now a hub for over 120 researchers working on problems from epidemic forecasting to agricultural intelligence. Her team's open models are used by health ministries in eleven countries.",
        "She advises the African Union on AI policy, sits on the editorial board of a leading machine learning journal, and remains a relentless advocate for the idea that the next decade of AI breakthroughs will come from everywhere, not just Silicon Valley."
      ],
      achievements: ["Named one of the 100 most influential people in AI research", "Built open multilingual models deployed by health systems in 11 countries", "Founded a research institute now employing 120+ scientists"],
      expertise: ["artificial-intelligence", "machine-learning", "natural-language-processing", "scientific-research"],
      industries: ["technology", "science"],
      experience: [
        { role: "Chief AI Scientist & Director", org: "Africa Institute for Intelligent Systems", period: "2019 – Present", description: "Leads a pan-African research agenda across language technology, health AI, and scientific machine learning." },
        { role: "Principal Researcher", org: "DeepMind (London)", period: "2014 – 2019", description: "Worked on multilingual representation learning and efficient model architectures." },
        { role: "Research Scientist", org: "IBM Research Africa", period: "2011 – 2014", description: "Pioneered early mobile-first machine learning systems for East African markets." },
      ],
      education: [
        { degree: "PhD, Machine Learning", institution: "ETH Zürich", year: "2011" },
        { degree: "BSc, Computer Science", institution: "University of Nairobi", year: "2006" },
      ],
      publications: [
        { title: "Low-Resource Language Models for the World's Majority Languages", venue: "Journal of Machine Learning Research", year: "2022" },
        { title: "Epidemic Forecasting with Sparse Health System Data", venue: "Nature Machine Intelligence", year: "2020" },
      ],
      awards: [
        { title: "AI Researcher of the Year", org: "Global AI Society", year: "2023" },
        { title: "Ethel Newbold Prize for Data Science", org: "International Statistics Institute", year: "2021" },
      ],
      links: [
        { label: "LinkedIn", url: "https://linkedin.com/in/amara-okafor" },
        { label: "Research Profile", url: "https://research.skilledsphere.dev/amara-okafor" },
        { label: "Personal Website", url: "https://amaraokafor.africa" },
      ],
    },
    {
      slug: "elena-vasquez", fullName: "Dr. Elena Vásquez", professionalTitle: "Quantum Computing Research Lead",
      city: "Barcelona", countryCode: "ES", organization: "Institute of Photonic Sciences (ICFO)",
      summary: "Physicist leading Europe's most promising quantum error-correction program, turning fragile qubits into reliable computation.",
      biography: [
        "Elena Vásquez entered quantum physics through an unlikely door — a high-school astronomy club in Valencia — and never left. Her doctorate at ICFO produced some of the first demonstrations of logical qubit operations with trapped ions, work now cited in nearly every serious roadmap toward fault-tolerant quantum computing.",
        "Today she leads a 40-person team in Barcelona pursuing the unglamorous but decisive problem of the field: keeping quantum information alive long enough to be useful. Her group's error-correcting codes have been adopted by three national laboratories.",
        "She is a gifted communicator of difficult science, known for making quantum mechanics legible to rooms full of executives and policymakers without ever overselling the timeline."
      ],
      achievements: ["First demonstration of a logical qubit beating its best physical component", "EU Quantum Flagship project lead (€14M program)", "Mentored 12 doctoral researchers now in leading labs worldwide"],
      expertise: ["quantum-computing", "scientific-research"],
      industries: ["science", "technology"],
      experience: [
        { role: "Quantum Computing Research Lead", org: "ICFO, Barcelona", period: "2018 – Present", description: "Leads the trapped-ion error correction group and its European collaborations." },
        { role: "Postdoctoral Fellow", org: "University of Innsbruck", period: "2014 – 2018", description: "Quantum logic gates with individual ion addressing." },
      ],
      education: [
        { degree: "PhD, Quantum Physics", institution: "ICFO – The Institute of Photonic Sciences", year: "2014" },
        { degree: "MSc, Theoretical Physics", institution: "University of Valencia", year: "2010" },
      ],
      publications: [
        { title: "Fault-Tolerant Logical Operations with Trapped-Ion Qubits", venue: "Physical Review X", year: "2023" },
        { title: "Surface Codes Under Realistic Noise", venue: "Nature Physics", year: "2019" },
      ],
      awards: [{ title: "EPS Quantum Electronics Prize", org: "European Physical Society", year: "2024" }],
      links: [
        { label: "LinkedIn", url: "https://linkedin.com/in/elena-vasquez" },
        { label: "Research Profile", url: "https://research.skilledsphere.dev/elena-vasquez" },
      ],
    },
    {
      slug: "kenji-watanabe", fullName: "Kenji Watanabe", professionalTitle: "Chief Robotics Engineer",
      city: "Tokyo", countryCode: "JP", organization: "Advanced Manufacturing Laboratory",
      summary: "Master roboticist behind a generation of precision assembly robots now used in half the world's smartphone factories.",
      biography: [
        "Kenji Watanabe spent his first decade as an engineer building factory automation in Nagoya, where he developed an obsession with the last millimeter — the tiny, reliable motions that separate good robots from great ones. His patents in force-control manipulation became the quiet backbone of modern electronics assembly.",
        "At the Advanced Manufacturing Laboratory in Tokyo he now leads a team of 85 engineers building humanoid-adjacent robots for Elderly care — a project born from watching his own parents age in a country short of caregivers.",
        "Colleagues describe him as an engineer's engineer: suspicious of hype, devoted to craftsmanship, and famous for keeping a 30-year-old prototype arm in his office as a reminder that good ideas take time."
      ],
      achievements: ["Holds 47 patents in force-controlled robotic manipulation", "His assembly robots are deployed in 60% of global smartphone production lines", "Led Japan's national project on eldercare robotics"],
      expertise: ["robotics", "software-engineering", "management"],
      industries: ["engineering", "manufacturing"],
      experience: [
        { role: "Chief Robotics Engineer", org: "Advanced Manufacturing Laboratory", period: "2012 – Present", description: "Leads robotics R&D across industrial automation and assistive care." },
        { role: "Senior Engineer", org: "Fanuc Corporation", period: "1998 – 2012", description: "Developed force-feedback control systems for precision assembly." },
      ],
      education: [
        { degree: "MEng, Mechanical Engineering", institution: "University of Tokyo", year: "1998" },
        { degree: "BEng, Mechatronics", institution: "Nagoya Institute of Technology", year: "1996" },
      ],
      projects: [
        { name: "Project Aya", description: "Eldercare assistive robot now in trials at 40 Japanese care homes.", year: "2024" },
        { name: "MicroMate", description: "Sub-millimeter precision assembly platform for electronics manufacturing.", year: "2017" },
      ],
      awards: [
        { title: "Medal of Honor with Purple Ribbon (Japan)", org: "Government of Japan", year: "2022" },
        { title: "IEEE Robotics Pioneer Award", org: "IEEE", year: "2019" },
      ],
      links: [
        { label: "LinkedIn", url: "https://linkedin.com/in/kenji-watanabe" },
        { label: "Laboratory Website", url: "https://aml.tokyo/watanabe" },
      ],
    },
    {
      slug: "sofia-lindqvist", fullName: "Dr. Sofia Lindqvist", professionalTitle: "Principal Biomedical Engineer",
      city: "Stockholm", countryCode: "SE", organization: "Karolinska Institute",
      summary: "Biomedical engineer whose implantable sensor technologies are redefining how chronic disease is monitored.",
      biography: [
        "Sofia Lindqvist trained as an electrical engineer in Lund before medicine captured her — or more precisely, before she captured medicine's unsolved engineering problems. At Karolinska she developed biocompatible micro-sensors that can live inside the human body for years, continuously reporting data that patients once had to travel to hospitals to collect.",
        "Her spinoff company, acquired in 2021, put those sensors into more than 30,000 patients with cardiovascular disease. She returned to research full-time to chase the next frontier: fully biodegradable implants that dissolve when their work is done.",
        "She splits her week between the lab and Sweden's national medical-ethics council, where she argues that engineers must design for consent and dignity, not just capability."
      ],
      achievements: ["Invented long-lived biocompatible sensors implanted in 30,000+ patients", "Founded and exited a medtech company (acquired 2021)", "Elected to Sweden's national medical-ethics council"],
      expertise: ["biomedical-engineering", "medical-innovation", "scientific-research"],
      industries: ["healthcare", "engineering"],
      experience: [
        { role: "Principal Biomedical Engineer", org: "Karolinska Institute", period: "2015 – Present", description: "Leads the implantable systems group." },
        { role: "Founder & CTO", org: "CardioSense AB", period: "2016 – 2021", description: "Built and scaled implantable cardiovascular monitoring." },
      ],
      education: [
        { degree: "PhD, Biomedical Engineering", institution: "Karolinska Institute", year: "2013" },
        { degree: "MSc, Electrical Engineering", institution: "Lund University", year: "2008" },
      ],
      publications: [{ title: "Biodegradable Pressure Sensors for Post-Operative Monitoring", venue: "Science Translational Medicine", year: "2023" }],
      awards: [{ title: "European Inventor Award – Finalist", org: "European Patent Office", year: "2022" }],
      links: [
        { label: "LinkedIn", url: "https://linkedin.com/in/sofia-lindqvist" },
        { label: "Research Profile", url: "https://research.skilledsphere.dev/sofia-lindqvist" },
      ],
    },
    {
      slug: "michael-chen", fullName: "Michael Chen", professionalTitle: "General Partner, Venture Capital",
      city: "San Francisco", countryCode: "US", organization: "Meridian Capital",
      summary: "Early investor in category-defining infrastructure companies, with a decade of top-decile returns in deep tech.",
      biography: [
        "Michael Chen began his career as a systems engineer at a database company that scaled from 40 to 4,000 people — an experience that taught him what technical leverage looks like from the inside. He moved to venture capital to fund it.",
        "At Meridian Capital he has led early rounds in fourteen companies now valued above a billion dollars, with a portfolio deliberately concentrated in infrastructure, developer tools, and applied AI. He is known for writing checks fast and then staying useful for a decade.",
        "He teaches a popular Stanford seminar on technical due diligence and has quietly funded more than 30 nonprofit open-source maintainers out of his own pocket."
      ],
      achievements: ["Early investor in 14 companies now valued over $1B", "Top-decile returns across three funds", "Backed open-source infrastructure used by millions of developers"],
      expertise: ["venture-capital", "investment", "business-strategy"],
      industries: ["finance", "entrepreneurship", "technology"],
      experience: [
        { role: "General Partner", org: "Meridian Capital", period: "2014 – Present", description: "Leads infrastructure and applied AI investments." },
        { role: "Principal", org: "Sequoia Heritage", period: "2010 – 2014", description: "Growth-stage technology investing." },
        { role: "Systems Engineer", org: "Vertica (acquired by HP)", period: "2006 – 2010", description: "Distributed database internals." },
      ],
      education: [{ degree: "BSc, Computer Science", institution: "Stanford University", year: "2006" }],
      links: [
        { label: "LinkedIn", url: "https://linkedin.com/in/michael-chen" },
        { label: "Personal Website", url: "https://michaelchen.vc" },
      ],
    },
    {
      slug: "priya-sharma", fullName: "Priya Sharma", professionalTitle: "Founder & Chief Executive Officer",
      city: "Bengaluru", countryCode: "IN", organization: "LedgerLoom",
      summary: "Founder of one of India's fastest-growing fintech platforms, bringing instant credit to 8 million small businesses.",
      biography: [
        "Priya Sharma watched her mother's fabric shop in Jaipur get rejected for a loan three times for lack of a credit history — a problem shared by 60 million Indian micro-businesses. A data scientist by training, she decided the answer was better underwriting, not more paperwork.",
        "She founded LedgerLoom in 2019 to underwrite small businesses from their real transaction flows — payments, inventory, logistics — rather than their paperwork. The platform now serves eight million merchants and processes billions in annual credit originations profitably.",
        "She has become a leading voice for financial inclusion in emerging markets, testifying before parliamentary committees and mentoring a new generation of Indian fintech founders."
      ],
      achievements: ["Built a credit platform serving 8 million small businesses", "Raised $180M across four rounds while retaining board control", "Named to Fortune's 40 Under 40 (Global)"],
      expertise: ["entrepreneurship", "data-science", "fintech", "business-strategy"],
      industries: ["finance", "technology", "entrepreneurship"],
      experience: [
        { role: "Founder & CEO", org: "LedgerLoom", period: "2019 – Present", description: "Leads strategy, capital, and a 900-person team across four countries." },
        { role: "Lead Data Scientist", org: "Flipkart", period: "2014 – 2019", description: "Built fraud and credit-risk models for the payments arm." },
      ],
      education: [
        { degree: "B.Tech, Computer Science", institution: "IIT Delhi", year: "2012" },
        { degree: "Executive Program, Financial Analysis", institution: "ISB Hyderabad", year: "2016" },
      ],
      awards: [
        { title: "Fortune 40 Under 40 (Global)", org: "Fortune Magazine", year: "2024" },
        { title: "Inclusive Finance Innovator of the Year", org: "World Fintech Forum", year: "2023" },
      ],
      links: [
        { label: "LinkedIn", url: "https://linkedin.com/in/priya-sharma" },
        { label: "Company", url: "https://ledgerloom.in" },
      ],
    },
    {
      slug: "james-oneill", fullName: "James O'Neill", professionalTitle: "Global Head of Security Architecture",
      city: "London", countryCode: "GB", organization: "Northgate Group",
      summary: "Cybersecurity veteran who has defended central banks, national grids, and the world's largest exchange from state-scale attacks.",
      biography: [
        "James O'Neill spent eight years in British signals intelligence before crossing to the private sector, where he found that most companies were defending yesterday's attacks. He has spent the two decades since making sure the institutions that can't afford to fail — banks, grids, exchanges — don't.",
        "As Global Head of Security Architecture at Northgate Group he redesigned the security posture of institutions that collectively move trillions annually, pioneering an approach built on zero-trust principles a decade before the term was fashionable.",
        "He chairs the UK financial sector's threat-sharing consortium and is known for a calm, engineering-first style: his mantra is that security is a systems property, not a product."
      ],
      achievements: ["Architect of zero-trust security for institutions moving $4T annually", "Led incident response for three of the largest financial cyber-attacks in history", "Chairs the UK financial-sector threat intelligence consortium"],
      expertise: ["cybersecurity", "software-engineering", "management"],
      industries: ["technology", "finance", "consulting"],
      experience: [
        { role: "Global Head of Security Architecture", org: "Northgate Group", period: "2015 – Present", description: "Security strategy and architecture for critical financial infrastructure." },
        { role: "Director of Security Engineering", org: "Barclays", period: "2008 – 2015", description: "Built the bank's first dedicated red team." },
      ],
      education: [{ degree: "MSc, Information Security", institution: "Royal Holloway, University of London", year: "2005" }],
      awards: [{ title: "Cybersecurity Personality of the Year", org: "SC Awards Europe", year: "2021" }],
      links: [
        { label: "LinkedIn", url: "https://linkedin.com/in/james-oneill" },
      ],
    },
    {
      slug: "isabelle-moreau", fullName: "Isabelle Moreau", professionalTitle: "Global Design Director",
      city: "Paris", countryCode: "FR", organization: "Atelier Moreau",
      summary: "Design director whose studio has shaped flagship digital products for museums, airlines, and luxury houses.",
      biography: [
        "Isabelle Moreau believes the test of good design is whether a product feels like a place you want to return to. Trained at ENSAD in Paris, she spent her twenties at a Swiss typography studio learning that restraint is a discipline, then brought that discipline to digital products at the dawn of the app era.",
        "Her Paris studio, Atelier Moreau, has since defined the digital experience of three national museums, two flag carriers, and some of the most exacting luxury maisons in the world. The studio's work is studied for its quiet confidence: interfaces that disappear into the experience.",
        "She lectures on design ethics and refuses all work that involves dark patterns — a stance that has cost the studio clients and, she says, gained it better ones."
      ],
      achievements: ["Defined digital experiences for 3 national museums and leading luxury maisons", "Studio's work exhibited at the Musée des Arts Décoratifs", "Redesigned the booking flow of a major airline used by 90M passengers yearly"],
      expertise: ["product-design", "ux-ui-design", "digital-creativity"],
      industries: ["technology", "media"],
      experience: [
        { role: "Global Design Director", org: "Atelier Moreau", period: "2013 – Present", description: "Leads a 45-person studio across Paris and Lisbon." },
        { role: "Creative Director", org: "Studio Norm (Lausanne)", period: "2006 – 2013", description: "Editorial and typographic systems for cultural institutions." },
      ],
      education: [{ degree: "DNSAP, Design", institution: "ENSAD Paris", year: "2004" }],
      awards: [{ title: "Grand Prix, Digital Design", org: "Art Directors Club Europe", year: "2022" }],
      links: [
        { label: "LinkedIn", url: "https://linkedin.com/in/isabelle-moreau" },
        { label: "Studio", url: "https://ateliermoreau.fr" },
      ],
    },
    {
      slug: "lukas-weber", fullName: "Lukas Weber", professionalTitle: "Chief Technology Officer",
      city: "Berlin", countryCode: "DE", organization: "Kraftwerk Systems",
      summary: "Engineering leader who scaled a logistics platform from 4 servers to a European network moving 2 million parcels a day.",
      biography: [
        "Lukas Weber's first system failure happened at 22: a student project crashed during a demo because he had not thought about what happens when two users press save at once. He describes it as the most valuable lesson of his career — an early respect for the unglamorous engineering that keeps systems alive.",
        "As CTO of Kraftwerk Systems he scaled the company's logistics platform from a Berlin garage operation to a network that plans and tracks two million parcels a day across 14 European markets, while keeping engineering culture deliberately small, senior, and pragmatic.",
        "He writes a widely read engineering blog on distributed systems and interviews every engineer the company hires, 400 and counting."
      ],
      achievements: ["Scaled infrastructure from 4 servers to 2M parcels/day across 14 markets", "Built an engineering org of 400 with a <3% annual attrition rate", "Author of a widely read distributed-systems blog (150k subscribers)"],
      expertise: ["software-engineering", "management", "business-strategy"],
      industries: ["technology", "engineering"],
      experience: [
        { role: "Chief Technology Officer", org: "Kraftwerk Systems", period: "2016 – Present", description: "Technology strategy and engineering leadership." },
        { role: "Staff Engineer", org: "Zalando", period: "2011 – 2016", description: "Order platform and event-driven architecture." },
      ],
      education: [{ degree: "Dipl.-Inf., Computer Science", institution: "TU Berlin", year: "2011" }],
      links: [
        { label: "LinkedIn", url: "https://linkedin.com/in/lukas-weber" },
        { label: "Engineering Blog", url: "https://lukasweber.dev" },
      ],
    },
    {
      slug: "anna-keller", fullName: "Dr. Anna Keller", professionalTitle: "Chief Economist",
      city: "Zurich", countryCode: "CH", organization: "Helvetia Capital Partners",
      summary: "Economist whose forecasts of monetary regime shifts have guided the asset allocation of one of Europe's largest private banks.",
      biography: [
        "Anna Keller began her career at the Swiss National Bank the year the euro was born, giving her a front-row seat — and a lasting skepticism — about the stability of monetary regimes. Her academic work on currency crises is now standard reading in central-bank training programs.",
        "As Chief Economist at Helvetia Capital Partners she correctly called three of the last four major macro regime shifts, informing the allocation of more than 80 billion francs. Her weekly macro letter is read by central bankers and founders alike for its refusal to hedge every sentence.",
        "She serves on the board of the KOF Swiss Economic Institute and teaches a legendary graduate seminar on monetary history — legendary mostly for how much reading it assigns."
      ],
      achievements: ["Correctly forecast 3 of the last 4 major macro regime shifts", "Advises allocation of CHF 80B+ in assets", "Board member, KOF Swiss Economic Institute"],
      expertise: ["economics", "investment", "financial-analysis"],
      industries: ["finance", "consulting"],
      experience: [
        { role: "Chief Economist", org: "Helvetia Capital Partners", period: "2012 – Present", description: "Macro research and asset-allocation strategy." },
        { role: "Economist", org: "Swiss National Bank", period: "2001 – 2012", description: "Monetary policy analysis and financial stability." },
      ],
      education: [
        { degree: "PhD, Economics", institution: "University of Zurich", year: "2001" },
        { degree: "MA, Economics", institution: "London School of Economics", year: "1996" },
      ],
      publications: [{ title: "Currency Crises and the Limits of Credible Commitment", venue: "Journal of International Economics", year: "2010" }],
      links: [
        { label: "LinkedIn", url: "https://linkedin.com/in/anna-keller" },
        { label: "Weekly Letter", url: "https://kellermacro.ch" },
      ],
    },
    {
      slug: "daniel-kim", fullName: "Dr. Daniel Kim", professionalTitle: "Head of Computer Vision Research",
      city: "Seoul", countryCode: "KR", organization: "Hanul AI Research",
      summary: "Computer vision researcher whose models run in the cameras of a hundred million devices — and in hospital scanners.",
      biography: [
        "Daniel Kim's path into computer vision began with a broken camera: as a teenager he tried to repair his father's and became fascinated by what the sensor could not see. His research has been devoted to teaching machines to see what humans easily do — depth, motion, intent.",
        "At Hanul AI Research in Seoul he leads a team of 60 researchers whose efficient vision models ship inside consumer devices worldwide, and whose medical-imaging models assist radiologists at 200 hospitals. He is unusually fluent in both worlds: his papers satisfy reviewers and his models fit phones.",
        "He has resisted lucrative offers from US labs, arguing that world-class research can be built in Korea — and his lab's retention rate is the proof."
      ],
      achievements: ["Vision models shipped in 100M+ consumer devices", "Medical imaging AI assisting radiologists at 200 hospitals", "Oral presentations at CVPR four years running"],
      expertise: ["computer-vision", "machine-learning", "artificial-intelligence"],
      industries: ["technology", "healthcare"],
      experience: [
        { role: "Head of Computer Vision Research", org: "Hanul AI Research", period: "2018 – Present", description: "Leads efficient vision and medical imaging programs." },
        { role: "Research Scientist", org: "Naver Labs", period: "2014 – 2018", description: "On-device perception for mobile platforms." },
      ],
      education: [
        { degree: "PhD, Electrical Engineering (KAIST)", institution: "KAIST", year: "2014" },
        { degree: "BSc, Computer Science", institution: "Seoul National University", year: "2009" },
      ],
      publications: [
        { title: "Edge-Efficient Transformers for Real-Time Depth Estimation", venue: "CVPR", year: "2023" },
        { title: "Self-Supervised Pretraining for Low-Dose CT", venue: "Nature Communications", year: "2022" },
      ],
      awards: [{ title: "Young Scientist Award", org: "Korean Academy of Science and Technology", year: "2023" }],
      links: [
        { label: "LinkedIn", url: "https://linkedin.com/in/daniel-kim" },
        { label: "Research Profile", url: "https://research.skilledsphere.dev/daniel-kim" },
      ],
    },
    {
      slug: "sarah-mitchell", fullName: "Sarah Mitchell", professionalTitle: "Chief Executive Officer",
      city: "Toronto", countryCode: "CA", organization: "NorthMed Health",
      summary: "CEO scaling one of North America's fastest-growing virtual-care networks to 6 million patients.",
      biography: [
        "Sarah Mitchell trained as a nurse before business school — a fact that still shapes how she runs a healthcare company. She has said that every strategy document at NorthMed has to answer one question: would this make sense to a tired nurse at 3 a.m.?",
        "She joined NorthMed Health as COO when it served 200,000 patients and became CEO four years later, scaling the virtual-care network to six million patients across Canada and the US while holding patient-satisfaction scores above 92 percent.",
        "She is a prominent advocate for interoperable health data and co-chairs Canada's digital-health standards initiative."
      ],
      achievements: ["Scaled a virtual care network from 200k to 6M patients", "Maintained 92%+ patient satisfaction through hypergrowth", "Co-chair of Canada's national digital health standards initiative"],
      expertise: ["executive-leadership", "business-strategy", "medical-innovation"],
      industries: ["healthcare", "entrepreneurship"],
      experience: [
        { role: "Chief Executive Officer", org: "NorthMed Health", period: "2020 – Present", description: "Leads 2,400 clinicians and staff across North America." },
        { role: "Chief Operating Officer", org: "NorthMed Health", period: "2016 – 2020", description: "Built the clinical operations backbone." },
        { role: "Registered Nurse → Clinical Director", org: "University Health Network, Toronto", period: "2004 – 2016", description: "Critical care and clinical program leadership." },
      ],
      education: [
        { degree: "MBA, Health Management", institution: "Rotman School of Management", year: "2014" },
        { degree: "BScN, Nursing", institution: "University of Toronto", year: "2004" },
      ],
      awards: [{ title: "Healthcare CEO of the Year", org: "Canadian Health Business Awards", year: "2024" }],
      links: [
        { label: "LinkedIn", url: "https://linkedin.com/in/sarah-mitchell" },
      ],
    },
    {
      slug: "lucas-ferreira", fullName: "Lucas Ferreira", professionalTitle: "Founder & CEO",
      city: "São Paulo", countryCode: "BR", organization: "AgroPonto",
      summary: "Agtech founder whose precision-agriculture platform helps 300,000 Latin American farms raise yields while cutting inputs.",
      biography: [
        "Lucas Ferreira grew up on a small coffee farm in Minas Gerais where a bad forecast could mean a lost year. He studied agronomic engineering, then machine learning, convinced that the region's farmers were flying blind compared to their competitors in Iowa.",
        "AgroPonto, founded when he was 28, fuses satellite imagery, agronomic models, and hyperlocal weather into recommendations that now guide planting and input decisions on 300,000 farms across Brazil, Argentina, and Chile. Independent studies credit the platform with double-digit yield gains and a 20 percent average reduction in fertilizer use.",
        "He is one of the most prominent advocates of Latin American deep tech — and an impatient one, frequently arguing the region should export technology, not just commodities."
      ],
      achievements: ["Platform serves 300,000 farms across 3 countries", "Independently verified 20% average reduction in fertilizer use", "Raised Latin America's largest Series B in agtech ($65M)"],
      expertise: ["entrepreneurship", "data-science", "business-strategy"],
      industries: ["entrepreneurship", "technology"],
      experience: [
        { role: "Founder & CEO", org: "AgroPonto", period: "2019 – Present", description: "Strategy, fundraising, and a 500-person team." },
        { role: "Data Scientist", org: "Embrapa (Brazilian Agricultural Research)", period: "2015 – 2019", description: "Remote sensing for crop monitoring." },
      ],
      education: [{ degree: "Eng. Agrônomo, Agronomy", institution: "University of São Paulo (ESALQ)", year: "2015" }],
      awards: [{ title: "LatAm Entrepreneur of the Year (Agtech)", org: "America Economia", year: "2024" }],
      links: [
        { label: "LinkedIn", url: "https://linkedin.com/in/lucas-ferreira" },
        { label: "Company", url: "https://agroponto.com.br" },
      ],
    },
    {
      slug: "aisha-al-mansouri", fullName: "Aisha Al-Mansouri", professionalTitle: "Group Chief Digital Officer",
      city: "Dubai", countryCode: "AE", organization: "Emirates United Bank",
      summary: "Banking executive leading one of the Gulf's largest digital transformations — 14 million customers moved to real-time finance.",
      biography: [
        "Aisha Al-Mansouri joined Emirates United Bank as a junior analyst in 2007, in an era when the bank's most advanced technology was a fax machine in every branch. She left for a payments startup, built it to two million users, and was invited back in 2019 to do for the bank what she had done for the startup — at 200 times the scale.",
        "As Group Chief Digital Officer she has moved 14 million customers onto real-time banking infrastructure, launched the region's most-used financial super-app, and rebuilt the bank's core systems without a single day of downtime — a fact she mentions with the pride of someone who knows exactly how unlikely it was.",
        "She mentors Gulf women entering technology careers and has funded 40 scholarships for Emirati women in computer science."
      ],
      achievements: ["Digitized banking for 14 million customers with zero-downtime migration", "Launched the region's most-used financial super-app", "Funded 40 scholarships for women in computer science"],
      expertise: ["fintech", "executive-leadership", "financial-analysis"],
      industries: ["finance", "technology"],
      experience: [
        { role: "Group Chief Digital Officer", org: "Emirates United Bank", period: "2019 – Present", description: "Group-wide digital strategy and platforms." },
        { role: "Co-founder & COO", org: "PaySouq", period: "2014 – 2019", description: "Consumer payments platform, 2M users." },
      ],
      education: [
        { degree: "MBA", institution: "London Business School", year: "2014" },
        { degree: "BSc, Information Systems", institution: "United Arab Emirates University", year: "2007" },
      ],
      awards: [{ title: "Middle East CIO of the Year", org: "Gulf Digital Awards", year: "2023" }],
      links: [{ label: "LinkedIn", url: "https://linkedin.com/in/aisha-al-mansouri" }],
    },
    {
      slug: "wei-zhang", fullName: "Wei Zhang", professionalTitle: "Managing Partner, Deep Tech Investments",
      city: "Singapore", countryCode: "SG", organization: "Orchard Gate Capital",
      summary: "Investor backing Asia's hard-tech champions — from semiconductor equipment to satellite manufacturing.",
      biography: [
        "Wei Zhang spent eleven years in semiconductor manufacturing before venture capital, rising to run a fab line in Singapore — an experience she credits for her investing edge: she can smell technical risk in a pitch deck from across the room.",
        "At Orchard Gate Capital she leads a $1.2 billion deep-tech mandate, backing hard-to-copy companies across Southeast Asia: semiconductor equipment, satellite manufacturing, advanced materials, and robotics. Her portfolio includes five companies now central to regional supply chains.",
        "She chairs Singapore's national deep-tech talent advisory board and argues, persuasively and often, that capital markets underrate patience."
      ],
      achievements: ["Manages a $1.2B deep-tech portfolio across Asia", "Backed 5 companies now critical to regional semiconductor supply chains", "Chairs Singapore's deep-tech talent advisory board"],
      expertise: ["investment", "venture-capital", "business-strategy"],
      industries: ["finance", "entrepreneurship", "manufacturing"],
      experience: [
        { role: "Managing Partner", org: "Orchard Gate Capital", period: "2016 – Present", description: "Deep-tech investment strategy and portfolio." },
        { role: "Fab Operations Director", org: "GlobalFoundries Singapore", period: "2005 – 2016", description: "300mm semiconductor manufacturing operations." },
      ],
      education: [
        { degree: "MSc, Materials Science", institution: "NUS Singapore", year: "2005" },
        { degree: "BEng, Electrical Engineering", institution: "NTU Singapore", year: "2002" },
      ],
      links: [
        { label: "LinkedIn", url: "https://linkedin.com/in/wei-zhang" },
        { label: "Firm", url: "https://orchardgate.capital" },
      ],
    },
    {
      slug: "oliver-bennett", fullName: "Oliver Bennett", professionalTitle: "Founding Principal Architect",
      city: "Sydney", countryCode: "AU", organization: "Bennett & Marsh Architects",
      summary: "Architect proving that low-carbon buildings can be beautiful — 40 awarded projects across the Asia-Pacific.",
      biography: [
        "Oliver Bennett began his career retrofitting wool warehouses in Melbourne and developed a conviction that has defined his practice since: the greenest building is the one that already exists, and the second greenest is the one you never have to tear down.",
        "Bennett & Marsh, the studio he founded at 34, has become the Asia-Pacific's reference point for low-carbon architecture: mass-timber towers, passive-cooled civic buildings, and adaptive reuse projects that have won 40 major awards while cutting embodied carbon by more than half against conventional baselines.",
        "He sketches every project by hand first — a discipline, he says, that forces decisions screens let you postpone."
      ],
      achievements: ["40 major architecture awards including 3 national gold medals", "Cut embodied carbon >50% against conventional baselines across the studio's portfolio", "Designed the world's tallest mass-timber civic building (Brisbane, 2023)"],
      expertise: ["architecture", "product-design"],
      industries: ["architecture", "engineering"],
      experience: [
        { role: "Founding Principal", org: "Bennett & Marsh Architects", period: "2012 – Present", description: "Design leadership across 60 architects in Sydney and Singapore." },
        { role: "Associate", org: "Denton Corker Marshall", period: "2004 – 2012", description: "Civic and cultural projects." },
      ],
      education: [{ degree: "BArch", institution: "University of Melbourne", year: "2003" }],
      projects: [
        { name: "Riverline Civic Tower", description: "The world's tallest mass-timber civic building, Brisbane.", year: "2023" },
        { name: "Woolstore Precinct", description: "Adaptive reuse of 19th-century warehouses into a zero-carbon precinct.", year: "2019" },
      ],
      awards: [{ title: "National Architecture Gold Medal (×3)", org: "Australian Institute of Architects", year: "2020" }],
      links: [
        { label: "LinkedIn", url: "https://linkedin.com/in/oliver-bennett" },
        { label: "Studio", url: "https://bennettmarsh.au" },
      ],
    },
    {
      slug: "fatima-el-sayed", fullName: "Dr. Fatima El-Sayed", professionalTitle: "Director of Medical Innovation",
      city: "Cairo", countryCode: "EG", organization: "Nile Health Initiative",
      summary: "Physician-innovator building diagnostic networks that bring specialist-grade care to 12 million people across North Africa.",
      biography: [
        "Fatima El-Sayed practiced internal medicine in Cairo public hospitals, where she watched treatable conditions become fatal for no reason except distance from a specialist. Her response was not a paper but a program.",
        "The Nile Health Initiative, which she now directs, trains rural physicians to perform ultrasound and ECG under remote specialist guidance, backed by an AI triage system her team built. The network spans 340 clinics across Egypt, Sudan, and Jordan and reaches 12 million people; published outcomes show a 38 percent reduction in late-stage referrals for cardiovascular disease.",
        "She holds both an MD and a public-health degree and insists on measuring everything: 'Hope is not a health system. Data is.'"
      ],
      achievements: ["Built a diagnostic network of 340 clinics across 3 countries", "38% measured reduction in late-stage cardiovascular referrals", "AI triage system processing 500,000 consultations yearly"],
      expertise: ["medical-innovation", "biomedical-engineering", "management"],
      industries: ["healthcare", "science"],
      experience: [
        { role: "Director of Medical Innovation", org: "Nile Health Initiative", period: "2017 – Present", description: "Clinical networks and health-system innovation." },
        { role: "Attending Physician", org: "Cairo University Hospitals", period: "2009 – 2017", description: "Internal medicine and cardiology." },
      ],
      education: [
        { degree: "MD, Internal Medicine", institution: "Cairo University", year: "2009" },
        { degree: "MPH", institution: "American University in Cairo", year: "2016" },
      ],
      publications: [{ title: "Task-Shared Echocardiography in Low-Resource Settings", venue: "The Lancet Global Health", year: "2022" }],
      awards: [{ title: "Global Health Innovator Award", org: "WHO Foundation", year: "2023" }],
      links: [
        { label: "LinkedIn", url: "https://linkedin.com/in/fatima-el-sayed" },
      ],
    },
    {
      slug: "emma-van-der-berg", fullName: "Dr. Emma van der Berg", professionalTitle: "Co-founder & Chief Scientific Officer",
      city: "Amsterdam", countryCode: "NL", organization: "Vycell Therapeutics",
      summary: "Biotech scientist leading the first clinically validated cell therapy for a common autoimmune disease.",
      biography: [
        "Emma van der Berg did her doctoral work on T-cell engineering at a time when the field was small enough to fit in one conference room. She stayed with it through the decade's brutal failures, publishing some of the pivotal papers on immune-cell persistence that made the current generation of autoimmune cell therapies possible.",
        "At Vycell Therapeutics, which she co-founded in 2020, she guided the first engineered T-cell therapy for multiple sclerosis through Phase II trials — the first time any engineered cell therapy has shown disease reversal in an autoimmune indication this common. The results made the front page of every major medical journal.",
        "She still runs her own experiments two days a week, a habit she calls non-negotiable: 'The day I only read data instead of making it, I'll be a worse scientist.'"
      ],
      achievements: ["First engineered cell therapy to show disease reversal in a Phase II autoimmune trial", "Pivotal publications on T-cell persistence cited 4,000+ times", "Built a 130-person biotech from bench to Phase II in 4 years"],
      expertise: ["biotechnology", "scientific-research", "medical-innovation"],
      industries: ["science", "healthcare"],
      experience: [
        { role: "Co-founder & CSO", org: "Vycell Therapeutics", period: "2020 – Present", description: "Scientific strategy and preclinical/clinical pipeline." },
        { role: "Group Leader", org: "Netherlands Cancer Institute", period: "2013 – 2020", description: "T-cell engineering and persistence." },
      ],
      education: [
        { degree: "PhD, Immunology", institution: "University of Amsterdam", year: "2013" },
        { degree: "MSc, Biomedical Sciences", institution: "Utrecht University", year: "2008" },
      ],
      publications: [
        { title: "Engineered Tregs Achieve Sustained Remission in Relapsing MS", venue: "New England Journal of Medicine", year: "2024" },
        { title: "Determinants of CAR-T Persistence", venue: "Nature Biotechnology", year: "2018" },
      ],
      awards: [{ title: "European Biotech of the Year (CSO)", org: "EBE Awards", year: "2024" }],
      links: [
        { label: "LinkedIn", url: "https://linkedin.com/in/emma-vdberg" },
        { label: "Research Profile", url: "https://research.skilledsphere.dev/emma-van-der-berg" },
      ],
    },
    {
      slug: "david-cohen", fullName: "David Cohen", professionalTitle: "Founder & Executive Chairman",
      city: "Tel Aviv", countryCode: "IL", organization: "Sentinel Cyber",
      summary: "Serial founder whose second cybersecurity company now protects cloud workloads for half the Fortune 100.",
      biography: [
        "David Cohen's first company was born in an Israeli army intelligence unit and sold six years later for $340 million. His second, Sentinel Cyber, attacked a problem everyone else thought solved: securing the connections between cloud services themselves.",
        "Sentinel's platform now inspects workloads for 49 of the Fortune 100 and has disclosed and patched 21 zero-day vulnerabilities — several of them found by Cohen personally, who codes weekly and keeps a bug bounty alive under his own handle.",
        "He is a central figure in Israel's cyber ecosystem, having seeded 14 startups by alumni of his teams, and a blunt critic of security theater: 'Compliance is not security. It's the receipt.'"
      ],
      achievements: ["Founded and sold two cybersecurity companies ($340M and $1.1B exits)", "Platform protects cloud workloads for 49 of the Fortune 100", "Personally credited with 21 zero-day vulnerability discoveries"],
      expertise: ["cybersecurity", "entrepreneurship", "software-engineering"],
      industries: ["technology", "entrepreneurship"],
      experience: [
        { role: "Founder & Executive Chairman", org: "Sentinel Cyber", period: "2018 – Present", description: "Strategy, culture, and deep technical direction." },
        { role: "Founder & CEO", org: "Argus Security (acquired)", period: "2010 – 2017", description: "Application security from unit 8200 roots." },
      ],
      education: [{ degree: "BSc, Computer Science & Mathematics", institution: "Technion – Israel Institute of Technology", year: "2006" }],
      links: [
        { label: "LinkedIn", url: "https://linkedin.com/in/david-cohen" },
        { label: "Company", url: "https://sentinelcyber.io" },
      ],
    },
    {
      slug: "chidi-okonkwo", fullName: "Dr. Chidi Okonkwo", professionalTitle: "Chief Medical Director",
      city: "Lagos", countryCode: "NG", organization: "Lifeline Health Group",
      summary: "Physician-executive building West Africa's largest private hospital network — 22 hospitals and a teaching partnership.",
      biography: [
        "Chidi Okonkwo could have practiced anywhere; he chose Lagos General Hospital, where he spent a decade in emergency medicine and developed an unshakable belief that African healthcare's problem is capacity, not capability.",
        "Lifeline Health Group, which he has led since 2015, operates 22 hospitals across Nigeria and Ghana, a nursing academy that graduates 600 nurses a year, and West Africa's first JCI-accredited cardiac center. He is unsentimental about quality: every hospital in the group publishes its clinical outcomes publicly.",
        "He teaches medicine one day a week and has trained more than 300 physicians, many of whom now run hospitals of their own — which he calls the group's real compounding asset."
      ],
      achievements: ["Built West Africa's largest private hospital network (22 hospitals)", "Established the region's first JCI-accredited cardiac center", "Trained 300+ physicians through his teaching program"],
      expertise: ["medical-innovation", "executive-leadership", "management"],
      industries: ["healthcare", "education"],
      experience: [
        { role: "Chief Medical Director", org: "Lifeline Health Group", period: "2015 – Present", description: "Clinical quality, expansion, and medical education." },
        { role: "Consultant Emergency Physician", org: "Lagos University Teaching Hospital", period: "2004 – 2015", description: "Emergency medicine and trauma systems." },
      ],
      education: [
        { degree: "MBBS, Medicine", institution: "University of Ibadan", year: "2001" },
        { degree: "Fellowship, Emergency Medicine", institution: "West African College of Surgeons", year: "2009" },
      ],
      awards: [{ title: "African Healthcare Leadership Prize", org: "Africa Health Business Congress", year: "2022" }],
      links: [{ label: "LinkedIn", url: "https://linkedin.com/in/chidi-okonkwo" }],
    },
    {
      slug: "rachel-goldstein", fullName: "Dr. Rachel Goldstein", professionalTitle: "Principal Investigator, Computational Genomics",
      city: "New York", countryCode: "US", organization: "Columbia University / Helix Institute",
      summary: "Genomics researcher whose population-scale sequencing work is rewriting how rare diseases are diagnosed.",
      biography: [
        "Rachel Goldstein's lab sequenced its first genome during her PhD; she now oversees programs that have sequenced 1.4 million of them. Her research sits at the intersection of genomics and machine learning, mining population-scale biobanks for the genetic architecture of rare disease.",
        "Her diagnostic pipeline — which matches undiagnosed patients to candidate variants across 1.4 million genomes — has ended the 'diagnostic odyssey' for thousands of families, raising the solve rate for rare genetic disease from 30 to 62 percent in the networks that adopt it.",
        "She is a vocal advocate for genomic data sovereignty, helping six countries build national sequencing programs that keep patient data under local governance."
      ],
      achievements: ["1.4M genomes sequenced under her research programs", "Raised rare-disease diagnostic solve rate from 30% to 62% in partner networks", "Advised 6 nations on national genomics programs"],
      expertise: ["scientific-research", "biotechnology", "data-science"],
      industries: ["science", "healthcare"],
      experience: [
        { role: "Principal Investigator", org: "Columbia University / Helix Institute", period: "2018 – Present", description: "Computational genomics and population biobanks." },
        { role: "Postdoctoral Fellow", org: "Broad Institute of MIT and Harvard", period: "2013 – 2018", description: "Statistical genetics of rare variants." },
      ],
      education: [
        { degree: "PhD, Computational Biology", institution: "MIT", year: "2013" },
        { degree: "BA, Biology & Computer Science", institution: "University of Pennsylvania", year: "2007" },
      ],
      publications: [
        { title: "Population-Scale Matching Ends the Diagnostic Odyssey", venue: "NEJM", year: "2023" },
        { title: "The Genetic Architecture of Rare Disease in 1M Genomes", venue: "Nature", year: "2021" },
      ],
      awards: [{ title: "Pew Biomedical Scholar", org: "The Pew Charitable Trusts", year: "2020" }],
      links: [
        { label: "LinkedIn", url: "https://linkedin.com/in/rachel-goldstein" },
        { label: "Research Profile", url: "https://research.skilledsphere.dev/rachel-goldstein" },
      ],
    },
    {
      slug: "wanjiru-kamau", fullName: "Wanjiru Kamau", professionalTitle: "Founder & CEO",
      city: "Nairobi", countryCode: "KE", organization: "SomaConnect",
      summary: "28-year-old founder whose platform has brought internet-connected learning to 1.2 million students across East Africa.",
      biography: [
        "Wanjiru Kamau was distributing exam-prep PDFs over WhatsApp to 200 students as a university side project. Five years later, SomaConnect is the largest digital learning platform in East Africa: 1.2 million students, 22,000 teachers, and a low-bandwidth app designed for the region's real infrastructure — 2G networks and shared phones.",
        "Her company's revenue model — micro-sponsorships from African employers who fund specific skills tracks — made it sustainable where donated programs collapsed. Completion rates on SomaConnect run four times the regional average for online courses.",
        "She is the youngest board member of Kenya's national digital literacy council and speaks globally about building technology for the constraints of the majority world."
      ],
      achievements: ["1.2M students and 22,000 teachers on the platform", "4× regional average course completion rates", "Youngest member of Kenya's national digital literacy council"],
      expertise: ["entrepreneurship", "business-strategy", "digital-creativity"],
      industries: ["education", "entrepreneurship", "technology"],
      experience: [
        { role: "Founder & CEO", org: "SomaConnect", period: "2020 – Present", description: "Product, partnerships, and a 180-person team." },
      ],
      education: [{ degree: "BSc, Information Systems", institution: "University of Nairobi", year: "2019" }],
      awards: [
        { title: "Forbes Africa 30 Under 30", org: "Forbes Africa", year: "2024" },
        { title: "Global Student Prize – Finalist", org: "Varkey Foundation", year: "2021" },
      ],
      links: [
        { label: "LinkedIn", url: "https://linkedin.com/in/wanjiru-kamau" },
        { label: "Company", url: "https://somaconnect.co.ke" },
      ],
    },
    {
      slug: "henrik-larsen", fullName: "Henrik Larsen", professionalTitle: "Group Chief Executive Officer",
      city: "Copenhagen", countryCode: "DK", organization: "Nordvest Energy",
      summary: "Energy executive steering a 4-gigawatt offshore wind build-out that will power 6 million European homes.",
      biography: [
        "Henrik Larsen trained as a naval architect and spent his first career building ships — including the specialized vessels that install offshore wind turbines. When he crossed to the energy side in 2009, colleagues teased that he had joined his own customers.",
        "As CEO of Nordvest Energy he leads a 4 GW offshore wind portfolio across the North and Baltic Seas, one of Europe's largest privately-held build-outs. He has championed sector coupling — linking turbines directly to hydrogen and district heating — arguing the industry's future is selling molecules, not just electrons.",
        "He negotiated the industry's first collective biodiversity commitment, tying executive bonuses to measurable marine habitat restoration."
      ],
      achievements: ["Leads a 4 GW offshore wind portfolio powering 6M homes", "Pioneered turbine-to-hydrogen sector coupling at commercial scale", "Tied executive pay to marine biodiversity outcomes — an industry first"],
      expertise: ["executive-leadership", "sustainable-energy", "business-strategy"],
      industries: ["energy", "engineering"],
      experience: [
        { role: "Group CEO", org: "Nordvest Energy", period: "2017 – Present", description: "Portfolio strategy, capital projects, and policy leadership." },
        { role: "VP Offshore Operations", org: "Ørsted", period: "2009 – 2017", description: "North Sea wind farm construction." },
      ],
      education: [{ degree: "MSc, Naval Architecture", institution: "Technical University of Denmark", year: "1994" }],
      links: [{ label: "LinkedIn", url: "https://linkedin.com/in/henrik-larsen" }],
    },
    {
      slug: "alejandra-cruz", fullName: "Alejandra Cruz", professionalTitle: "Chief Operating Officer",
      city: "Monterrey", countryCode: "MX", organization: "Grupo Metálico",
      summary: "Manufacturing executive proving that nearshoring can be both profitable and humane across 18 plants.",
      biography: [
        "Alejandra Cruz runs the industrial empire her grandfather started as a machine shop — 18 plants, 24,000 employees, making everything from automotive stampings to aerospace components for companies that moved production from Asia to Mexico.",
        "She took over operations in 2018 amid a quality crisis and rebuilt the group around a philosophy she calls 'planta con alma' — factories with a soul: transparent pay bands, internal promotion ladders that have moved 3,000 operators into technical careers, and a supplier code that audits working conditions as strictly as tolerances.",
        "The result is nearshoring's most-cited case study: turnover down 60 percent, quality escapes down by half, and a waiting list of 40,000 applicants a year."
      ],
      achievements: ["Operates 18 plants with 24,000 employees across North America", "Cut workforce turnover 60% and quality escapes 50%", "Promoted 3,000 production operators into technical careers"],
      expertise: ["executive-leadership", "management", "business-strategy"],
      industries: ["manufacturing", "engineering"],
      experience: [
        { role: "Chief Operating Officer", org: "Grupo Metálico", period: "2018 – Present", description: "Global operations and industrial strategy." },
        { role: "Plant Director", org: "Grupo Metálico", period: "2012 – 2018", description: "Aerospace division, Monterrey." },
      ],
      education: [
        { degree: "MBA", institution: "IPADE Business School", year: "2012" },
        { degree: "BEng, Industrial Engineering", institution: "Tecnológico de Monterrey", year: "2004" },
      ],
      awards: [{ title: "Latin American Industrialist of the Year", org: "Latin Trade", year: "2023" }],
      links: [{ label: "LinkedIn", url: "https://linkedin.com/in/alejandra-cruz" }],
    },
  ];

  const profIds: Record<string, string> = {};
  for (const p of profs) {
    const row = await db.professional.create({
      data: {
        slug: p.slug,
        fullName: p.fullName,
        professionalTitle: p.professionalTitle,
        summary: p.summary,
        biography: p.biography.join("\n\n"),
        portraitUrl: `/images/portraits/${p.slug}.png`,
        city: p.city,
        organization: p.organization ?? null,
        countryCode: p.countryCode,
        achievements: JSON.stringify(p.achievements),
        experience: JSON.stringify(p.experience),
        education: JSON.stringify(p.education),
        projects: JSON.stringify(p.projects ?? []),
        publications: JSON.stringify(p.publications ?? []),
        awards: JSON.stringify(p.awards ?? []),
        links: JSON.stringify(p.links),
        expertise: { create: p.expertise.map((slug) => ({ expertiseId: expIds[slug] })) },
        industries: { create: p.industries.map((slug) => ({ industryId: indIds[slug] })) },
      },
    });
    profIds[p.slug] = row.id;
  }

  // ---------- Collections ----------
  const collections = [
    {
      title: "30 Under 30 — Global Class of 2025", slug: "30-under-30",
      description: "Thirty of the world's most remarkable professionals under thirty — founders, researchers, and creators whose early work is already reshaping their fields. Selected from more than 4,000 nominations across 62 countries.",
      coverUrl: "/images/covers/collection-30u30.png", kind: "ranking", edition: "2025 Edition",
      members: ["wanjiru-kamau", "rachel-goldstein", "lucas-ferreira", "daniel-kim", "priya-sharma"],
    },
    {
      title: "Global AI Leaders", slug: "global-ai-leaders",
      description: "An editorial selection of the researchers, founders, and executives defining how artificial intelligence is built, governed, and deployed around the world. Not a ranking — a portrait of a discipline at its inflection point.",
      coverUrl: "/images/covers/collection-ai-leaders.png", kind: "editorial", edition: null,
      members: ["amara-okafor", "daniel-kim", "priya-sharma", "michael-chen", "rachel-goldstein"],
    },
    {
      title: "Women in Leadership", slug: "women-in-leadership",
      description: "Executives, scientists, and founders leading organizations of consequence — on their own terms. A continuing editorial series on power, craft, and the cultures these leaders are building.",
      coverUrl: "/images/covers/collection-women-leaders.png", kind: "editorial", edition: null,
      members: ["sarah-mitchell", "wei-zhang", "anna-keller", "aisha-al-mansouri", "sofia-lindqvist", "isabelle-moreau", "fatima-el-sayed", "alejandra-cruz"],
    },
    {
      title: "Emerging Innovators", slug: "emerging-innovators",
      description: "The researchers and builders whose work has not yet made the headlines it deserves. Our editors' selection of the people to watch before everyone else is watching.",
      coverUrl: "/images/covers/collection-innovators.png", kind: "editorial", edition: null,
      members: ["emma-van-der-berg", "elena-vasquez", "wanjiru-kamau", "lucas-ferreira", "rachel-goldstein"],
    },
    {
      title: "Next Generation Founders", slug: "next-generation-founders",
      description: "Founders building companies for problems their generation will inherit — finance, food, health, and learning. Curated by our editorial team across six continents.",
      coverUrl: "/images/covers/story-founders.png", kind: "editorial", edition: null,
      members: ["priya-sharma", "david-cohen", "lucas-ferreira", "wanjiru-kamau", "aisha-al-mansouri"],
    },
    {
      title: "Influential Researchers", slug: "influential-researchers",
      description: "The scientists whose laboratories are quietly determining what the next decade will be able to do. Selected on the judgment of our editorial board and a panel of peer reviewers.",
      coverUrl: "/images/covers/story-quantum.png", kind: "editorial", edition: null,
      members: ["elena-vasquez", "kenji-watanabe", "sofia-lindqvist", "amara-okafor", "emma-van-der-berg"],
    },
  ];
  const colIds: Record<string, string> = {};
  for (const c of collections) {
    const row = await db.collection.create({ data: { title: c.title, slug: c.slug, description: c.description, coverUrl: c.coverUrl, kind: c.kind, edition: c.edition } });
    colIds[c.slug] = row.id;
    for (const [i, m] of c.members.entries()) {
      await db.collectionMember.create({ data: { collectionId: row.id, professionalId: profIds[m], order: i } });
    }
  }

  // ---------- Stories ----------
  const md = (paragraphs: string[]) => paragraphs.join("\n\n");
  const stories = [
    {
      slug: "the-quantum-horizon", title: "The Quantum Horizon", subtitle: "Elena Vásquez on error correction, patience, and why the next breakthrough will be invisible",
      author: "SkilledSphere Editorial", category: "Interview", coverUrl: "/images/covers/story-quantum.png",
      excerpt: "In her Barcelona laboratory, the physicist leading Europe's most promising quantum error-correction program explains why the field's biggest milestone will be one nobody notices.",
      readingMinutes: 9, relatedProfessionals: ["elena-vasquez"], relatedExpertise: ["quantum-computing", "scientific-research"],
      content: md([
        "The dilution refrigerator at the Institute of Photonic Sciences resembles nothing so much as a golden chandelier suspended upside down in a bath of liquid helium — if chandeliers needed to be colder than deep space. Elena Vásquez gives it an affectionate pat as she passes. 'Everyone photographs this,' she says. 'The interesting part is what you cannot see.'",
        "What you cannot see is the logic running through those gold-plated stages: quantum error correction, the make-or-break discipline that determines whether quantum computers ever become useful machines. Vásquez's group holds the European record for keeping a logical qubit alive — and, crucially, for the first demonstration of a logical qubit outperforming its own best physical component.",
        "## The problem nobody wanted",
        "When Vásquez finished her doctorate in 2014, error correction was regarded as the field's plumbing: essential, unglamorous, and a career dead-end for ambitious physicists. Her supervisor tried to steer her toward flashier work in quantum algorithms. She refused.",
        "'Algorithms are promises,' she says. 'Correction is collateral. If you build a beautiful algorithm on qubits that die in fifty microseconds, you have built a poem about a computer.'",
        "The gamble took nine years to pay off. Along the way her group absorbed two failed architectures and one near-fatal funding gap. 'The low point was 2019. We had six months of money and a result that did not work. My best postdoc left for a bank.' She pauses. 'The bank's loss, eventually.'",
        "## What changes when qubits stop dying",
        "The implications of reliable logical qubits are deliberately unexciting, and Vásquez is precise about this. The first applications will not be the universe-simulating, cryptography-breaking machines of popular imagination. They will be small, specialized calculations in chemistry and materials — the kind that let a battery company test an electrolyte in silico instead of spending two years in the lab.",
        "'People ask me when quantum computers will break encryption,' she laughs. 'The honest answer is that first they will make slightly better molecules. That is enough. That is a industry.'",
        "## The communicator's burden",
        "Vásquez has become one of Europe's most visible scientists, and she treats that visibility as part of the job. She meets finance ministers and Fortune 100 boards several times a month, delivering the same disciplined message: quantum is real, quantum is slow, and any investment pitch using the word 'exponential' should be shown the door.",
        "'The greatest danger to this field is not failure,' she says, gathering her notes. 'It is overpromise. We are asking society to fund physics on a twenty-year horizon. That requires trust, and trust requires that we never lie about the timeline.'",
        "She stops at the laboratory door, glancing back at the golden machine. 'Also — when it does arrive, it will be invisible. It will be a chip in a data center solving a problem you did not know existed. That is what success looks like in this field: silence, followed by better batteries.'",
      ]),
    },
    {
      slug: "ai-meets-the-clinic", title: "AI Meets the Clinic", subtitle: "How Amara Okafor's models ended up in eleven national health systems",
      author: "SkilledSphere Editorial", category: "Innovation", coverUrl: "/images/covers/story-ai-medicine.png",
      excerpt: "The story of a research institute in Nairobi that built AI tools for the world's hardest health-data conditions — and ended up exporting them to rich countries.",
      readingMinutes: 8, relatedProfessionals: ["amara-okafor", "fatima-el-sayed"], relatedExpertise: ["artificial-intelligence", "medical-innovation"],
      content: md([
        "When Dr. Amara Okafor describes the early days of the Africa Institute for Intelligent Systems, she reaches for a farming metaphor. 'We were not planting in a field,' she says. 'We were building soil.'",
        "The soil in question was data infrastructure. The institute's now-famous models — for epidemic forecasting, diagnostic triage, and health-system logistics — were not built despite working in low-resource conditions. They were built because of them.",
        "## Constraint as a research agenda",
        "Every machine-learning researcher faces a version of the same trade-off: models improve with data, but data is expensive and messy. Health ministries across Africa offered Okafor's team the messiest data in the world — paper records digitized under duress, eleven languages, clinics that reported weekly by SMS.",
        "'The models that work in Boston do not survive contact with a clinic that reports by SMS,' Okafor says. 'So we built models that thrive on it. Sparse data, delayed data, biased data — if your model only works when the data is perfect, you have built a model for rich countries only.'",
        "The institute's epidemic-forecasting system, now operating in eleven countries, gives ministries two-to-three weeks of additional warning over traditional surveillance. During a 2023 cholera outbreak in the Lake Victoria basin, that lead time was credited with cutting the outbreak's peak by an estimated forty percent.",
        "## The reversal",
        "What happened next surprised everyone, including Okafor. Health systems in Europe and North America began inquiring about the models. Their own data was getting messier — staffing crises, fragmented providers, pandemic backlogs — and their assumption of perfect data was failing.",
        "'The reversal is the thing I am proudest of,' she says. 'The assumption was that Africa would import AI from wealthy countries. Instead we built AI that is robust to reality, and reality turned out to be universal.'",
        "## The policy long game",
        "Okafor now spends a week each month on policy, advising the African Union on a continental AI framework. She is unapologetic about the time cost. 'Research without policy is a hobby,' she says. 'The models that matter are the ones that get deployed, and deployment is a policy question.'",
        "She is pressing for two things: African data staying under African governance, and computational infrastructure on the continent. 'We cannot be a continent that exports raw data and imports finished intelligence. That is the new colonial economy. We refuse.'",
      ]),
    },
    {
      slug: "the-quiet-hand-of-progress", title: "The Quiet Hand of Progress", subtitle: "Kenji Watanabe and the last millimeter of robotics",
      author: "SkilledSphere Editorial", category: "Interview", coverUrl: "/images/covers/story-robotics.png",
      excerpt: "Japan's most decorated robotics engineer keeps a thirty-year-old prototype arm in his office. It is not sentimentality — it is strategy.",
      readingMinutes: 7, relatedProfessionals: ["kenji-watanabe"], relatedExpertise: ["robotics", "software-engineering"],
      content: md([
        "The robot arm on Kenji Watanabe's shelf is older than most of his engineers. It is slow, loud, and inaccurate by the standards of the machines his team builds today. It is also, he insists, the most important object in the laboratory.",
        "'Every young engineer who joins us asks why we keep it,' Watanabe says. 'I tell them: this arm taught us that precision is not a property of a motor. It is a property of a system — the sensor, the control loop, the mounting, the temperature of the room. When you understand that, you stop buying better motors and start designing better systems.'",
        "## The last millimeter",
        "Watanabe's career has been a campaign for the last millimeter — the margin where assembly robots either succeed or scrap the part. His forty-seven patents in force-controlled manipulation quietly underpin the smartphones in most readers' pockets: his designs populate the assembly lines of sixty percent of global handset production.",
        "The breakthrough, he explains, was teaching robots to feel. 'A human assembler adjusts grip a thousand times a second without thinking. We spent fifteen years giving machines that unconsciousness. Force sensors, adaptive compliance, learning from every failed grasp.'",
        "## Building for aging",
        "For the past five years, Watanabe's attention has turned to a different problem: his parents' generation. Japan's caregiver shortage is arithmetic, not politics — the population aged past any plausible workforce. Project Aya, his laboratory's eldercare assistive robot, is now in trials at forty care homes.",
        "The robot deliberately does less than it could. 'We removed the arms,' Watanabe says. 'The residents were afraid of arms. Aya observes, steadies, reaches what is dropped, and calls a human when a human is needed. The design goal is not to replace caregivers. It is to give caregivers a third hand.'",
        "## Against hype",
        "Ask Watanabe about humanoid robots and the response is a long, courteous silence. 'I have watched four humanoid booms,' he finally says. 'Each time, the demos are beautiful and the factories are empty. A robot must earn its shape. Ours earn it in the last millimeter.'",
        "He glances at the old arm on the shelf. 'Thirty years, and it still teaches. That is what I want our robots to be: patient teachers for impatient humans.'",
      ]),
    },
    {
      slug: "what-great-leadership-looks-like-now", title: "What Great Leadership Looks Like Now", subtitle: "Sarah Mitchell on running a healthcare company for the 3 a.m. nurse",
      author: "SkilledSphere Editorial", category: "Leadership", coverUrl: "/images/covers/story-leadership.png",
      excerpt: "The CEO of North America's fastest-growing virtual-care network still starts every strategy meeting with the same question.",
      readingMinutes: 6, relatedProfessionals: ["sarah-mitchell"], relatedExpertise: ["executive-leadership", "medical-innovation"],
      content: md([
        "Every strategy document at NorthMed Health passes through an unusual filter. Before the board sees it, before the market analysis, before the financial model, it must answer one question: would this make sense to a tired nurse at 3 a.m.?",
        "It is the defining habit of Sarah Mitchell's leadership, and it was learned at the bedside. 'I was that nurse,' she says. 'I worked nights in critical care for ten years. Every system that was designed around administrators instead of patients, I felt it in my feet and my hands at three in the morning.'",
        "## Scaling without losing the soul",
        "Mitchell joined NorthMed as COO when the virtual-care network served 200,000 patients. Under her leadership — COO from 2016, CEO from 2020 — it has grown to six million patients while keeping patient-satisfaction scores above ninety-two percent, a combination industry observers describe as somewhere between difficult and impossible.",
        "Her method is unglamorous: clinical staff in every product meeting, a rule that no feature ships without a frontline pilot, and internal systems rated, literally, by whether they reduce clicks per patient.",
        "'Growth hides broken things until it doesn't,' she says. 'Six million patients means six million moments where the system either helps someone or makes their day worse. You do not get to average that out.'",
        "## On being a nurse in the boardroom",
        "Mitchel is frequently the only clinician in rooms full of investors and technologists, and she considers it an edge, not a burden. 'I can hear a number and feel it. When someone says a two-minute increase in wait time, I know exactly what two minutes sounds like on the phone with a frightened parent.'",
        "Her advice to other clinical leaders moving into management is blunt: 'Do not leave your profession at the door. The profession is the qualification.'",
        "## The standards fight",
        "She now co-chairs Canada's national digital-health standards initiative, a sometimes-frustrating campaign to make health data interoperable across every province and vendor. 'It is the least glamorous and most important work of my career. Every locked data silo is a patient repeating their story from scratch — and sometimes the story matters too much for that.'",
      ]),
    },
    {
      slug: "the-new-rules-of-fintech", title: "The New Rules of Fintech", subtitle: "Aisha Al-Mansouri and Priya Sharma on building real-time finance for the majority world",
      author: "SkilledSphere Editorial", category: "Industry Insight", coverUrl: "/images/covers/story-fintech.png",
      excerpt: "Two builders from Dubai and Bengaluru on what the West keeps getting wrong about digital finance — and what the next billion users actually need.",
      readingMinutes: 8, relatedProfessionals: ["aisha-al-mansouri", "priya-sharma"], relatedExpertise: ["fintech", "entrepreneurship"],
      content: md([
        "Aisha Al-Mansouri remembers the fax machines. Priya Sharma remembers the loan rejections. Both are now running or shaping financial platforms used by millions — and both say the future of fintech is being written far from Silicon Valley.",
        "We brought them together for a conversation about what the next decade of digital finance actually looks like.",
        "## On the myth of the unbanked",
        "'The West describes most of the world as underbanked, as if banking were a church people had not yet found,' says Sharma, whose company LedgerLoom underwrites eight million Indian small businesses from their transaction flows. 'They are not waiting for a bank branch. They are waiting for credit that sees them. That is a data problem, not a distribution problem.'",
        "Al-Mansouri, who moved fourteen million customers onto real-time banking infrastructure as Group Chief Digital Officer at Emirates United Bank, nods. 'Every survey says consumers want trust. But trust is a product feature. Instant settlement is trust. A dispute resolved in an hour is trust. We measure trust in milliseconds now.'",
        "## On regulation as an advantage",
        "Both executives are impatient with the trope that regulation is the enemy of innovation. 'Regulation is the moat,' Al-Mansouri says flatly. 'The institutions that treat compliance as engineering instead of paperwork will own the next decade. When the regulators finally move — and they always move — you want to be the one who was already ready.'",
        "Sharma adds a builder's caveat: 'But regulate the outcome, not the architecture. If you force a startup to build the bank of 1990 with an API, you have legislated the past.'",
        "## What the next billion users need",
        "They converge on three answers: instant everything, credit from real behavior, and interfaces that work in the user's reality — shared phones, low bandwidth, many languages. 'My mother runs her fabric shop on WhatsApp,' Sharma says. 'The winning financial product meets her there, in her language, with a price she can hold in her head.'",
        "'The next billion users are not a market entry strategy,' Al-Mansouri says. 'They are the market. The question is whether the industry builds for them or merely translates for them.'",
      ]),
    },
    {
      slug: "powering-the-transition", title: "Powering the Transition", subtitle: "Henrik Larsen on selling molecules, not just electrons",
      author: "SkilledSphere Editorial", category: "Industry Insight", coverUrl: "/images/covers/story-energy.png",
      excerpt: "The CEO behind one of Europe's largest private offshore wind portfolios explains why the industry's future smells faintly of hydrogen.",
      readingMinutes: 7, relatedProfessionals: ["henrik-larsen"], relatedExpertise: ["sustainable-energy", "executive-leadership"],
      content: md([
        "Henrik Larsen spent the first half of his career building the ships that install offshore wind turbines; the second half building the business that orders them. It gives him an unusual vantage point on the energy transition: he has seen it from the water and from the boardroom.",
        "'People think offshore wind is a technology story,' he says, in an office overlooking Copenhagen harbor. 'The technology mostly works. It is an industrialization story — how you manufacture, install, and finance gigawatts instead of megawatts. My ships learned that lesson twenty years ago. The industry is learning it now.'",
        "## Electrons are not enough",
        "Larsen's central argument, increasingly heard across the sector, is that electricity alone cannot decarbonize heavy industry. His company's answer is sector coupling: turbines wired directly to electrolyzers that produce hydrogen for shipping fuel and fertilizer plants, and to heat exchangers feeding city district-heating networks.",
        "'If we only sell electrons, we compete with everything,' he says. 'When we sell heat and molecules, we solve problems nothing else can touch. A steel mill cannot electrify its chemistry. It can, however, buy our hydrogen.'",
        "The company's Baltic pilot now supplies hydrogen to a fertilizer plant and heat to 80,000 homes — from the same wind.",
        "## The biodiversity clause",
        "Larsen is arguably better known for something unusual in energy: in 2022 he tied his executive team's bonuses not just to output but to measurable marine habitat restoration around the company's wind farms — reef structures, monitoring programs, and fishing-community co-management of the seabed.",
        "'The sea is not empty space where we place machines,' he says. 'It is someone's workplace and everyone's inheritance. The industry that treats the ocean as a partner will still be operating in thirty years. The one that treats it as a free construction site will not be allowed to be.'",
        "The results, he admits, are mixed so far — nature does not respect quarterly reporting — but the reefs are drawing fish back to foundations that were once dead zones. 'We built artificial reefs by accident,' he says. 'Now we are doing it on purpose.'",
      ]),
    },
    {
      slug: "designing-for-dignity", title: "Designing for Dignity", subtitle: "Isabelle Moreau on the quiet power of interfaces that disappear",
      author: "SkilledSphere Editorial", category: "Success Story", coverUrl: "/images/covers/story-design.png",
      excerpt: "The Paris design director behind flagship digital products for museums, airlines, and luxury maisons refuses, on principle, to manipulate anyone.",
      readingMinutes: 6, relatedProfessionals: ["isabelle-moreau"], relatedExpertise: ["product-design", "ux-ui-design", "digital-creativity"],
      content: md([
        "In the atrium of the Musée des Arts Décoratifs, where her studio's work was exhibited last year, Isabelle Moreau makes an observation that doubles as a design philosophy: 'People do not remember interfaces. They remember whether a place felt like it wanted them there.'",
        "It is a strange thing for one of Europe's most decorated digital designers to admit — that her life's work consists of things people are not meant to notice. Her studio, Atelier Moreau, has defined the digital experience of three national museums, two flag carriers, and some of the most exacting luxury houses in the world. The work is studied precisely for what it withholds.",
        "## Restraint as discipline",
        "'Every project begins with subtraction,' she says. 'We remove until removing anything more would hurt. Then we remove once more, carefully, and see if it still works.' Her team's redesign of a flag carrier's booking flow — used by ninety million passengers a year — famously ended with fewer screens than it started with, and a measurable rise in completed bookings.",
        "'Friction is not always the enemy,' Moreau notes. 'Meaningless friction is. The two minutes a traveler spends choosing a seat is not friction — it is anticipation. The eleven seconds hunting for the same information twice is theft.'",
        "## The clause in every contract",
        "Atelier Moreau is known in the industry for a contractual clause almost unique in its field: the studio will not build dark patterns — urgency counters, hidden costs, guilt-tripped cancellations — and any client who insists on them terminates the engagement, forfeiting the deposit.",
        "'It has cost us two clients in twelve years,' she says, with no visible regret. 'And gained us every hire that matters.'",
        "## What luxury actually means",
        "Working for maisons whose products are measured in craftsmanship has taught her a definition of luxury she now applies to everything: 'Luxury is the absence of hurry. When an interface respects your time — does not shout, does not nudge, simply works — that is the digital equivalent of hand-stitching.'",
        "She glances at a museum display of her work, a screen quietly helping a lost visitor find a Vermeer. 'The best compliment my work can receive,' she says, 'is that nobody mentions it.'",
      ]),
    },
    {
      slug: "from-lab-to-90-million-users", title: "From Lab to Eight Million Merchants", subtitle: "Priya Sharma and the quiet data science behind India's instant credit revolution",
      author: "SkilledSphere Editorial", category: "Success Story", coverUrl: "/images/covers/story-founders.png",
      excerpt: "Her mother's fabric shop was rejected for a loan three times. Priya Sharma's answer became a platform serving eight million Indian businesses.",
      readingMinutes: 7, relatedProfessionals: ["priya-sharma", "wei-zhang"], relatedExpertise: ["entrepreneurship", "data-science", "fintech"],
      content: md([
        "Every founder origin story has a founding wound. Priya Sharma's is a fabric shop in Jaipur, and three loan rejections.",
        "'My mother's shop had twenty years of customers, perfect repayment history with informal lenders, and inventory everyone in the bazaar knew,' Sharma recalls. 'The bank saw no credit history, no collateral, no file. Sixty million Indian businesses looked exactly like that shop on paper: invisible.'",
        "A data scientist by training, Sharma did not write a complaint. She wrote a model.",
        "## Underwriting reality",
        "LedgerLoom, founded in 2019, underwrites small businesses from what they actually do — payment flows, inventory turnover, logistics patterns, seasonality — rather than what documents they can produce. The models run on India's digital public infrastructure rails, and the results have bent the industry's assumptions: approval rates three times traditional banks at comparable default rates, with decisions in under four minutes.",
        "'The insight is not clever,' she insists. 'It is humility. A business is what it does every day. A file is a story a business tells a bank once. We stopped reading files and started watching behavior.'",
        "Eight million merchants now hold LedgerLoom credit lines; the company processes billions in annual originations profitably, with four funding rounds raised while Sharma retained board control — a detail she mentions deliberately, noting how rarely founders like her do.",
        "## The long game",
        "Her ambitions now extend past credit: insurance, savings products, and export financing designed for micro-multinationals — ten-person workshops selling globally. 'The next decade of financial services will be built for the businesses the last century ignored,' she says. 'Those businesses are not a market segment. They are the majority of the world's commerce.'",
        "She still visits the Jaipur shop, she says, where a LedgerLoom credit line hangs on the wall behind the register like a diploma. 'My mother thinks I built it for her. In every way that matters, she is correct.'",
      ]),
    },
    {
      slug: "the-genome-decade", title: "The Genome Decade", subtitle: "Rachel Goldstein on ending the diagnostic odyssey",
      author: "SkilledSphere Editorial", category: "Innovation", coverUrl: "/images/covers/collection-innovators.png",
      excerpt: "Fourteen hundred thousand genomes, one diagnostic pipeline, and the researcher who took rare-disease diagnosis from 30 to 62 percent.",
      readingMinutes: 8, relatedProfessionals: ["rachel-goldstein", "emma-van-der-berg"], relatedExpertise: ["scientific-research", "biotechnology", "data-science"],
      content: md([
        "The families Rachel Goldstein meets have usually waited years. A child with symptoms that fit no textbook, a sequence of specialists, a shelf of inconclusive tests. Clinical genetics calls it the diagnostic odyssey — and Goldstein's laboratory has, quietly, been ending it for thousands of families.",
        "'When I started, we could solve maybe a third of rare-disease cases,' she says. 'The families of the other two-thirds learned to live with the word idiopathic. That word is a locked door.'",
        "## Matching at population scale",
        "The key was scale. Rare diseases are, individually, rare — but collectively they affect one in twelve people, and every unsolved case carries information that can solve another family's mystery a continent away. Goldstein's pipeline matches undiagnosed patients against 1.4 million sequenced genomes, hunting for others whose variants and symptoms rhyme.",
        "The pipeline — part genomics, part machine learning, part clinical curation — has lifted the diagnostic solve rate in partner networks from roughly thirty percent to sixty-two percent. For families, the number is not a statistic: a diagnosis means prognosis, treatment paths, and, often for the first time, a community of others with the same condition.",
        "'A diagnosis ends the isolation before it ends the search,' Goldstein says. 'That is the part families tell you about.'",
        "## Data sovereignty",
        "She is equally known for the fight she picks around genomic data: insisting that the countries generating it keep it under their own governance. Her lab has helped six nations build national sequencing programs with local data storage and local research priority.",
        "'Genomics has an extractive history,' she says plainly. 'The least we can do, building these biobanks, is not repeat it. A country's genomes are not raw material for export. They are a national scientific asset — and a matter of trust.'",
        "## What comes next",
        "The pipeline's next frontier is prevention: catching disease before symptoms, in newborns. Goldstein is careful with the word. 'Sequencing a newborn is a profound thing — for good and otherwise. The science is the easy part. The consent architecture, the privacy guarantees, the right not to know — that is the work of the next decade.'",
      ]),
    },
  ];
  for (const [i, s] of stories.entries()) {
    const row = await db.story.create({
      data: {
        slug: s.slug, title: s.title, subtitle: s.subtitle, coverUrl: s.coverUrl,
        author: s.author, category: s.category, excerpt: s.excerpt, content: s.content,
        readingMinutes: s.readingMinutes,
        publicationDate: new Date(Date.now() - (i + 1) * 4 * 24 * 3600 * 1000),
        relatedProfessionals: { create: s.relatedProfessionals.map((slug) => ({ professionalId: profIds[slug] })) },
        relatedExpertise: { create: s.relatedExpertise.map((slug) => ({ expertiseId: expIds[slug] })) },
      },
    });
    void row;
  }

  // ---------- Featured schedules ----------
  const today = new Date();
  const dayStart = (offsetDays: number) => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() + offsetDays);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  };
  await db.featuredSchedule.create({ data: { professionalId: profIds["amara-okafor"], featuredDate: dayStart(0), label: "Person of the Day", active: true } });
  await db.featuredSchedule.create({ data: { professionalId: profIds["kenji-watanabe"], featuredDate: dayStart(-1), label: "Person of the Day", active: true } });
  await db.featuredSchedule.create({ data: { professionalId: profIds["priya-sharma"], featuredDate: dayStart(1), label: "Person of the Day", active: true } });
  await db.featuredSchedule.create({ data: { professionalId: profIds["elena-vasquez"], featuredDate: dayStart(2), label: "Person of the Day", active: true } });

  const counts = {
    countries: await db.country.count(),
    expertise: await db.expertise.count(),
    industries: await db.industry.count(),
    professionals: await db.professional.count(),
    collections: await db.collection.count(),
    stories: await db.story.count(),
    featured: await db.featuredSchedule.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
