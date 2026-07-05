import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { inputClass, labelClass } from '../../pages/masters/shared';

interface MasterSearchPanelProps {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  aside?: ReactNode;
}

function MasterSearchPanel({
  id,
  label,
  value,
  placeholder,
  onChange,
  aside,
}: MasterSearchPanelProps) {
  return (
    <div className="bento-cell">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <label htmlFor={id} className={labelClass}>
            {label}
          </label>
          <div className="relative mt-1 max-w-xl">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-muted"
              aria-hidden="true"
            />
            <input
              id={id}
              type="search"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className={`${inputClass} pl-10`}
              autoComplete="off"
            />
          </div>
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
    </div>
  );
}

export default MasterSearchPanel;
