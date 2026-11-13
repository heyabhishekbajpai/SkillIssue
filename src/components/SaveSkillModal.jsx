import { useState } from 'react'
import { X, Globe, Lock } from 'lucide-react'

// Visibility picker shown before saving a built or uploaded skill
export default function SaveModal({ onClose, onSave }) {
    const [visibility, setVisibility] = useState('public')
    const options = [
        { id: 'public', icon: Globe, label: 'Public', desc: 'Anyone on Skill Issue can see and copy this skill.' },
        { id: 'private', icon: Lock, label: 'Private', desc: 'Only you can see this skill.' },
    ]
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div role="dialog" aria-modal="true" aria-labelledby="save-title" className="modal-card max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-line-muted px-4 py-3">
                    <h3 id="save-title" className="font-sans text-sm font-semibold">Save skill</h3>
                    <button type="button" onClick={onClose} className="btn-invisible btn-icon btn-sm" aria-label="Close"><X className="h-4 w-4" /></button>
                </div>
                <fieldset className="space-y-2 p-4">
                    <legend className="mb-2 text-sm text-fg-muted">Who can see this skill?</legend>
                    {options.map(({ id, icon: Icon, label, desc }) => (
                        <label
                            key={id}
                            className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${visibility === id ? 'border-accent bg-accent-subtle' : 'border-line hover:bg-canvas-subtle'}`}
                        >
                            <input type="radio" name="visibility" value={id} checked={visibility === id} onChange={() => setVisibility(id)} className="mt-1 accent-[rgb(var(--accent-emphasis))]" />
                            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-fg-muted" />
                            <span>
                                <span className="block text-sm font-semibold">{label}</span>
                                <span className="block text-xs text-fg-muted">{desc}</span>
                            </span>
                        </label>
                    ))}
                </fieldset>
                <div className="flex justify-end gap-2 border-t border-line-muted bg-canvas-subtle px-4 py-3">
                    <button type="button" onClick={onClose} className="btn">Cancel</button>
                    <button type="button" onClick={() => onSave(visibility)} className="btn-primary">Save skill</button>
                </div>
            </div>
        </div>
    )
}

