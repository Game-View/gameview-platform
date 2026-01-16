import { router } from "../trpc";
import { userRouter } from "./user";
import { creatorRouter } from "./creator";
import { experienceRouter } from "./experience";
import { followRouter } from "./follow";
import { wishlistRouter } from "./wishlist";
import { playHistoryRouter } from "./playHistory";
import { promoRouter } from "./promo";
import { productionRouter } from "./production";
import { analyticsRouter } from "./analytics";
import { stripeRouter } from "./stripe";

/**
 * Main application router
 * All routers are merged here
 */
export const appRouter = router({
  user: userRouter,
  creator: creatorRouter,
  experience: experienceRouter,
  follow: followRouter,
  wishlist: wishlistRouter,
  playHistory: playHistoryRouter,
  promo: promoRouter,
  production: productionRouter,
  analytics: analyticsRouter,
  stripe: stripeRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
