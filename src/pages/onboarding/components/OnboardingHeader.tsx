import { Link } from 'react-router-dom'
import { BrandLogo } from '../../../design-system/components'

interface OnboardingHeaderProps {
  eyebrow: string
  title: string
}

export const OnboardingHeader = ({ eyebrow, title }: OnboardingHeaderProps) => (
  <div className="flex items-center justify-between gap-4">
    <Link to="/" aria-label="Bridgr home">
      <BrandLogo size="sm" />
    </Link>
    <div className="text-right">
      <p className="text-caption font-bold uppercase text-primary-800">{eyebrow}</p>
      <p className="text-caption text-neutral-600">{title}</p>
    </div>
  </div>
)
