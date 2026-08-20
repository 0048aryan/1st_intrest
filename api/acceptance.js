import { randomUUID } from "node:crypto";

/*
 * Vercel serverless endpoint for the YES action.
 *
 * Required server-side environment variables:
 *   RESEND_API_KEY
 *   RESEND_FROM                     (a sender on a verified Resend domain)
 *
 * Optional:
 *   ACCEPTANCE_RECIPIENT            (defaults to Aryan's address below)
 *   UPSTASH_REDIS_REST_URL          (keeps an auditable record for one year)
 *   UPSTASH_REDIS_REST_TOKEN
 *   APP_ORIGIN                      (for an extra same-site origin check)
 */
export const config = { api: { bodyParser: { sizeLimit: "16kb" } } };

const allowedEvent = "proposal_accepted";

function asText(value, maxLength) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength
    ? value.trim()
    : null;
}

async function storeEvent(event) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return false;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(["SET", `proposal:acceptance:${event.id}`, JSON.stringify(event), "EX", "31536000"])
  });
  if (!response.ok) throw new Error("The acceptance record could not be stored.");
  return true;
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;"
  })[character]);
}

async function emailOwner(event) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const recipient = process.env.ACCEPTANCE_RECIPIENT || "aryanpatel8561@gmail.com";
  if (!apiKey || !from) throw new Error("Email delivery is not configured.");

  const text = `${event.personName} accepted ♥\n\nRecorded at: ${event.occurredAt}\nEvent ID: ${event.id}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "User-Agent": "proposal-site/1.0",
      "Idempotency-Key": event.id
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      subject: `${event.personName} accepted ♥`,
      text,
      html: `<p><strong>${escapeHtml(event.personName)} accepted ♥</strong></p><p>Recorded at: ${escapeHtml(event.occurredAt)}<br>Event ID: ${escapeHtml(event.id)}</p>`
    })
  });
  if (!response.ok) throw new Error("The email service rejected the acceptance notification.");
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed." });
  }

  const expectedOrigin = process.env.APP_ORIGIN;
  const origin = request.headers.origin;
  if (expectedOrigin && origin && origin !== expectedOrigin) {
    return response.status(403).json({ error: "Unexpected origin." });
  }

  let body;
  try {
    body = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
  } catch {
    return response.status(400).json({ error: "Invalid JSON." });
  }
  const personName = asText(body?.personName, 80);
  const senderName = asText(body?.senderName, 80);
  if (body?.event !== allowedEvent || !personName || !senderName) {
    return response.status(400).json({ error: "Invalid acceptance event." });
  }

  const event = {
    id: randomUUID(),
    type: allowedEvent,
    personName,
    senderName,
    occurredAt: new Date().toISOString(),
    source: "proposal-site"
  };

  try {
    const recorded = await storeEvent(event);
    await emailOwner(event);
    return response.status(201).json({ recorded, emailed: true, id: event.id });
  } catch (error) {
    console.error("Acceptance delivery failed", { eventId: event.id, message: error.message });
    return response.status(503).json({ error: "Acceptance could not be securely recorded and delivered." });
  }
}
