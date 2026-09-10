import { type SVGProps } from "react";

const LOGO_WIDTH = 3000;
const LOGO_HEIGHT = 1375.12;

interface LogoIconProps extends Omit<SVGProps<SVGSVGElement>, "width" | "height"> {
  size?: number;
}

export function LogoIcon({ size = 24, style, ...props }: LogoIconProps) {
  return (
    <svg
      viewBox={`0 0 ${LOGO_WIDTH} ${LOGO_HEIGHT}`}
      width={size}
      height={Math.round((size * LOGO_HEIGHT * 10) / LOGO_WIDTH) / 10}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={style}
      {...props}
    >
      <path
        d="M26.73,1946.88c-148.42-179.18,351.19-995.7,760.33-963.26,227.36,18,274,286.1,760.34,726.11,320.26,289.78,567.66,513.64,810.45,473.07,449.72-75.15,811.91-1045.57,558.64-1300.64C2476.6,439.14,290,2264.65,26.73,1946.88Z"
        transform="translate(0 -812.44)"
      />
    </svg>
  );
}