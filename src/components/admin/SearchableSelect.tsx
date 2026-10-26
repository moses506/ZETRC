import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';

export type SelectOption = { value: string; label: string; hint?: string };

type SearchableSelectProps = {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
};

/** A dropdown with a search box, for long option lists like lecturers or courses. */
function SearchableSelect({
  value,
  options,
  onChange,
  placeholder = '— Select —',
  emptyText = 'No matches',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((option) => option.value === value);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) =>
      `${option.label} ${option.value} ${option.hint ?? ''}`.toLowerCase().includes(term),
    );
  }, [options, query]);

  useEffect(() => {
    if (!isOpen) return;
    const close = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setHighlight(0);
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const choose = (next: string) => {
    onChange(next);
    setIsOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlight((index) => Math.min(index + 1, filtered.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const option = filtered[highlight];
      if (option) choose(option.value);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`admin-combobox${isOpen ? ' admin-combobox-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="admin-combobox-trigger"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={selected || value ? '' : 'admin-combobox-placeholder'}>
          {selected ? selected.label : value || placeholder}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen ? (
        <div className="admin-combobox-panel">
          <div className="admin-combobox-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search…"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setHighlight(0);
              }}
              onKeyDown={handleKeyDown}
            />
          </div>

          <ul className="admin-combobox-list" role="listbox">
            {value ? (
              <li>
                <button type="button" className="admin-combobox-option admin-combobox-clear" onClick={() => choose('')}>
                  Clear selection
                </button>
              </li>
            ) : null}
            {filtered.length === 0 ? (
              <li className="admin-combobox-empty">{options.length === 0 ? 'No options available' : emptyText}</li>
            ) : (
              filtered.map((option, index) => (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={option.value === value}
                    className={`admin-combobox-option${index === highlight ? ' admin-combobox-option-active' : ''}${
                      option.value === value ? ' admin-combobox-option-selected' : ''
                    }`}
                    onMouseEnter={() => setHighlight(index)}
                    onClick={() => choose(option.value)}
                  >
                    <span>
                      {option.label}
                      {option.hint ? <small>{option.hint}</small> : null}
                    </span>
                    {option.value === value ? <span aria-hidden="true">✓</span> : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export default SearchableSelect;
