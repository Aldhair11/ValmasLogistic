import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MASTER_PAGE_SIZE_OPTIONS } from '../../constants/masters';

export interface MasterPaginationBarProps {
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  rangeFrom: number;
  rangeTo: number;
  hasPrev: boolean;
  hasNext: boolean;
  disabled?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPageSizeChange: (size: number) => void;
}

function MasterPaginationBar({
  page,
  pageSize,
  totalPages,
  totalCount,
  rangeFrom,
  rangeTo,
  hasPrev,
  hasNext,
  disabled = false,
  onPrev,
  onNext,
  onPageSizeChange,
}: MasterPaginationBarProps) {
  return (
    <div className="flex flex-col gap-3 border-t-2 border-on-surface bg-surface-container-low px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <p className="text-xs font-bold uppercase tracking-wide text-on-surface-muted sm:text-sm">
          {totalCount === 0 ? (
            'Sin resultados'
          ) : (
            <>
              Mostrando{' '}
              <span className="font-extrabold tabular-nums text-on-surface">{rangeFrom}</span>ÔÇô
              <span className="font-extrabold tabular-nums text-on-surface">{rangeTo}</span> de{' '}
              <span className="font-extrabold tabular-nums text-on-surface">{totalCount}</span>
              {totalPages > 1 && (
                <span className="ml-1 text-on-surface-muted">
                  (p├ígina {page} de {totalPages})
                </span>
              )}
            </>
          )}
        </p>
        <div className="flex items-center gap-2">
          <label
            htmlFor="master-page-size"
            className="shrink-0 text-xs font-bold uppercase tracking-wide text-on-surface-muted"
          >
            Por p├ígina
          </label>
          <select
            id="master-page-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            disabled={disabled}
            className="brutalist-input min-w-[4.5rem] py-1.5 text-sm"
          >
            {MASTER_PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={disabled || !hasPrev}
          className="brutalist-button-secondary px-3 py-1.5 text-xs"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Anterior
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={disabled || !hasNext}
          className="brutalist-button-secondary px-3 py-1.5 text-xs"
        >
          Siguiente
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default MasterPaginationBar;
