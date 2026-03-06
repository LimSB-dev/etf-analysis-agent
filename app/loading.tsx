import { PageSkeleton } from "./loading/PageSkeleton"

export default function Loading() {
  return (
    <main className="flex-1 flex-col bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <PageSkeleton />
      </div>
    </main>
  )
}
