import express from 'express';
import { getShopByUrl, getShops, createShop, getShopBySearch } from '../controllers/shopController.js';

const router = express.Router();

router.get('/', getShops);
router.post('/', createShop);
router.get('/search', getShopBySearch);
router.post('/shopByUrl', getShopByUrl);

export default router;
