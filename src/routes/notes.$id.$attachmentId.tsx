import { createFileRoute } from '@tanstack/react-router'
import AppLayoutContent from '@/app/(app)/AppLayoutContent'
import AttachmentPage from '@/app/(app)/notes/[id]/[attachmentId]/page'

export const Route = createFileRoute('/notes/$id/$attachmentId')({
  component: AttachmentRoute,
})

function AttachmentRoute() {
  return (
    <AppLayoutContent>
      <AttachmentPage />
    </AppLayoutContent>
  )
}
