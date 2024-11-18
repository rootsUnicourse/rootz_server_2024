import express from 'express';
import { getCompanyByUrl, getCompanies, createCompany, getCompanyBySearch } from '../controllers/company.js'

const router = express.Router();

router.get('/', getCompanies)
router.post('/', createCompany)
router.get('/search', getCompanyBySearch)
router.post('/companyByUrl', getCompanyByUrl);

export default router