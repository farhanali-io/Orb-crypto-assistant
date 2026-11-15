export function BubbleSkeleton() {
  return (
    <div className="w-full h-[600px] flex flex-wrap gap-3 p-4">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-full bg-gray-800"
          style={{
            width: `${40 + Math.random() * 80}px`,
            height: `${40 + Math.random() * 80}px`,
          }}
        />
      ))}
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="w-full p-4 space-y-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="animate-pulse flex gap-4">
          <div className="h-10 w-10 rounded-full bg-gray-800" />
          <div className="h-10 flex-1 rounded bg-gray-800" />
          <div className="h-10 w-20 rounded bg-gray-800" />
        </div>
      ))}
    </div>
  );
}
