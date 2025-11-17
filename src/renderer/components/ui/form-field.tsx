import * as React from 'react'
import { Label } from './label'
import { Input } from './input'
import { Textarea } from './textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { cn } from '../../lib/utils'

export interface FormFieldProps {
  label: string
  htmlFor?: string
  error?: string
  hint?: string
  required?: boolean
  className?: string
  inline?: boolean
}

interface FormFieldContextValue {
  error?: string
  required?: boolean
}

const FormFieldContext = React.createContext<FormFieldContextValue>({})

export const FormField = React.forwardRef<
  HTMLDivElement,
  FormFieldProps & React.HTMLAttributes<HTMLDivElement>
>(({ label, htmlFor, error, hint, required, className, inline, children, ...props }, ref) => {
  return (
    <FormFieldContext.Provider value={{ error, required }}>
      <div
        ref={ref}
        className={cn(
          'form-group',
          inline && 'inline',
          className
        )}
        {...props}
      >
        <Label htmlFor={htmlFor} className={required ? 'required' : ''}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {children}
        {hint && (
          <small className="text-muted-foreground text-xs mt-1 block">
            {hint}
          </small>
        )}
        {error && (
          <small className="text-destructive text-xs mt-1 block">
            {error}
          </small>
        )}
      </div>
    </FormFieldContext.Provider>
  )
})
FormField.displayName = 'FormField'

export const FormFieldInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<typeof Input>
>(({ className, ...props }, ref) => {
  return <Input ref={ref} className={className} {...props} />
})
FormFieldInput.displayName = 'FormFieldInput'

export const FormFieldTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentPropsWithoutRef<typeof Textarea>
>(({ className, ...props }, ref) => {
  return <Textarea ref={ref} className={className} {...props} />
})
FormFieldTextarea.displayName = 'FormFieldTextarea'

export const FormFieldSelect = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Select> & {
    options?: Array<{ value: string; label: string }>
  }
>(({ className, options, children, ...props }, ref) => {
  return (
    <Select {...props}>
      <SelectTrigger ref={ref} className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options?.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
        {children}
      </SelectContent>
    </Select>
  )
})
FormFieldSelect.displayName = 'FormFieldSelect'

