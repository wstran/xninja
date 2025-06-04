import { CallToAction } from '@/components/CallToAction'
import { Food } from '@/components/Food'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { WhatIs } from '@/components/WhatIs'
import { HowToJoin } from '@/components/HowToJoin'

export default function Home() {
  return (
    <>
      <Header/>
      <main>
        <Hero />
        <WhatIs />
        <HowToJoin />
        <Food />
        <CallToAction />
      </main>
      <Footer />
    </>
  )
}
