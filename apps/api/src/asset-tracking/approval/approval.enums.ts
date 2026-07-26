/** Approval Engine (SDD §5.11) — implementasi awal single-level, siap diperluas multi-level. */

export enum ApprovalEntityType {
  TRANSFER = 'TRANSFER',
  BORROWING = 'BORROWING',
  DISPOSAL = 'DISPOSAL',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum ApprovalDecision {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}
