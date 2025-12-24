import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gv-gradient flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-3xl">🐰</span>
            <span className="font-bold text-white text-2xl tracking-wide">GAME VIEW</span>
            <span className="text-gv-primary-500 font-semibold text-xl">Studio</span>
          </div>
          <p className="text-gv-neutral-400">Create your account to get started</p>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-gv-neutral-800 border border-gv-neutral-700 shadow-gv-lg",
            },
          }}
          afterSignUpUrl="/onboarding"
          signInUrl="/sign-in"
        />
      </div>
    </div>
  );
}
