import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        primary: 
          "bg-accent text-accent-foreground hover:brightness-110 shadow-gentle transform transition-all hover:scale-105",
        gradient:
          "bg-cta-gradient text-white hover:opacity-90 shadow-gentle transform transition-all hover:scale-105",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all",
        secondary:
          "bg-card text-primary ring-1 ring-primary/30 hover:bg-primary/5",
        purple:
          "bg-purple hover:bg-pink text-white shadow-lg transform transition-all hover:scale-105",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        enrollNow: "border-2 border-color-black text-white font-semibold outline outline-1 outline-purple hover:bg-[#F7C948] hover:border-[#F7C948] hover:text-black transition-all",
        heroEnrollNow: "btn-large bg-purple/90 hover:bg-yellow/90 text-white hover:text-black border-2 border-yellow shadow-lg font-bold w-full",
        enquireNow: "btn-large bg-purple/90 hover:bg-yellow/90 text-white hover:text-black border-2 border-yellow shadow-lg font-bold",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-6 py-3 text-base",
        xl: "h-14 rounded-xl px-8 py-4 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
