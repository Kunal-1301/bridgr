import { cn } from '../cn'

type BrandLogoVariant = 'navy' | 'white'
type BrandLogoSize = 'sm' | 'md' | 'lg'

interface BrandLogoProps {
  variant?: BrandLogoVariant
  size?: BrandLogoSize
  showWordmark?: boolean
  className?: string
}

const sizeClasses: Record<BrandLogoSize, { root: string; mark: string; text: string }> = {
  sm: { root: 'gap-2', mark: 'h-8 w-8', text: 'text-xl' },
  md: { root: 'gap-2.5', mark: 'h-10 w-10', text: 'text-2xl' },
  lg: { root: 'gap-3', mark: 'h-12 w-12', text: 'text-3xl' },
}

export const BrandLogo = ({
  variant = 'navy',
  size = 'md',
  showWordmark = true,
  className,
}: BrandLogoProps) => {
  const classes = sizeClasses[size]
  const isWhite = variant === 'white'

  return (
    <div className={cn('inline-flex items-center', classes.root, className)} aria-label="Bridgr">
      <svg
        viewBox="0 0 120 120"
        className={classes.mark}
        role="img"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="60" cy="60" r="56" className={isWhite ? 'fill-white/10' : 'fill-primary-50'} />
        <path
          d="M34 70 A 26 26 0 0 1 86 70"
          className="stroke-primary-400"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="34" cy="70" r="12" className={isWhite ? 'fill-white' : 'fill-primary-800'} />
        <circle cx="86" cy="70" r="12" className="fill-primary-400" />
      </svg>
      {showWordmark && (
        <span
          className={cn(
            'font-sans font-bold leading-none tracking-normal',
            classes.text,
            isWhite ? 'text-white' : 'text-primary-800'
          )}
        >
          Bridgr
        </span>
      )}
    </div>
  )
}
