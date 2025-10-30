import Image from "next/image"

export function Logo({ className = "" }: { className?: string }) {
  return <Image src="/miami-ai-logo.png" alt="Miami.AI" width={140} height={35} className={className} priority />
}
