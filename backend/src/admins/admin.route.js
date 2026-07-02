const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('./admin.model');
const verifyAdminToken = require('../middleware/verifyAdminToken');
const User = require('../users/user.model');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET_KEY;

const buildAdminResponse = (admin) => ({
    _id: admin._id,
    fullName: admin.fullName,
    phoneNumber: admin.phoneNumber,
    businessName: admin.businessName,
    email: admin.email,
    firebaseId: admin.firebaseId,
    createdAt: admin.createdAt
});

const issueAdminToken = (admin) => {
    if (!JWT_SECRET) {
        throw new Error('JWT secret is not configured');
    }
    return jwt.sign(
        {
            id: admin._id,
            email: admin.email,
            businessName: admin.businessName
        },
        JWT_SECRET,
        { expiresIn: '8h' }
    );
};

router.post('/register', async (req, res) => {
    try {
        const { businessName, email, firebaseId, fullName, phoneNumber } = req.body || {};

        if (!businessName || !email || !firebaseId || !fullName || !phoneNumber) {
            return res.status(400).json({ message: 'businessName, fullName, phoneNumber, email and firebaseId are required' });
        }

        const existingAdmin = await Admin.findOne({ $or: [{ email }, { firebaseId }] });
        if (existingAdmin) {
            return res.status(409).json({ message: 'Admin already exists with the provided email or firebaseId' });
        }

        const admin = await Admin.create({ businessName, email, firebaseId, fullName, phoneNumber });
        const token = issueAdminToken(admin);

        return res.status(201).json({
            message: 'Admin registered successfully',
            admin: buildAdminResponse(admin),
            token
        });
    } catch (error) {
        console.error('Failed to register admin', error);
        return res.status(500).json({ message: 'Failed to register admin' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, firebaseId } = req.body || {};
        if (!email || !firebaseId) {
            return res.status(400).json({ message: 'email and firebaseId are required' });
        }

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        if (admin.firebaseId !== firebaseId) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = issueAdminToken(admin);

        return res.status(200).json({
            message: 'Authentication successful',
            token,
            admin: buildAdminResponse(admin)
        });
    } catch (error) {
        console.error('Failed to login admin', error);
        return res.status(500).json({ message: 'Failed to login admin' });
    }
});

router.get('/users', verifyAdminToken, async (_req, res) => {
    try {
        const users = await User.find({})
            .select('username email firebaseId phoneNumber createdAt updatedAt')
            .sort({ createdAt: -1 });
        return res.status(200).json(users);
    } catch (error) {
        console.error('Failed to get users', error);
        return res.status(500).json({ message: 'Failed to get users' });
    }
});

router.get('/profile', verifyAdminToken, async (req, res) => {
    try {
        const admin = await Admin.findById(req.user?.id);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        return res.status(200).json({
            admin: buildAdminResponse(admin)
        });
    } catch (error) {
        console.error('Failed to fetch admin profile', error);
        return res.status(500).json({ message: 'Failed to fetch admin profile' });
    }
});

router.put('/profile', verifyAdminToken, async (req, res) => {
    try {
        const { fullName, phoneNumber, businessName } = req.body || {};

        if (!fullName && !phoneNumber && !businessName) {
            return res.status(400).json({ message: 'Provide at least one field to update' });
        }

        const admin = await Admin.findById(req.user?.id);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        if (fullName !== undefined) admin.fullName = fullName;
        if (phoneNumber !== undefined) admin.phoneNumber = phoneNumber;
        if (businessName !== undefined) admin.businessName = businessName;

        await admin.save();

        return res.status(200).json({
            message: 'Profile updated successfully',
            admin: buildAdminResponse(admin)
        });
    } catch (error) {
        console.error('Failed to update admin profile', error);
        return res.status(500).json({ message: 'Failed to update admin profile' });
    }
});

module.exports = router;

