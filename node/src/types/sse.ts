export interface SSEEvent<T = unknown> {
  type: string;
  payload: T;
  message_id?: string;
}
