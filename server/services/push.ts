import webpush from "web-push";
import { storage } from "../storage";

// Generate VAPID keys once and store them for the session
let vapidPublicKey: string;
let vapidPrivateKey: string;

// Initialize VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
} else {
    // Generate new keys for development
    const vapidKeys = webpush.generateVAPIDKeys();
    vapidPublicKey = vapidKeys.publicKey;
    vapidPrivateKey = vapidKeys.privateKey;
    console.log("Generated VAPID Keys (Add these to your .env for persistence):");
    console.log("VAPID_PUBLIC_KEY=" + vapidPublicKey);
    console.log("VAPID_PRIVATE_KEY=" + vapidPrivateKey);
}

webpush.setVapidDetails(
    "mailto:notifications@lifeos.app",
    vapidPublicKey,
    vapidPrivateKey
);

// Export the public key so the client can subscribe
export function getVapidPublicKey(): string {
    return vapidPublicKey;
}

export async function sendPushNotification(userId: string, title: string, body: string, url = "/") {
    console.log(`[PUSH] Sending to user ${userId}: ${title} - ${body}`);

    try {
        // Retrieve ALL subscriptions for the user (multi-device support)
        const subscriptions = await storage.getAllPushSubscriptions(userId);

        if (subscriptions.length === 0) {
            console.log(`[PUSH] No subscriptions found for user ${userId}`);
            return;
        }

        console.log(`[PUSH] Found ${subscriptions.length} device(s) for user ${userId}`);

        const payload = JSON.stringify({
            title,
            body,
            url,
            icon: "/favicon.png",
            badge: "/favicon.png",
        });

        // Send to all devices
        const results = await Promise.allSettled(
            subscriptions.map(async (subscription) => {
                const pushSubscription = {
                    endpoint: subscription.endpoint,
                    keys: subscription.keys as { p256dh: string; auth: string },
                };
                return webpush.sendNotification(pushSubscription, payload);
            })
        );

        const successful = results.filter(r => r.status === "fulfilled").length;
        const failed = results.filter(r => r.status === "rejected").length;

        console.log(`[PUSH] Sent to ${successful}/${subscriptions.length} devices (${failed} failed)`);
    } catch (error) {
        console.error(`[PUSH] Error sending notification to user ${userId}:`, error);
    }
}

