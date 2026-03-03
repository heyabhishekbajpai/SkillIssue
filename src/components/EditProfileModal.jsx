import { useState, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { updateProfile } from '../lib/userService'
import { storage, account, ID, Permission, Role, AVATARS_BUCKET_ID } from '../lib/appwrite'

const PREVIEW_SIZE = 200 // diameter of the circular crop area in px
const OUTPUT_SIZE  = 512 // final avatar canvas size in px

// Crops the original image to exactly what's visible in the circular preview.
// Uses the same geometry as the preview rendering so preview === saved output.
async function cropCircle(imageSrc, { cropScale, offsetX, offsetY }) {
    return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
            // Minimum scale to fill the preview circle (same as baseScale in the UI)
            const baseScale = Math.max(PREVIEW_SIZE / img.naturalWidth, PREVIEW_SIZE / img.naturalHeight)
            const displayScale = baseScale * cropScale

            // Top-left of the displayed image inside the PREVIEW_SIZE container
            const imgLeft = (PREVIEW_SIZE - img.naturalWidth  * displayScale) / 2 + offsetX
            const imgTop  = (PREVIEW_SIZE - img.naturalHeight * displayScale) / 2 + offsetY

            // Source rectangle in original image pixel coordinates
            const srcX = -imgLeft / displayScale
            const srcY = -imgTop  / displayScale
            const srcW =  PREVIEW_SIZE / displayScale
            const srcH =  PREVIEW_SIZE / displayScale

            const canvas = document.createElement('canvas')
            canvas.width  = OUTPUT_SIZE
            canvas.height = OUTPUT_SIZE
            const ctx = canvas.getContext('2d')

            ctx.beginPath()
            ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2)
            ctx.clip()

            ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
            canvas.toBlob(resolve, 'image/jpeg', 0.92)
        }
        img.src = imageSrc
    })
}

