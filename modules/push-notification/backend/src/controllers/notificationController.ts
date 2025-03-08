import { Request, Response } from 'express';
import webPush from 'web-push';

export class NotificationController {
  private subscriptions: any[] = [];

  constructor() {
    // Generate VAPID keys
    const vapidKeys = webPush.generateVAPIDKeys();
    webPush.setVapidDetails(
      'mailto:your-email@example.com',
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );

    console.log('Public Key:', vapidKeys.publicKey);
    console.log('Private Key:', vapidKeys.privateKey);
  }

  public subscribe(req: Request, res: Response): void {
    const subscription = req.body;
    this.subscriptions.push(subscription);
    res.status(201).json({});
  }

  public sendNotification(req: Request, res: Response): void {
    const { title, body } = req.body;
    const payload = JSON.stringify({ title, body });

    this.subscriptions.forEach(subscription => {
      webPush.sendNotification(subscription, payload).catch(error => {
        console.error('Error sending notification:', error);
      });
    });

    res.status(200).json({});
  }
}