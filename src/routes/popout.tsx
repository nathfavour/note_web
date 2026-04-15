import { createFileRoute } from '@tanstack/react-router'
import PopoutPage from '@/app/popout/page'

export const Route = createFileRoute('/popout')({
  component: PopoutPage,
})
