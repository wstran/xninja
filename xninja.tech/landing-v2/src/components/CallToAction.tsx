import Image from 'next/image'
import Link from 'next/link'
import { Container } from '@/components/Container'
import suken from '@/images/objects/suken.png'
import buttonX from '@/images/bt_x.png'
import buttonD from '@/images/bt_dc.png'
import { Logo2 } from '@/components/Logo2'

export function CallToAction() {
  return (
    <section
      id="get-started-today"
      className="relative overflow-hidden py-24"
    >

      <Container className="relative">
        <Image className="animate-spin absolute top-0 left-0" width="24" src={suken} alt="Object" style={{ top: "0%", left: "-16%" }} />
        <Image className="animate-spin absolute bottom-0 right-0" width="24" src={suken} alt="Object" style={{ bottom: "16%", right: "-8%" }} />
        <Image className="animate-spin absolute top-0 right-0" width="40" src={suken} alt="Object" style={{ top: "0%", right: "-16%" }} />
        <Image className="animate-spin absolute bottom-0 left-0" width="48" src={suken} alt="Object" style={{ bottom: "16%", left: "-8%" }} />
        <div className="mx-auto max-w-lg text-center items-center">
          <Link href="#" className="animate-shake animate-infinite inline-block">
            <Logo2 className="mx-auto h-10" />
          </Link>
          <h2 className="font-display text-3xl tracking-tight text-[#DCC7AF] sm:text-4xl">
          JOIN OTHER NINJAS & STAY UPDATED
          </h2>
          <div className="mt-8 flex justify-center gap-x-6">
          <button className="hover:scale-105 hover:shadow-xl transition-transform duration-300">
            <Link href="https://discord.gg/BYDKUkN36V" className="inline-block">
              <Image src={buttonD} alt="Button image" />
            </Link>
          </button>
          <button className="hover:scale-105 hover:shadow-xl transition-transform duration-300">
            <Link href="https://twitter.com/xninja_tech" className="inline-block">
              <Image src={buttonX} alt="Button image" />
            </Link>
          </button>
          </div>
        </div>
      </Container>
    </section>
  )
}
