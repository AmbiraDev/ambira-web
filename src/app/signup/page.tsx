import { SignupForm } from '@/components/SignupForm';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#007AFF] rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">A</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Join Ambira
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Start your productivity journey with friends
          </p>
        </div>
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
