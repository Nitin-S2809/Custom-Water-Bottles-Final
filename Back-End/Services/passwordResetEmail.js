const crypto = require("node:crypto");
const { Resend } = require("resend");

let cachedClient = null;
let cachedApiKey = null;

const getResendConfig = () => {
    const apiKey = String(process.env.RESEND_API_KEY || "").trim();
    const from = String(process.env.RESEND_FROM_EMAIL || "").trim();

    if (!apiKey || !from) {
        const error = new Error("Resend email configuration is incomplete");
        error.code = "RESEND_CONFIG_INCOMPLETE";
        throw error;
    }

    const senderAddress = from.match(/<([^<>]+)>/)?.[1] || from;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderAddress)) {
        const error = new Error("RESEND_FROM_EMAIL must contain a valid sender address");
        error.code = "RESEND_CONFIG_INVALID";
        throw error;
    }

    return { apiKey, from };
};

const getResendClient = (apiKey) => {
    if (!cachedClient || cachedApiKey !== apiKey) {
        cachedClient = new Resend(apiKey);
        cachedApiKey = apiKey;
    }

    return cachedClient;
};

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
}[character]));

const createEmailError = (code, statusCode) => {
    const error = new Error("Email delivery failed");
    error.code = code;
    if (Number.isInteger(statusCode)) error.statusCode = statusCode;
    return error;
};

const sendEmail = async ({ to, subject, text, html, idempotencyKey }) => {
    let config;
    try {
        config = getResendConfig();
    } catch {
        throw createEmailError("EMAIL_SEND_NOT_ATTEMPTED");
    }

    let result;
    try {
        result = await getResendClient(config.apiKey).emails.send(
            {
                from: config.from,
                to: [to],
                subject,
                text,
                html,
            },
            { idempotencyKey }
        );
    } catch {
        throw createEmailError("EMAIL_DELIVERY_UNKNOWN");
    }

    if (result.error) {
        const statusCode = Number(result.error.statusCode);
        const code = statusCode >= 400 && statusCode < 500
            ? "EMAIL_PROVIDER_REJECTED"
            : "EMAIL_DELIVERY_UNKNOWN";
        throw createEmailError(code, statusCode);
    }

    if (!result.data?.id) {
        throw createEmailError("EMAIL_DELIVERY_UNKNOWN");
    }

    return result.data;
};

module.exports.isConfigured = () => {
    try {
        getResendConfig();
        const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL;
        const parsedUrl = new URL(clientUrl);
        return ["http:", "https:"].includes(parsedUrl.protocol);
    } catch {
        return false;
    }
};

const getResetUrl = (token) => {
    const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL;
    if (!clientUrl) throw new Error("CLIENT_URL is not configured");

    const resetUrl = new URL(clientUrl);
    resetUrl.pathname = `${resetUrl.pathname.replace(/\/$/, "")}/reset-password/${encodeURIComponent(token)}`;
    resetUrl.search = "";
    resetUrl.hash = "";
    return resetUrl.toString();
};

module.exports.send = async ({ email, username, token }) => {
    const resetUrl = getResetUrl(token);
    const safeUsername = username ? escapeHtml(username) : "";
    const greeting = safeUsername ? `Hello ${safeUsername},` : "Hello,";
    const tokenHash = crypto.createHash("sha256").update(String(token)).digest("hex");

    return sendEmail({
        to: email,
        subject: "Reset your AquaBrand password",
        text: `${greeting}\n\nWe received a request to reset your AquaBrand password.\n\nOpen this link to reset your password: ${resetUrl}\n\nThis link will expire after 30 minutes. If you did not request this, you can safely ignore this email.\n\nAquaBrand`,
        html: `<p>${greeting}</p><p>We received a request to reset your AquaBrand password.</p><p><a href="${escapeHtml(resetUrl)}" style="display:inline-block;padding:12px 20px;background:#1769c2;color:#fff;text-decoration:none;border-radius:8px">Reset Password</a></p><p>This link will expire after 30 minutes. If you did not request this, you can safely ignore this email.</p><p>AquaBrand</p>`,
        idempotencyKey: `password-reset/${tokenHash}`,
    });
};

module.exports.sendDeliveryOtp = async ({ email, username, orderId, otp, expiresInMinutes }) => {
    const safeUsername = escapeHtml(username || "Customer");
    const safeOrderId = escapeHtml(orderId);
    const safeOtp = escapeHtml(otp);
    const greeting = `Hello ${safeUsername},`;
    const expiration = `This OTP is valid for ${expiresInMinutes} minutes.`;
    const otpHash = crypto.createHash("sha256").update(String(otp)).digest("hex");

    return sendEmail({
        to: email,
        subject: "AquaBrand Delivery Verification OTP",
        text: `${greeting}\n\nYour AquaBrand order is ready for delivery verification.\n\nYour delivery verification OTP is: ${otp}\n\nPlease provide this OTP to the authorized AquaBrand delivery supplier to confirm delivery of your order. ${expiration}\n\nIf you did not expect this delivery verification, please contact AquaBrand support.\n\nOrder ID: ${orderId}\n\nRegards,\nAquaBrand Team`,
        html: `<!doctype html><html><body style="margin:0;padding:24px;background:#f3f7fb;font-family:Arial,sans-serif;color:#18324b"><div style="max-width:560px;margin:0 auto;padding:32px 24px;background:#fff;border:1px solid #dce7f1;border-radius:16px"><p>${greeting}</p><p>Your AquaBrand order is ready for delivery verification.</p><p>Your delivery verification OTP is:</p><p style="margin:24px 0;padding:18px;text-align:center;background:#eef6ff;border-radius:12px;color:#1457a6;font-size:32px;font-weight:700;letter-spacing:8px">${safeOtp}</p><p>Please provide this OTP to the authorized AquaBrand delivery supplier to confirm delivery of your order.</p><p>${expiration}</p><p>If you did not expect this delivery verification, please contact AquaBrand support.</p><p style="margin-top:24px"><strong>Order ID:</strong> ${safeOrderId}</p><p style="margin-top:32px;color:#587086">Regards,<br />AquaBrand Team</p></div></body></html>`,
        idempotencyKey: `delivery-otp/${String(orderId)}/${otpHash}`,
    });
};
