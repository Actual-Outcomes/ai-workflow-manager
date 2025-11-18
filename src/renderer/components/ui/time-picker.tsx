import * as React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Label } from './label'
import { cn } from '../../lib/utils'

interface TimePickerProps {
  value?: string // Format: "HH:MM" (24-hour)
  onChange?: (value: string) => void
  id?: string
  className?: string
  label?: string
  disabled?: boolean
}

export const TimePicker: React.FC<TimePickerProps> = ({
  value = '00:00',
  onChange,
  id,
  className,
  label,
  disabled = false
}) => {
  const [hours, minutes] = value.split(':').map(v => parseInt(v, 10) || 0)
  
  const handleHoursChange = (newHours: string) => {
    const h = parseInt(newHours, 10)
    const newValue = `${String(h).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    onChange?.(newValue)
  }
  
  const handleMinutesChange = (newMinutes: string) => {
    const m = parseInt(newMinutes, 10)
    const newValue = `${String(hours).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    onChange?.(newValue)
  }

  const hoursOptions = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
  const minutesOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="flex items-center gap-2">
        <Select
          value={String(hours).padStart(2, '0')}
          onValueChange={handleHoursChange}
          disabled={disabled}
        >
          <SelectTrigger id={id} className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {hoursOptions.map((hour) => (
              <SelectItem key={hour} value={hour}>
                {hour}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground">:</span>
        <Select
          value={String(minutes).padStart(2, '0')}
          onValueChange={handleMinutesChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {minutesOptions.map((minute) => (
              <SelectItem key={minute} value={minute}>
                {minute}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

