import { useState, useRef, useCallback, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { X, Camera, Upload, ZoomIn, ZoomOut } from 'lucide-react'
import { Spinner } from './ui/primitives'
import { updateProfile } from '../lib/userService'
import { storage, account, ID, Permission, Role, AVATARS_BUCKET_ID, isAppwriteConfigured } from '../lib/appwrite'

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
            const displayScale = Math.floor(baseScale * cropScale)

            // Top-left of the displayed image inside the PREVIEW_SIZE container
            const imgLeft = Math.floor((PREVIEW_SIZE - img.naturalWidth  * displayScale) / 2 + offsetX)
            const imgTop  = Math.floor((PREVIEW_SIZE - img.naturalHeight * displayScale) / 2 + offsetY)

            // Source rectangle in original image pixel coordinates
            const srcX = Math.floor(-imgLeft / displayScale)
            const srcY = Math.floor(-imgTop  / displayScale)
            const srcW =  Math.floor(PREVIEW_SIZE / displayScale)
            const srcH =  Math.floor(PREVIEW_SIZE / displayScale)

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
    const baseScale = imgNatural.w && imgNatural.h ? Math.max(PREVIEW_SIZE / imgNatural.w, PREVIEW_SIZE / imgNatural.h) : 1

    const displayScale = baseScale * cropScale

    const imgLeft = (PREVIEW_SIZE - imgNatural.w * displayScale) / 2 + cropOffset.x
    const imgTop  = (PREVIEW_SIZE - imgNatural.h * displayScale) / 2 + cropOffset.y

    // Clamp offset so the image always fully covers the circle — no empty edges.
    function clampOffset(ox, oy, scale = cropScale) {
        const iw = Math.floor(imgNatural.w * baseScale * scale)
        const ih = Math.floor(imgNatural.h * baseScale * scale)
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
    const [dragActive, setDragActive] = useState(false)
    const [globalDragActive, setGlobalDragActive] = useState(false)
    const fileInputRef = useRef(null)

    // Ref to always point at the latest processImageFile (avoids stale closure in global handler)
    const processImageFileRef = useRef(null)

    // Global drag and drop handlers
    useEffect(() => {
        const handleGlobalDragEnter = (e) => {
            e.preventDefault()
            e.stopPropagation()

            // Check if dragging files
            if (e.dataTransfer?.items) {
                for (let item of e.dataTransfer.items) {
                    if (item.kind === 'file') {
                        setGlobalDragActive(true)
                        break
                    }
                }
            }
        }

        const handleGlobalDragLeave = (e) => {
            e.preventDefault()
            e.stopPropagation()
            // Only deactivate if leaving the window
            if (e.clientX === 0 && e.clientY === 0) {
                setGlobalDragActive(false)
            }
        }

        const handleGlobalDragOver = (e) => {
            e.preventDefault()
            e.stopPropagation()
        }

        const handleGlobalDrop = (e) => {
            e.preventDefault()
            e.stopPropagation()
            setGlobalDragActive(false)

            const files = e.dataTransfer.files
            if (files && files.length > 0) {
                // Process first image only for profile pic
                const file = files[0]
                processImageFileRef.current?.(file)
            }
        }

        document.addEventListener('dragenter', handleGlobalDragEnter)
        document.addEventListener('dragleave', handleGlobalDragLeave)
        document.addEventListener('dragover', handleGlobalDragOver)
        document.addEventListener('drop', handleGlobalDrop)

        return () => {
            document.removeEventListener('dragenter', handleGlobalDragEnter)
            document.removeEventListener('dragleave', handleGlobalDragLeave)
            document.removeEventListener('dragover', handleGlobalDragOver)
            document.removeEventListener('drop', handleGlobalDrop)
        }
    }, [])

    // ── Validate and process file ────────────────────────────
    // Keep ref in sync so global drop handler always uses the latest function
    processImageFileRef.current = processImageFile

    function processImageFile(file) {
        if (!file) return

        // Validate it's an image
        const validImageTypes = ['image/jpeg', 'image/png', 'image/webp']
        if (!validImageTypes.includes(file.type)) {
            setError('Only image files (JPEG, PNG, WebP) are allowed')
            return
        }

        if (file.size > 1 * 1024 * 1024) {
            setError('Image must be under 1 MB')
            return
        }

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
            tmp.onerror = () => {
                setError('Failed to load image. Please try a different file.')
            }
            tmp.src = src
        }
        reader.readAsDataURL(file)
    }

    // ── Pick file ────────────────────────────────────────────
    function handleFilePick(e) {
        const file = e.target.files?.[0]
        processImageFile(file)
    }

    // ── Drag and drop handlers ───────────────────────────────
    function handleDragEnter(e) {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(true)
    }

    function handleDragLeave(e) {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
    }

    function handleDragOver(e) {
        e.preventDefault()
        e.stopPropagation()
    }

    function handleDrop(e) {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        const files = e.dataTransfer.files
        if (files && files.length > 0) {
            const file = files[0]
            processImageFile(file)
        }
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
            if (!storage || !account) {
                throw new Error('Upload service not available. Please check your Appwrite configuration (VITE_APPWRITE_ENDPOINT and VITE_APPWRITE_PROJECT_ID).')
            }

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
        <div className="modal-overlay" onClick={photoStep === 'cropping' ? undefined : onClose}>
            {/* Window-level drag & drop hint */}
            {globalDragActive && (
                <div className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center bg-[rgb(var(--shadow)/0.55)] p-6">
                    <div className="rounded-xl border-2 border-dashed border-accent bg-canvas px-10 py-12 text-center shadow-overlay">
                        <Camera className="mx-auto h-8 w-8 text-accent" />
                        <p className="mt-3 font-display text-xl font-semibold">Drop your photo to upload</p>
                        <p className="mt-1 text-sm text-fg-muted">JPEG, PNG or WebP, up to 5 MB</p>
                    </div>
                </div>
            )}

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-profile-title"
                className="modal-card max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-line-muted px-4 py-3">
                    <h2 id="edit-profile-title" className="font-sans text-sm font-semibold">
                        {photoStep === 'cropping' ? 'Adjust photo' : 'Edit profile'}
                    </h2>
                    <button type="button" onClick={onClose} className="btn-invisible btn-icon btn-sm" aria-label="Close"><X className="h-4 w-4" /></button>
                </div>

                {photoStep === 'cropping' && rawSrc ? (
                    <div className="space-y-4 p-5">
                        <p className="text-center text-xs text-fg-muted">Drag to reposition · scroll to zoom</p>
                        <div className="flex justify-center">
                            <div
                                className="relative cursor-grab select-none overflow-hidden rounded-full ring-2 ring-accent active:cursor-grabbing"
                                style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleMouseUp}
                                onWheel={(e) => {
                                    e.preventDefault()
                                    const newScale = Math.min(4, Math.max(1, cropScale - e.deltaY * 0.003))
                                    setCropScale(newScale)
                                    setCropOffset((prev) => clampOffset(prev.x, prev.y, newScale))
                                }}
                            >
                                {/* Absolutely positioned so preview geometry matches canvas output */}
                                <img
                                    src={rawSrc}
                                    alt="Crop preview"
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
                        <label className="flex items-center gap-3 px-2">
                            <ZoomOut className="h-4 w-4 shrink-0 text-fg-muted" />
                            <span className="sr-only">Zoom</span>
                            <input
                                type="range" min="1" max="4" step="0.01"
                                value={cropScale}
                                onChange={(e) => {
                                    const newScale = parseFloat(e.target.value)
                                    setCropScale(newScale)
                                    setCropOffset((prev) => clampOffset(prev.x, prev.y, newScale))
                                }}
                                className="flex-1 cursor-pointer accent-[rgb(var(--accent-emphasis))]"
                            />
                            <ZoomIn className="h-4 w-4 shrink-0 text-fg-muted" />
                        </label>
                        {error && <p className="flash flash-danger text-xs">{error}</p>}
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => { setPhotoStep('idle'); setRawSrc(null) }} className="btn">Cancel</button>
                            <button type="button" onClick={handleCropConfirm} className="btn-primary">Set new profile picture</button>
                        </div>
                    </div>
                ) : photoStep === 'uploading' ? (
                    <div className="flex flex-col items-center gap-3 py-12">
                        <Spinner size={24} />
                        <p className="text-sm text-fg-muted">Uploading your photo…</p>
                    </div>
                ) : (
                    <form onSubmit={handleSave}>
                        <div className="space-y-4 p-5">
                            <div
                                className={`flex items-center gap-4 rounded-md border border-dashed p-3 transition-colors ${dragActive ? 'border-accent bg-accent-subtle' : 'border-line'}`}
                                onDragEnter={isAppwriteConfigured ? handleDragEnter : undefined}
                                onDragLeave={isAppwriteConfigured ? handleDragLeave : undefined}
                                onDragOver={isAppwriteConfigured ? handleDragOver : undefined}
                                onDrop={isAppwriteConfigured ? handleDrop : undefined}
                            >
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Avatar" className="avatar h-16 w-16" />
                                ) : (
                                    <span className="avatar flex h-16 w-16 items-center justify-center bg-neutral-subtle text-2xl font-semibold text-fg-muted">
                                        {(displayName || profile?.username || '?').charAt(0).toUpperCase()}
                                    </span>
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold">Profile picture</p>
                                    <p className="text-xs text-fg-muted">{dragActive ? 'Drop the image here' : 'Drag an image here or choose a file.'}</p>
                                </div>
                                <button
                                    type="button"
                                    disabled={!isAppwriteConfigured}
                                    onClick={() => isAppwriteConfigured && fileInputRef.current?.click()}
                                    className="btn btn-sm shrink-0"
                                    title={!isAppwriteConfigured ? 'Appwrite not configured. Check VITE_APPWRITE_ENDPOINT and VITE_APPWRITE_PROJECT_ID.' : ''}
                                >
                                    <Upload className="h-3.5 w-3.5" />Upload
                                </button>
                                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleFilePick} />
                            </div>

                            {!isAppwriteConfigured && (
                                <p className="flash flash-warn text-xs">
                                    Photo upload is disabled until VITE_APPWRITE_ENDPOINT and VITE_APPWRITE_PROJECT_ID are configured.
                                </p>
                            )}

                            <div>
                                <label htmlFor="ep-name" className="form-label">Name</label>
                                <input
                                    id="ep-name"
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    maxLength={60}
                                    placeholder="Your name"
                                    className="input"
                                />
                            </div>

                            <div>
                                <label htmlFor="ep-bio" className="form-label">Bio</label>
                                <textarea
                                    id="ep-bio"
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value.slice(0, 160))}
                                    rows={3}
                                    placeholder="Tell people about yourself or your AI skills"
                                    className="input resize-none"
                                />
                                <p className="form-hint text-right">{bio.length}/160</p>
                            </div>

                            {error && <p className="flash flash-danger text-xs">{error}</p>}
                        </div>
                        <div className="flex justify-end gap-2 border-t border-line-muted bg-canvas-subtle px-4 py-3">
                            <button type="button" onClick={onClose} className="btn">Cancel</button>
                            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Update profile'}</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
