// Shown instead of a bookmark / history / application row whose job no
// longer exists (the backend populates `job` as null when the employer's
// account — and so their jobs — were deleted). Without this, rendering
// `entry.job.id` throws and the whole page goes blank.
export function DeletedJobNotice() {
  return (
    <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
      This job is no longer available.
    </p>
  );
}
