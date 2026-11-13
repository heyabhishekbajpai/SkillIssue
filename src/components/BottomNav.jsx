import { NavLink, useLocation } from 'react-router-dom'
import { Home, Compass, Plus, Users, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Avatar } from './ui/primitives'

function Tab({ to, label, icon: Icon, end, children }) {
    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
                `flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium ${
                    isActive ? 'text-fg' : 'text-fg-muted'
                }`
            }
        >
            {({ isActive }) => (
                <>
                    {children ?? <Icon className="h-5 w-5" strokeWidth={isActive ? 2.25 : 1.75} />}
                    <span>{label}</span>
                </>
            )}
        </NavLink>
    )
}

export default function BottomNav() {
    const { user, profile, isLoggedIn, openAuthModal } = useAuth()
    const { pathname } = useLocation()
    const profileHref = isLoggedIn && profile?.username ? `/user/${profile.username}` : null
    const onProfile = pathname.startsWith('/user/')

    return (
        <nav
            aria-label="Mobile tabs"
            className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-canvas/95 backdrop-blur md:hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div className="flex items-stretch">
                <Tab to="/" end label="Home" icon={Home} />
                <Tab to="/browse" label="Explore" icon={Compass} />
                <Tab to="/build" label="New" icon={Plus}>
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-success-emphasis text-fg-onemphasis">
                        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </span>
                </Tab>
                <Tab to="/community" label="Community" icon={Users} />
                {profileHref ? (
                    <Tab to={profileHref} label="Profile" icon={User}>
                        <Avatar
                            src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                            name={profile?.display_name || 'You'}
                            size={20}
                            className={onProfile ? 'ring-2 ring-fg' : ''}
                        />
                    </Tab>
                ) : (
                    <button
                        type="button"
                        onClick={openAuthModal}
                        className="flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium text-fg-muted"
                    >
                        <User className="h-5 w-5" strokeWidth={1.75} />
                        <span>Sign in</span>
                    </button>
                )}
            </div>
        </nav>
    )
}
