import { Router } from "express";
import { getUsers, getAnalytics } from "./admin.controller";
import { protect } from "../../middleware/authMiddleware";
import { restrictTo } from "../../middleware/roleMiddleware";

const router = Router();

/**
 * All admin routes require strict authentication and 'admin' role permissions
 */
router.use(protect);
router.use(restrictTo("admin"));

/**
 * GET: Retrieve list of users
 */
router.get("/users", getUsers);

/**
 * GET: Core Analytics Data (e.g. Total counts, Revenue)
 */
router.get("/analytics", getAnalytics);

export default router;
