import express from "express";
import { getStatus } from "../controllers/baseController.js";

const router = express.Router();

// Simple health check route
router.get("/", getStatus);

export default router;
