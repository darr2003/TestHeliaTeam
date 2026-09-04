import { forwardRef } from "react";

type ButtonVariant = "primary" | "ghost" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", children, ...props }, ref) => {
    const base =
      variant === "primary"
        ? "ah-btn"
        : variant === "ghost"
        ? "ah-btn-ghost"
        : "ah-icon-btn";

    return (
      <button ref={ref} className={`${base} ${className}`} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
