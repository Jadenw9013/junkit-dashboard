export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: '#1a2535' }}>
      <div className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin mb-4"
        style={{ borderColor: '#b8964a', borderTopColor: 'transparent' }} />
      <p className="text-sm" style={{ color: '#718096' }}>Loading...</p>
    </div>
  )
}
