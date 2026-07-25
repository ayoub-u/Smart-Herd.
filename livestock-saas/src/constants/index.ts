// ── App identity ──────────────────────────────────────────────────────────────
export const APP_NAME = "SmartHerd";
export const APP_TAGLINE = "Livestock Management, Simplified.";
export const APP_DESCRIPTION =
  "The all-in-one SaaS platform for dairy farms, beef operations and sheep management.";

// ── Routes ────────────────────────────────────────────────────────────────────
export const ROUTES = {
  // Marketing
  HOME: "/",
  FEATURES: "/features",
  PRICING: "/pricing",
  ABOUT: "/about",
  CONTACT: "/contact",
  // Auth
  LOGIN: "/login",
  // Dashboard
  DASHBOARD: "/dashboard",
  ANIMALS: "/animals",
  MILK: "/milk",
  REPRODUCTION: "/reproduction",
  HEALTH: "/health",
  NUTRITION: "/nutrition",
  ANALYTICS: "/analytics",
  NOTIFICATIONS: "/notifications",
  SETTINGS: "/settings",
} as const;

// ── Navigation ────────────────────────────────────────────────────────────────
export const MARKETING_NAV = [
  { label: "Features",  href: ROUTES.FEATURES },
  { label: "Pricing",   href: ROUTES.PRICING  },
  { label: "About",     href: ROUTES.ABOUT    },
  { label: "Contact",   href: ROUTES.CONTACT  },
] as const;

// ── Pricing Plans ─────────────────────────────────────────────────────────────
export const PRICING_PLANS = [
  {
    name: "Starter",
    price: 29,
    period: "month",
    description: "Perfect for small family farms.",
    features: [
      "Up to 50 animals",
      "Milk tracking",
      "Basic health records",
      "Vaccination calendar",
      "Mobile app access",
      "Email support",
    ],
    cta: "Start Free Trial",
    highlighted: false,
  },
  {
    name: "Professional",
    price: 79,
    period: "month",
    description: "For growing operations.",
    features: [
      "Up to 250 animals",
      "Everything in Starter",
      "Advanced analytics",
      "Reproduction management",
      "Feed & nutrition planner",
      "Priority support",
      "Export reports (PDF/CSV)",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: 199,
    period: "month",
    description: "For large-scale operations.",
    features: [
      "Unlimited animals",
      "Everything in Professional",
      "Multi-farm management",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
      "On-site training",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
] as const;

// ── Features ──────────────────────────────────────────────────────────────────
export const FEATURES = [
   {
     icon: "🐄",
     title: "Animal Management",
     description: "Track every animal with RFID, QR codes, breed info, weight history and complete life records.",
   },
   {
     icon: "🥛",
          title: "Milk Tracking",
     description: "Record morning, afternoon and evening sessions. Visualize trends and spot top producers instantly.",
 },
   {
     icon: "❤️",
     title: "Reproduction",
     description: "Manage heat detection, AI scheduling, pregnancy confirmation and expected calving dates.",
   },
   {
     icon: "💉",
     title: "Health & Vaccines",
     description: "Never miss a vaccination. Get automatic alerts before due dates and maintain full vet records.",
   },
   {
     icon: "🌾",
     title: "Nutrition & Feed",
     description: "Manage feed inventory, calculate TMR rations and track daily feeding costs per animal.",
   },
   {
     icon: "📊",
     title: "Analytics & Reports",
     description: "Profitability charts, herd performance KPIs and exportable reports for your accountant or vet.",
   },
 ] as const;

// // ── Testimonials ──────────────────────────────────────────────────────────────
// /*export const TESTIMONIALS = [
//   {
//     name: "Rachid B.",
//     role: "Dairy Farmer · Tlemcen, Algeria",
//     avatar: "RB",
//     quote:
//       "SmartHerd replaced three different spreadsheets. My vet loves the health reports and I can see milk production from my phone while in the field.",
//     rating: 5,
//   },
//   {
//     name: "Youssef M.",
//     role: "Beef Operation · Sétif, Algeria",
//     avatar: "YM",
//     quote:
//       "The vaccination calendar alone saved me two sick animals last season. Setup took 30 minutes and the team was helpful from day one.",
//     rating: 5,
//   },
//   {
//     name: "Fatima K.",
//     role: "Sheep Farm · Batna, Algeria",
//     avatar: "FK",
//     quote:
//       "Finally software that understands small farms. The mobile interface is simple enough that my workers use it without any training.",
//     rating: 5,
//   },
// ] as const;
