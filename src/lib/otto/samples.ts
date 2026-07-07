import type { BusinessBrain, InboundMessage } from "./types";

/**
 * A realistic demo Business Brain for a home-services company. Used on the
 * landing-page demo so a visitor sees Otto reply as a real business.
 */
export const DEMO_BRAIN: BusinessBrain = {
  name: "Summit Remodeling",
  ownerName: "Mike",
  industry: "Home remodeling & general contracting",
  website: "summitremodeling.example",
  timezone: "America/Denver",
  serviceArea: "Denver metro (within ~30 miles)",
  hours: "Mon–Fri 7:30am–5pm",
  services: [
    "Kitchen remodels",
    "Bathroom remodels",
    "Basement finishing",
    "Additions",
    "Deck & outdoor",
  ],
  pricingNotes:
    "Free in-home estimates. Kitchen remodels typically start around $25k; bathrooms around $12k. Do NOT commit to a firm price before an estimate — ranges only.",
  faqs: [
    { q: "Are you licensed and insured?", a: "Yes — fully licensed and insured in Colorado." },
    { q: "Do you offer free estimates?", a: "Yes, in-home estimates are free and take about 45 minutes." },
    { q: "How booked out are you?", a: "Typically starting new projects 3–5 weeks out." },
  ],
  tone: "Friendly, straightforward, and confident. Sounds like a busy but caring local contractor. No corporate fluff.",
  bookingTypes: [
    { label: "Free in-home estimate", durationMin: 45, location: "onsite" },
  ],
  escalateTopics: ["complaints", "warranty disputes", "legal or lien questions"],
  signature: "— Mike, Summit Remodeling",
};

/** Sample inbound leads a visitor can try in the demo. */
export const SAMPLE_LEADS: { id: string; label: string; message: InboundMessage }[] = [
  {
    id: "kitchen",
    label: "Kitchen remodel (website form)",
    message: {
      from: "sarah.j@gmail.com",
      subject: "New lead from your website",
      receivedAt: "11:42 PM",
      body: `Name: Sarah Johnson
Phone: (303) 555-0142
Message: Hi, we're thinking about redoing our kitchen — it's pretty dated, probably a full gut. Wondering roughly what that runs and how soon you could come take a look? We're in Littleton. Thanks!`,
    },
  },
  {
    id: "bathroom",
    label: "Bathroom, urgent (direct email)",
    message: {
      from: "dwright@outlook.com",
      subject: "Bathroom leak / remodel",
      receivedAt: "6:15 AM",
      body: `Our master bathroom has water damage under the vanity and we've been wanting to remodel it anyway. Do you handle that kind of thing? Would like to move fast if possible. — Dan`,
    },
  },
  {
    id: "thumbtack",
    label: "Deck project (Thumbtack notification)",
    message: {
      from: "no-reply@thumbtack.com",
      subject: "You have a new lead: Deck or porch build",
      receivedAt: "9:03 PM",
      body: `Thumbtack lead:
Customer: Alicia R.
Project: Build a new ~300 sq ft deck
Details: Looking to build a deck off the back of the house before summer. Composite if possible. What would that cost and when could you start?
Reply to this email to respond to Alicia.`,
    },
  },
  {
    id: "spam",
    label: "Not a lead (vendor spam)",
    message: {
      from: "growth@leadgenpros.biz",
      subject: "Get 50 exclusive leads this month 🚀",
      receivedAt: "2:20 PM",
      body: `Hi there, I help contractors like you get 30-50 exclusive remodeling leads per month with our proven system. Do you have 15 minutes this week for a quick call to see if we're a fit?`,
    },
  },
];