export default function EditProfileModal({ profile, onClose, onSave }) {
    const { user, refreshProfile } = useAuth()

    // ── Text fields ──────────────────────────────────────────
    const [displayName, setDisplayName] = useState(profile?.display_name || user?.user_metadata?.full_name || '')
    const [bio, setBio] = useState(profile?.bio || '')

    // ── Photo upload & crop state ────────────────────────────
    const [photoStep, setPhotoStep] = useState('idle') // idle | cropping | uploading
    const [rawSrc, setRawSrc] = useState(null)          // data URL of chosen file
    const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 }) // natural px dimensions
    const [cropScale, setCropScale] = useState(1)
    const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 })
    const [dragStart, setDragStart] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(profile?.avatar_url || null)

    // Derived preview geometry — image positioned absolutely inside the circle container
    const baseScale = imgNatural.w && imgNatural.h
        ? Math.max(PREVIEW_SIZE / imgNatural.w, PREVIEW_SIZE / imgNatural.h)
        : 1
    const displayScale = baseScale * cropScale
    const imgLeft = (PREVIEW_SIZE - imgNatural.w * displayScale) / 2 + cropOffset.x
    const imgTop  = (PREVIEW_SIZE - imgNatural.h * displayScale) / 2 + cropOffset.y

    // Clamp offset so the image always fully covers the circle — no empty edges.
    function clampOffset(ox, oy, scale = cropScale) {
        const iw = imgNatural.w * baseScale * scale
        const ih = imgNatural.h * baseScale * scale
        const maxX = Math.max(0, (iw - PREVIEW_SIZE) / 2)
        const maxY = Math.max(0, (ih - PREVIEW_SIZE) / 2)
        return {
            x: Math.min(maxX, Math.max(-maxX, ox)),
            y: Math.min(maxY, Math.max(-maxY, oy)),
        }
    }

    // ── General state ────────────────────────────────────────
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const fileInputRef = useRef(null)

    // ── Pick file ────────────────────────────────────────────
    function handleFilePick(e) {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5 MB'); return }

        const reader = new FileReader()
        reader.onload = (ev) => {
            const src = ev.target.result
            // Load image to capture natural dimensions before entering crop step
            const tmp = new window.Image()
            tmp.onload = () => {
                setImgNatural({ w: tmp.naturalWidth, h: tmp.naturalHeight })
                setRawSrc(src)
                setCropScale(1)
                setCropOffset({ x: 0, y: 0 })
                setPhotoStep('cropping')
                setError('')
            }
            tmp.src = src
        }
        reader.readAsDataURL(file)
    }

    // ── Drag to pan ──────────────────────────────────────────
    const handleMouseDown = useCallback((e) => {
        setDragStart({ x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y })
    }, [cropOffset])

    const handleMouseMove = useCallback((e) => {
        if (!dragStart) return
        setCropOffset(prev => {
            const raw = { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }
            return clampOffset(raw.x, raw.y)
        })
    }, [dragStart, imgNatural, baseScale, cropScale])

    const handleMouseUp = useCallback(() => setDragStart(null), [])

    // Touch equivalents
    const handleTouchStart = useCallback((e) => {
        const t = e.touches[0]
        setDragStart({ x: t.clientX - cropOffset.x, y: t.clientY - cropOffset.y })
    }, [cropOffset])

    const handleTouchMove = useCallback((e) => {
        if (!dragStart) return
        const t = e.touches[0]
        setCropOffset(prev => {
            const raw = { x: t.clientX - dragStart.x, y: t.clientY - dragStart.y }
            return clampOffset(raw.x, raw.y)
        })
    }, [dragStart, imgNatural, baseScale, cropScale])

    // ── Upload cropped photo ─────────────────────────────────
    async function handleCropConfirm() {
        if (!rawSrc) return
        setPhotoStep('uploading')
        setError('')

        try {
            const blob = await cropCircle(rawSrc, {
                cropScale,
                offsetX: cropOffset.x,
                offsetY: cropOffset.y,
            })

            const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })

            // Upload to Appwrite Storage — per-file permissions so only owner can edit
            const uploaded = await storage.createFile(
                AVATARS_BUCKET_ID,
                ID.unique(),
                file,
                [
                    Permission.read(Role.any()),
                    Permission.update(Role.user(user.$id ?? user.id)),
                    Permission.delete(Role.user(user.$id ?? user.id)),
                ]
            )

            // Build the public URL for this file
            const publicUrl = storage.getFileView(AVATARS_BUCKET_ID, uploaded.$id).toString()
            setPreviewUrl(publicUrl)

            // Save to account prefs so enrichUser() picks it up immediately
            const prefs = await account.getPrefs()
            await account.updatePrefs({ ...prefs, avatar_url: publicUrl })

            // Also persist to the users collection row
            await updateProfile({ id: profile.id, display_name: displayName.trim(), bio: bio.trim(), avatar_url: publicUrl })
            onSave({ display_name: displayName.trim(), bio: bio.trim(), avatar_url: publicUrl })
            await refreshProfile()
            onClose()
        } catch (err) {
            setError(err.message || 'Upload failed. Please try again.')
            setPhotoStep('cropping')
        }
    }

    // ── Save text-only changes ───────────────────────────────
    async function handleSave(e) {
        e.preventDefault()
        setSaving(true)
        setError('')
        try {
            const updated = await updateProfile({
                id: profile.id,
                display_name: displayName.trim(),
                bio: bio.trim(),
            })
            onSave(updated)
            await refreshProfile()
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
            onClick={photoStep === 'cropping' ? undefined : onClose}
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

                {/* ── CROP STEP ── */}
                {photoStep === 'cropping' && rawSrc ? (
                    <div className="space-y-5">
                        <div className="text-center">
                            <h2 className="font-clash font-bold text-xl">Adjust Photo</h2>
                            <p className="font-satoshi text-xs text-white/30 mt-1">Drag to reposition · scroll to zoom</p>
                        </div>

                        {/* Crop circle viewport */}
                        <div className="flex justify-center">
                            <div
                                className="relative overflow-hidden rounded-full border-2 border-accent/40 shadow-[0_0_40px_rgba(75,169,255,0.2)] cursor-grab active:cursor-grabbing select-none"
                                style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleMouseUp}
                                onWheel={e => {
                                    e.preventDefault()
                                    const newScale = Math.min(4, Math.max(1, cropScale - e.deltaY * 0.003))
                                    setCropScale(newScale)
                                    setCropOffset(prev => clampOffset(prev.x, prev.y, newScale))
                                }}
                            >
                                {/* Absolutely positioned so preview geometry exactly matches canvas output */}
                                <img
                                    src={rawSrc}
                                    alt="crop"
                                    draggable={false}
                                    style={{
                                        position: 'absolute',
                                        left: imgLeft,
                                        top: imgTop,
                                        width: imgNatural.w * displayScale,
                                        height: imgNatural.h * displayScale,
                                        maxWidth: 'none',
                                        pointerEvents: 'none',
                                        userSelect: 'none',
                                    }}
                                />
                            </div>
                        </div>

                        {/* Zoom slider */}
                        <div className="flex items-center gap-3 px-2">
                            <svg className="w-3.5 h-3.5 text-white/30 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                            </svg>
                            <input
                                type="range" min="1" max="4" step="0.01"
                                value={cropScale}
                                onChange={e => {
                                    const newScale = parseFloat(e.target.value)
                                    setCropScale(newScale)
                                    setCropOffset(prev => clampOffset(prev.x, prev.y, newScale))
                                }}
                                className="flex-1 h-1.5 appearance-none bg-white/10 rounded-full accent-accent cursor-pointer"
                            />
                            <svg className="w-5 h-5 text-white/30 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                            </svg>
                        </div>

                        {error && (
                            <p className="font-satoshi text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{error}</p>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setPhotoStep('idle'); setRawSrc(null) }}
                                className="flex-1 py-3 rounded-xl border border-white/[0.08] text-white/50 font-satoshi text-sm hover:text-white/80 hover:border-white/20 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCropConfirm}
                                className="flex-1 py-3 rounded-xl bg-accent text-navy font-satoshi font-bold text-sm hover:bg-[#6bbcff] transition-all"
                            >
                                Upload Photo →
                            </button>
                        </div>
                    </div>
                ) : photoStep === 'uploading' ? (
                    /* ── UPLOADING STEP ── */
                    <div className="flex flex-col items-center gap-5 py-8">
                        <div className="w-12 h-12 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
                        <p className="font-satoshi text-sm text-white/40">Uploading your photo…</p>
                    </div>
                ) : (
                    /* ── MAIN EDIT STEP ── */
                    <>
                        <h2 className="font-clash font-bold text-xl mb-6">Edit Profile</h2>

                        {/* Avatar with upload button */}
                        <div className="flex justify-center mb-7">
                            <div className="relative group">
                                {/* Avatar ring */}
                                <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-accent/40 via-accent/10 to-accent/30 opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                                {previewUrl ? (
                                    <img
                                        src={previewUrl}
                                        alt="Avatar"
                                        className="relative w-24 h-24 rounded-full border-2 border-navy object-cover"
                                    />
                                ) : (
                                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-navy-200 to-navy-100 border-2 border-navy flex items-center justify-center">
                                        <span className="font-clash font-medium text-4xl text-accent">
                                            {(displayName || profile?.username || '?').charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                )}

                                {/* Camera overlay button */}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 rounded-full bg-navy/70 backdrop-blur-sm flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 border border-accent/20"
                                >
                                    <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                                    </svg>
                                    <span className="font-satoshi text-[10px] text-accent/80 font-semibold">Change</span>
                                </button>
                            </div>
                        </div>

                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="sr-only"
                            onChange={handleFilePick}
                        />

                        {/* Upload button (visible on mobile / always accessible) */}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full mb-5 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] text-white/40 font-satoshi text-xs font-medium hover:text-accent/70 hover:border-accent/20 hover:bg-accent/[0.04] transition-all duration-300"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                            Upload Photo
                        </button>

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
                                <p className="font-satoshi text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{error}</p>
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
                    </>
                )}
            </div>
        </div>
    )
}
