'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, X, ChevronDown, ChevronUp, ArrowLeftRight } from 'lucide-react'
import {
  saveBusinessInfo, savePricing, saveServiceArea, saveItemLists,
  saveAvailability, saveAIStyle, restoreSettings,
} from '@/app/actions/settings'
import { Settings, PricingItem, SettingsSnapshot } from '@/lib/types'
import BackButton from '@/components/BackButton'

const inputStyle = {
  backgroundColor: '#F7F6F1',
  border: '1px solid rgba(0,0,0,0.3)',
  color: '#2D2D2D',
}

const cardStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid rgba(0,0,0,0.2)',
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4" style={cardStyle}>
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#F5C518' }}>{title}</h2>
      {children}
    </div>
  )
}

function SaveButton({ onClick, loading, label = 'Save' }: { onClick: () => void; loading: boolean; label?: string }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="w-full mt-4 py-3 rounded-xl font-semibold text-sm disabled:opacity-50 transition-opacity"
      style={{ backgroundColor: '#F5C518', color: '#F7F6F1' }}>
      {loading ? 'Saving...' : label}
    </button>
  )
}

function FieldLabel({ children, helper }: { children: React.ReactNode; helper?: string }) {
  return (
    <div className="mb-1">
      <label className="text-sm font-medium" style={{ color: '#2D2D2D' }}>{children}</label>
      {helper && <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{helper}</p>}
    </div>
  )
}

function ButtonGroup<T extends string>({ options, value, onChange }: { options: { label: string; value: T }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            backgroundColor: value === opt.value ? '#F5C518' : '#F7F6F1',
            color: value === opt.value ? '#F7F6F1' : '#6B7280',
            border: value === opt.value ? '1px solid #F5C518' : '1px solid rgba(0,0,0,0.2)',
          }}>
          {opt.label}
        </button>
      ))}
    </div>
  )
}

interface Props {
  initialSettings: Settings
  initialHistory: SettingsSnapshot[]
}

