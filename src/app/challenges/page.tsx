import Header from '@/components/HeaderComponent';

export default function ChallengesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Challenges</h1>
          <p className="text-gray-600">
            Participate in productivity challenges and compete with others
          </p>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <p className="text-center text-gray-500">
            Challenges list will be implemented here
          </p>
        </div>
      </div>
    </div>
  );
}
