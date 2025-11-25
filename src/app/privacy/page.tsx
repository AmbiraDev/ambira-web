import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-lg text-gray-600 mb-8">
          This page is under construction. Please check back later.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-[#0066CC] text-white font-semibold rounded-lg hover:bg-[#0051D5] transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
