import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@gameview/database";

/**
 * Stripe Webhook Handler - Sprint 20
 *
 * Handles payment events from Stripe:
 * - checkout.session.completed: Mark purchase as complete
 * - account.updated: Update creator account status
 */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  console.log("[Stripe Webhook] Event received:", event.type);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutExpired(session);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        await handleAccountUpdated(account);
        break;
      }

      default:
        console.log("[Stripe Webhook] Unhandled event type:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error processing event:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout completion
 */
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const { experienceId, userId } = session.metadata || {};

  if (!experienceId || !userId) {
    console.error("[Stripe Webhook] Missing metadata in checkout session");
    return;
  }

  // Find and update the purchase record
  const purchase = await db.purchase.findFirst({
    where: {
      stripePaymentId: session.id,
      status: "PENDING",
    },
  });

  if (purchase) {
    await db.purchase.update({
      where: { id: purchase.id },
      data: {
        status: "COMPLETED",
        updatedAt: new Date(),
      },
    });

    console.log("[Stripe Webhook] Purchase completed:", purchase.id);
  } else {
    // Create new purchase if not found (fallback)
    await db.purchase.create({
      data: {
        userId,
        experienceId,
        amount: session.amount_total ? session.amount_total / 100 : 0,
        currency: session.currency?.toUpperCase() || "USD",
        stripePaymentId: session.id,
        status: "COMPLETED",
      },
    });

    console.log("[Stripe Webhook] Purchase created for session:", session.id);
  }

  // Update analytics (optional: track daily revenue)
  const experience = await db.experience.findUnique({
    where: { id: experienceId },
  });

  if (experience && session.amount_total) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await db.creatorAnalytics.upsert({
      where: {
        experienceId_date: {
          experienceId,
          date: today,
        },
      },
      create: {
        experienceId,
        date: today,
        revenue: session.amount_total / 100,
      },
      update: {
        revenue: {
          increment: session.amount_total / 100,
        },
      },
    });
  }
}

/**
 * Handle expired checkout session
 */
async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  // Mark purchase as failed if it exists
  await db.purchase.updateMany({
    where: {
      stripePaymentId: session.id,
      status: "PENDING",
    },
    data: {
      status: "FAILED",
      updatedAt: new Date(),
    },
  });

  console.log("[Stripe Webhook] Checkout expired:", session.id);
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const sessionId = paymentIntent.metadata?.sessionId;

  if (sessionId) {
    await db.purchase.updateMany({
      where: {
        stripePaymentId: sessionId,
        status: "PENDING",
      },
      data: {
        status: "FAILED",
        updatedAt: new Date(),
      },
    });
  }

  console.log("[Stripe Webhook] Payment failed:", paymentIntent.id);
}

/**
 * Handle Stripe Connect account updates
 */
async function handleAccountUpdated(account: Stripe.Account) {
  const creatorId = account.metadata?.creatorId;

  if (creatorId) {
    // Could update creator status or send notification
    console.log(
      "[Stripe Webhook] Account updated for creator:",
      creatorId,
      "charges_enabled:",
      account.charges_enabled,
      "payouts_enabled:",
      account.payouts_enabled
    );
  }
}
