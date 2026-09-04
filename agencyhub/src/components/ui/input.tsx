import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  help?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, help, error, id, className, ...props }, ref) => {
    return (
      <div className={`ah-field ${className || ""}`}>
        {label && (
          <label htmlFor={id} className="ah-field-label">
            {label}
          </label>
        )}
        <div className="ah-field-input">
          <input ref={ref} id={id} {...props} />
        </div>
        {error && <span className="ah-field-error">{error}</span>}
        {!error && help && <span className="ah-field-help">{help}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  help?: string;
  error?: string;
  children: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, help, error, id, className, children, ...props }, ref) => {
    return (
      <div className={`ah-field ${className || ""}`}>
        {label && (
          <label htmlFor={id} className="ah-field-label">
            {label}
          </label>
        )}
        <div className="ah-field-input">
          <select ref={ref} id={id} {...props}>
            {children}
          </select>
        </div>
        {error && <span className="ah-field-error">{error}</span>}
        {!error && help && <span className="ah-field-help">{help}</span>}
      </div>
    );
  }
);
Select.displayName = "Select";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  help?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, help, error, id, className, ...props }, ref) => {
    return (
      <div className={`ah-field ${className || ""}`}>
        {label && (
          <label htmlFor={id} className="ah-field-label">
            {label}
          </label>
        )}
        <div className="ah-field-input">
          <textarea ref={ref} id={id} {...props} />
        </div>
        {error && <span className="ah-field-error">{error}</span>}
        {!error && help && <span className="ah-field-help">{help}</span>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
