import express from "express";
import {
  getDashboardData,
  incrementSiteVisits,
  getVisitors, // Import the new controller function
} from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/", getDashboardData); // Route to fetch dashboard data
router.post("/visit", incrementSiteVisits); // Route to increment site visits
router.get("/visitors", getVisitors); // New route to fetch visitors' details

export default router;
