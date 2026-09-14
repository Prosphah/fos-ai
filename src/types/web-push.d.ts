declare module "web-push" {
  interface PushSubscription {
    endpoint: string;
    keys?: {
      p256dh: string;
      auth: string;
    };
  }

  interface SendNotificationOptions {
    TTL?: number;
    urgency?: string;
    topic?: string;
    headers?: Record<string, string>;
  }

  interface WebPushResult {
    statusCode: number;
    body: string;
    headers: Record<string, string>;
  }

  function setVapidDetails(
    subject: string,
    publicKey: string,
    privateKey: string
  ): void;

  function sendNotification(
    subscription: PushSubscription,
    payload: string | Buffer,
    options?: SendNotificationOptions
  ): Promise<WebPushResult>;

  function generateVapidKeys(): {
    publicKey: string;
    privateKey: string;
  };

  const webPush: {
    sendNotification: typeof sendNotification;
    setVapidDetails: typeof setVapidDetails;
    generateVapidKeys: typeof generateVapidKeys;
  };

  export { sendNotification, setVapidDetails, generateVapidKeys };
  export default webPush;
}
