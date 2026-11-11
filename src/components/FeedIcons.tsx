import { CheckCircle2, TriangleAlert, FileClock, UserPlus, BadgeCheck, FileText } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { FeedKind } from '../lib/store'

export const FEED_ICONS: Record<FeedKind, { icon: LucideIcon; tone: string }> = {
  verified: { icon: CheckCircle2, tone: 'text-success bg-success/10' },
  flagged: { icon: TriangleAlert, tone: 'text-danger bg-danger/10' },
  review: { icon: FileClock, tone: 'text-warning bg-warning/10' },
  credential: { icon: BadgeCheck, tone: 'text-[#6FB2F5] bg-[#6FB2F5]/10' },
  team: { icon: UserPlus, tone: 'text-ink2 bg-white/[0.06]' },
  report: { icon: FileText, tone: 'text-accent bg-accent/10' },
}
