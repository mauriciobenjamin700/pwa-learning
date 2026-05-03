import db from "@/db";

export interface SubscriptionRow {
  id: number;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

function run(sql: string, params: unknown[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err) => (err ? reject(err) : resolve()));
  });
}

function all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) =>
      err ? reject(err) : resolve(rows as T[]),
    );
  });
}

export default class SubscriptionRepository {
  static async create(input: {
    user_id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
  }): Promise<void> {
    await run(
      `INSERT OR REPLACE INTO subscriptions (user_id, endpoint, p256dh, auth)
       VALUES (?, ?, ?, ?)`,
      [input.user_id, input.endpoint, input.p256dh, input.auth],
    );
  }

  static listByUser(user_id: string): Promise<SubscriptionRow[]> {
    return all<SubscriptionRow>(
      `SELECT * FROM subscriptions WHERE user_id = ?`,
      [user_id],
    );
  }

  static listAll(): Promise<SubscriptionRow[]> {
    return all<SubscriptionRow>(`SELECT * FROM subscriptions`);
  }

  static deleteByEndpoint(endpoint: string): Promise<void> {
    return run(`DELETE FROM subscriptions WHERE endpoint = ?`, [endpoint]);
  }

  static deleteAllByUser(user_id: string): Promise<void> {
    return run(`DELETE FROM subscriptions WHERE user_id = ?`, [user_id]);
  }
}
