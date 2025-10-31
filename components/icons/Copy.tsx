import type React from "react"

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number
}

export default function Copy({ size = 18, className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 18 18"
      className={className}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7 8.75C7 7.78379 7.78379 7 8.75 7H14.25C15.2162 7 16 7.78379 16 8.75V14.25C16 15.2162 15.2162 16 14.25 16H8.75C7.78379 16 7 15.2162 7 14.25V8.75Z"
        fill="currentColor"
        fillOpacity="0.4"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2 3.75C2 2.78379 2.78379 2 3.75 2H9.25C10.2162 2 11 2.78379 11 3.75V9.25C11 10.2162 10.2162 11 9.25 11H3.75C2.78379 11 2 10.2162 2 9.25V3.75Z"
        fill="currentColor"
      />
    </svg>
  )
}
