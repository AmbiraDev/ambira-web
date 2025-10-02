import { SignupForm } from '@/components/SignupForm';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-foreground">
            Join Ambira
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Start your productivity journey with friends
          </p>
        </div>
        <div className="bg-card-background p-8 rounded-lg shadow-sm border border-border">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
