'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import backgroundImage from '@/images/background-upcall.png'

export function Food() {
  return (
    <section
    id="hero"
    >
      <Container className="relative overflow-hidden  py-16 sm:py-24 bg-cover">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="py-8 font-display text-4xl tracking-tight text-[#DCC7AF] sm:text-5xl md:text-6xl">
          TRAIN, FIGHT & EARN 
          <div>DIRECTLY ON X (TWITTER)</div>
          </h1>
          <div className='animate-jump animate-infinite'>
          <Button href="https://app.xninja.tech" color="blue" >Play Now</Button>
          </div>
        </div>
        <Image
          className="mt-8 w-full"
          src={backgroundImage}
          alt=""
          unoptimized
        />
      </Container>
    </section>
  )
}
