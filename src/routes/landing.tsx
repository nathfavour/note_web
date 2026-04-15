import { createFileRoute } from '@tanstack/react-router'
import LandingPage from '@/app/landing/page'

export const Route = createFileRoute('/landing')({
  component: LandingPage,
})
