import express from 'express';
import { getShopByUrl, getShops, createShop, getShopBySearch, incrementShopClickCount } from '../controllers/shopController.js';

const router = express.Router();

router.get('/', getShops);
router.post('/', createShop);
router.get('/search', getShopBySearch);
router.post('/shopByUrl', getShopByUrl);
router.patch("/:shopId/click", incrementShopClickCount);


export default router;
