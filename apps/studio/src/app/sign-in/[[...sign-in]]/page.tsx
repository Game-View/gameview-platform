import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gv-gradient flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-3xl">🐰</span>
            <span className="font-bold text-white text-2xl tracking-wide">GAME VIEW</span>
            <span className="text-gv-primary-500 font-semibold text-xl">Studio</span>
          </div>
          <p className="text-gv-neutral-400">Sign in to continue creating</p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-gv-neutral-800 border border-gv-neutral-700 shadow-gv-lg",
              headerTitle: "text-white",
              headerSubtitle: "text-gv-neutral-400",
              socialButtonsBlockButton: "bg-gv-neutral-700 border-gv-neutral-600 text-white hover:bg-gv-neutral-600",
              socialButtonsBlockButtonText: "text-white font-medium",
              dividerLine: "bg-gv-neutral-700",
              dividerText: "text-gv-neutral-500",
              formFieldLabel: "text-gv-neutral-300",
              formFieldInput: "bg-gv-neutral-900 border-gv-neutral-700 text-white",
              formButtonPrimary: "bg-gv-primary-500 hover:bg-gv-primary-600",
              footerActionLink: "text-gv-primary-500 hover:text-gv-primary-400",
              identityPreviewText: "text-white",
              identityPreviewEditButton: "text-gv-primary-500",
              // Hide Clerk branding
              footer: "hidden",
            },
            layout: {
              socialButtonsPlacement: "top",
              socialButtonsVariant: "blockButton",
            },
          }}
          afterSignInUrl="/dashboard"
          signUpUrl="/sign-up"
        />
        <p className="text-center text-gv-neutral-500 text-xs mt-6">
          Powered by Game View
        </p>
      </div>
    </div>
  );
}
