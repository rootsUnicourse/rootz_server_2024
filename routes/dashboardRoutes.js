import express from "express";
import { getDashboardData, incrementSiteVisits } from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/", getDashboardData);
router.post("/visit", incrementSiteVisits); // Route to increment site visits

export default router;
