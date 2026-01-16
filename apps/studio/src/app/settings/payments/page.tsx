"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import {
  ArrowLeft,
  CreditCard,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  DollarSign,
  Clock,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "@/stores/toast-store";

/**
 * Payments Settings Page - Sprint 20
 *
 * Allows creators to:
 * - Connect Stripe account for receiving payments
 * - View earnings summary
 * - Access Stripe dashboard
 */
export default function PaymentsSettingsPage() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const refresh = searchParams.get("refresh");

  // Fetch Stripe Connect status
  const {
    data: connectStatus,
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = trpc.stripe.getConnectStatus.useQuery();

  // Fetch earnings summary
  const { data: earnings, isLoading: earningsLoading } = trpc.stripe.getEarnings.useQuery();

  // Fetch payout info
  const { data: payoutInfo, isLoading: payoutLoading } = trpc.stripe.getPayoutInfo.useQuery();

  // Create Connect account mutation
  const createAccount = trpc.stripe.createConnectAccount.useMutation({
    onSuccess: (data) => {
      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl;
      }
    },
    onError: (error) => {
      toast.error("Failed to create account", error.message);
    },
  });

  // Get dashboard link
  const getDashboard = trpc.stripe.getDashboardLink.useQuery(undefined, {
    enabled: connectStatus?.hasAccount && connectStatus?.detailsSubmitted,
  });

  // Handle success/refresh params
  useEffect(() => {
    if (success === "true") {
      toast.success("Account connected", "Your Stripe account is now connected!");
      refetchStatus();
    } else if (refresh === "true") {
      toast.info("Complete setup", "Please complete your Stripe account setup");
    }
  }, [success, refresh, refetchStatus]);

  const isLoading = statusLoading || earningsLoading || payoutLoading;

  return (
    <div className="min-h-screen bg-gv-darker">
      {/* Header */}
      <header className="border-b border-gv-neutral-800 bg-gv-dark/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/settings"
              className="flex items-center gap-2 text-gv-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
            <div className="h-6 w-px bg-gv-neutral-700" />
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-gv-primary-500" />
              Payments
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-gv-primary-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* Stripe Connect Section */}
            <section className="bg-gv-dark border border-gv-neutral-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-2">Stripe Connect</h2>
              <p className="text-gv-neutral-400 text-sm mb-6">
                Connect your Stripe account to receive payments from experience sales
              </p>

              {connectStatus?.hasAccount ? (
                <div className="space-y-4">
                  {/* Status indicators */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatusCard
                      label="Account Connected"
                      value={connectStatus.detailsSubmitted}
                      description="Basic info complete"
                    />
                    <StatusCard
                      label="Charges Enabled"
                      value={connectStatus.chargesEnabled}
                      description="Can accept payments"
                    />
                    <StatusCard
                      label="Payouts Enabled"
                      value={connectStatus.payoutsEnabled}
                      description="Can receive payouts"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 pt-4">
                    {!connectStatus.detailsSubmitted && (
                      <button
                        onClick={() => createAccount.mutate()}
                        disabled={createAccount.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded-lg transition-colors"
                      >
                        {createAccount.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        Complete Setup
                      </button>
                    )}

                    {getDashboard.data?.url && (
                      <a
                        href={getDashboard.data.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-gv-neutral-800 hover:bg-gv-neutral-700 text-white rounded-lg transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Stripe Dashboard
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <CreditCard className="h-12 w-12 text-gv-neutral-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No account connected</h3>
                  <p className="text-gv-neutral-400 text-sm mb-6">
                    Connect a Stripe account to start accepting payments for your experiences
                  </p>
                  <button
                    onClick={() => createAccount.mutate()}
                    disabled={createAccount.isPending}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gv-primary-500 hover:bg-gv-primary-600 text-white font-medium rounded-lg transition-colors"
                  >
                    {createAccount.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <CreditCard className="h-5 w-5" />
                    )}
                    Connect Stripe Account
                  </button>
                </div>
              )}
            </section>

            {/* Earnings Summary */}
            {connectStatus?.hasAccount && earnings && (
              <section className="bg-gv-dark border border-gv-neutral-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-6">Earnings Summary</h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <EarningsCard
                    icon={<DollarSign className="h-5 w-5" />}
                    label="Total Revenue"
                    value={`$${earnings.totalRevenue.toFixed(2)}`}
                    color="green"
                  />
                  <EarningsCard
                    icon={<TrendingUp className="h-5 w-5" />}
                    label="Net Earnings"
                    value={`$${earnings.netEarnings.toFixed(2)}`}
                    sublabel="After platform fee"
                    color="blue"
                  />
                  <EarningsCard
                    icon={<ArrowUpRight className="h-5 w-5" />}
                    label="Total Sales"
                    value={earnings.purchaseCount.toString()}
                    color="purple"
                  />
                  {payoutInfo && (
                    <EarningsCard
                      icon={<Clock className="h-5 w-5" />}
                      label="Available Balance"
                      value={`$${payoutInfo.balance.toFixed(2)}`}
                      sublabel={payoutInfo.pendingBalance > 0 ? `$${payoutInfo.pendingBalance.toFixed(2)} pending` : undefined}
                      color="orange"
                    />
                  )}
                </div>

                {/* Recent Transactions */}
                {earnings.recentTransactions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gv-neutral-400 mb-3">Recent Transactions</h3>
                    <div className="space-y-2">
                      {earnings.recentTransactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between py-2 border-b border-gv-neutral-800 last:border-0"
                        >
                          <div>
                            <p className="text-white text-sm">{tx.experienceTitle}</p>
                            <p className="text-gv-neutral-500 text-xs">
                              {new Date(tx.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-green-400 font-medium">+${tx.netAmount.toFixed(2)}</p>
                            <p className="text-gv-neutral-500 text-xs">${tx.amount.toFixed(2)} gross</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Platform Fee Info */}
            <section className="bg-gv-dark border border-gv-neutral-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-2">Platform Fees</h2>
              <p className="text-gv-neutral-400 text-sm">
                Game View charges a 20% platform fee on all experience sales. This fee covers payment
                processing, hosting, and platform maintenance. You receive 80% of each sale directly
                to your connected Stripe account.
              </p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

// Status Card Component
function StatusCard({
  label,
  value,
  description,
}: {
  label: string;
  value: boolean;
  description: string;
}) {
  return (
    <div className="bg-gv-neutral-900 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-1">
        {value ? (
          <CheckCircle className="h-5 w-5 text-green-400" />
        ) : (
          <AlertCircle className="h-5 w-5 text-yellow-400" />
        )}
        <span className="text-white font-medium">{label}</span>
      </div>
      <p className="text-gv-neutral-500 text-sm">{description}</p>
    </div>
  );
}

// Earnings Card Component
function EarningsCard({
  icon,
  label,
  value,
  sublabel,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
  color: "green" | "blue" | "purple" | "orange";
}) {
  const colorClasses = {
    green: "text-green-400",
    blue: "text-blue-400",
    purple: "text-purple-400",
    orange: "text-orange-400",
  };

  return (
    <div className="text-center">
      <div className={`inline-flex p-2 rounded-lg bg-gv-neutral-900 ${colorClasses[color]} mb-2`}>
        {icon}
      </div>
      <p className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
      <p className="text-gv-neutral-500 text-xs">{label}</p>
      {sublabel && <p className="text-gv-neutral-600 text-xs mt-1">{sublabel}</p>}
    </div>
  );
}
