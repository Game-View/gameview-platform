import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@gameview/database";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SECRET environment variable");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no Svix headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: "Missing Svix headers" },
      { status: 400 }
    );
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle the webhook
  const eventType = evt.type;
  console.log(`Received Clerk webhook: ${eventType}`);

  try {
    switch (eventType) {
      case "user.created": {
        const { id, email_addresses, first_name, last_name, image_url } =
          evt.data;

        const primaryEmail = email_addresses.find(
          (email) => email.id === evt.data.primary_email_address_id
        );

        if (!primaryEmail) {
          console.error("No primary email found for user:", id);
          return NextResponse.json(
            { error: "No primary email" },
            { status: 400 }
          );
        }

        const displayName =
          [first_name, last_name].filter(Boolean).join(" ").trim() || "User";

        await db.user.create({
          data: {
            clerkId: id,
            email: primaryEmail.email_address,
            displayName,
            avatarUrl: image_url,
          },
        });

        console.log(`Created user in database: ${id}`);
        break;
      }

      case "user.updated": {
        const { id, email_addresses, first_name, last_name, image_url } =
          evt.data;

        const primaryEmail = email_addresses.find(
          (email) => email.id === evt.data.primary_email_address_id
        );

        const displayName =
          [first_name, last_name].filter(Boolean).join(" ").trim() || undefined;

        await db.user.update({
          where: { clerkId: id },
          data: {
            ...(primaryEmail && { email: primaryEmail.email_address }),
            ...(displayName && { displayName }),
            ...(image_url && { avatarUrl: image_url }),
          },
        });

        console.log(`Updated user in database: ${id}`);
        break;
      }

      case "user.deleted": {
        const { id } = evt.data;

        if (id) {
          // Prisma cascade will delete related records
          await db.user.delete({
            where: { clerkId: id },
          });

          console.log(`Deleted user from database: ${id}`);
        }
        break;
      }

      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error handling webhook ${eventType}:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
