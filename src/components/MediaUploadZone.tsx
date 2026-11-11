import { useCallback, useRef, useState } from 'react'
import { UploadCloud, FileImage } from 'lucide-react'

export default function MediaUploadZone({
  onFile,
  disabled,
}: {
  onFile: (_f: File) => void
  disabled?: boolean
}) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0 || disabled) return
      const file = files[0]
      if (!file.type.startsWith('image/')) return
      onFile(file)
    },
    [onFile, disabled],
  )

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label="Upload media for analysis"
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (disabled || !inputRef.current) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          inputRef.current.click()
        }
      }}
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        handleFiles(e.dataTransfer.files)
      }}
      className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
        dragOver
          ? 'border-accent/70 bg-accent-dim'
          : 'border-lineBright/70 bg-elevated hover:border-lineBright'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl border border-line transition-colors ${
          dragOver ? 'bg-accent/15 text-accent' : 'bg-base text-ink3 group-hover:text-ink2'
        }`}
      >
        {dragOver ? <FileImage className="h-5 w-5" /> : <UploadCloud className="h-5 w-5" />}
      </div>
      <p className="mt-3 text-[13px] font-medium text-ink">
        {dragOver ? 'Drop to analyze' : 'Drag & drop an image here'}
      </p>
      <p className="mt-1 text-micro text-ink3">
        or <span className="font-medium text-[#F5B942] no-underline">browse files</span> · JPEG, PNG, WebP, HEIF · max 100 MB
      </p>
    </div>
  )
}
