import Image from "next/image"

export function Logo({ className = "" }: { className?: string }) {
  return <Image src="/miami-ai-logo.png" alt="Miami.AI" width={200} height={50} className={className} priority />
}
