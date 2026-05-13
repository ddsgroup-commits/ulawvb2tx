#!/usr/bin/env tsx
/**
 * Generate VAPID keys for Web Push notifications.
 * Run: pnpm vapid:keys
 * Then add the output to your .env file.
 */
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();
console.log("\n# Web Push VAPID keys — add to .env\n");
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_SUBJECT=mailto:admin@ulawvb2tx.com\n`);
