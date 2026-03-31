'use client'

import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { X } from 'lucide-react'
import { Settings, PricingItem } from '@/lib/types'
import { completeOnboarding, OnboardingData } from '@/app/actions/onboarding'
import { toast } from 'sonner'

const inputStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid rgba(0,0,0,0.3)',
  color: '#2D2D2D',
}

export default function OnboardingClient({ initialSettings }: { initialSettings: Settings }) {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  // Step 2 — Business basics
  const [businessName, setBusinessName] = useState(initialSettings.businessName)
  const [ownerName, setOwnerName] = useState(initialSettings.ownerName)
  const [phone, setPhone] = useState(initialSettings.phone)

  // Step 3 — Service area
  const [cities, setCities] = useState<string[]>(initialSettings.serviceArea)
  const [newCity, setNewCity] = useState('')

  // Step 4 — Pricing
  const corePricing = ['quarter', 'half', 'full', 'demo', 'trailer']
  const [pricing, setPricing] = useState<PricingItem[]>(
    initialSettings.pricing.filter((p) => corePricing.includes(p.id))
  )

  // Step 5 — Google review link
  const [googleReviewLink, setGoogleReviewLink] = useState(initialSettings.googleReviewLink)

  function addCity() {
    const trimmed = newCity.trim()
    if (!trimmed || cities.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return
    setCities([...cities, trimmed])
    setNewCity('')
  }

  async function handleFinish() {
    setSaving(true)
    try {
      const data: OnboardingData = {
        businessName, ownerName, phone,
        serviceArea: cities,
        pricing: pricing,
        googleReviewLink,
      }
      await completeOnboarding(data)
    } catch {
      toast.error('Failed to save settings')
      setSaving(false)
    }
  }

  const totalSteps = 5

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7F6F1' }}>
      <div className="w-full max-w-[500px] mx-auto px-6 py-8">
        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full transition-all"
              style={{
                backgroundColor: i + 1 <= step ? '#F5C518' : 'rgba(0,0,0,0.2)',
                transform: i + 1 === step ? 'scale(1.3)' : 'scale(1)',
              }}
            />
          ))}
        </div>

        {/* Step 1 — Welcome */}
        {step === 1 && (
          <div className="text-center">
            <div className="text-5xl font-black tracking-widest mb-2" style={{ color: '#F5C518', fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}>
              JUNK IT
            </div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: '#2D2D2D' }}>Welcome to Junk It Dashboard</h2>
            <p className="text-sm mb-8" style={{ color: '#6B7280' }}>
              This takes 3 minutes. We&apos;ll set up your business info so every AI response is accurate from day one.
            </p>
            <button onClick={() => setStep(2)}
              className="w-full py-3.5 rounded-xl font-semibold text-sm"
              style={{ backgroundColor: '#F5C518', color: '#F7F6F1' }}>
              Let&apos;s go →
            </button>
          </div>
        )}

        {/* Step 2 — Business basics */}
        {step === 2 && (
          <div>
            <button onClick={() => setStep(1)} className="flex items-center gap-1 mb-4 text-sm" style={{ color: '#6B7280' }}>
              <ChevronLeft size={16} /> Back
            </button>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#F5C518' }}>Step 2 of 5</p>
            <h2 className="text-xl font-bold mb-1" style={{ color: '#2D2D2D' }}>Your business</h2>
            <p className="text-sm mb-6" style={{ color: '#6B7280' }}>This info is used in every AI-generated response.</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: '#2D2D2D' }}>Business name</label>
                <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: '#2D2D2D' }}>Your name</label>
                <input type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: '#2D2D2D' }}>Phone number</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
              </div>
            </div>
            <button onClick={() => setStep(3)}
              className="w-full mt-6 py-3.5 rounded-xl font-semibold text-sm"
              style={{ backgroundColor: '#F5C518', color: '#F7F6F1' }}>
              Next →
            </button>
          </div>
        )}

        {/* Step 3 — Service area */}
        {step === 3 && (
          <div>
            <button onClick={() => setStep(2)} className="flex items-center gap-1 mb-4 text-sm" style={{ color: '#6B7280' }}>
              <ChevronLeft size={16} /> Back
            </button>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#F5C518' }}>Step 3 of 5</p>
            <h2 className="text-xl font-bold mb-1" style={{ color: '#2D2D2D' }}>Service area</h2>
            <p className="text-sm mb-6" style={{ color: '#6B7280' }}>Which cities do you serve? Tap ✕ to remove, type to add.</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {cities.map((city) => (
                <span key={city} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: 'rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.25)', color: '#E0B115' }}>
                  {city}
                  <button onClick={() => setCities(cities.filter((c) => c !== city))} style={{ color: '#6B7280' }}>
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="Add city" value={newCity} onChange={(e) => setNewCity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCity()}
                className="flex-1 px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
              <button onClick={addCity} className="px-4 py-3 rounded-xl text-sm font-medium"
                style={{ backgroundColor: 'rgba(0,0,0,0.15)', color: '#F5C518' }}>Add</button>
            </div>
            <button onClick={() => setStep(4)}
              className="w-full mt-6 py-3.5 rounded-xl font-semibold text-sm"
              style={{ backgroundColor: '#F5C518', color: '#F7F6F1' }}>
              Next →
            </button>
          </div>
        )}

        {/* Step 4 — Pricing */}
        {step === 4 && (
          <div>
            <button onClick={() => setStep(3)} className="flex items-center gap-1 mb-4 text-sm" style={{ color: '#6B7280' }}>
              <ChevronLeft size={16} /> Back
            </button>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#F5C518' }}>Step 4 of 5</p>
            <h2 className="text-xl font-bold mb-1" style={{ color: '#2D2D2D' }}>Set your prices</h2>
            <p className="text-sm mb-6" style={{ color: '#6B7280' }}>These are ranges — you can always adjust later.</p>
            <div className="space-y-3">
              {pricing.map((item, idx) => (
                <div key={item.id} className="rounded-xl p-3" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.2)' }}>
                  <p className="text-xs font-medium mb-2" style={{ color: '#E0B115' }}>{item.label}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: '#6B7280' }}>$</span>
                    <input type="number" value={item.min}
                      onChange={(e) => {
                        const p = [...pricing]
                        p[idx] = { ...p[idx], min: Number(e.target.value) }
                        setPricing(p)
                      }}
                      className="flex-1 px-3 py-2 rounded-lg text-sm outline-none text-center"
                      style={{ backgroundColor: '#F7F6F1', border: '1px solid rgba(0,0,0,0.2)', color: '#2D2D2D' }} />
                    <span className="text-xs" style={{ color: '#6B7280' }}>to $</span>
                    <input type="number" value={item.max}
                      onChange={(e) => {
                        const p = [...pricing]
                        p[idx] = { ...p[idx], max: Number(e.target.value) }
                        setPricing(p)
                      }}
                      className="flex-1 px-3 py-2 rounded-lg text-sm outline-none text-center"
                      style={{ backgroundColor: '#F7F6F1', border: '1px solid rgba(0,0,0,0.2)', color: '#2D2D2D' }} />
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setStep(5)}
              className="w-full mt-6 py-3.5 rounded-xl font-semibold text-sm"
              style={{ backgroundColor: '#F5C518', color: '#F7F6F1' }}>
              Next →
            </button>
          </div>
        )}

        {/* Step 5 — Google Review */}
        {step === 5 && (
          <div>
            <button onClick={() => setStep(4)} className="flex items-center gap-1 mb-4 text-sm" style={{ color: '#6B7280' }}>
              <ChevronLeft size={16} /> Back
            </button>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#F5C518' }}>Step 5 of 5</p>
            <h2 className="text-xl font-bold mb-1" style={{ color: '#2D2D2D' }}>One last thing</h2>
            <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
              Your Google review link gets added to every review request you send. Find it in your Google Business Profile under &ldquo;Get more reviews&rdquo;.
            </p>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: '#2D2D2D' }}>Google Review Link</label>
              <input type="url" value={googleReviewLink} onChange={(e) => setGoogleReviewLink(e.target.value)}
                placeholder="https://g.page/r/..."
                className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
              <p className="text-xs mt-2" style={{ color: '#6B7280' }}>Leave blank for now — you can add it in Settings later.</p>
            </div>
            <button onClick={handleFinish} disabled={saving}
              className="w-full mt-6 py-3.5 rounded-xl font-semibold text-sm disabled:opacity-50"
              style={{ backgroundColor: '#F5C518', color: '#F7F6F1' }}>
              {saving ? 'Saving...' : 'Finish setup →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
