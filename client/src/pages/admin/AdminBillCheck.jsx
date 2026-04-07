import { useState } from 'react'
import { PageTitle } from '@/components/ui'

const CATS = {
  medicine:    { label:'💊 Medicines & Pharmacy',     color:'#0284c7', bg:'#f0f9ff', border:'#bae6fd', claimable:true,
    kw:['tablet','capsule','syrup','injection','inj.','iv fluid','infusion','drip','saline','dextrose','ringer','ampoule','vial','ointment','cream','drops','inhaler','patch',' mg ',' ml ',' mcg ','strips','strip','paracetamol','amoxicillin','ciprofloxacin','metronidazole','pantoprazole','omeprazole','ondansetron','ranitidine','metformin','atorvastatin','clopidogrel','aspirin','heparin','insulin','dexamethasone','furosemide','diclofenac','ibuprofen','tramadol','vancomycin','meropenem','ceftriaxone','amikacin','linezolid','pharmacy','pharma','medicine','medication','prescription','antibiotic','analgesic','antiemetic','dispensed'] },
  room:        { label:'🛏️ Room & Boarding',           color:'#3730a3', bg:'#f5f0ff', border:'#ddd6fe', claimable:true,
    kw:['room charge','room rent','bed charge','ward charge','icu charge','icu rent','nicu','picu','cabin','bed rent','accommodation','room tariff','general ward','private ward','semi-private'] },
  ot:          { label:'🔬 Surgical & OT Charges',     color:'#1e8a4c', bg:'#f0fdf4', border:'#bbf7d0', claimable:true,
    kw:['ot charge','operation theatre','theatre charge','ot complex','surgical charge','anaesthesia','anesthesia','anesthetic','surgeon fee','surgeon charge','surgery charge','operation charge','procedure charge','surgical fee','consultant fee','specialist fee','doctor fee','physician fee','operating room'] },
  diagnostic:  { label:'🧪 Diagnostics & Lab',         color:'#c45f00', bg:'#fff7ed', border:'#fed7aa', claimable:true,
    kw:['lab ','laboratory','pathology','blood test','urine test','x-ray','xray','mri','ct scan','ultrasound','usg ','ecg ','eeg ','2d echo','echocardiography','endoscopy','biopsy','haemogram','cbc ','lft ','kft ','tsh ','thyroid','glucose','hba1c','radiology','imaging','diagnostic','serology','histopathology','culture sensitivity','test charge','test -','report'] },
  non_medical: { label:'🚫 Non-Medical / Non-Payable', color:'#c62828', bg:'#fdecea', border:'#ef9a9a', claimable:false,
    kw:['food','meal','lunch','dinner','breakfast','canteen','tea ','coffee','laundry','telephone','tv charge','television','newspaper','toiletry','amenity','parking','transport','courier','stationery','photocopy','birth certificate','alcohol','tobacco','cosmetic','beautician','massage','spa ','personal care','diaper','sanitary pad','mobile','internet','wifi','cable tv','registration charge','admission charge','discharge charge','file charge','service charge','sundry','miscellaneous','attendant charge','companion','visitor pass'] },
  other:       { label:'📋 Other Charges',              color:'#5f6368', bg:'#f5f5f5', border:'#e0e0e0', claimable:null, kw:[] },
}

function detectCategory(line) {
  const l = line.toLowerCase()
  for (const [key, cat] of Object.entries(CATS)) {
    if (key === 'other') continue
    if (cat.kw.some(k => l.includes(k))) return key
  }
  return 'other'
}

function extractAmount(line) {
  const patterns = [
    /[=:]\s*(?:rs\.?|₹|inr)?\s*([\d,]+(?:\.\d{1,2})?)\s*$/i,
    /(?:rs\.?|₹|inr)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /([\d,]+(?:\.\d{1,2})?)\s*$/,
  ]
  for (const re of patterns) {
    const m = line.match(re)
    if (m) { const v = parseFloat(m[1].replace(/,/g,'')); if (v > 0) return v }
  }
  return 0
}

