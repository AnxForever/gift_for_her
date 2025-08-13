import Navigation from "@/components/navigation"
import AboutHerPage from "@/components/about-her-page"

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      <Navigation />
      <div className="pt-20">
        <AboutHerPage />
      </div>
    </main>
  )
}
