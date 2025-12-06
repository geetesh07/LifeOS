import webpush from "web-push";
import { storage } from "../storage";

// VAPID keys should be generated once and stored in env vars
// For this setup, we'll generate them if missing, but in prod they should be fixed
const publicVapidKey = process.env.VAPID_PUBLIC_KEY || "BMk_...placeholder...";
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || "placeholder...";

// If keys are not set, we can generate them (for dev convenience)
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    const vapidKeys = webpush.generateVAPIDKeys();
    console.log("Generated VAPID Keys (Add these to your .env):");
    console.log("VAPID_PUBLIC_KEY=", vapidKeys.publicKey);
    console.log("VAPID_PRIVATE_KEY=", vapidKeys.privateKey);

    webpush.setVapidDetails(
        "mailto:example@yourdomain.org",
        vapidKeys.publicKey,
        vapidKeys.privateKey
    );
} else {
    webpush.setVapidDetails(
        "mailto:example@yourdomain.org",
        publicVapidKey,
        privateVapidKey
    );
}

export async function sendPushNotification(userId: string, title: string, body: string, url = "/") {
    // In a real app, we would store subscriptions in the DB
    // For now, we'll assume we have a way to get them or just log
    console.log(`[PUSH] Sending to user ${userId}: ${title} - ${body}`);

    // TODO: Retrieve subscription from DB
    // const subscription = await storage.getPushSubscription(userId);
    // if (subscription) {
    //   await webpush.sendNotification(subscription, JSON.stringify({ title, body, url }));
    // }
}
