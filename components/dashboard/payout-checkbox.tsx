"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { togglePayout } from "@/app/(app)/doctors/actions"
import { formatDateTime } from "@/lib/format"

export function PayoutCheckbox({
  masterId,
  period,
  paid: initialPaid,
  paidBy: initialPaidBy,
  paidAt: initialPaidAt,
  actorEmail,
  doctorName,
  className,
  showAriaLabel = true,
}: {
  masterId: string
  period: string
  paid: boolean
  paidBy: string | null
  paidAt: string | null
  /** Current user's email — used only for the optimistic tooltip until the server confirms. */
  actorEmail: string
  /** Doctor's display name — included in the accessible name and tooltip so it stays clear which
   *  doctor this checkbox belongs to, even when the name column has scrolled out of view. */
  doctorName: string
  className?: string
  /** Set false when a visible <Label> already provides the accessible name (avoids a doubled name). */
  showAriaLabel?: boolean
}) {
  const [paid, setPaid] = useState(initialPaid)
  const [paidBy, setPaidBy] = useState(initialPaidBy)
  const [paidAt, setPaidAt] = useState(initialPaidAt)
  const [, startTransition] = useTransition()

  const handleChange = (next: boolean) => {
    // Optimistic update — flips immediately, reverts only if the action fails.
    const prevPaid = paid
    const prevPaidBy = paidBy
    const prevPaidAt = paidAt
    setPaid(next)
    if (next) {
      setPaidBy(actorEmail)
      setPaidAt(new Date().toISOString())
    } else {
      setPaidBy(null)
      setPaidAt(null)
    }

    startTransition(async () => {
      const res = await togglePayout(masterId, period, next)
      if (!res.ok) {
        setPaid(prevPaid)
        setPaidBy(prevPaidBy)
        setPaidAt(prevPaidAt)
        toast.error(res.error)
      }
    })
  }

  const checkboxEl = (
    <Checkbox
      checked={paid}
      onCheckedChange={(value) => handleChange(value === true)}
      onClick={(e) => e.stopPropagation()}
      aria-label={showAriaLabel ? `Vyplaceno — ${doctorName}` : undefined}
      className={className}
    />
  )

  if (!paid) return checkboxEl

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex">{checkboxEl}</span>} />
      <TooltipContent>
        {doctorName} — vyznačil: {paidBy ?? "…"}, {formatDateTime(paidAt)}
      </TooltipContent>
    </Tooltip>
  )
}
