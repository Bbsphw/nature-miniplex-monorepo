import { Skeleton } from '@/components/ui/skeleton';

export function MovieCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-surface-border bg-surface-DEFAULT">
      <Skeleton className="h-56 w-full bg-surface-elevated" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4 bg-surface-elevated" />
        <Skeleton className="h-3 w-1/2 bg-surface-elevated" />
        <Skeleton className="h-3 w-2/5 bg-surface-elevated" />
        <Skeleton className="h-10 w-full mt-2 bg-surface-elevated" />
      </div>
    </div>
  );
}
