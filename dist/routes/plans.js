"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const plans_1 = require("../controllers/plans");
const router = express_1.default.Router();
router.route('/').get(plans_1.fetchAllPlans);
router.route('/plan/:planId').get(plans_1.fetchPlan);
router.route('/user/:userId').get(plans_1.fetchUserWithPlans);
router.route('/category/:categoryId').get(plans_1.fetchCategoryWithPlans);
exports.default = router;
