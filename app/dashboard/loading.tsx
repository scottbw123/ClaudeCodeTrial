export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-64 bg-gray-200 mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 border border-gray-200" />
        ))}
      </div>
      <div className="border border-gray-200 divide-y divide-gray-100">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-4">
            <div className="space-y-2">
              <div className="h-3 w-24 bg-gray-100" />
              <div className="h-4 w-64 bg-gray-200" />
            </div>
            <div className="h-7 w-20 bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
