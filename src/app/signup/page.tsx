import { SignupForm } from '@/components/SignupForm';
import Image from 'next/image';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <Image
              src="/logo.svg"
              alt="Ambira"
              width={64}
              height={64}
              className="w-16 h-16"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Join Ambira
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Start your productivity journey with friends
          </p>
        </div>
        <div className="bg-white p-10 rounded-xl shadow-lg border border-gray-200">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
