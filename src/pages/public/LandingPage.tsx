import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Clock3, ShieldCheck, Sparkles, Wallet } from 'lucide-react'
import { BrandLogo, ProgressBar, StatusBadge } from '../../design-system/components'

const steps = [
  { title: 'Apply & verify', body: 'Create your profile, upload resume and ID, then submit for Bridgr review.', icon: ShieldCheck },
  { title: 'Get matched', body: 'Operators match your skills to vetted international project work.', icon: Sparkles },
  { title: 'Do the work', body: 'You deliver inside Bridgr workspaces with clear scope and deadlines.', icon: CheckCircle2 },
  { title: 'Get paid', body: 'Payouts are tracked, scheduled, and released on time.', icon: Wallet },
]

const stats = [
  ['4,200+', 'Approved workers'],
  ['Rs 22k', 'Avg monthly earnings'],
  ['98%', 'On time payouts'],
]

export const LandingPage = () => (
  <div className="min-h-screen bg-white font-sans text-neutral-900">
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-5 lg:px-8">
        <Link to="/" aria-label="Bridgr home"><BrandLogo /></Link>
        <nav className="hidden items-center gap-7 text-body font-semibold text-neutral-600 md:flex">
          <a href="#how" className="hover:text-primary-800">How it works</a>
          <a href="#workers" className="hover:text-primary-800">For workers</a>
          <Link to="/client/login" className="hover:text-primary-800">For clients</Link>
          <Link to="/login" className="hover:text-primary-800">Log in</Link>
          <Link to="/register" className="rounded-sm bg-primary-600 px-4 py-2.5 text-white shadow-sm hover:bg-primary-800">Apply as a worker</Link>
        </nav>
        <Link to="/register" className="rounded-sm bg-primary-600 px-3 py-2 text-caption font-bold text-white md:hidden">Apply</Link>
      </div>
    </header>

    <main>
      <section id="workers" className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-12 lg:grid-cols-[1fr_440px] lg:px-8 lg:py-20">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-600/15 bg-primary-50 px-3 py-1 text-caption font-bold uppercase text-primary-800">
            <Sparkles className="h-3.5 w-3.5" />
            Worker recruitment
          </div>
          <h1 className="mt-5 max-w-3xl text-display text-primary-800 sm:text-[48px] sm:leading-[56px]">
            Stable, well-paid work for India&apos;s best talent.
          </h1>
          <p className="mt-5 max-w-2xl text-body-lg text-neutral-600">
            Bridgr connects you to high-paying international projects - no client hunting, no contracts, no chasing payments. Just work, delivered.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link to="/register" className="inline-flex h-12 items-center justify-center gap-2 rounded-sm bg-primary-600 px-5 text-body-lg font-semibold text-white shadow-sm hover:bg-primary-800">
              Apply as a worker <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#how" className="inline-flex h-12 items-center justify-center rounded-sm border border-neutral-200 bg-white px-5 text-body-lg font-semibold text-primary-800 shadow-sm hover:bg-neutral-50">
              See how it works
            </a>
          </div>
          <div className="mt-9 grid max-w-xl grid-cols-3 gap-3">
            {stats.map(([value, label]) => (
              <div key={label} className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <p className="font-mono text-[22px] font-bold leading-none text-primary-800">{value}</p>
                <p className="mt-2 text-caption font-semibold text-neutral-600">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-xl border border-neutral-200 bg-white p-5 shadow-panel">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 font-bold text-primary-800">AR</div>
              <div>
                <h2 className="text-subhead text-primary-800">Aarav R.</h2>
                <p className="text-caption text-neutral-600">React Developer</p>
              </div>
            </div>
            <StatusBadge status="approved" label="Active" />
          </div>
          <div className="mt-6 rounded-lg bg-neutral-50 p-4">
            <p className="text-caption font-bold uppercase text-neutral-600">This month</p>
            <p className="mt-1 font-mono text-[34px] font-bold leading-none text-primary-800">Rs 38,500</p>
            <div className="mt-4"><ProgressBar value={72} label="Payout progress" showValue /></div>
          </div>
          <div className="mt-5 space-y-3">
            {[
              ['SaaS dashboard build', 'Due Friday', 78],
              ['Landing page QA', 'Paid milestone', 100],
            ].map(([title, meta, progress]) => (
              <div key={title} className="rounded-lg border border-neutral-200 p-4">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="text-body font-bold text-neutral-900">{title}</p>
                    <p className="mt-1 text-caption text-neutral-600">{meta}</p>
                  </div>
                  <Clock3 className="h-4 w-4 text-primary-600" />
                </div>
                <div className="mt-3"><ProgressBar value={Number(progress)} /></div>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section id="how" className="bg-neutral-50 py-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-caption font-bold uppercase text-primary-600">How it works</p>
            <h2 className="mt-2 text-page-title text-primary-800">Four steps from sign-up to payout</h2>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <article key={step.title} className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-50 text-primary-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-5 font-mono text-caption font-bold text-accent-500">0{index + 1}</p>
                  <h3 className="mt-1 text-subhead text-primary-800">{step.title}</h3>
                  <p className="mt-2 text-body text-neutral-600">{step.body}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 rounded-xl bg-primary-800 p-8 text-white shadow-panel md:grid-cols-[1fr_320px] md:p-10">
          <div>
            <ShieldCheck className="h-10 w-10 text-primary-400" />
            <h2 className="mt-5 text-page-title text-white">Your work and identity stay private - always.</h2>
            <p className="mt-3 max-w-2xl text-body-lg text-white/75">
              Bridgr manages client communication, contracts, and delivery flow. Workers never receive client contact details, and clients never see worker identity.
            </p>
          </div>
          <div className="space-y-3">
            {['No direct client contact', 'No original client budget shown', 'Operator-managed delivery'].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-3 text-body font-semibold">
                <CheckCircle2 className="h-4 w-4 text-primary-400" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-16 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-page-title text-primary-800">Ready to start earning?</h2>
          <p className="mt-3 text-body-lg text-neutral-600">Apply once, get verified, and let Bridgr bring the work to you.</p>
          <Link to="/register" className="mt-7 inline-flex h-12 items-center justify-center rounded-sm bg-accent-500 px-6 text-body-lg font-bold text-primary-800 shadow-sm hover:bg-accent-500/90">
            Apply as a worker
          </Link>
        </div>
      </section>
    </main>

    <footer className="border-t border-neutral-200 bg-white px-5 py-8 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <BrandLogo />
          <p className="mt-2 text-body text-neutral-600">Private worker-first access to international projects.</p>
        </div>
        <div className="flex flex-wrap gap-5 text-body font-semibold text-primary-600">
          <Link to="/login">Worker login</Link>
          <Link to="/client/login">Client login</Link>
          <Link to="/admin/login" className="text-neutral-600">Admin</Link>
        </div>
      </div>
    </footer>
  </div>
)
