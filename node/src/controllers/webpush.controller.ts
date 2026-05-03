import { NextFunction, Request, Response } from "express";
import SubscriptionRepository from "@/repositories/subscription.repository";
import WebPushService from "@/services/webpush.service";
import { NotFoundError, UnprocessableEntityError } from "@/core/errors";
import {
  ERROR_REQUIRED_ENDPOINT_KEYS,
  ERROR_REQUIRED_TITLE_BODY,
  ERROR_SUBSCRIPTION_NOT_FOUND,
  SUCCESS_BROADCAST_SENT,
  SUCCESS_NOTIFICATION_SENT,
  SUCCESS_SUBSCRIBED,
  SUCCESS_UNSUBSCRIBED,
} from "@/core/messages";
import { NotificationData } from "@/types/notification";

export default class WebPushController {
  static async subscribe(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { endpoint, keys } = req.body ?? {};
      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        throw new UnprocessableEntityError(ERROR_REQUIRED_ENDPOINT_KEYS);
      }
      await SubscriptionRepository.create({
        user_id: req.user_id!,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      });
      res.status(201).json({ status_code: 201, detail: SUCCESS_SUBSCRIBED });
    } catch (e) {
      next(e);
    }
  }

  static async unsubscribeAll(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await SubscriptionRepository.deleteAllByUser(req.user_id!);
      res.json({ status_code: 200, detail: SUCCESS_UNSUBSCRIBED });
    } catch (e) {
      next(e);
    }
  }

  static async deleteByEndpoint(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const endpoint = req.query.endpoint as string | undefined;
      if (!endpoint) throw new NotFoundError(ERROR_SUBSCRIPTION_NOT_FOUND);
      await SubscriptionRepository.deleteByEndpoint(endpoint);
      res.json({ status_code: 200, detail: SUCCESS_UNSUBSCRIBED });
    } catch (e) {
      next(e);
    }
  }

  static async notifyUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user_id = String(req.params.user_id ?? "");
      const data = req.body as NotificationData;
      if (!data?.title || !data?.body) {
        throw new UnprocessableEntityError(ERROR_REQUIRED_TITLE_BODY);
      }
      const result = await WebPushService.sendToUser(user_id, data);
      res.json({
        status_code: 200,
        detail: SUCCESS_NOTIFICATION_SENT,
        ...result,
      });
    } catch (e) {
      next(e);
    }
  }

  static async broadcast(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = req.body as NotificationData;
      if (!data?.title || !data?.body) {
        throw new UnprocessableEntityError(ERROR_REQUIRED_TITLE_BODY);
      }
      const result = await WebPushService.broadcast(data);
      res.json({
        status_code: 200,
        detail: SUCCESS_BROADCAST_SENT,
        ...result,
      });
    } catch (e) {
      next(e);
    }
  }
}
