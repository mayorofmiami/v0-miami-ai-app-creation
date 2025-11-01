import type React from "react"

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number
}

function UserSearch({ size = 18, className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="10" cy="8" r="5" />
      <path d="M2 21a8 8 0 0 1 13.292-6" />
      <circle cx="18" cy="18" r="3" />
      <path d="m22 22-1.5-1.5" />
    </svg>
  )
}

export default UserSearch
