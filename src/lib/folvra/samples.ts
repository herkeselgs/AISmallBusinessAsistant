import type { BusinessBrain, InboundMessage } from "./types";

/**
 * A realistic demo Business Brain for a multi-trade home-services company. Used
 * on the landing-page demo so a visitor sees Folvra reply as a real business
 * across several verticals (HVAC, roofing, remodeling, landscaping, cleaning).
 */
export const DEMO_BRAIN: BusinessBrain = {
  name: "Summit Home Services",
  ownerName: "Mike",
  industry: "Home services — HVAC, roofing, remodeling, landscaping & cleaning",
  website: "summithomeservices.example",
  timezone: "America/Denver",
  serviceArea: "Denver metro (within ~30 miles)",
  hours: "Mon–Fri 7:30am–6pm, emergency service after hours",
  services: [
    "HVAC repair & install (heating & cooling)",
    "Roofing repair & replacement",
    "Bathroom & kitchen remodels",
    "Landscaping & yard",
    "Recurring house cleaning",
  ],
  pricingNotes:
    "Free estimates. We give ballpark ranges only and confirm exact pricing after a visit — never quote a firm price sight-unseen. Emergency HVAC has a service-call fee we confirm on the call.",
  faqs: [
    { q: "Are you licensed and insured?", a: "Yes — fully licensed and insured in Colorado." },
    { q: "Do you offer free estimates?", a: "Yes, estimates are free and usually take about 45 minutes." },
    { q: "How soon can you come out?", a: "Emergencies same-day when we can; estimates usually within a few days." },
  ],
  tone: "Friendly, straightforward, and confident. Sounds like a busy but caring local pro. No corporate fluff.",
  bookingTypes: [
    { label: "Free estimate / service visit", durationMin: 45, location: "onsite" },
  ],
  escalateTopics: ["complaints", "warranty disputes", "legal or lien questions"],
  signature: "— Mike, Summit Home Services",
};

/**
 * Sample inbound leads a visitor can try in the demo. IDs here must match the
 * button list in components/folvra-demo.tsx and the seed map in workspace.ts.
 */
export const SAMPLE_LEADS: { id: string; label: string; message: InboundMessage }[] = [
  {
    id: "hvac",
    label: "HVAC emergency",
    message: {
      from: "jenm@gmail.com",
      subject: "New lead from your website",
      receivedAt: "10:52 PM",
      body: `Name: Jen Marsh
Phone: (303) 555-0188
Message: Our furnace just quit and the house is freezing — we have a newborn. Is there any way someone can come out tonight or first thing tomorrow? Please help!`,
    },
  },
  {
    id: "roofing",
    label: "Roofing estimate",
    message: {
      from: "no-reply@angi.com",
      subject: "You have a new lead: Roof repair",
      receivedAt: "7:41 AM",
      body: `Angi lead — Customer: Robert C.
Project: Roof leak + missing shingles after last week's storm. Wants an estimate to repair or possibly replace.
Reply to this email to respond to Robert.`,
    },
  },
  {
    id: "bathroom",
    label: "Bathroom remodel",
    message: {
      from: "dwright@outlook.com",
      subject: "Bathroom leak / remodel",
      receivedAt: "6:15 AM",
      body: `Our master bathroom has water damage under the vanity and we've been wanting to remodel it anyway. Do you handle that kind of thing? Would like to move fast if possible. — Dan`,
    },
  },
  {
    id: "landscaping",
    label: "Landscaping quote",
    message: {
      from: "no-reply@thumbtack.com",
      subject: "You have a new lead: Landscaping",
      receivedAt: "8:24 PM",
      body: `Thumbtack lead — Customer: Alicia R.
Project: Redo the front yard — new sod, a couple of planting beds, maybe a small retaining wall. Wants a ballpark and to know when someone could come look.
Reply to this email to respond to Alicia.`,
    },
  },
  {
    id: "cleaning",
    label: "Cleaning inquiry",
    message: {
      from: "priya.k@gmail.com",
      subject: "House cleaning",
      receivedAt: "1:07 PM",
      body: `Hi! Looking for recurring house cleaning — 3 bed / 2 bath, probably every other week. Do you do that, and roughly what would it cost? Thanks, Priya`,
    },
  },
  {
    id: "spam",
    label: "Vendor spam",
    message: {
      from: "growth@leadgenpros.biz",
      subject: "Get 50 exclusive leads this month 🚀",
      receivedAt: "2:20 PM",
      body: `Hi there, I help contractors like you get 30-50 exclusive leads per month with our proven system. Do you have 15 minutes this week for a quick call to see if we're a fit?`,
    },
  },
];
