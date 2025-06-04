import Link from 'next/link'

import { Container } from '@/components/Container'
import { Logo } from '@/components/Logo'
import { NavLink } from '@/components/NavLink'
import Image from 'next/image'
import fireNinja from '@/images/ninjas/fire.gif'
export function Footer() {
  return (
    <footer>
      <Container className="relative">
        <div className="py-8">
          <nav className="text-xs md:text-sm" aria-label="quick links">
            <div className="-my-1 flex justify-center gap-x-1 md:gap-x-6">
              <NavLink href="https://docs.xninja.tech/other-information/borrow-policy">Borrow Policy</NavLink>
              <NavLink href="https://docs.xninja.tech/other-information/privacy-policy">Privacy Policy</NavLink>
              <NavLink href="https://docs.xninja.tech/other-information/terms-of-use">Terms of use</NavLink>
            </div>
          </nav>
        </div>
        <div className="flex flex-col items-center border-t border-slate-400/10 py-10 sm:flex-row-reverse sm:justify-between">
          <p className="mx-auto mt-6 text-sm text-slate-500 sm:mt-0">
            Copyright &copy; {new Date().getFullYear()} <b>xNinja</b>. All rights
            reserved.
          </p>
        </div>
        <Image className="absolute top-0 left-0" width="100" src={fireNinja} alt="Object" style={{ top: "0%", left: "16%" }} />
      </Container>
    </footer>
  )
}
