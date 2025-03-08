"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const web_push_1 = __importDefault(require("web-push"));
class NotificationController {
    constructor() {
        this.subscriptions = [];
        // Generate VAPID keys
        const vapidKeys = web_push_1.default.generateVAPIDKeys();
        web_push_1.default.setVapidDetails('mailto:your-email@example.com', vapidKeys.publicKey, vapidKeys.privateKey);
        console.log('Public Key:', vapidKeys.publicKey);
        console.log('Private Key:', vapidKeys.privateKey);
    }
    subscribe(req, res) {
        const subscription = req.body;
        this.subscriptions.push(subscription);
        res.status(201).json({});
    }
    sendNotification(req, res) {
        const { title, body } = req.body;
        const payload = JSON.stringify({ title, body });
        this.subscriptions.forEach(subscription => {
            web_push_1.default.sendNotification(subscription, payload).catch(error => {
                console.error('Error sending notification:', error);
            });
        });
        res.status(200).json({});
    }
}
exports.NotificationController = NotificationController;
