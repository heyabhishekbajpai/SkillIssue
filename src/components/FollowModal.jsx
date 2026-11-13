import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Check, Users } from 'lucide-react'
import { Avatar, Spinner } from './ui/primitives'

function PersonRow({ person, onClose }) {
    const navigate = useNavigate()
    return (
        <button
            type="button"
            onClick={() => { onClose(); navigate(`/user/${person.username}`) }}
            className="flex w-full items-center gap-3 border-b border-line-muted px-4 py-3 text-left last:border-b-0 hover:bg-canvas-subtle"
        >
            <Avatar src={person.avatar_url} name={person.display_name || person.username} size={36} />
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{person.display_name || person.username}</p>
                <p className="truncate text-xs text-fg-muted">{person.username}</p>
            </div>
        </button>
    )
}

function PendingRow({ person, onAccept, onReject }) {
    const [accepting, setAccepting] = useState(false)
    const [rejecting, setRejecting] = useState(false)

    async function handleAccept() {
        setAccepting(true)
        await onAccept(person.user_id)
        setAccepting(false)
    }

    async function handleReject() {
        setRejecting(true)
        await onReject(person.user_id)
        setRejecting(false)
    }

    return (
        <div className="flex items-center gap-3 border-b border-line-muted px-4 py-3 last:border-b-0">
            <Avatar src={person.avatar_url} name={person.display_name || person.username} size={36} />
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{person.display_name || person.username}</p>
                <p className="truncate text-xs text-fg-muted">{person.username}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
                <button type="button" onClick={handleAccept} disabled={accepting || rejecting} className="btn-primary btn-sm" title="Accept">
                    {accepting ? <Spinner size={12} className="text-fg-onemphasis" /> : <Check className="h-3.5 w-3.5" />}Accept
                </button>
                <button type="button" onClick={handleReject} disabled={accepting || rejecting} className="btn btn-sm" title="Decline">
                    {rejecting ? <Spinner size={12} /> : <X className="h-3.5 w-3.5" />}Decline
                </button>
            </div>
        </div>
    )
}

export default function FollowModal({ type, people, onClose, onAccept, onReject }) {
    const [search, setSearch] = useState('')
    const searchRef = useRef(null)

    useEffect(() => {
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = prev }
    }, [])

    useEffect(() => { setTimeout(() => searchRef.current?.focus(), 50) }, [])

    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onClose])

    const titles = { followers: 'Followers', following: 'Following', pending: 'Follow requests' }
    const title = titles[type] || 'People'

    const query = search.trim().toLowerCase()
    const filtered = query
        ? people.filter((p) => (p.display_name || '').toLowerCase().includes(query) || (p.username || '').toLowerCase().includes(query))
        : people

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="follow-title"
                onClick={(e) => e.stopPropagation()}
                className="modal-card flex max-w-md flex-col"
                style={{ height: 'min(560px, 85vh)' }}
            >
                <div className="flex shrink-0 items-center justify-between border-b border-line-muted px-4 py-3">
                    <h2 id="follow-title" className="font-sans text-sm font-semibold">
                        {title} <span className="counter ml-1">{people.length}</span>
                    </h2>
                    <button type="button" onClick={onClose} className="btn-invisible btn-icon btn-sm" aria-label="Close"><X className="h-4 w-4" /></button>
                </div>

                <div className="shrink-0 border-b border-line-muted p-3">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
                        <input
                            ref={searchRef}
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Filter people"
                            aria-label="Filter people"
                            className="input pl-8"
                        />
                    </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                            <Users className="h-5 w-5 text-fg-muted" />
                            <p className="text-sm text-fg-muted">
                                {query ? 'No matching people.' : type === 'pending' ? 'No pending requests.' : `No ${title.toLowerCase()} yet.`}
                            </p>
                        </div>
                    ) : type === 'pending' ? (
                        filtered.map((person) => <PendingRow key={person.user_id} person={person} onAccept={onAccept} onReject={onReject} />)
                    ) : (
                        filtered.map((person) => <PersonRow key={person.user_id} person={person} onClose={onClose} />)
                    )}
                </div>
            </div>
        </div>
    )
}
