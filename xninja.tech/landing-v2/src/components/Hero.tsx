'use client'

import Image from 'next/image'

import { Button } from '@/components/Button'
import { Container } from '@/components/Container'

import bgHero from '@/images/home/bg-hero.png'
import bgHeroItem1 from '@/images/home/bg-hero-item1.png'
import bgHeroItem2 from '@/images/home/bg-hero-item2.png'
import hero1 from '@/images/hero/1.png'
import hero2 from '@/images/hero/2.png'
import hero3 from '@/images/hero/3.png'
import hero4 from '@/images/hero/4.png'
import hero5 from '@/images/hero/5.png'
import hero6 from '@/images/hero/6.png'
import hero7 from '@/images/hero/7.png'
import hero8 from '@/images/hero/8.png'
import hero9 from '@/images/hero/9.png'

export function Hero() {
  return (
    <section id="hero" className='bg-gray-300 shadow-[0px_-66px_43px_-9px_#070707_inset]' >
    <Container className="relative overflow-hidden">
      <Image
        className="absolute top-[-379.21px] left-[0px] w-[1280px] h-[1124.45px] object-contain opacity-[0.15]"
        alt=""
        src={bgHero}
      />
      <Image
        className="animate-ping absolute top-[285.65px] left-[-9.93px] w-[323.46px] h-[411.32px] object-cover"
        alt=""
        src={bgHeroItem1}
      />
      <Image
        className="animate-ping absolute top-[294px] left-[347.21px] w-[458.93px] h-[396px] object-contain"
        alt=""
        src={bgHeroItem2}
      />
      <div className="mx-auto">
        <div className="mx-auto max-w-2xl gap-x-14 lg:mx-0 lg:flex lg:max-w-none lg:items-center">
          <div className="relative lg:shrink-0 xl:max-w-2xl">
            <h1 className="text-center lg:text-left  lg:max-w-xl mt-8 lg:mt-0 font-display text-4xl font-medium tracking-tight text-peachpuff sm:text-5xl">
              TRAIN YOUR NINJA <div>FIGHT THE BATTLES</div>{' '}
              <span className="relative whitespace-nowrap text-blue-600">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 418 42"
                  className="absolute left-0 top-2/3 h-[0.58em] w-full fill-blue-300/70"
                  preserveAspectRatio="none"
                >
                  <path d="M203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6-16.878-7.066Z" />
                </svg>
                <span className="relative">TAKE PROFIT</span>
              </span>{' '}ON X
            </h1>
            <p className="mx-auto lg:mx-0 text-center lg:text-left my-6 max-w-sm lg:max-w-md font-normal text-base text-slate-100">
              Train your Ninja directly on X (Twitter) interface, fight the battles & earn profit while scrolling.
            </p>
            <div className="flex justify-center lg:justify-start gap-x-6 mb-24">
              <Button href="https://app.xninja.tech" color="blue">Connect to X</Button>
              <Button
                href="#"
                color="black"
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
          <div className="flex justify-end gap-8 sm:justify-start sm:pl-20 lg:pl-0 shadow-[-8px_4px_40px_23px_#000]">
            <div className="ml-auto -mt-4 md:-mt-8 lg:-mt-16 w-32 sm:w-36 lg:w-40 flex-none space-y-8 sm:ml-0 lg:order-last xl:order-none shadow-[-8px_4px_40px_23px_#000]">
              <div className="animate-fade-up animate-infinite relative">
                <Image
                  src={hero1}
                  alt=""
                  className=""
                />
              </div>
              <div className="animate-wiggle animate-infinite relative">
                <Image
                  src={hero2}
                  alt=""
                  className=""
                />
              </div>
              <div className="animate-rotate-y animate-infinite relative hidden lg:block">
                <Image
                  src={hero3}
                  alt=""
                  className=""
                />
              </div>
            </div>
            <div className="hidden sm:block mr-auto -mt-4 md:-mt-16 lg:-mt-24 w-32 sm:w-36 lg:w-40 flex-none space-y-8 sm:mr-0">
              <div className="animate-fade-up animate-infinite relative">
                <Image
                src={hero4}
                  alt=""
                  className=""
                />
              </div>
              <div className="animate-wiggle animate-infinite relative">
                <Image
                src={hero5}
                  alt=""
                  className=""
                />
              </div>
              <div className="animate-rotate-y animate-infinite relative hidden lg:block">
                <Image
                  src={hero6}
                  alt=""
                  className=""
                />
              </div>
            </div>
            <div className="mr-auto -mt-4 md:-mt-8 lg:-mt-16 w-32 sm:w-36 lg:w-40 flex-none space-y-8">
              <div className="animate-fade-up animate-infinite relative">
                <Image
                  src={hero7}
                  alt=""
                  className=""
                />
              </div>
              <div className="animate-wiggle animate-infinite relative">
                <Image
                  src={hero8}
                  alt=""
                  className=""
                />
              </div>
              <div className="animate-rotate-y animate-infinite relative hidden lg:block">
                <Image
                  src={hero9}
                  alt=""
                  className=""
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
    </section>
  )
}
