import { useCallback, useRef, useState } from 'react'
import { FileUp, Download, X, CheckCircle2 } from 'lucide-react'
import { parseCsv, buildTemplateBlob, readFileAsText } from './csvImportUtils'
import { classNames } from '../../../lib/utils'

export default function UploadStep({ onParsed }) {
  const [dragOver, setDragOver] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [file, setFile] = useState(null)
  const [parsed, setParsed] = useState(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  function handleTemplateDownload() {
    const blob = buildTemplateBlob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'rippling_bulk_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function processText(text, sourceName) {
    setError('')
    const result = parseCsv(text)
    if (result.headers.length === 0) {
      setError('Could not parse any columns from the CSV. Please check the format.')
      setParsed(null)
      onParsed(null)
      return
    }
    if (result.rows.length === 0) {
      setError('The CSV has headers but no data rows.')
      setParsed(null)
      onParsed(null)
      return
    }
    const finalResult = { ...result, sourceName }
    setParsed(finalResult)
    onParsed(finalResult)
  }

  async function handleFile(f) {
    if (!f) return
    if (!f.name.endsWith('.csv') && f.type !== 'text/csv') {
      setError('Please upload a .csv file.')
      return
    }
    setFile(f)
    setPasteText('')
    setParsed(null)
    onParsed(null)
    try {
      const text = await readFileAsText(f)
      processText(text, f.name)
    } catch {
      setError('Failed to read the file.')
    }
  }

  function handleFileInput(e) {
    handleFile(e.target.files?.[0])
  }

  const handleDrop = useCallback(async (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    handleFile(f)
  }, [])

  function handlePasteChange(e) {
    const text = e.target.value
    setPasteText(text)
    setFile(null)
    setParsed(null)
    onParsed(null)
    setError('')
    if (text.trim()) {
      processText(text, 'Pasted CSV')
    }
  }

  function clearAll() {
    setFile(null)
    setPasteText('')
    setParsed(null)
    setError('')
    onParsed(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[13.5px] text-rippling-ink font-semibold mb-1">
          Step 1. Download the CSV template
        </p>
        <p className="text-[12.5px] text-rippling-muted leading-relaxed mb-2">
          Use the template to enter employee names and emails. You can skip columns you don't need.
        </p>
        <button
          type="button"
          onClick={handleTemplateDownload}
          className="inline-flex items-center gap-1.5 text-[12.5px] text-rippling-plum font-medium hover:underline"
        >
          <Download size={13} strokeWidth={2} />
          Download CSV template
        </button>
      </div>

      <div className="border-t border-rippling-line-2" />

      <div>
        <p className="text-[13.5px] text-rippling-ink font-semibold mb-1">
          Step 2. Fill out and save the CSV file
        </p>
        <p className="text-[12.5px] text-rippling-muted leading-relaxed">
          Add a row for each employee. Use the Name and/or Email columns to identify them.
        </p>
      </div>

      <div className="border-t border-rippling-line-2" />

      <div>
        <p className="text-[13.5px] text-rippling-ink font-semibold mb-3">
          Step 3. Upload the completed CSV file
        </p>

        {/* Dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={classNames(
            'relative border-2 border-dashed rounded-lg flex flex-col items-center justify-center py-10 px-6 transition-colors cursor-pointer',
            dragOver
              ? 'border-rippling-plum bg-rippling-chip'
              : file && parsed
              ? 'border-green-400 bg-green-50'
              : 'border-rippling-line hover:border-rippling-plum/40 hover:bg-rippling-surface',
          )}
          onClick={() => !file && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={handleFileInput}
          />
          {file && parsed ? (
            <>
              <CheckCircle2 size={28} strokeWidth={1.5} className="text-green-500 mb-2" />
              <p className="text-[13px] font-medium text-rippling-ink">{file.name}</p>
              <p className="text-[12px] text-rippling-muted mt-0.5">
                {parsed.rows.length} {parsed.rows.length === 1 ? 'row' : 'rows'} detected
              </p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); clearAll() }}
                className="mt-3 inline-flex items-center gap-1 text-[11.5px] text-rippling-muted hover:text-rippling-ink"
              >
                <X size={11} strokeWidth={2} /> Remove
              </button>
            </>
          ) : (
            <>
              <FileUp size={28} strokeWidth={1.5} className="text-rippling-plum mb-2" />
              <p className="text-[13.5px] text-rippling-plum font-medium">
                Drop or select (.csv)
              </p>
              <p className="text-[11.5px] text-rippling-muted mt-1">
                Click to browse or drag a file here
              </p>
            </>
          )}
        </div>

        {/* Or divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 border-t border-rippling-line" />
          <span className="text-[12px] font-medium text-rippling-muted">Or</span>
          <div className="flex-1 border-t border-rippling-line" />
        </div>

        {/* Paste area */}
        <div>
          <p className="text-[12.5px] font-semibold text-rippling-ink mb-1.5">
            Paste your CSV data here
          </p>
          <textarea
            value={pasteText}
            onChange={handlePasteChange}
            placeholder={`Name,Email\nJane Smith,jane.smith@acme.com\nJohn Doe,john.doe@acme.com`}
            rows={5}
            className="w-full text-[12px] font-mono rounded-md border border-rippling-line bg-rippling-surface px-3 py-2 text-rippling-ink placeholder:text-rippling-muted/50 focus:outline-none focus:border-rippling-plum/60 focus:ring-1 focus:ring-rippling-plum/20 resize-none"
          />
          {pasteText && parsed && (
            <p className="text-[11.5px] text-green-600 mt-1 flex items-center gap-1">
              <CheckCircle2 size={11} strokeWidth={2} />
              {parsed.rows.length} {parsed.rows.length === 1 ? 'row' : 'rows'} detected
            </p>
          )}
        </div>

        {error && (
          <p className="mt-2 text-[12px] text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
