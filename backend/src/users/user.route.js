const express =  require('express');
const User = require('./user.model');
const Address = require('../address/address.model');
const mongoose = require('mongoose');
const Book = require('../books/book.model');
const Interaction = require('../interactions/interaction.model');
const { triggerRecommendationRebuild } = require('../recommendations/recommendation.update');
const upload = require('../middleware/upload');
const { uploadFile } = require('../utils/uploadToCloud');

const router =  express.Router();

const decodeEmailParam = (value = '') => decodeURIComponent(value);

const findUserByEmailOrUsername = async (email) => {
    if (!email) return null;
    let user = await User.findOne({ email });
    if (!user) {
        user = await User.findOne({ username: email });
        if (user && !user.email) {
            user.email = email;
            await user.save();
        }
    }
    return user;
};

const createPlaceholderUser = async (email, overrides = {}) => {
    const baseUsername = email && email.includes('@') ? email.split('@')[0] : `user_${Date.now().toString(36)}`;
    const username = `${baseUsername}_${Date.now().toString(36).slice(-4)}`;
    return User.create({
        username,
        email,
        ...overrides
    });
};

const ensureUserDocument = async (email, overrides = {}) => {
    let user = await findUserByEmailOrUsername(email);
    if (!user) {
        user = await createPlaceholderUser(email, overrides);
    }
    return user;
};

const resolveAddressName = (address = {}) => {
    const firstName = (address.firstName || '').trim();
    const lastName = (address.lastName || '').trim();
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
    return { firstName, lastName, fullName };
};

const formatAddressResponse = (address = {}) => {
    const { firstName, lastName, fullName } = resolveAddressName(address);
    return {
        id: (address._id || address.id || new mongoose.Types.ObjectId()).toString(),
        firstName,
        lastName,
        fullName,
        street: address.street,
        city: address.city,
        state: address.state,
        country: address.country,
        zipcode: address.zipcode
    };
};

const buildUserResponse = (user, fallbackEmail, addresses = []) => ({
    id: user._id,
    firebaseId: user.firebaseId,
    username: user.username,
    email: user.email || fallbackEmail,
    phoneNumber: user.phoneNumber || '',
    avatar: user.avatar || '',
    wishlist: (user.wishlist || []).map((id) => id.toString()),
    addresses: addresses.map(formatAddressResponse)
});

const fetchUserAddresses = async (email) => {
    if (!email) return [];
    const docs = await Address.find({ userEmail: email }).sort({ createdAt: 1 });
    return docs.map(formatAddressResponse);
};

const buildUserResponseWithAddresses = async (user, fallbackEmail) => {
    const addresses = await fetchUserAddresses(fallbackEmail || user.email);
    return buildUserResponse(user, fallbackEmail, addresses);
};

const normalizeAddressPayload = (payload = {}) => {
    const normalizeText = (value = '') => (typeof value === 'string' ? value.trim() : '');
    const firstName = normalizeText(payload.firstName || payload.label);
    const lastName = normalizeText(payload.lastName || payload.recipientName);
    return {
        firstName,
        lastName,
        street: normalizeText(payload.street),
        city: normalizeText(payload.city),
        state: normalizeText(payload.state),
        country: normalizeText(payload.country),
        zipcode: normalizeText(payload.zipcode),
        isDefault: Boolean(payload.isDefault)
    };
};

const ensureDefaultAddress = async () => {};

const ensureSingleDefaultAddress = (addresses = [], preferredId = null) => {
    if (!addresses.length) return addresses;
    let targetId = preferredId;
    if (!targetId) {
        const existingDefault = addresses.find((addr) => addr.isDefault);
        targetId = existingDefault ? existingDefault.id : addresses[0].id;
    }
    return addresses.map((addr) => ({
        ...addr,
        isDefault: addr.id === targetId
    }));
};

router.post("/customers/sync", async (req, res) => {
    try {
        const { email, username, firebaseId } = req.body;
        if(!email) return res.status(400).json({ message: 'Email is required' });        
        let user = null;
        if (firebaseId) {
            user = await User.findOne({ firebaseId });
        }
        if (!user) {
            user = await User.findOne({ email });
        }
        
        if(!user) {
            const defaultUsername = username || email.split('@')[0] + '_' + Date.now().toString().slice(-6);
            user = await User.create({ 
                username: defaultUsername, 
                email: email,
                firebaseId: firebaseId || undefined
            });
            // trigger recommendation rebuild for new user
            setImmediate(() => triggerRecommendationRebuild("new-user-created"));
        } else {
            if (username && user.username !== username) {
                user.username = username;
            }
            if (firebaseId && user.firebaseId !== firebaseId) {
                user.firebaseId = firebaseId;
            }
            if (!user.email) {
                user.email = email;
            }
            await user.save();
        }
        
        return res.status(200).json(await buildUserResponseWithAddresses(user, email));
    } catch (error) {
        console.error('Failed to sync customer', error);
        return res.status(500).json({ message: 'Failed to sync customer' });
    }
});

