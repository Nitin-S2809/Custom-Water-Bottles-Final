const crypto = require("crypto");

const verifyRazorpayWebhookSignature = (rawBody, signature, secret) => {
  if (!Buffer.isBuffer(rawBody) || typeof signature !== "string" || !secret) return false;
  if (!/^[a-f\d]{64}$/i.test(signature)) return false;

  const expectedSignature = crypto.createHmac("sha256", secret).update(rawBody).digest();
  const receivedSignature = Buffer.from(signature, "hex");
  return expectedSignature.length === receivedSignature.length
    && crypto.timingSafeEqual(expectedSignature, receivedSignature);
};

const parseRazorpayWebhookPayload = (rawBody) => {
  if (!Buffer.isBuffer(rawBody) || rawBody.length === 0) {
    throw new TypeError("Webhook request body must be non-empty raw JSON");
  }

  const payload = JSON.parse(rawBody.toString("utf8"));
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new TypeError("Webhook payload must be a JSON object");
  }

  return payload;
};

module.exports = {
  verifyRazorpayWebhookSignature,
  parseRazorpayWebhookPayload,
};
