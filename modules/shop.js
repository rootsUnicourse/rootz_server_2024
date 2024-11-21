// models/Shop.js
import mongoose from 'mongoose';

const ShopSchema = new mongoose.Schema({
    image: { type: String, required: true },
    title: { type: String, required: true },
    discount: { type: String, required: true },
    clickCount: {
        type: Number,
        default: 0
    },
    siteUrl: { type: String, required: true },
    description: { type: String, required: true },
});

const Shop = mongoose.model('Shop', ShopSchema);

export default Shop;