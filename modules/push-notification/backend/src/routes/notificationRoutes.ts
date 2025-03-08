import { Router } from 'express';
import express from 'express';
import {NotificationController} from '../controllers/notificationController';

const router = Router();
const notificationController = new NotificationController();

export function setNotificationRoutes(app: express.Application) {
  app.post('/subscribe', notificationController.subscribe.bind(notificationController));
  app.post('/sendNotification', notificationController.sendNotification.bind(notificationController));
}