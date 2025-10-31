import type React from "react"

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  strokeWidth?: number
  size?: number
}

function Sparkles({ strokeWidth = 1.5, size = 18, className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 18 18"
      className={className}
      {...props}
    >
      <polygon
        points="7.5 3.5 9.1287 7.6204 13.25 9.25 9.1287 10.8796 7.5 15 5.8704 10.8796 1.75 9.25 5.8704 7.6204 7.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
      <circle
        cx="14"
        cy="4"
        r="1.75"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
      <line
        x1="14.25"
        y1="12.5"
        x2="14.25"
        y2="16"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
      <line
        x1="16"
        y1="14.25"
        x2="12.5"
        y2="14.25"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </svg>
  )
}

export default Sparkles