export default function SettingsClient({ initialSettings, initialHistory }: Props) {
  const [settings, setSettings] = useState(initialSettings)
  const [history] = useState(initialHistory)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [restoreConfirm, setRestoreConfirm] = useState<SettingsSnapshot | null>(null)

  // Pricing edit state
  const [pricing, setPricing] = useState<PricingItem[]>(initialSettings.pricing)
  const [newPriceRow, setNewPriceRow] = useState<Partial<PricingItem> & { label: string }>({ label: '', min: 0, max: 0, notes: '' })
  const [showAddPrice, setShowAddPrice] = useState(false)

  // Service area
  const [cities, setCities] = useState<string[]>(initialSettings.serviceArea)
  const [newCity, setNewCity] = useState('')

  // Items
  const [accepted, setAccepted] = useState<string[]>(initialSettings.acceptedItems)
  const [refused, setRefused] = useState<string[]>(initialSettings.refusedItems)
  const [newAccepted, setNewAccepted] = useState('')
  const [newRefused, setNewRefused] = useState('')

  // Availability
  const [avail, setAvail] = useState(initialSettings.availability)
  const [businessHours, setBusinessHours] = useState(initialSettings.businessHours)

  // AI Style
  const [tone, setTone] = useState(initialSettings.tone)
  const [responseLength, setResponseLength] = useState(initialSettings.responseLength)
  const [includePricing, setIncludePricing] = useState(initialSettings.includePricingInFirstResponse)

  // Business info
  const [bizInfo, setBizInfo] = useState({
    businessName: initialSettings.businessName,
    ownerName: initialSettings.ownerName,
    phone: initialSettings.phone,
    googleReviewLink: initialSettings.googleReviewLink,
  })

  function setL(key: string, val: boolean) { setLoading((l) => ({ ...l, [key]: val })) }

  async function handleSaveBizInfo() {
    setL('biz', true)
    try { await saveBusinessInfo(bizInfo); setSettings((s) => ({ ...s, ...bizInfo })); toast.success('Business info saved') }
    catch { toast.error('Failed to save') }
    setL('biz', false)
  }

  async function handleSavePricing() {
    setL('pricing', true)
    try { await savePricing(pricing); toast.success('Pricing saved') }
    catch { toast.error('Failed to save') }
    setL('pricing', false)
  }

  async function handleSaveArea() {
    setL('area', true)
    try { await saveServiceArea(cities); toast.success('Service area saved') }
    catch { toast.error('Failed to save') }
    setL('area', false)
  }

  async function handleSaveItems() {
    setL('items', true)
    try { await saveItemLists(accepted, refused); toast.success('Item lists saved') }
    catch { toast.error('Failed to save') }
    setL('items', false)
  }

  async function handleSaveAvail() {
    setL('avail', true)
    try { await saveAvailability(avail, businessHours); toast.success('Availability saved') }
    catch { toast.error('Failed to save') }
    setL('avail', false)
  }

  async function handleSaveAI() {
    setL('ai', true)
    try { await saveAIStyle(tone, responseLength, includePricing); toast.success('AI style saved') }
    catch { toast.error('Failed to save') }
    setL('ai', false)
  }

  async function handleRestore(snapshot: SettingsSnapshot) {
    setL('restore', true)
    try {
      await restoreSettings(snapshot)
      window.location.reload()
    } catch { toast.error('Failed to restore') }
    setL('restore', false)
    setRestoreConfirm(null)
  }

  function addCity() {
    const trimmed = newCity.trim()
    if (!trimmed || cities.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return
    setCities([...cities, trimmed])
    setNewCity('')
  }

  function addAccepted() {
    const t = newAccepted.trim()
    if (!t || accepted.includes(t.toLowerCase())) return
    setAccepted([...accepted, t])
    setNewAccepted('')
  }

  function addRefused() {
    const t = newRefused.trim()
    if (!t || refused.includes(t.toLowerCase())) return
    setRefused([...refused, t])
    setNewRefused('')
  }

  function moveToRefused(item: string) {
    setAccepted(accepted.filter((i) => i !== item))
    if (!refused.includes(item)) setRefused([...refused, item])
  }

  function moveToAccepted(item: string) {
    setRefused(refused.filter((i) => i !== item))
    if (!accepted.includes(item)) setAccepted([...accepted, item])
  }

  function addPriceRow() {
    if (!newPriceRow.label) return
    const row: PricingItem = {
      id: `custom-${Date.now()}`,
      label: newPriceRow.label,
      min: newPriceRow.min ?? 0,
      max: newPriceRow.max ?? 0,
      notes: newPriceRow.notes ?? '',
    }
    setPricing([...pricing, row])
    setNewPriceRow({ label: '', min: 0, max: 0, notes: '' })
    setShowAddPrice(false)
  }

  const days: (keyof typeof avail)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const dayLabels: Record<string, string> = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F6F1' }}>
      <div className="mx-auto max-w-[430px] px-4 pb-10">
        <div className="flex items-center gap-3 py-5">
          <BackButton href="/" label="Back to Dashboard" />
        </div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: '#2D2D2D' }}>Business Settings</h1>
          <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Changes take effect immediately on all AI responses.</p>
        </div>

        <div className="space-y-4">
          {/* Business Info */}
          <SectionCard title="Business Info">
            {[
              { key: 'businessName' as const, label: 'Business name', helper: '' },
              { key: 'ownerName' as const, label: 'Owner name', helper: 'Used to personalize AI sign-offs' },
              { key: 'phone' as const, label: 'Phone number', helper: 'Included in email responses' },
              { key: 'googleReviewLink' as const, label: 'Google Review Link', helper: 'Paste your Google review URL here' },
            ].map(({ key, label, helper }) => (
              <div key={key} className="mb-3">
                <FieldLabel helper={helper || undefined}>{label}</FieldLabel>
                <input type="text" value={bizInfo[key]} onChange={(e) => setBizInfo({ ...bizInfo, [key]: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={inputStyle} />
              </div>
            ))}
            <SaveButton onClick={handleSaveBizInfo} loading={!!loading.biz} label="Save Business Info" />
          </SectionCard>

          {/* Pricing Table */}
          <SectionCard title="Pricing">
            <div className="space-y-2 mb-3">
              {pricing.map((item, idx) => (
                <div key={item.id} className="grid grid-cols-[1fr_60px_60px_80px_28px] gap-1.5 items-center">
                  <input type="text" value={item.label} onChange={(e) => { const p = [...pricing]; p[idx] = { ...p[idx], label: e.target.value }; setPricing(p) }}
                    className="px-2 py-1.5 rounded-lg text-xs outline-none" style={inputStyle} />
                  <input type="number" value={item.min} onChange={(e) => { const p = [...pricing]; p[idx] = { ...p[idx], min: Number(e.target.value) }; setPricing(p) }}
                    className="px-2 py-1.5 rounded-lg text-xs outline-none text-center" style={inputStyle} placeholder="Min" />
                  <input type="number" value={item.max} onChange={(e) => { const p = [...pricing]; p[idx] = { ...p[idx], max: Number(e.target.value) }; setPricing(p) }}
                    className="px-2 py-1.5 rounded-lg text-xs outline-none text-center" style={inputStyle} placeholder="Max" />
                  <input type="text" value={item.notes} onChange={(e) => { const p = [...pricing]; p[idx] = { ...p[idx], notes: e.target.value }; setPricing(p) }}
                    className="px-2 py-1.5 rounded-lg text-xs outline-none" style={inputStyle} placeholder="Notes" />
                  <button onClick={() => setPricing(pricing.filter((_, i) => i !== idx))}
                    className="flex items-center justify-center w-6 h-6 rounded-full" style={{ backgroundColor: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>

            {/* Live preview */}
            <div className="rounded-lg p-3 mb-3" style={{ backgroundColor: '#F7F6F1', border: '1px solid rgba(0,0,0,0.15)' }}>
              <p className="text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Preview:</p>
              {pricing.slice(0, 4).map((p) => (
                <p key={p.id} className="text-xs" style={{ color: '#E0B115' }}>
                  {p.label}: ${p.min}–${p.max}{p.notes ? ` (${p.notes})` : ''}
                </p>
              ))}
            </div>

            {!showAddPrice ? (
              <button onClick={() => setShowAddPrice(true)} className="flex items-center gap-1.5 text-xs py-2 px-3 rounded-lg w-full justify-center"
                style={{ backgroundColor: 'rgba(0,0,0,0.08)', border: '1px dashed rgba(0,0,0,0.3)', color: '#F5C518' }}>
                <Plus size={13} /> Add custom item
              </button>
            ) : (
              <div className="grid grid-cols-[1fr_60px_60px_80px] gap-1.5 mb-2">
                <input type="text" placeholder="Label" value={newPriceRow.label} onChange={(e) => setNewPriceRow({ ...newPriceRow, label: e.target.value })}
                  className="px-2 py-1.5 rounded-lg text-xs outline-none" style={inputStyle} />
                <input type="number" placeholder="Min" value={newPriceRow.min || ''} onChange={(e) => setNewPriceRow({ ...newPriceRow, min: Number(e.target.value) })}
                  className="px-2 py-1.5 rounded-lg text-xs outline-none text-center" style={inputStyle} />
                <input type="number" placeholder="Max" value={newPriceRow.max || ''} onChange={(e) => setNewPriceRow({ ...newPriceRow, max: Number(e.target.value) })}
                  className="px-2 py-1.5 rounded-lg text-xs outline-none text-center" style={inputStyle} />
                <input type="text" placeholder="Notes" value={newPriceRow.notes} onChange={(e) => setNewPriceRow({ ...newPriceRow, notes: e.target.value })}
                  className="px-2 py-1.5 rounded-lg text-xs outline-none" style={inputStyle} />
                <button onClick={addPriceRow} className="col-span-4 text-xs py-1.5 rounded-lg font-medium" style={{ backgroundColor: '#F5C518', color: '#F7F6F1' }}>Add</button>
              </div>
            )}
            <SaveButton onClick={handleSavePricing} loading={!!loading.pricing} label="Save Pricing" />
          </SectionCard>

          {/* Service Area */}
          <SectionCard title="Service Area">
            {cities.length < 2 && (
              <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(245,158,11,0.08)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.2)' }}>
                Add at least one service area so AI responses reference the correct locations.
              </p>
            )}
            <div className="flex flex-wrap gap-2 mb-3">
              {cities.map((city) => (
                <span key={city} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: 'rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.25)', color: '#E0B115' }}>
                  {city}
                  <button onClick={() => setCities(cities.filter((c) => c !== city))} style={{ color: '#6B7280' }}><X size={11} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="Add city" value={newCity} onChange={(e) => setNewCity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCity()}
                className="flex-1 px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
              <button onClick={addCity} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: 'rgba(0,0,0,0.15)', color: '#F5C518' }}>
                Add
              </button>
            </div>
            <SaveButton onClick={handleSaveArea} loading={!!loading.area} label="Save Service Area" />
          </SectionCard>

          {/* What We Haul */}
          <SectionCard title="What We Haul">
            <div className="grid grid-cols-2 gap-4">
              {/* Accepted */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: '#4ade80' }}>We Accept</p>
                <div className="flex flex-col gap-1.5 mb-2">
                  {accepted.map((item) => (
                    <div key={item} className="flex items-center justify-between gap-1 text-xs px-2 py-1.5 rounded-lg"
                      style={{ backgroundColor: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.15)' }}>
                      <span style={{ color: '#2D2D2D' }} className="truncate">{item}</span>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => moveToRefused(item)} title="Move to refused" style={{ color: '#6B7280' }}><ArrowLeftRight size={10} /></button>
                        <button onClick={() => setAccepted(accepted.filter((i) => i !== item))} style={{ color: '#6B7280' }}><X size={10} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1">
                  <input type="text" placeholder="Add item" value={newAccepted} onChange={(e) => setNewAccepted(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addAccepted()}
                    className="flex-1 px-2 py-1.5 rounded-lg text-xs outline-none" style={inputStyle} />
                  <button onClick={addAccepted} className="px-2 rounded-lg text-xs" style={{ backgroundColor: 'rgba(74,222,128,0.15)', color: '#4ade80' }}>+</button>
                </div>
              </div>

              {/* Refused */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: '#f87171' }}>We Refuse</p>
                <div className="flex flex-col gap-1.5 mb-2">
                  {refused.map((item) => (
                    <div key={item} className="flex items-center justify-between gap-1 text-xs px-2 py-1.5 rounded-lg"
                      style={{ backgroundColor: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}>
                      <span style={{ color: '#2D2D2D' }} className="truncate">{item}</span>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => moveToAccepted(item)} title="Move to accepted" style={{ color: '#6B7280' }}><ArrowLeftRight size={10} /></button>
                        <button onClick={() => setRefused(refused.filter((i) => i !== item))} style={{ color: '#6B7280' }}><X size={10} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1">
                  <input type="text" placeholder="Add item" value={newRefused} onChange={(e) => setNewRefused(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addRefused()}
                    className="flex-1 px-2 py-1.5 rounded-lg text-xs outline-none" style={inputStyle} />
                  <button onClick={addRefused} className="px-2 rounded-lg text-xs" style={{ backgroundColor: 'rgba(248,113,113,0.15)', color: '#f87171' }}>+</button>
                </div>
              </div>
            </div>
            <SaveButton onClick={handleSaveItems} loading={!!loading.items} label="Save Item Lists" />
          </SectionCard>

          {/* Availability */}
          <SectionCard title="Availability & Hours">
            <div className="flex gap-1.5 mb-4 flex-wrap">
              {days.map((day) => (
                <button key={day} onClick={() => setAvail({ ...avail, [day]: !avail[day] })}
                  className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: avail[day] ? '#F5C518' : '#F7F6F1',
                    color: avail[day] ? '#F7F6F1' : '#6B7280',
                    border: avail[day] ? '1px solid #F5C518' : '1px solid rgba(0,0,0,0.2)',
                  }}>
                  {dayLabels[day]}
                </button>
              ))}
            </div>
            <FieldLabel>Business hours</FieldLabel>
            <input type="text" placeholder="e.g. 7am–6pm" value={businessHours} onChange={(e) => setBusinessHours(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={inputStyle} />
            <SaveButton onClick={handleSaveAvail} loading={!!loading.avail} label="Save Availability" />
          </SectionCard>

          {/* AI Style */}
          <SectionCard title="AI Response Style">
            <div className="space-y-5">
              <div>
                <FieldLabel helper="How the AI writes responses to customers">Tone</FieldLabel>
                <ButtonGroup
                  options={[{ label: 'Friendly', value: 'friendly' }, { label: 'Professional', value: 'formal' }, { label: 'Casual', value: 'casual' }]}
                  value={tone} onChange={setTone} />
              </div>
              <div>
                <FieldLabel helper="Brief = SMS-style, Standard = 2-3 sentences, Detailed = full paragraph">Response Length</FieldLabel>
                <ButtonGroup
                  options={[{ label: 'Brief', value: 'brief' }, { label: 'Standard', value: 'standard' }, { label: 'Detailed', value: 'detailed' }]}
                  value={responseLength} onChange={setResponseLength} />
              </div>
              <div>
                <FieldLabel helper="Some owners prefer to discuss pricing on the call">Include pricing in first response</FieldLabel>
                <ButtonGroup
                  options={[{ label: 'Yes — show price range', value: 'yes' }, { label: 'No — ask them to call first', value: 'no' }]}
                  value={includePricing ? 'yes' : 'no'}
                  onChange={(v) => setIncludePricing(v === 'yes')} />
              </div>
            </div>
            <SaveButton onClick={handleSaveAI} loading={!!loading.ai} label="Save AI Style" />
          </SectionCard>

          {/* Version History */}
          <div className="rounded-xl overflow-hidden" style={cardStyle}>
            <button onClick={() => setHistoryOpen(!historyOpen)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
              style={{ color: '#2D2D2D' }}>
              <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#F5C518' }}>Version History</span>
              {historyOpen ? <ChevronUp size={16} style={{ color: '#6B7280' }} /> : <ChevronDown size={16} style={{ color: '#6B7280' }} />}
            </button>

            {historyOpen && (
              <div className="px-4 pb-4">
                {history.length === 0 ? (
                  <p className="text-xs text-center py-4" style={{ color: '#6B7280' }}>No history yet — save any setting to start tracking</p>
                ) : (
                  <div className="space-y-2">
                    {history.map((snap, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-t" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
                        <div>
                          <p className="text-xs font-medium" style={{ color: '#2D2D2D' }}>Version {snap.settings.version}</p>
                          <p className="text-xs" style={{ color: '#6B7280' }}>{new Date(snap.savedAt).toLocaleString()}</p>
                        </div>
                        <button onClick={() => setRestoreConfirm(snap)}
                          className="text-xs px-3 py-1.5 rounded-lg"
                          style={{ backgroundColor: 'rgba(0,0,0,0.1)', color: '#F5C518', border: '1px solid rgba(0,0,0,0.2)' }}>
                          Restore
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Redo wizard */}
        <div className="text-center mt-6 mb-4">
          <a href="/onboarding" className="text-xs underline" style={{ color: '#6B7280' }}>
            Want to redo the initial setup? Run wizard again →
          </a>
        </div>
      </div>

      {/* Restore Confirmation Dialog */}
      {restoreConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="mx-4 w-full max-w-sm rounded-xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.3)' }}>
            <h3 className="font-semibold mb-2" style={{ color: '#2D2D2D' }}>Restore this version?</h3>
            <p className="text-sm mb-5" style={{ color: '#6B7280' }}>
              This will replace your current settings with version {restoreConfirm.settings.version} from {new Date(restoreConfirm.savedAt).toLocaleString()}. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => handleRestore(restoreConfirm)} disabled={!!loading.restore}
                className="flex-1 py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
                style={{ backgroundColor: '#F5C518', color: '#F7F6F1' }}>
                {loading.restore ? 'Restoring...' : 'Yes, restore'}
              </button>
              <button onClick={() => setRestoreConfirm(null)} className="flex-1 py-3 rounded-xl text-sm"
                style={{ backgroundColor: 'rgba(0,0,0,0.1)', color: '#6B7280', border: '1px solid rgba(0,0,0,0.2)' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
