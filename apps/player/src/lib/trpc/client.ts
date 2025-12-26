"use client";

import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@gameview/api/trpc";

/**
 * tRPC React client
 * Use this in React components to call tRPC procedures
 */
export const trpc = createTRPCReact<AppRouter>();
