import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTourStore } from '../stores/tourStore'
import { X } from 'lucide-react'

interface TargetRect {
  top: number
  left: number
  width: number
  height: number
}

const SPOTLIGHT_PADDING = 12
const TOOLTIP_WIDTH = 320
const TOOLTIP_HEIGHT_EST = 260 // estimated card height for placement calc
const TOOLTIP_GAP = 16

export default function WalkthroughTour() {
  const navigate = useNavigate()
  const { isActive, currentStepIndex, steps, nextStep, prevStep, endTour } = useTourStore()
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null)

  const step = isActive ? steps[currentStepIndex] : null

  // --- Navigate to step's page when step changes ---
  useEffect(() => {
    if (!isActive || !step) return
    navigate(step.path)
  }, [isActive, currentStepIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  // --- Find target element with retry loop ---
  const findTarget = useCallback(
    (selector: string) => {
      let attempts = 0
      const maxAttempts = 10

      setTargetRect(null) // reset during navigation

      const tryFind = () => {
        const el = document.querySelector(selector)
        if (el) {
          const r = el.getBoundingClientRect()
          setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height })
          return
        }
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(tryFind, 200)
        }
        // If never found, targetRect stays null → centered tooltip (still usable)
      }

      requestAnimationFrame(tryFind)
    },
    []
  )

  useEffect(() => {
    if (!isActive || !step) {
      setTargetRect(null)
      return
    }
    // Delay slightly to let React render the new page before searching the DOM
    const t = setTimeout(() => findTarget(step.targetSelector), 100)
    return () => clearTimeout(t)
  }, [isActive, currentStepIndex, findTarget]) // eslint-disable-line react-hooks/exhaustive-deps

  // --- Keep spotlight synced to scroll / resize ---
  useEffect(() => {
    if (!isActive || !step) return

    const sync = () => {
      const el = document.querySelector(step.targetSelector)
      if (el) {
        const r = el.getBoundingClientRect()
        setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      }
    }

    window.addEventListener('scroll', sync, { passive: true })
    window.addEventListener('resize', sync)
    return () => {
      window.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
    }
  }, [isActive, step])

  if (!isActive || !step) return null

  const vw = window.innerWidth
  const vh = window.innerHeight

  // Spotlight box
  const spotTop = targetRect ? Math.max(0, targetRect.top - SPOTLIGHT_PADDING) : 0
  const spotLeft = targetRect ? Math.max(0, targetRect.left - SPOTLIGHT_PADDING) : 0
  const spotW = targetRect ? targetRect.width + SPOTLIGHT_PADDING * 2 : 0
  const spotH = targetRect ? targetRect.height + SPOTLIGHT_PADDING * 2 : 0

  // Tooltip position
  let tipTop: number
  let tipLeft: number

  if (targetRect) {
    switch (step.placement) {
      case 'bottom':
        tipTop = spotTop + spotH + TOOLTIP_GAP
        tipLeft = targetRect.left + targetRect.width / 2 - TOOLTIP_WIDTH / 2
        break
      case 'top':
        tipTop = spotTop - TOOLTIP_GAP - TOOLTIP_HEIGHT_EST
        tipLeft = targetRect.left + targetRect.width / 2 - TOOLTIP_WIDTH / 2
        break
      case 'right':
        tipTop = targetRect.top + targetRect.height / 2 - TOOLTIP_HEIGHT_EST / 2
        tipLeft = spotLeft + spotW + TOOLTIP_GAP
        break
      case 'left':
        tipTop = targetRect.top + targetRect.height / 2 - TOOLTIP_HEIGHT_EST / 2
        tipLeft = spotLeft - TOOLTIP_WIDTH - TOOLTIP_GAP
        break
      default:
        tipTop = vh / 2 - TOOLTIP_HEIGHT_EST / 2
        tipLeft = vw / 2 - TOOLTIP_WIDTH / 2
    }
    // Clamp to viewport
    tipTop = Math.max(12, Math.min(tipTop, vh - TOOLTIP_HEIGHT_EST - 12))
    tipLeft = Math.max(12, Math.min(tipLeft, vw - TOOLTIP_WIDTH - 12))
  } else {
    // Fallback: center the card
    tipTop = vh / 2 - TOOLTIP_HEIGHT_EST / 2
    tipLeft = vw / 2 - TOOLTIP_WIDTH / 2
  }

  const isFirst = currentStepIndex === 0
  const isLast = currentStepIndex === steps.length - 1

  return (
    <div
      className="fixed inset-0 z-[9998]"
      style={{ pointerEvents: 'none' }}
      aria-live="polite"
    >
      {/* ── Backdrop: 4 panels surrounding the spotlight ── */}
      {targetRect ? (
        <>
          {/* Top strip */}
          <div
            className="absolute bg-black/60 transition-all duration-300"
            style={{ top: 0, left: 0, right: 0, height: spotTop }}
          />
          {/* Bottom strip */}
          <div
            className="absolute bg-black/60 transition-all duration-300"
            style={{ top: spotTop + spotH, left: 0, right: 0, bottom: 0 }}
          />
          {/* Left strip */}
          <div
            className="absolute bg-black/60 transition-all duration-300"
            style={{ top: spotTop, left: 0, width: spotLeft, height: spotH }}
          />
          {/* Right strip */}
          <div
            className="absolute bg-black/60 transition-all duration-300"
            style={{ top: spotTop, left: spotLeft + spotW, right: 0, height: spotH }}
          />
          {/* Glowing ring around target */}
          <div
            className="absolute rounded-xl ring-2 ring-brand-400 ring-offset-0 transition-all duration-300"
            style={{ top: spotTop, left: spotLeft, width: spotW, height: spotH }}
          />
        </>
      ) : (
        // No target found — full dim
        <div className="absolute inset-0 bg-black/60" />
      )}

      {/* ── Tooltip card ── */}
      <div
        className="absolute"
        style={{
          top: tipTop,
          left: tipLeft,
          width: TOOLTIP_WIDTH,
          pointerEvents: 'auto',
          zIndex: 9999,
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl p-6 relative">
          {/* × close */}
          <button
            onClick={endTour}
            className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close tour"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5 mb-4">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === currentStepIndex
                    ? 'w-6 h-2 bg-brand-500'
                    : i < currentStepIndex
                    ? 'w-2 h-2 bg-brand-300'
                    : 'w-2 h-2 bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Step label */}
          <p className="text-xs font-semibold text-brand-500 uppercase tracking-wider mb-1">
            Step {currentStepIndex + 1} of {steps.length}
          </p>

          {/* Title */}
          <h3 className="text-base font-bold text-gray-900 mb-2 pr-5">{step.title}</h3>

          {/* Description */}
          <p className="text-sm text-gray-600 leading-relaxed mb-5">{step.description}</p>

          {/* Actions row */}
          <div className="flex items-center justify-between">
            <button
              onClick={endTour}
              className="text-xs text-gray-400 hover:text-gray-500 transition-colors"
            >
              Skip tour
            </button>

            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={prevStep}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={nextStep}
                className="px-4 py-1.5 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
              >
                {isLast ? '🎉 Finish' : 'Next →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
