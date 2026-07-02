const Banner = require('./banner.model');

const createBanner = async (req, res) => {
    try {
        const { title, imageUrl, isActive, displayOrder } = req.body;
        const newBanner = new Banner({ title, imageUrl, isActive, displayOrder });
        await newBanner.save();
        res.status(201).json(newBanner);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create banner', message: error.message });
    }
};

const getBanners = async (req, res) => {
    try {
        const banners = await Banner.find();
        res.status(200).json(banners);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get banners', message: error.message });
    }
};

const getBannerById = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) {
            return res.status(404).json({ error: 'Banner not found' });
        }
        res.status(200).json(banner);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get banner', message: error.message });
    }
};

const updateBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, imageUrl, isActive, displayOrder } = req.body;
        const updatedBanner = await Banner.findByIdAndUpdate(id, { title, imageUrl, isActive, displayOrder }, { new: true });
        if (!updatedBanner) {
            return res.status(404).json({ error: 'Banner not found' });
        }
        res.status(200).json(updatedBanner);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update banner', message: error.message });
    }
};

const deleteBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedBanner = await Banner.findByIdAndDelete(id);
        if (!deletedBanner) {
            return res.status(404).json({ error: 'Banner not found' });
        }
        res.status(200).json({ message: 'Banner deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete banner', message: error.message });
    }
};

module.exports = {
    createBanner,
    getBanners,
    getBannerById,
    updateBanner,
    deleteBanner,
};
