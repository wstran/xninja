'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

import { Container } from '@/components/Container'
import backgroundImage from '@/images/background-whatis.png'
import { Button } from '@/components/Button'
import hero33 from '@/images/33.png'
import hero21 from '@/images/21.png'
import bgwhatis from '@/images/home/bg-whatis.png'
import bgwhatisItem1 from '@/images/home/bg-whatis-item1.png'
import bgwhatisItem2 from '@/images/home/bg-whatis-item2.png'


export function WhatIs() {

  return (
    <section id="whatis" className='bg-gray-300'>
      <Container className="relative overflow-hidden  py-16 sm:py-24 bg-cover shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)_inner]">
        <div>
          <Image
            className="absolute top-[-97.86px] right-[0.38px] w-[1630.59px] h-[917.21px]"
            alt=""
            src={bgwhatis}
          />
          <div className='scale-50'>
          <Image
            className="hidden sm:inline animate-shake animate-infinite absolute top-[171.79px] left-[500px]"
            alt=""
            src={bgwhatisItem1}
          />
          <Image
            className="hidden sm:inline animate-bounce absolute top-[145.33px] left-[950px]"
            alt=""
            src={bgwhatisItem2}
          />
          </div>
        </div>
      
        <div className="mx-auto">
          <div className="mx-auto max-w-2xl gap-x-14 lg:mx-0 lg:flex lg:max-w-none lg:items-center">
          <div className="relative p-6 sm:p-8 mt-16 max-w-md bg-[#070707] rounded-lg text-[#DCC7AF]" >
            <h1 className="text-center font-display text-5xl font-normal tracking-tight">
              WHAT’S XNINJA?
            </h1>
            <p className="mt-4 text-base tracking-tigh leading-6 text-left">
            The first SocialFi 2.0 built on Injective, by Ninjas & for Ninjas. xNinja brings you a virtual platform to step into Ninja universe with a unique, engaging & rewarding experience right on X (Twitter), combining the power of blockchain, the spirit of Ninja and the joy of training & fighting.
            </p>
            <div className="mt-9 flex gap-x-6">
              <Button
                href="#"
                variant="outline"
                color="white"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 16H11V18H13V16Z" fill="white"/>
                  <path d="M13 6H11V14H13V6Z" fill="white"/>
                  <path d="M21 5V4H20V3H19V2H5V3H4V4H3V5H2V19H3V20H4V21H5V22H19V21H20V20H21V19H22V5H21ZM20 17H19V18H18V19H17V20H7V19H6V18H5V17H4V7H5V6H6V5H7V4H17V5H18V6H19V7H20V17Z" fill="white"/>
                </svg>
                <span className="ml-3">Learn More</span>
              </Button>
            </div>
          </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
