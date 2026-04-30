'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDownIcon } from 'lucide-react';

// ─── prop interfaces (kept public so callers can type-check) ─────────────────

interface SelectRootProps {
  children?: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
}

interface SelectTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  id?: string;
  size?: 'sm' | 'default';
  children?: React.ReactNode;
}

interface SelectContentProps {
  children?: React.ReactNode;
  className?: string;
  side?: string;
  sideOffset?: number;
  align?: string;
  alignOffset?: number;
  alignItemWithTrigger?: boolean;
}

interface SelectItemProps {
  value: string;
  children?: React.ReactNode;
  disabled?: boolean;
  label?: string;
  className?: string;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function displayName(el: React.ReactElement): string {
  const t = el.type as { displayName?: string; name?: string };
  return t.displayName ?? t.name ?? '';
}

function collectItems(
  children: React.ReactNode,
): { value: string; label: string; disabled?: boolean }[] {
  const items: { value: string; label: string; disabled?: boolean }[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const name = displayName(child);
    if (name === 'SelectItem') {
      const p = child.props as SelectItemProps;
      items.push({
        value: p.value,
        label: String(p.children ?? p.label ?? p.value),
        disabled: p.disabled,
      });
    } else if (name === 'SelectGroup') {
      items.push(...collectItems((child.props as { children?: React.ReactNode }).children));
    }
  });
  return items;
}

// ─── Select (root — does all the rendering) ──────────────────────────────────

function Select({ children, value, defaultValue, onValueChange }: SelectRootProps) {
  let triggerId: string | undefined;
  let options: { value: string; label: string; disabled?: boolean }[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const name = displayName(child);
    if (name === 'SelectTrigger') {
      triggerId = (child.props as SelectTriggerProps).id;
    }
    if (name === 'SelectContent') {
      options = collectItems((child.props as SelectContentProps).children);
    }
  });

  const isControlled = value !== undefined;

  return (
    <div className="relative">
      <select
        id={triggerId}
        {...(isControlled
          ? { value, onChange: (e) => onValueChange?.(e.target.value) }
          : {
              defaultValue,
              onChange: (e) => onValueChange?.(e.target.value),
            })}
        className={cn(
          'flex h-11 w-full appearance-none rounded-lg border border-input',
          'bg-transparent px-3 py-2 pr-9 text-base text-foreground shadow-sm',
          'transition-colors',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon
        aria-hidden
        className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}
Select.displayName = 'Select';

// ─── Sub-components (data carriers — render nothing) ─────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SelectTrigger(_props: SelectTriggerProps) {
  return null;
}
SelectTrigger.displayName = 'SelectTrigger';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SelectValue(_props: { placeholder?: string; className?: string }) {
  return null;
}
SelectValue.displayName = 'SelectValue';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SelectContent(_props: SelectContentProps) {
  return null;
}
SelectContent.displayName = 'SelectContent';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SelectItem(_props: SelectItemProps) {
  return null;
}
SelectItem.displayName = 'SelectItem';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SelectGroup(_props: { children?: React.ReactNode }) {
  return null;
}
SelectGroup.displayName = 'SelectGroup';

function SelectLabel({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('px-1.5 py-1 text-sm text-muted-foreground', className)} {...props} />;
}
SelectLabel.displayName = 'SelectLabel';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SelectSeparator(_props: { className?: string }) {
  return null;
}
SelectSeparator.displayName = 'SelectSeparator';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SelectScrollUpButton(_props: { className?: string }) {
  return null;
}
SelectScrollUpButton.displayName = 'SelectScrollUpButton';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SelectScrollDownButton(_props: { className?: string }) {
  return null;
}
SelectScrollDownButton.displayName = 'SelectScrollDownButton';

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
