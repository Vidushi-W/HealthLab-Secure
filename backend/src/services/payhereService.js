const crypto = require('crypto');

const MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID;
const MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET;
const SANDBOX = process.env.PAYHERE_SANDBOX === 'true';

const assertConfigured = () => {
    if (!MERCHANT_ID || !MERCHANT_SECRET) {
        const error = new Error('Payment service is not configured. Set PAYHERE_MERCHANT_ID and PAYHERE_MERCHANT_SECRET.');
        error.statusCode = 503;
        throw error;
    }
};

const getCheckoutUrl = () =>
    SANDBOX
        ? 'https://sandbox.payhere.lk/pay/checkout'
        : 'https://www.payhere.lk/pay/checkout';

const generateHash = (orderId, amount, currency = 'LKR') => {
    assertConfigured();
    const formattedAmount = Number(amount).toFixed(2);
    const secretHash = crypto
        .createHash('md5')
        .update(MERCHANT_SECRET)
        .digest('hex')
        .toUpperCase();

    const raw = MERCHANT_ID + orderId + formattedAmount + currency + secretHash;
    return crypto.createHash('md5').update(raw).digest('hex').toUpperCase();
};

const verifyWebhookHash = (merchantId, orderId, payhereAmount, payhereCurrency, statusCode, md5sig) => {
    assertConfigured();
    const secretHash = crypto
        .createHash('md5')
        .update(MERCHANT_SECRET)
        .digest('hex')
        .toUpperCase();

    const localRaw = merchantId + orderId + payhereAmount + payhereCurrency + statusCode + secretHash;
    const localHash = crypto.createHash('md5').update(localRaw).digest('hex').toUpperCase();

    return localHash === md5sig;
};

module.exports = {
    generateHash,
    verifyWebhookHash,
    getCheckoutUrl,
    MERCHANT_ID,
    SANDBOX
};
