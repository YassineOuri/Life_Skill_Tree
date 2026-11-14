import { router } from '@inertiajs/react'
import { Download, FileText, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'

const ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp'

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/** Certificates and other proof attached to a skill: upload, preview, download, delete. */
export default function EvidenceFiles({ node, color }) {
    const input = useRef(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState(null)

    const upload = fileList => {
        if (!fileList?.length) return
        setError(null)
        setUploading(true)
        router.post(`/nodes/${node.id}/files`, { files: [...fileList] }, {
            forceFormData: true,
            preserveScroll: true,
            onError: errors => setError(Object.values(errors)[0]),
            onFinish: () => {
                setUploading(false)
                if (input.current) input.current.value = ''
            },
        })
    }

    const remove = file => {
        if (!confirm(`Delete "${file.name}"?`)) return
        router.delete(`/files/${file.id}`, { preserveScroll: true })
    }

    return (
        <div>
            {node.files.length > 0 && (
                <ul className="mb-3 grid grid-cols-3 gap-2">
                    {node.files.map(file => (
                        <li key={file.id} className="group relative border border-ink-600 bg-ink-950/60">
                            <a href={file.url} target="_blank" rel="noreferrer" title={`${file.name} · ${formatSize(file.size)}`}>
                                {file.mime.startsWith('image/') ? (
                                    <img src={file.url} alt={file.name} className="h-20 w-full object-cover" />
                                ) : (
                                    <div className="flex h-20 flex-col items-center justify-center gap-1">
                                        <FileText size={26} style={{ color }} />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-parchment-dim">PDF</span>
                                    </div>
                                )}
                                <p className="truncate px-1.5 py-1 text-[11px] font-semibold text-parchment">{file.name}</p>
                            </a>
                            <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition group-hover:opacity-100">
                                <a href={file.download_url} className="bg-ink-900/90 p-1 text-parchment hover:text-gold-300" aria-label="Download">
                                    <Download size={13} />
                                </a>
                                <button type="button" onClick={() => remove(file)} className="bg-ink-900/90 p-1 text-parchment hover:text-red-400" aria-label="Delete">
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <label
                className="flex cursor-pointer items-center justify-center gap-2 border border-dashed border-ink-600 px-3 py-3 text-sm font-semibold text-parchment-dim transition hover:border-gold-500 hover:text-gold-300"
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                    e.preventDefault()
                    upload(e.dataTransfer.files)
                }}
            >
                <Upload size={16} />
                {uploading ? 'Uploading…' : 'Add certificate (PDF or image, ≤ 10 MB)'}
                <input ref={input} type="file" multiple accept={ACCEPT} className="hidden" onChange={e => upload(e.target.files)} />
            </label>
            {error && <p className="mt-2 text-sm font-semibold text-red-400">{error}</p>}
        </div>
    )
}
