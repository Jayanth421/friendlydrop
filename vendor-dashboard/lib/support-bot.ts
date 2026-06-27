import { SupportTicket } from "@/types";

const HELP_KEYWORDS: Array<{ needle: string; reply: string; category: SupportTicket["category"] }> = [
  {
    needle: "refund",
    category: "refund",
    reply: "I can help with refunds. Please share your order ID and reason so our support team can speed this up.",
  },
  {
    needle: "late",
    category: "delay",
    reply: "Looks like this may be a delivery delay. Please share your order ID and we will check shipment status right away.",
  },
  {
    needle: "damage",
    category: "damage",
    reply: "Sorry this happened. Please upload photos/video of the issue and mention your order ID. A support agent will join shortly.",
  },
  {
    needle: "cancel",
    category: "other",
    reply: "I can help with cancellation requests. Please share your order ID and whether the order is already shipped.",
  },
];

export function classifySupportCategory(message: string): SupportTicket["category"] {
  const normalized = message.toLowerCase();
  const found = HELP_KEYWORDS.find((item) => normalized.includes(item.needle));
  return found?.category ?? "other";
}

export function buildBotReply(message: string) {
  const normalized = message.toLowerCase();
  const found = HELP_KEYWORDS.find((item) => normalized.includes(item.needle));
  if (found) {
    return found.reply;
  }

  return "Thanks for reaching out. I can help with refunds, delays, damaged products, or order updates. If needed, I will connect you with a support agent.";
}
