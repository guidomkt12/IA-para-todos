import { Button } from "@/components/ui/button";

export function EmptyState({ title, description, action, onAction }: { title: string; description: string; action?: string; onAction?: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed bg-white p-8 text-center">
      <h3 className="text-lg font-semibold text-stone-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">{description}</p>
      {action ? <Button className="mt-4" onClick={onAction}>{action}</Button> : null}
    </div>
  );
}
