"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setNotificationRoutes = void 0;
const express_1 = require("express");
const notificationController_1 = __importDefault(require("../controllers/notificationController"));
const router = (0, express_1.Router)();
const notificationController = new notificationController_1.default();
function setNotificationRoutes(app) {
    app.post('/subscribe', notificationController.subscribe.bind(notificationController));
    app.post('/sendNotification', notificationController.sendNotification.bind(notificationController));
}
exports.setNotificationRoutes = setNotificationRoutes;
