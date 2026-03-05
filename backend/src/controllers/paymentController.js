const Contribution = require('../models/Contribution');
const FundRequest = require('../models/FundRequest');
const ExperimentWallet = require('../models/ExperimentWallet');
const auditService = require('../services/auditService');
const payhereService = require('../services/payhereService');
const logger = require('../utils/logger');

const createPayment = async (req, res, next) => {
    try {
        const { fundRequestId, amount, notes } = req.body;

        if (!fundRequestId || !amount || amount <= 0) {
            return res.status(400).json({ message: 'fundRequestId and a positive amount are required.' });
        }

        const fundRequest = await FundRequest.findById(fundRequestId);
        if (!fundRequest) {
            return res.status(404).json({ message: 'Fund request not found.' });
        }

        if (fundRequest.status !== 'OPEN_FOR_FUNDING' || !fundRequest.isOpenForFunding) {
            return res.status(400).json({ message: 'This fund request is not currently open for funding.' });
        }

        const remaining = fundRequest.targetAmount - fundRequest.raisedAmount;
        if (amount > remaining) {
            return res.status(400).json({
                message: `Amount exceeds remaining target. Remaining: ${remaining}`
            });
        }

        const orderId = `HLTH-${fundRequest._id.toString().slice(-6)}-${Date.now()}`;

        const contribution = await Contribution.create({
            fundRequestId: fundRequest._id,
            experimentId: fundRequest.experimentId,
            contributorUserId: req.user._id,
            amount,
            paymentStatus: 'PENDING',
            paymentReferenceId: orderId,
            notes: notes || '',
            walletCredited: false
        });

        await auditService.logAction({
            actorId: req.user._id,
            actorRole: req.user.role,
            action: 'CONTRIBUTION_CREATED',
            fundRequestId: fundRequest._id,
            experimentId: fundRequest.experimentId,
            metadata: { contributionId: contribution._id, amount, orderId }
        });

        const currency = 'LKR';
        const hash = payhereService.generateHash(orderId, amount, currency);

        return res.status(201).json({
            message: 'Payment initiated. Use the checkout payload to redirect to PayHere.',
            contribution,
            checkout: {
                sandbox: payhereService.SANDBOX,
                checkout_url: payhereService.getCheckoutUrl(),
                merchant_id: payhereService.MERCHANT_ID,
                return_url: process.env.PAYHERE_RETURN_URL || 'http://localhost:3000/payment/success',
                cancel_url: process.env.PAYHERE_CANCEL_URL || 'http://localhost:3000/payment/cancel',
                notify_url: process.env.PAYHERE_NOTIFY_URL || 'http://localhost:5000/api/payments/webhook',
                order_id: orderId,
                items: `Contribution to Fund Request ${fundRequest._id}`,
                currency,
                amount: Number(amount).toFixed(2),
                first_name: req.user.name?.split(' ')[0] || 'Contributor',
                last_name: req.user.name?.split(' ').slice(1).join(' ') || '',
                email: req.user.email || '',
                phone: req.user.phone || '',
                address: '',
                city: '',
                country: 'Sri Lanka',
                hash
            }
        });
    } catch (error) {
        logger.error('createPayment error', error);
        next(error);
    }
};

const paymentWebhook = async (req, res) => {
    try {
        const {
            merchant_id,
            order_id,
            payhere_amount,
            payhere_currency,
            status_code,
            md5sig,
            payment_id
        } = req.body;

        logger.info('PayHere webhook received', { order_id, status_code, payment_id });

        const isValid = payhereService.verifyWebhookHash(
            merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig
        );

        if (!isValid) {
            logger.warn('PayHere webhook: Invalid hash', { order_id });
            return res.status(400).send('Invalid hash');
        }

        const contribution = await Contribution.findOne({ paymentReferenceId: order_id });
        if (!contribution) {
            logger.warn('PayHere webhook: Contribution not found', { order_id });
            return res.status(404).send('Contribution not found');
        }

        if (contribution.walletCredited) {
            logger.info('PayHere webhook: Already processed', { order_id });
            return res.status(200).send('Already processed');
        }

        const statusNum = parseInt(status_code, 10);

        if (statusNum === 2) {
            contribution.paymentStatus = 'SUCCESS';
            contribution.walletCredited = true;
            contribution.creditedAt = new Date();
            await contribution.save();

            const fundRequest = await FundRequest.findById(contribution.fundRequestId);
            if (fundRequest) {
                fundRequest.raisedAmount += contribution.amount;

                if (fundRequest.raisedAmount >= fundRequest.targetAmount) {
                    fundRequest.status = 'FUNDED';
                    fundRequest.isOpenForFunding = false;
                    fundRequest.fundedAt = new Date();
                }
                await fundRequest.save();
            }

            let wallet = await ExperimentWallet.findOne({ experimentId: contribution.experimentId });
            if (!wallet) {
                wallet = await ExperimentWallet.create({
                    experimentId: contribution.experimentId,
                    balance: 0
                });
            }
            wallet.balance += contribution.amount;
            wallet.lastUpdatedAt = new Date();
            await wallet.save();

            await auditService.logAction({
                actorId: contribution.contributorUserId,
                actorRole: 'SYSTEM',
                action: 'PAYMENT_WEBHOOK_SUCCESS',
                fundRequestId: contribution.fundRequestId,
                experimentId: contribution.experimentId,
                metadata: {
                    contributionId: contribution._id,
                    amount: contribution.amount,
                    payhere_payment_id: payment_id,
                    order_id
                }
            });

            await auditService.logAction({
                actorId: contribution.contributorUserId,
                actorRole: 'SYSTEM',
                action: 'WALLET_CREDIT',
                fundRequestId: contribution.fundRequestId,
                experimentId: contribution.experimentId,
                metadata: {
                    contributionId: contribution._id,
                    creditedAmount: contribution.amount,
                    newBalance: wallet.balance
                }
            });

            logger.info('PayHere webhook: Payment SUCCESS', { order_id, amount: contribution.amount });

        } else if (statusNum === -1 || statusNum === -2) {
            contribution.paymentStatus = 'FAILED';
            await contribution.save();

            await auditService.logAction({
                actorId: contribution.contributorUserId,
                actorRole: 'SYSTEM',
                action: 'PAYMENT_WEBHOOK_FAILED',
                fundRequestId: contribution.fundRequestId,
                experimentId: contribution.experimentId,
                metadata: { contributionId: contribution._id, status_code, order_id }
            });

            logger.info('PayHere webhook: Payment FAILED', { order_id, status_code });

        } else {
            logger.info('PayHere webhook: Pending/Other status', { order_id, status_code });
        }

        return res.status(200).send('OK');

    } catch (error) {
        logger.error('PayHere webhook error', error);
        return res.status(500).send('Internal server error');
    }
};

const getPaymentStatus = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const contribution = await Contribution.findOne({ paymentReferenceId: orderId });

        if (!contribution) {
            return res.status(404).json({ message: 'Payment not found.' });
        }

        if (
            contribution.contributorUserId.toString() !== req.user._id.toString() &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({ message: 'Not authorized to view this payment.' });
        }

        return res.json({
            orderId,
            paymentStatus: contribution.paymentStatus,
            amount: contribution.amount,
            walletCredited: contribution.walletCredited,
            creditedAt: contribution.creditedAt,
            createdAt: contribution.createdAt
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createPayment,
    paymentWebhook,
    getPaymentStatus
};
