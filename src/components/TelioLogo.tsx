interface LogoMarkProps {
  className?: string
  size?: number
}

interface LogoFullProps {
  className?: string
  /** 'dark' = dark teal text (for light backgrounds), 'light' = white text (for dark backgrounds) */
  variant?: 'dark' | 'light'
  size?: 'sm' | 'md' | 'lg'
}

/** Heart mark with two profile silhouettes and medical cross */
export function TelioLogoMark({ className, size = 40 }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Heart shape — left half (light teal) */}
      <path
        d="M40 70 C40 70 8 50 8 28 C8 17 17 10 27 10 C34 10 39 14 40 18 C41 14 46 10 53 10 C63 10 72 17 72 28 C72 50 40 70 40 70Z"
        fill="#4BBFD8"
      />
      {/* Dark overlay for right half of heart */}
      <path
        d="M40 18 C41 14 46 10 53 10 C63 10 72 17 72 28 C72 50 40 70 40 70 L40 18Z"
        fill="#1B7087"
      />
      {/* Female profile (left, light side) */}
      <path
        d="M27 26 C27 22 30 19 33 20 C35 20 37 22 37 25 C37 28 35 30 33 31 C31 32 29 33 28 35 C27 37 27 40 27 40"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
      {/* Male profile (right, dark side) */}
      <path
        d="M53 26 C53 22 50 19 47 20 C45 20 43 22 43 25 C43 28 45 30 47 31 C49 32 51 33 52 35 C53 37 53 40 53 40"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
      {/* Medical cross (top right) */}
      <rect x="54" y="16" width="12" height="3.5" rx="1.5" fill="white" />
      <rect x="58.25" y="11.75" width="3.5" height="12" rx="1.5" fill="white" />
    </svg>
  )
}

/** Full logo: mark + "TELIO HEALTH" wordmark */
export function TelioLogoFull({ className, variant = 'dark', size = 'md' }: LogoFullProps) {
  const textSizes = { sm: 'text-base', md: 'text-xl', lg: 'text-3xl' }
  const markSizes = { sm: 28, md: 36, lg: 56 }

  const telioColor = variant === 'light' ? 'text-white' : 'text-[#1B7087]'
  const healthColor = variant === 'light' ? 'text-[#7DD8EC]' : 'text-[#4BBFD8]'

  return (
    <div className={`flex items-center gap-2.5 ${className ?? ''}`}>
      <TelioLogoMark size={markSizes[size]} />
      <span className={`font-bold tracking-tight ${textSizes[size]}`}>
        <span className={telioColor}>TELIO</span>
        <span className={`font-light ${healthColor}`}> HEALTH</span>
      </span>
    </div>
  )
}

/** Mark-only inline icon for tight spaces (replaces stethoscope) */
export function TelioIcon({ className }: { className?: string }) {
  return <TelioLogoMark className={className} size={24} />
}
