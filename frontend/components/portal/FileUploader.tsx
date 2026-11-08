'use client'

import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { UploadPurpose, errorMessage, uploadFile } from '@/lib/portal/api'
import { btn } from './kit'
import { notifyError, notifyOk } from '@/lib/portal/hooks'

const MAX = 5 * 1024 * 1024
const OK_TYPES = ['image/jpeg', 'image/png', 'application/pdf']

// Uploads straight to Backblaze B2 using a presigned PUT URL, with a progress bar
export default function FileUploader({ purpose, ownerId, label = 'Upload file', accept, onDone }: {
  purpose: UploadPurpose
  ownerId: string
  label?: string
  accept?: string
  onDone?: () => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [pct, setPct] = useState<number | null>(null)

  const onFile = async (file?: File) => {
    if (!file) return
    if (!OK_TYPES.includes(file.type)) return notifyError(new Error('Only JPG, PNG or PDF files are allowed'))
    if (file.size > MAX) return notifyError(new Error('File must be 5 MB or smaller'))
    try {
      setPct(0)
      await uploadFile(file, purpose, ownerId, setPct)
      notifyOk('Uploaded', file.name)
      onDone?.()
    } catch (e) {
      notifyError(new Error(errorMessage(e)))
    } finally {
      setPct(null)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <input ref={input} type="file" hidden accept={accept || 'image/jpeg,image/png,application/pdf'} onChange={(e) => onFile(e.target.files?.[0])} />
      <button type="button" className={btn('outline', 'sm')} disabled={pct !== null} onClick={() => input.current?.click()}>
        <Upload className="h-4 w-4" /> {pct === null ? label : `Uploading ${pct}%`}
      </button>
      {pct !== null && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-purple transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  )
}
