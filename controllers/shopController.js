import Shop from "../modules/shop.js";

export const getShops = async (req, res) => {
    try {
        const shops = await Shop.find();
        res.status(200).json(shops);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

export const getShopBySearch = async (req, res) => {
    const { searchQuery } = req.query;
    try {
        const regex = new RegExp(searchQuery, "i"); // 'i' for case-insensitive
        const shops = await Shop.find({ title: regex });
        res.status(200).json(shops);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

export const createShop = async (req, res) => {
    const shop = req.body;
    const newShop = new Shop(shop);
    try {
        await newShop.save();
        res.status(201).json(newShop);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
};

export const getShopByUrl = async (req, res) => {
    let { url } = req.body;
    url = new URL(url).origin;  // This will remove extra parameters

    try {
        const shop = await Shop.findOne({ siteUrl: { $regex: url, $options: 'i' } });
        if (shop) {
            res.status(200).json(shop);
        } else {
            res.status(404).json({ message: "Shop not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
