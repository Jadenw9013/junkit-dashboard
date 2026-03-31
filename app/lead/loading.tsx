export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: '#F7F6F1' }}>
      <div className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin mb-4"
        style={{ borderColor: '#F5C518', borderTopColor: 'transparent' }} />
      <p className="text-sm" style={{ color: '#6B7280' }}>Loading...</p>
    </div>
  )
}