router.get("/customers/:email", async (req, res) => {
    try {
        const email = decodeEmailParam(req.params.email);
        let user = await findUserByEmailOrUsername(email);
        
        if(!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json(await buildUserResponseWithAddresses(user, email));
    } catch (error) {
        console.error('Failed to get user', error);
        return res.status(500).json({ message: 'Failed to get user' });
    }
});

router.put("/customers/:email/phone", async (req, res) => {
    try {
        const email = decodeEmailParam(req.params.email);
        const { phoneNumber } = req.body;
        
        let user = await findUserByEmailOrUsername(email);
        if(!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        user.phoneNumber = phoneNumber || '';
        await user.save();
        
        return res.status(200).json(await buildUserResponseWithAddresses(user, email));
    } catch (error) {
        console.error('Failed to update phone number', error);
        return res.status(500).json({ message: 'Failed to update phone number' });
    }
});

router.put("/customers/:email/username", async (req, res) => {
    try {
        const email = decodeEmailParam(req.params.email);
        const { username } = req.body;
        
        if(!username) {
            return res.status(400).json({ message: 'Username is required' });
        }
        
        let user = await findUserByEmailOrUsername(email);
        if(!user) {
            try {
                user = await User.create({ 
                    username: username, 
                    email: email
                });
                // trigger recommendation rebuild for new user
                setImmediate(() => triggerRecommendationRebuild("new-user-created"));
            } catch (createError) {
                console.error('Failed to create user during update', createError);
                return res.status(500).json({ message: 'Failed to create user. Please try logging in again.' });
            }
        } else {
            user.username = username;
            if(!user.email) {
                user.email = email;
            }
            await user.save();
        }
        
        return res.status(200).json(await buildUserResponseWithAddresses(user, email));
    } catch (error) {
        console.error('Failed to update username', error);
        return res.status(500).json({ message: 'Failed to update username' });
    }
});

router.post("/customers/:email/wishlist", async (req, res) => {
    try {
        const email = decodeEmailParam(req.params.email);
        const { bookId } = req.body;

        if (!bookId) {
            return res.status(400).json({ message: 'bookId is required' });
        }

        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).json({ message: 'Invalid bookId' });
        }

        const bookExists = await Book.exists({ _id: bookId });
        if (!bookExists) {
            return res.status(404).json({ message: 'Book not found' });
        }

        const user = await ensureUserDocument(email);
        user.wishlist = user.wishlist || [];
        const alreadyExists = user.wishlist.some((id) => id.toString() === bookId);
        if (!alreadyExists) {
            user.wishlist.push(bookId);
            await user.save();
            
            try {
                const interaction = new Interaction({
                    userId: user._id,
                    bookId: new mongoose.Types.ObjectId(bookId),
                    interactionType: 'wishlist'
                });
                await interaction.save();
                
                // trigger recommendation rebuild after wishlist addition
                setImmediate(() => triggerRecommendationRebuild("wishlist-added"));
            } catch (interactionError) {
                console.error('Failed to log wishlist interaction:', interactionError);
            }
        }

        return res.status(200).json(await buildUserResponseWithAddresses(user, email));
    } catch (error) {
        console.error('Failed to add to wishlist', error);
        return res.status(500).json({ message: 'Failed to update wishlist' });
    }
});

router.delete("/customers/:email/wishlist/:bookId", async (req, res) => {
    try {
        const email = decodeEmailParam(req.params.email);
        const { bookId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).json({ message: 'Invalid bookId' });
        }

        const user = await findUserByEmailOrUsername(email);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.wishlist = (user.wishlist || []).filter((id) => id.toString() !== bookId);
        await user.save();

        return res.status(200).json(await buildUserResponseWithAddresses(user, email));
    } catch (error) {
        console.error('Failed to remove from wishlist', error);
        return res.status(500).json({ message: 'Failed to update wishlist' });
    }
});


router.post("/customers/:email/addresses", async (req, res) => {
    try {
        const email = decodeEmailParam(req.params.email);
        const addressPayload = normalizeAddressPayload(req.body);
        const user = await ensureUserDocument(email);
        await Address.create({ ...addressPayload, userEmail: email });
        return res.status(200).json(await buildUserResponseWithAddresses(user, email));
    } catch (error) {
        console.error('Failed to add address', error);
        return res.status(500).json({ message: 'Failed to add address' });
    }
});

router.put("/customers/:email/addresses/:addressId", async (req, res) => {
    try {
        const email = decodeEmailParam(req.params.email);
        const { addressId } = req.params;
        const updates = normalizeAddressPayload(req.body);

        const address = await Address.findOne({ _id: addressId, userEmail: email });
        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        Object.assign(address, updates);
        await address.save();

        const user = await ensureUserDocument(email);
        return res.status(200).json(await buildUserResponseWithAddresses(user, email));
    } catch (error) {
        console.error('Failed to update address', error);
        return res.status(500).json({ message: 'Failed to update address' });
    }
});

router.delete("/customers/:email/addresses/:addressId", async (req, res) => {
    try {
        const email = decodeEmailParam(req.params.email);
        const { addressId } = req.params;

        const deleted = await Address.findOneAndDelete({ _id: addressId, userEmail: email });
        if (!deleted) {
            return res.status(404).json({ message: 'Address not found' });
        }

        const user = await ensureUserDocument(email);
        return res.status(200).json(await buildUserResponseWithAddresses(user, email));
    } catch (error) {
        console.error('Failed to delete address', error);
        return res.status(500).json({ message: 'Failed to delete address' });
    }
});

router.post("/customers/:email/addresses/:addressId/default", async (req, res) => {
    return res.status(400).json({ message: 'Default address selection is disabled.' });
});

router.post("/customers/:email/avatar", upload.single('file'), async (req, res) => {
    try {
        const email = decodeEmailParam(req.params.email);

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file provided' });
        }

        const user = await ensureUserDocument(email);

        const result = await uploadFile(req.file, 'avatars', 'image');

        user.avatar = result.url;
        await user.save();

        return res.status(200).json(await buildUserResponseWithAddresses(user, email));
    } catch (error) {
        console.error('Failed to upload avatar', error);
        return res.status(500).json({ message: 'Failed to upload avatar' });
    }
});

module.exports = router;