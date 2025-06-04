'use client'

import Image from 'next/image'

import { Container } from '@/components/Container'
import backgroundImage from '@/images/how-to-join.png'
import group287 from '@/images/home/group-287@2x.png'
import s3805ab414e20d30 from '@/images/home/3805ab414e20d30-1-1@2x.png'
import dalle from '@/images/home/dalle-20240112-1313-1@2x.png'
import img113 from '@/images/home/113-1@2x.png'
import placeholder from '@/images/whatis/Placeholder.png'

export function HowToJoin() {

  return (
    <section
      id="how-to-join"
      className="relative bg-gray-300 "
    >
      <Container className="relative overflow-hidden  py-16 sm:py-24 bg-cover font-display">
        <div className="max-w-2xl mb-8 mx-auto text-center">
          <h1 className="font-display text-3xl tracking-tight text-[#DCC7AF]  sm:text-4xl md:text-5xl">
          HOW TO JOIN XNINJA?
          </h1>
          
        </div>
        <Image
          className=" "
          src={backgroundImage}
          alt=""
          unoptimized
        />
       {/* <div className="relative w-[1280px] h-[604px]">
          <Image
            className="absolute top-[90.63px] left-[109.53px] w-[464.93px] h-[364.18px] object-cover"
            alt=""
            src={img113}
          />
          <div className="absolute top-[21.85px] left-[718.22px] bg-peachpuff w-[11.48px] h-[410.59px]" />
          <Image
            className="absolute top-[16.77px] left-[652.5px] w-[142.92px] h-[114.02px]"
            alt=""
            src={placeholder}
          />
          <Image
            className="absolute top-[212.07px] left-[652.5px] w-[142.92px] h-[114.02px]"
            alt=""
            src={placeholder}
          />
          <Image
            className="absolute top-[431.48px] left-[652.5px] w-[142.92px] h-[114.02px]"
            alt=""
            src={placeholder}
          />
          <div className="absolute text-peachpuff top-[27.98px] left-[824.96px] text-3xl leading-[150%] inline-block w-[397.1px]">{`Install the browser extension (Coming soon) `}</div>
          <div className="absolute text-peachpuff top-[226.2px] left-[824.96px] text-3xl leading-[150%] inline-block w-[447.85px]">{`Receive your Ninja directly on X (Twitter) interface`}</div>
          <div className="absolute text-peachpuff top-[439.14px] left-[824.96px] text-3xl leading-[150%] inline-block w-[257.49px]">{`Train your Ninja, fight & earn profit.`}</div>
          <Image
            className="absolute top-[230.61px] left-[684.35px] w-[79.23px] h-[79.23px] object-contain"
            alt=""
            src={s3805ab414e20d30}
          />
          <Image
            className="absolute top-[43.98px] left-[691.96px] w-16 h-16 object-cover"
            alt=""
            src={group287}
          />
          <Image
            className="absolute top-[441.85px] left-[677.46px] w-[89.37px] h-[89.37px] object-cover"
            alt=""
            src={dalle}
          />
        </div> */}
      </Container>
    </section>
  )
}