const SAMPLE_BILL = `ICU Room charges - 3 days @ Rs.8000/day = Rs.24000
General Ward - 2 days @ Rs.2500/day = Rs.5000
Surgeon fee = Rs.35000
OT charges = Rs.18000
Anaesthesia charges = Rs.12000
Ceftriaxone 1g Injection x10 vials = Rs.4500
Paracetamol Tab 500mg x30 strips = Rs.180
Metronidazole IV 500mg x6 = Rs.900
NS IV Fluid 500ml x8 = Rs.1200
Ondansetron Inj 4mg x6 = Rs.480
Haemogram CBC = Rs.800
Liver Function Test LFT = Rs.900
Kidney Function Test KFT = Rs.750
X-Ray Chest PA view = Rs.600
2D Echo = Rs.2800
Food and meal charges = Rs.2500
Attendant charges = Rs.3000
TV charges = Rs.500
Laundry = Rs.300
Registration charge = Rs.200
File charge = Rs.150
Miscellaneous = Rs.750`

export default function AdminBillCheck() {
  const [billText, setBillText]     = useState('')
  const [uploadedFile, setUploadedFile] = useState('')
  const [uploading, setUploading]   = useState(false)
  const [analyzing, setAnalyzing]   = useState(false)
  const [result, setResult]         = useState(null)
  const [corrected, setCorrected]   = useState([])

  const fmt = (n) => '₹' + Math.round(n).toLocaleString('en-IN')

  const parseBillLocal = (text) => {
    return text.split('\n').map((rawLine, idx) => {
      const line = rawLine.trim()
      if (!line || line.length < 3) return null
      const cat  = detectCategory(line)
      const meta = CATS[cat]
      const amount = extractAmount(line)
      return { lineNo: idx+1, line, category: cat, catLabel: meta.label, amount, claimable: meta.claimable, color: meta.color, bg: meta.bg, border: meta.border, flagged: cat === 'non_medical' }
    }).filter(Boolean)
  }

  const runAnalysis = async (text) => {
    if (!text.trim()) { alert('Please upload a bill or paste the bill content first'); return }
    setAnalyzing(true)
    setResult(null)
    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_KEY || ''
      if (!apiKey) throw new Error('No API key - using local analysis')
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [{ role: 'user', content: `You are an Indian hospital bill auditor. Analyze this hospital bill and return ONLY a JSON array. Each element: {"line":"exact item text","category":"medicine|room|ot|diagnostic|non_medical|other","amount":number,"claimable":true/false/null,"flagged":true/false,"reason":"short reason if flagged"}. medicine=drugs/pharma, room=room/bed/ward/icu, ot=surgery/anaesthesia/surgeon, diagnostic=lab/xray/mri/scan, non_medical=food/laundry/TV/attendant/registration (IRDAI non-payable). Return ONLY valid JSON array, no markdown.\n\nBill (first 200 lines):\n${text.split('\n').filter(l=>l.trim()).slice(0,200).join('\n')}` }]
        })
      })
      const data = await resp.json()
      if (data.error) throw new Error(data.error.message)
      const textBlock = data.content?.find(b => b.type === 'text')
      if (!textBlock) throw new Error('No text')
      const raw = textBlock.text.trim().replace(/^```json[\r\n]*/,'').replace(/[\r\n]*```$/,'')
      const parsed = JSON.parse(raw)
      const enriched = parsed.map((it, idx) => {
        const meta = CATS[it.category] || CATS.other
        return { ...it, lineNo: idx+1, catLabel: meta.label, color: meta.color, bg: meta.bg, border: meta.border }
      })
      setResult(enriched)
      setCorrected(enriched.map(r => ({...r})))
    } catch (err) {
      console.error('AI analysis failed, using local:', err)
      const results = parseBillLocal(text)
      setResult(results)
      setCorrected(results.map(r => ({...r})))
    }
    setAnalyzing(false)
  }

  const readFile = async (file) => {
    setUploading(true)
    setUploadedFile(file.name)
    let text = ''
    if (file.name.match(/\.pdf$/i)) {
      // Basic PDF text extraction
      const bytes = new Uint8Array(await file.arrayBuffer())
      let raw = ''
      try { raw = new TextDecoder('latin1').decode(bytes) } catch { for (let i=0;i<bytes.length;i++) { const b=bytes[i]; if(b>=32&&b<127) raw+=String.fromCharCode(b); else if(b===10||b===13) raw+='\n' } }
      let extracted = ''
      const btBlocks = raw.match(/BT[\s\S]{0,3000}?ET/g) || []
      btBlocks.forEach(block => {
        ;(block.match(/\(((?:[^()\\]|\\.)*)\)\s*Tj/g)||[]).forEach(m => { extracted += m.replace(/\(((?:[^()\\]|\\.)*)\)\s*Tj/,'$1')+'\n' })
        ;(block.match(/\[[\s\S]*?\]\s*TJ/g)||[]).forEach(m => { extracted += m.replace(/[\[\]]/g,'').replace(/\(([^)]*)\)/g,'$1').replace(/-?\d+/g,' ')+'\n' })
      })
      if (!extracted.trim()) {
        let seq = ''
        for (let i=0;i<raw.length;i++) {
          const b = raw.charCodeAt(i)
          if (b>=32&&b<127) seq+=raw[i]
          else if (b===10||b===13) { if(seq.trim().length>3) extracted+=seq.trim()+'\n'; seq='' }
        }
        if (seq.trim().length>3) extracted+=seq.trim()
      }
      text = extracted.split('\n').map(l=>l.replace(/\s+/g,' ').trim()).filter(l=>l.length>3&&/\d/.test(l)).join('\n')
        || '[Could not extract text — please paste the bill content below]'
    } else {
      text = await file.text()
    }
    setBillText(text)
    setUploading(false)
  }

  // Computed values
  const items = result || []
  const grouped = {}
  Object.keys(CATS).forEach(k => { grouped[k] = [] })
  items.forEach(it => { (grouped[it.category]||grouped.other).push(it) })
  const totalAmt          = items.reduce((s, r) => s + r.amount, 0)
  const claimableAmt      = items.filter(r => r.claimable === true).reduce((s, r) => s + r.amount, 0)
  const nonClaimableAmt   = items.filter(r => r.claimable === false).reduce((s, r) => s + r.amount, 0)
  const claimableCount    = items.filter(r => r.claimable === true).length
  const nonClaimableCount = items.filter(r => r.claimable === false).length

  const downloadReport = () => {
    const flagged = items.filter(r => r.flagged)
    const clean   = items.filter(r => !r.flagged)
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Bill Analysis Report</title>
<style>body{font-family:Arial,sans-serif;max-width:800px;margin:20px auto;padding:20px;color:#333}.hdr{background:#1e1b4b;color:#fff;padding:20px;border-radius:10px;margin-bottom:20px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}.card{padding:14px;border-radius:10px;text-align:center}.ok{background:#e6f4ed;color:#1e8a4c}.bad{background:#fdecea;color:#c62828}.sn{font-size:26px;font-weight:900}.item{padding:9px 12px;border-radius:8px;margin-bottom:7px;border-left:4px solid}.item-ok{background:#f8fffb;border-color:#1e8a4c}.item-bad{background:#fff8f8;border-color:#c62828}.ih{font-size:13px;font-weight:600}.is{font-size:11px;color:#888;margin-top:2px}.ia{float:right;font-size:13px;font-weight:700;margin-left:10px}.st{font-size:15px;font-weight:700;margin:15px 0 8px;padding-bottom:5px;border-bottom:2px solid #eee}.ft{font-size:11px;color:#888;margin-top:20px;text-align:center}</style></head><body>
<div class="hdr"><div style="font-size:20px;font-weight:800">🔍 Bill Analysis Report</div><div style="font-size:12px;opacity:.8;margin-top:4px">Heal Focus Admin · ${new Date().toLocaleDateString('en-IN')}</div></div>
<div class="grid">
<div class="card ok"><div class="sn">${clean.length}</div><div>✅ Claimable Items</div><div style="font-size:17px;font-weight:700;margin-top:5px">${fmt(claimableAmt)}</div></div>
<div class="card bad"><div class="sn">${flagged.length}</div><div>🚫 Non-Claimable</div><div style="font-size:17px;font-weight:700;margin-top:5px">${fmt(nonClaimableAmt)}</div></div>
</div>
<div class="st">🚫 Non-Claimable Items</div>
${flagged.map(i=>`<div class="item item-bad"><span class="ia">${i.amount>0?fmt(i.amount):''}</span><div class="ih">${i.line}</div><div class="is">${i.catLabel}</div></div>`).join('')||'<p style="color:#888">None ✅</p>'}
<div class="st">✅ Claimable Items</div>
${clean.map(i=>`<div class="item item-ok"><span class="ia">${i.amount>0?fmt(i.amount):''}</span><div class="ih">${i.line}</div><div class="is">${i.catLabel}</div></div>`).join('')}
<div class="ft">Analysis based on IRDAI guidelines. Verify with your TPA/insurer before submission.</div>
</body></html>`
    const a = document.createElement('a')
    a.href = 'data:text/html;charset=utf-8,' + encodeURIComponent(html)
    a.download = 'bill_analysis_' + Date.now() + '.html'
    a.click()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <PageTitle icon="🔍">AI Bill Analyzer</PageTitle>
      </div>

      {/* Header card */}
      <div className="rounded-2xl p-4 text-white mb-4" style={{ background: 'linear-gradient(135deg,#1e1b4b,#3730a3)' }}>
        <p className="text-[10px] opacity-60 tracking-widest mb-1">ADMIN TOOL</p>
        <p className="text-base font-black">🔍 AI Bill Analyzer</p>
        <p className="text-xs opacity-80 mt-1 leading-relaxed">Upload a hospital bill (PDF or TXT) or paste contents. AI detects medicines, room charges, OT, diagnostics and non-claimable items per IRDAI guidelines.</p>
      </div>

      {/* Input panel */}
      {!result && !analyzing && (
        <div className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card mb-4 space-y-3">
          <p className="text-sm font-black text-gray-800">📂 Upload or Paste Bill</p>

          {/* File upload */}
          <label className={`flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-5 cursor-pointer transition-all ${uploadedFile ? 'border-green-300 bg-green-50' : 'border-violet-300 bg-violet-50 hover:border-violet-500'}`}>
            <input type="file" accept=".pdf,.txt,.csv" className="hidden" onChange={async e => {
              const file = e.target.files[0]; if (!file) return
              await readFile(file); e.target.value = ''
            }} />
            {uploading ? (
              <p className="text-sm font-bold text-primary-700">⏳ Reading file...</p>
            ) : (
              <>
                <span className="text-3xl">📎</span>
                <p className="text-sm font-bold text-violet-700">Click to upload PDF or TXT</p>
                {uploadedFile ? (
                  <p className="text-xs font-bold text-green-700">✅ {uploadedFile}</p>
                ) : (
                  <p className="text-xs text-gray-500">PDF text extracted automatically</p>
                )}
              </>
            )}
          </label>

          {/* Textarea */}
          <div>
            <p className="text-[10px] text-gray-500 font-bold mb-1">BILL CONTENT (one item per line)</p>
            <textarea
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-xs font-mono leading-relaxed resize-none h-44 outline-none focus:border-primary-400"
              placeholder="Paste bill items here, e.g.&#10;ICU Room - 3 days = Rs.24000&#10;Surgeon fee = Rs.35000&#10;Paracetamol Tab 500mg x30 = Rs.180&#10;Food charges = Rs.2500"
              value={billText}
              onChange={e => setBillText(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button onClick={() => { setBillText(SAMPLE_BILL); setUploadedFile('') }}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold border-2 border-gray-200 text-gray-600">
              📋 Load Sample
            </button>
            <button onClick={() => runAnalysis(billText)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#1e1b4b,#3730a3)' }}>
              🤖 Analyze with AI
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center">AI analysis uses Claude to detect every line item. Falls back to keyword matching if API unavailable.</p>
        </div>
      )}

      {/* Analyzing state */}
      {analyzing && (
        <div className="bg-white border border-primary-100 rounded-2xl p-8 text-center shadow-card mb-4">
          <div className="text-5xl mb-3">🤖</div>
          <p className="text-base font-black text-primary-900 mb-1">Analyzing your bill...</p>
          <p className="text-xs text-gray-500 mb-5">AI is reading each line and categorising charges</p>
          <div className="flex gap-2 justify-center">
            {[0,1,2].map(i => <div key={i} className="w-3 h-3 rounded-full bg-primary-600 animate-bounce" style={{ animationDelay:`${i*0.3}s` }} />)}
          </div>
        </div>
      )}

      {/* Results */}
      {result && !analyzing && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-4 text-center text-white" style={{ background: 'linear-gradient(135deg,#1e8a4c,#34d399)' }}>
              <p className="text-2xl font-black">{claimableCount}</p>
              <p className="text-xs opacity-90">✅ Claimable Items</p>
              <p className="text-base font-black mt-1">{fmt(claimableAmt)}</p>
            </div>
            <div className="rounded-2xl p-4 text-center text-white" style={{ background: 'linear-gradient(135deg,#c62828,#f87171)' }}>
              <p className="text-2xl font-black">{nonClaimableCount}</p>
              <p className="text-xs opacity-90">🚫 Non-Claimable</p>
              <p className="text-base font-black mt-1">{fmt(nonClaimableAmt)}</p>
            </div>
          </div>

          {/* Category breakdown chart */}
          {totalAmt > 0 && (
            <div className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
              <p className="text-sm font-black text-gray-800 mb-3">📊 Category Breakdown</p>
              {Object.entries(CATS).filter(([k]) => grouped[k]?.length > 0).map(([k, meta]) => {
                const amt = grouped[k].reduce((s, r) => s + r.amount, 0)
                const pct = totalAmt > 0 ? Math.round(amt / totalAmt * 100) : 0
                return (
                  <div key={k} className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold" style={{ color: meta.color }}>{meta.label} ({grouped[k].length})</span>
                      <span className="font-black" style={{ color: meta.color }}>{fmt(amt)} · {pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width:`${pct}%`, background: meta.color }} />
                    </div>
                  </div>
                )
              })}
              <div className="flex justify-between border-t border-gray-200 pt-3 mt-2">
                <span className="text-sm font-black text-gray-800">Total Bill</span>
                <span className="text-sm font-black text-primary-700">{fmt(totalAmt)}</span>
              </div>
            </div>
          )}

          {/* Alert */}
          {nonClaimableCount > 0 ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-medium">
              ⚠️ {nonClaimableCount} non-claimable item(s) worth {fmt(nonClaimableAmt)} detected. Remove before submitting to insurance.
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700 font-medium">
              ✅ No non-medical items detected. Bill looks clean for insurance submission.
            </div>
          )}

          {/* Item-by-item grouped */}
          <div className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
            <p className="text-sm font-black text-gray-800 mb-3">📋 Item-by-Item Breakdown</p>
            {Object.entries(CATS).map(([k, meta]) => {
              const catItems = grouped[k] || []
              if (!catItems.length) return null
              const catAmt = catItems.reduce((s, r) => s + r.amount, 0)
              return (
                <div key={k} className="mb-5">
                  <div className="flex justify-between items-center rounded-xl px-3 py-2 mb-2" style={{ background: meta.bg, border:`1.5px solid ${meta.border}` }}>
                    <span className="text-xs font-black" style={{ color: meta.color }}>{meta.label}</span>
                    <span className="text-xs font-black" style={{ color: meta.color }}>{fmt(catAmt)}</span>
                  </div>
                  {catItems.map(item => (
                    <div key={item.lineNo} className="flex items-start gap-2 rounded-xl p-2.5 mb-1.5 bg-white border" style={{ borderColor: meta.border }}>
                      <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: meta.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-800 leading-relaxed break-words">{item.line}</p>
                        {item.flagged && <p className="text-[10px] font-bold mt-0.5" style={{ color: meta.color }}>⚠️ Non-payable per IRDAI — exclude from insurance claim</p>}
                        {item.reason && <p className="text-[10px] mt-0.5" style={{ color: meta.color }}>ℹ️ {item.reason}</p>}
                      </div>
                      {item.amount > 0 && <span className="text-xs font-black flex-shrink-0" style={{ color: meta.color, paddingTop:'2px' }}>{fmt(item.amount)}</span>}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={() => { setResult(null); setBillText(''); setUploadedFile(''); setCorrected([]) }}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold border-2 border-gray-200 text-gray-600">
              🔄 New Analysis
            </button>
            <button onClick={downloadReport}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#1e8a4c,#34d399)' }}>
              ⬇️ Download Report
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
