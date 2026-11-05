import * as React from 'react';

import { cn } from '../../lib/utils';

type SliderValue = number | number[];

type SliderProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: SliderValue;
  defaultValue?: SliderValue;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  'aria-label'?: string;
  onValueChange?: (value: SliderValue) => void;
  onValueCommitted?: (value: SliderValue) => void;
};

function toArray(v: SliderValue | undefined, min: number, max: number): number[] {
  if (Array.isArray(v)) return v;
  if (typeof v === 'number') return [v];
  return [min, max];
}

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  step,
  disabled,
  'aria-label': ariaLabel,
  onValueChange,
  onValueCommitted,
  ...props
}: SliderProps) {
  const values = toArray(value ?? defaultValue, min, max);
  const current = Math.min(Math.max(values[0] ?? min, min), max);
  const pct = max > min ? ((current - min) / (max - min)) * 100 : 0;

  const emit = (next: number) => {
    const arr = Array.isArray(value ?? defaultValue);
    onValueChange?.(arr ? [next] : next);
  };
  const emitCommit = (next: number) => {
    const arr = Array.isArray(value ?? defaultValue);
    onValueCommitted?.(arr ? [next] : next);
  };

  return (
    <div
      data-slot="slider"
      data-horizontal=""
      data-disabled={disabled ? '' : undefined}
      className={cn('relative flex w-full touch-none items-center select-none', className)}
      {...props}
    >
      <div className="relative flex w-full items-center">
        <div
          data-slot="slider-track"
          className="bg-muted relative h-1 w-full grow overflow-hidden rounded-full"
        >
          <div
            data-slot="slider-range"
            className="bg-primary absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div
          data-slot="slider-thumb"
          className="border-ring ring-ring/50 relative z-10 size-3 rounded-full border bg-white block shrink-0 select-none disabled:pointer-events-none disabled:opacity-50"
          style={{ left: `calc(${pct}% - 6px)` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          value={current}
          aria-label={ariaLabel}
          onChange={(e) => emit(Number(e.target.value))}
          onPointerUp={(e) => emitCommit(Number((e.target as HTMLInputElement).value))}
          onKeyUp={(e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End') {
              emitCommit(Number((e.target as HTMLInputElement).value));
            }
          }}
          onBlur={(e) => emitCommit(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
    </div>
  );
}

export { Slider };
