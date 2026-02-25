import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { updateProfile } from '../lib/userService'

export default function EditProfileModal({ profile, onClose, onSave }) {
    const { user } = useAuth()
    const [displayName, setDisplayName] = useState(profile?.display_name || user?.user_metadata?.full_name || '')
    const [bio, setBio] = useState(profile?.bio || '')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    async function handleSave(e) {
        e.preventDefault()
        setSaving(true)
        setError('')
        try {
            const updated = await updateProfile({
                id: user.id,
                display_name: displayName.trim(),
                bio: bio.trim(),
            })
            onSave(updated)
            onClose()
        } catch (err) {
            setError(err.message || 'Failed to save. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-md bg-[#0d1225] border border-white/[0.08] rounded-2xl p-8 shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h2 className="font-clash font-bold text-xl mb-6">Edit Profile</h2>

                <form onSubmit={handleSave} className="space-y-5">
                    <div>
                        <label className="block font-satoshi text-xs text-white/40 uppercase tracking-widest mb-1.5">
                            Display Name
                        </label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            maxLength={60}
                            placeholder="Your name"
                            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-accent/40 text-white placeholder:text-white/20 font-satoshi text-sm outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block font-satoshi text-xs text-white/40 uppercase tracking-widest mb-1.5">
                            Bio
                            <span className="ml-2 normal-case tracking-normal text-white/20">{bio.length}/160</span>
                        </label>
                        <textarea
                            value={bio}
                            onChange={e => setBio(e.target.value.slice(0, 160))}
                            rows={3}
                            placeholder="Tell people about yourself or your AI skills..."
                            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-accent/40 text-white placeholder:text-white/20 font-satoshi text-sm outline-none transition-all resize-none"
                        />
                    </div>

                    {error && (
                        <p className="font-satoshi text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                            {error}
                        </p>
                    )}

                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl border border-white/[0.08] text-white/50 font-satoshi text-sm hover:text-white/80 hover:border-white/20 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 py-3 rounded-xl bg-accent text-navy font-satoshi font-bold text-sm hover:bg-[#6bbcff] transition-all disabled:opacity-50"
                        >
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
