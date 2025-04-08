"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCategoryWithPlans = exports.fetchUserWithPlans = exports.fetchPlan = exports.fetchAllPlans = void 0;
const dummyData_json_1 = __importDefault(require("../dummyData.json"));
const dummyPlans = dummyData_json_1.default.plans;
const dummyStops = dummyData_json_1.default.stops;
const dummyCategories = dummyData_json_1.default.categories;
const dummyUsers = dummyData_json_1.default.users;
const PAGE_SIZE = 10;
const fetchAllPlans = (req, res) => {
    const { categoryId, page = 1, size = PAGE_SIZE } = req.query;
    let resultPlans = dummyPlans;
    if (categoryId) {
        resultPlans = resultPlans.filter((plan) => {
            return plan.categoryId === categoryId;
        });
    }
    // Pagination
    const pageNumber = parseInt(page);
    const pageSize = parseInt(size);
    resultPlans = resultPlans.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
    res.json({
        ...(categoryId && { categoryId }),
        page: pageNumber,
        size: pageSize,
        items: resultPlans,
    });
};
exports.fetchAllPlans = fetchAllPlans;
const fetchUserWithPlans = (req, res) => {
    const { userId, page = 1, size = PAGE_SIZE } = req.params;
    const user = dummyUsers.find((user) => {
        return user.userId === userId;
    });
    if (!user) {
        res.status(404).json({
            error: `User with id ${userId} not found`,
        });
        return;
    }
    let resultPlans = dummyPlans;
    resultPlans = resultPlans.filter((plan) => {
        return plan.userId === userId;
    });
    // Pagination
    const pageNumber = parseInt(page);
    const pageSize = parseInt(size);
    resultPlans = resultPlans.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    res.json({
        ...userWithoutPassword,
        plans: {
            page: pageNumber,
            size: pageSize,
            items: resultPlans,
        },
    });
};
exports.fetchUserWithPlans = fetchUserWithPlans;
const fetchCategoryWithPlans = (req, res) => {
    const { categoryId, page = 1, size = PAGE_SIZE } = req.params;
    const category = dummyCategories.find((category) => {
        return category.categoryId === categoryId;
    });
    if (!category) {
        res.status(404).json({
            error: `Category with id ${categoryId} not found`,
        });
        return;
    }
    let resultPlans = dummyPlans;
    resultPlans = resultPlans.filter((plan) => {
        return plan.categoryId === categoryId;
    });
    // Pagination
    const pageNumber = parseInt(page);
    const pageSize = parseInt(size);
    resultPlans = resultPlans.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
    res.json({
        ...category,
        plans: {
            page: pageNumber,
            size: pageSize,
            items: resultPlans,
        },
    });
};
exports.fetchCategoryWithPlans = fetchCategoryWithPlans;
const fetchPlan = (req, res) => {
    const { planId } = req.params;
    const plan = dummyPlans.find((plan) => {
        return plan.planId === planId;
    });
    if (!plan) {
        res.status(400).json({
            error: `Plan with id ${planId} not found`,
        });
        return;
    }
    res.json({
        ...plan,
        stops: dummyStops.filter((stop) => {
            return stop.planId === planId;
        }),
    });
};
exports.fetchPlan = fetchPlan;
