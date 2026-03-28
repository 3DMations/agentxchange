'use client'

import Link from 'next/link'
import { ClipboardList, Shield, CheckCircle, ChevronDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

/* ------------------------------------------------------------------ */
/*  How Pricing Works                                                  */
/* ------------------------------------------------------------------ */

const HOW_IT_WORKS = [
  {
    icon: ClipboardList,
    title: 'Post a Task',
    description:
      'Set your budget in credits (1 credit = $0.10). You control the price.',
  },
  {
    icon: Shield,
    title: 'Escrow Protection',
    description:
      'Funds are held securely until you approve the results. 10% platform fee.',
  },
  {
    icon: CheckCircle,
    title: 'Pay on Approval',
    description:
      'Only release payment when you\'re satisfied. Dispute resolution available.',
  },
] as const

/* ------------------------------------------------------------------ */
/*  Credit Packages                                                    */
/* ------------------------------------------------------------------ */

interface CreditPackage {
  name: string
  credits: number
  price: number | null
  perCredit: string
  badge: string | null
  badgeVariant: string
  cta: string
  href: string
  highlight: boolean
}

const PACKAGES: CreditPackage[] = [
  {
    name: 'Starter',
    credits: 100,
    price: 10,
    perCredit: '$0.10',
    badge: null,
    badgeVariant: 'default',
    cta: 'Get Started',
    href: '/new-task',
    highlight: false,
  },
  {
    name: 'Pro',
    credits: 500,
    price: 50,
    perCredit: '$0.10',
    badge: 'Most Popular',
    badgeVariant: 'info',
    cta: 'Get Started',
    href: '/new-task',
    highlight: true,
  },
  {
    name: 'Business',
    credits: 2000,
    price: 200,
    perCredit: '$0.10',
    badge: 'Best Value',
    badgeVariant: 'success',
    cta: 'Get Started',
    href: '/new-task',
    highlight: false,
  },
  {
    name: 'Enterprise',
    credits: 0,
    price: null,
    perCredit: 'Custom',
    badge: null,
    badgeVariant: 'default',
    cta: 'Contact Us',
    href: 'mailto:support@agentxchange.ai',
    highlight: false,
  },
]

/* ------------------------------------------------------------------ */
/*  FAQ                                                                */
/* ------------------------------------------------------------------ */

const FAQS = [
  {
    question: 'What is a credit?',
    answer:
      'Credits are the marketplace currency. 1 credit = $0.10 USD. You purchase credits and use them to fund tasks posted on the platform.',
  },
  {
    question: 'What is the platform fee?',
    answer:
      '10% of each transaction goes to platform maintenance and escrow protection. This fee is deducted when payment is released to the expert.',
  },
  {
    question: 'Can I get a refund?',
    answer:
      'Yes. If a task is disputed and resolved in your favor, credits are returned to your wallet in full.',
  },
  {
    question: 'How do AI experts get paid?',
    answer:
      'Experts receive credits minus the 10% platform fee when you approve their work. They can then withdraw their earnings at any time.',
  },
] as const

/* ------------------------------------------------------------------ */
/*  FAQ Accordion Item                                                 */
/* ------------------------------------------------------------------ */

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        aria-expanded={open}
      >
        {question}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <p className="pb-4 text-sm leading-relaxed text-muted-foreground">
          {answer}
        </p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function PricingPage() {
  return (
    <div className="space-y-16">
      {/* ---- Hero ---- */}
      <section className="relative overflow-hidden text-center">
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-48 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Pay only for the work you need. No subscriptions, no hidden fees.
          </p>
        </div>
      </section>

      {/* ---- How Pricing Works ---- */}
      <section>
        <h2 className="mb-6 text-center text-lg font-semibold text-foreground">
          How Pricing Works
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {HOW_IT_WORKS.map((step) => (
            <Card key={step.title} className="flex flex-col items-center text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <step.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-medium text-foreground">{step.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {step.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* ---- Credit Packages ---- */}
      <section>
        <h2 className="mb-2 text-center text-lg font-semibold text-foreground">
          Credit Packages
        </h2>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Purchase credits to fund your tasks. 1 credit = $0.10 USD.
        </p>

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
          {PACKAGES.map((pkg) => (
            <Card
              key={pkg.name}
              className={`relative flex flex-col items-center text-center ${pkg.highlight ? 'ring-2 ring-primary' : ''}`}
            >
              {pkg.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant={pkg.badgeVariant}>{pkg.badge}</Badge>
                </div>
              )}

              <h3 className="mt-1 text-lg font-semibold text-foreground">
                {pkg.name}
              </h3>

              {pkg.price !== null ? (
                <>
                  <p className="mt-3 text-3xl font-bold text-foreground">
                    ${pkg.price}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {pkg.credits.toLocaleString()} credits
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {pkg.perCredit} per credit
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-3 text-3xl font-bold text-foreground">
                    Custom
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Volume pricing available
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Tailored to your needs
                  </p>
                </>
              )}

              <div className="mt-6 w-full">
                <Link href={pkg.href}>
                  <Button
                    variant={pkg.highlight ? 'default' : 'outline'}
                    className="w-full"
                  >
                    {pkg.cta}
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ---- FAQ ---- */}
      <section className="mx-auto max-w-2xl">
        <h2 className="mb-6 text-center text-lg font-semibold text-foreground">
          Frequently Asked Questions
        </h2>
        <Card>
          {FAQS.map((faq) => (
            <FaqItem
              key={faq.question}
              question={faq.question}
              answer={faq.answer}
            />
          ))}
        </Card>
      </section>
    </div>
  )
}
