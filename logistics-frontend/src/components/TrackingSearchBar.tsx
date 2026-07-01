import { Search } from 'lucide-react';
import type { FormEvent } from 'react';

interface TrackingSearchBarProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  className?: string;
}

function TrackingSearchBar({
  id,
  value,
  onChange,
  onSubmit,
  className = '',
}: TrackingSearchBarProps) {
  return (
    <form
      onSubmit={onSubmit}
      className={`flex w-full flex-col gap-3 sm:flex-row sm:items-stretch ${className}`}
    >
      <label htmlFor={id} className="sr-only">
        Número de seguimiento
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ingresa tu número de seguimiento..."
        autoComplete="off"
        className="brutalist-input text-base sm:flex-1"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="brutalist-button-secondary sm:shrink-0"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        Rastrear
      </button>
    </form>
  );
}

export default TrackingSearchBar;
