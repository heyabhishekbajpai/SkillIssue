import { useEffect, useRef } from 'react'

export default function SplashScreen({ onDone }) {
    const overlayRef = useRef(null)
    const logoRef = useRef(null)
    const barRef = useRef(null)

    useEffect(() => {
        const overlay = overlayRef.current
        const logo = logoRef.current
        const bar = barRef.current
        if (!overlay || !logo || !bar) return

        const timers = []

        function startAnimation() {
            // ── Timeline ──────────────────────────────────────────
            // 0ms    : logo fades + scales in (300ms)
            // 50ms   : progress bar sweeps (550ms)
            // 650ms  : logo fades out (150ms)
            // 800ms  : overlay slides up (200ms)
            // 1000ms : onDone → unmounts

            // Logo enter
            requestAnimationFrame(() => {
                logo.style.opacity = '1'
                logo.style.transform = 'scale(1)'
            })

            // Bar sweep
            timers.push(setTimeout(() => {
                bar.style.width = '100%'
            }, 50))

            // Logo exit
            timers.push(setTimeout(() => {
                logo.style.opacity = '0'
                logo.style.transform = 'scale(0.95)'
            }, 650))

            // Overlay slide up
            timers.push(setTimeout(() => {
                overlay.style.transform = 'translateY(-100%)'
            }, 800))

            // Unmount
            timers.push(setTimeout(() => {
                onDone?.()
            }, 1000))
        }

        // Wait for the logo image to load before starting the animation
        // so the logo is always visible during the intro
        if (logo.complete && logo.naturalWidth > 0) {
            startAnimation()
        } else {
            logo.addEventListener('load', startAnimation, { once: true })
            logo.addEventListener('error', startAnimation, { once: true })
        }

        return () => {
            timers.forEach(clearTimeout)
            logo.removeEventListener('load', startAnimation)
            logo.removeEventListener('error', startAnimation)
        }
    }, [onDone])

    return (
        <>
            <style>{`
                #si-splash {
                    position: fixed;
                    inset: 0;
                    z-index: 9999;
                    background: #0a0e1a;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.2s cubic-bezier(0.76, 0, 0.24, 1);
                }
                #si-logo {
                    opacity: 0;
                    transform: scale(0.88);
                    transition:
                        opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1),
                        transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    will-change: opacity, transform;
                }
                #si-bar-track {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: rgba(75, 169, 255, 0.12);
                    overflow: hidden;
                }
                #si-bar-fill {
                    height: 100%;
                    width: 0%;
                    background: linear-gradient(
                        90deg,
                        transparent,
                        #4ba9ff 30%,
                        #cae8ff 60%,
                        #4ba9ff
                    );
                    transition: width 0.55s cubic-bezier(0.4, 0, 0.2, 1);
                    will-change: width;
                }
            `}</style>

            <div id="si-splash" ref={overlayRef}>
                <img
                    id="si-logo"
                    ref={logoRef}
                    src="/skill-issue-white.png"
                    alt="Skill Issue"
                    style={{ height: 48, width: 'auto' }}
                />
                <div id="si-bar-track">
                    <div id="si-bar-fill" ref={barRef} />
                </div>
            </div>
        </>
    )
}
