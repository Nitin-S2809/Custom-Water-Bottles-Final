const nodemailer = require('nodemailer');

let cachedTransporter = null;
let cachedTransportConfig = null;

const getSmtpConfig = () => {
    const host = String(process.env.SMTP_HOST || '').trim();
    const portValue = String(process.env.SMTP_PORT || '').trim();
    const user = String(process.env.SMTP_USER || '').trim();
    const pass = String(process.env.SMTP_PASS || '');
    const from = String(process.env.SMTP_FROM || '').trim();
    const secureValue = String(process.env.SMTP_SECURE || '').trim().toLowerCase();

    if (!host || !portValue || !user || !pass.trim() || !from) {
        const error = new Error('SMTP settings are incomplete');
        error.code = 'SMTP_CONFIG_INCOMPLETE';
        throw error;
    }

    const port = Number(portValue);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        const error = new Error('SMTP_PORT must be a valid port number');
        error.code = 'SMTP_CONFIG_INVALID';
        throw error;
    }

    if (secureValue && !['true', 'false'].includes(secureValue)) {
        const error = new Error('SMTP_SECURE must be true or false');
        error.code = 'SMTP_CONFIG_INVALID';
        throw error;
    }

    return {
        host,
        port,
        user,
        pass,
        from,
        secure: secureValue ? secureValue === 'true' : port === 465,
    };
};

const sameTransportConfig = (left, right) => left && right &&
    left.host === right.host &&
    left.port === right.port &&
    left.user === right.user &&
    left.pass === right.pass &&
    left.from === right.from &&
    left.secure === right.secure;

const getTransporter = () => {
    const config = getSmtpConfig();

    if (!cachedTransporter || !sameTransportConfig(cachedTransportConfig, config)) {
        cachedTransporter?.close();
        cachedTransporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: { user: config.user, pass: config.pass },
        });
        cachedTransportConfig = config;
    }

    return { transporter: cachedTransporter, from: config.from };
};

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
}[character]));

module.exports.isConfigured = () => {
    const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL;
    try {
        getSmtpConfig();
        const parsedUrl = new URL(clientUrl);
        return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
        return false;
    }
};

module.exports.verifySmtpConnection = async () => {
    const { transporter } = getTransporter();
    return transporter.verify();
};

const getResetUrl = (token) => {
    const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL;
    if (!clientUrl) throw new Error('CLIENT_URL is not configured');

    const resetUrl = new URL(clientUrl);
    resetUrl.pathname = `${resetUrl.pathname.replace(/\/$/, '')}/reset-password/${encodeURIComponent(token)}`;
    resetUrl.search = '';
    resetUrl.hash = '';
    return resetUrl.toString();
};

module.exports.send = async ({ email, username, token }) => {
    const resetUrl = getResetUrl(token);
    const { transporter, from } = getTransporter();
    const safeUsername = username ? escapeHtml(username) : '';
    const greeting = safeUsername ? `Hello ${safeUsername},` : 'Hello,';

    await transporter.sendMail({
        from,
        to: email,
        subject: 'Reset your AquaBrand password',
        text: `${greeting}\n\nWe received a request to reset your AquaBrand password.\n\nOpen this link to reset your password: ${resetUrl}\n\nThis link will expire after 30 minutes. If you did not request this, you can safely ignore this email.\n\nAquaBrand`,
        html: `<p>${greeting}</p><p>We received a request to reset your AquaBrand password.</p><p><a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#1769c2;color:#fff;text-decoration:none;border-radius:8px">Reset Password</a></p><p>This link will expire after 30 minutes. If you did not request this, you can safely ignore this email.</p><p>AquaBrand</p>`
    });
};

module.exports.sendDeliveryOtp = async ({ email, username, orderId, otp, expiresInMinutes }) => {
    const { transporter, from } = getTransporter();
    const safeUsername = escapeHtml(username || 'Customer');
    const safeOrderId = escapeHtml(orderId);
    const safeOtp = escapeHtml(otp);
    const greeting = `Hello ${safeUsername},`;
    const expiration = `This OTP is valid for ${expiresInMinutes} minutes.`;

    await transporter.sendMail({
        from,
        to: email,
        subject: 'AquaBrand Delivery Verification OTP',
        text: `${greeting}\n\nYour AquaBrand order is ready for delivery verification.\n\nYour delivery verification OTP is: ${otp}\n\nPlease provide this OTP to the authorized AquaBrand delivery supplier to confirm delivery of your order. ${expiration}\n\nIf you did not expect this delivery verification, please contact AquaBrand support.\n\nOrder ID: ${orderId}\n\nRegards,\nAquaBrand Team`,
        html: `<!doctype html><html><body style="margin:0;padding:24px;background:#f3f7fb;font-family:Arial,sans-serif;color:#18324b"><div style="max-width:560px;margin:0 auto;padding:32px 24px;background:#fff;border:1px solid #dce7f1;border-radius:16px"><p>${greeting}</p><p>Your AquaBrand order is ready for delivery verification.</p><p>Your delivery verification OTP is:</p><p style="margin:24px 0;padding:18px;text-align:center;background:#eef6ff;border-radius:12px;color:#1457a6;font-size:32px;font-weight:700;letter-spacing:8px">${safeOtp}</p><p>Please provide this OTP to the authorized AquaBrand delivery supplier to confirm delivery of your order.</p><p>${expiration}</p><p>If you did not expect this delivery verification, please contact AquaBrand support.</p><p style="margin-top:24px"><strong>Order ID:</strong> ${safeOrderId}</p><p style="margin-top:32px;color:#587086">Regards,<br />AquaBrand Team</p></div></body></html>`
    });
};