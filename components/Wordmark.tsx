/** URHA's mark: the Syriac ܐܘܪܚܐ ("the way") above the Latin name. Drawn in type, no logo file. */
export function Wordmark({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <span className="flex items-baseline gap-2">
        <span lang="syc" dir="rtl" className="font-syriac text-[18px] leading-none text-accent">ܐܘܪܚܐ</span>
        <span className="text-[15px] font-semibold tracking-tight">URHA</span>
      </span>
    );
  }
  return (
    <span className="flex flex-col gap-1">
      <span lang="syc" dir="rtl" className="self-start font-syriac text-[26px] leading-none text-accent">ܐܘܪܚܐ</span>
      <span className="text-[17px] font-semibold tracking-tight">URHA</span>
      <span className="text-[12px] text-muted">The path to mastery</span>
    </span>
  );
}
