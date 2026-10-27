import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';

/**
 * Converte ISO 'YYYY-MM-DD' para 'DD/MM/AAAA'
 */
function isoToDisplay(iso) {
  if (!iso || typeof iso !== 'string') return '';
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return '';
  const [, yyyy, mm, dd] = match;
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Converte 'DD/MM/AAAA' para ISO 'YYYY-MM-DD'
 * Retorna null se a data for inválida ou incompleta
 */
function displayToIso(display) {
  if (!display || typeof display !== 'string') return null;
  const digits = display.replace(/\D/g, '');
  if (digits.length !== 8) return null;

  const dd = parseInt(digits.slice(0, 2), 10);
  const mm = parseInt(digits.slice(2, 4), 10);
  const yyyy = parseInt(digits.slice(4, 8), 10);

  if (mm < 1 || mm > 12) return null;
  if (dd < 1 || dd > 31) return null;
  if (yyyy < 1920 || yyyy > 2100) return null;

  // Validação real do mês/dia (evita 31/02, 31/04, etc)
  const d = new Date(yyyy, mm - 1, dd);
  if (
    d.getFullYear() !== yyyy ||
    d.getMonth() !== mm - 1 ||
    d.getDate() !== dd
  ) {
    return null;
  }

  const sMm = String(mm).padStart(2, '0');
  const sDd = String(dd).padStart(2, '0');
  return `${yyyy}-${sMm}-${sDd}`;
}

/**
 * Formata sequência de dígitos numéricos com as barras DD/MM/AAAA automaticamente
 */
function formatWithMask(digits) {
  const clean = digits.replace(/\D/g, '').slice(0, 8);
  if (clean.length <= 2) {
    return clean;
  }
  if (clean.length <= 4) {
    return `${clean.slice(0, 2)}/${clean.slice(2)}`;
  }
  return `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4)}`;
}

export default function DateInput({
  value = '',
  onChange,
  required = false,
  disabled = false,
  className = '',
  placeholder = 'DD/MM/AAAA',
  min,
  max,
  id,
  name,
}) {
  const [displayValue, setDisplayValue] = useState(() => isoToDisplay(value));
  const hiddenDateRef = useRef(null);

  // Sincroniza se o valor externo mudar
  useEffect(() => {
    setDisplayValue(isoToDisplay(value));
  }, [value]);

  const handleTextChange = (e) => {
    const raw = e.target.value;
    const formatted = formatWithMask(raw);
    setDisplayValue(formatted);

    const clean = formatted.replace(/\D/g, '');
    if (clean.length === 8) {
      const iso = displayToIso(formatted);
      if (iso) {
        onChange(iso);
      }
    } else if (clean.length === 0) {
      onChange('');
    }
  };

  const handleKeyDown = (e) => {
    // Se o usuário apertar Backspace logo após uma barra, apaga a barra e o dígito anterior
    if (e.key === 'Backspace') {
      const input = e.target;
      const pos = input.selectionStart;
      if ((pos === 3 || pos === 6) && input.selectionEnd === pos) {
        e.preventDefault();
        const curDigits = displayValue.replace(/\D/g, '');
        const targetLen = pos === 3 ? 1 : 3;
        const newDigits = curDigits.slice(0, targetLen) + curDigits.slice(targetLen + 1);
        const newFormatted = formatWithMask(newDigits);
        setDisplayValue(newFormatted);
        const iso = displayToIso(newFormatted);
        onChange(iso || '');
      }
    }
  };

  const handleCalendarPickerChange = (e) => {
    const picked = e.target.value; // 'YYYY-MM-DD'
    if (picked) {
      setDisplayValue(isoToDisplay(picked));
      onChange(picked);
    }
  };

  const openCalendarPicker = () => {
    if (disabled) return;
    try {
      if (hiddenDateRef.current?.showPicker) {
        hiddenDateRef.current.showPicker();
      } else {
        hiddenDateRef.current?.focus();
      }
    } catch {
      hiddenDateRef.current?.focus();
    }
  };

  return (
    <div className="relative inline-flex items-center w-full">
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        id={id}
        name={name}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        value={displayValue}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        maxLength={10}
        className={`w-full pr-10 ${className}`}
      />

      {/* Botão sutil de calendário para quem preferir abrir o seletor visual */}
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={openCalendarPicker}
        title="Abrir calendário"
        className="absolute right-2.5 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer disabled:opacity-40"
      >
        <Calendar className="w-4 h-4" />
      </button>

      {/* Input de data nativo oculto para integração de calendário */}
      <input
        ref={hiddenDateRef}
        type="date"
        tabIndex={-1}
        min={min}
        max={max}
        value={value || ''}
        onChange={handleCalendarPickerChange}
        className="sr-only"
        aria-hidden="true"
      />
    </div>
  );
}
