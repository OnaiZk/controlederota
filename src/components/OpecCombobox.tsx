"use client";

import * as React from "react";
import { Search, ChevronDown, Check, Smartphone, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Lista padrão de aparelhos corporativos OPEC da operação (OPEC 01 a 50 + Reserva)
const DEFAULT_OPEC_LIST = [
  ...Array.from({ length: 50 }, (_, i) => {
    const num = String(i + 1).padStart(2, "0");
    return `OPEC ${num}`;
  }),
  "OPEC Reserva",
  "OPEC Apoio",
  "Celular Próprio / Particular",
];

interface OpecComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
}

export function OpecCombobox({
  value,
  onChange,
  placeholder = "Selecione ou busque o OPEC (Celular)...",
  error = false,
  disabled = false,
}: OpecComboboxProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Fecha ao clicar fora
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Foco no input de busca ao abrir
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch("");
    }
  }, [isOpen]);

  const filteredOpecs = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return DEFAULT_OPEC_LIST;

    // Se o usuário digitou apenas um número (ex: "7"), busca tanto "07" quanto "7"
    const isNum = /^\d+$/.test(q);
    const paddedNum = isNum ? q.padStart(2, "0") : q;

    return DEFAULT_OPEC_LIST.filter(
      (item) =>
        item.toLowerCase().includes(q) ||
        (isNum && item.toLowerCase().includes(`opec ${paddedNum}`))
    );
  }, [search]);

  const handleSelect = (selectedOpec: string) => {
    onChange(selectedOpec.trim());
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearch("");
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Botão Gatilho (Trigger) */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm shadow-xs transition-all select-none",
          disabled
            ? "bg-muted/50 text-muted-foreground border-dashed cursor-not-allowed opacity-75"
            : "cursor-pointer",
          !disabled &&
            (error
              ? "border-destructive focus-visible:ring-destructive/20"
              : "border-input hover:border-primary/50 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"),
          isOpen && !disabled && "ring-2 ring-primary border-primary"
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
          <Smartphone
            className={cn(
              "w-4 h-4 shrink-0",
              value ? "text-primary" : "text-muted-foreground"
            )}
          />
          {value ? (
            <div className="flex items-center gap-2 truncate min-w-0 flex-1">
              <Badge className="bg-primary/20 hover:bg-primary/20 text-foreground font-bold text-xs border border-primary/40 px-2.5 py-0.5 shrink-0">
                {value}
              </Badge>
            </div>
          ) : (
            <span
              className={cn(
                "text-sm truncate",
                disabled ? "text-muted-foreground/70 italic" : "text-muted-foreground"
              )}
            >
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {!disabled && value && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="p-1 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
              title="Limpar seleção do OPEC"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform duration-200",
              disabled ? "text-muted-foreground/40" : "text-muted-foreground",
              isOpen && !disabled && "rotate-180 text-primary"
            )}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Campo de Busca Interno */}
          <div className="p-2 border-b bg-muted/20">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Digite o número (ex: 05, 12) ou busque..."
                className="w-full bg-background border border-input rounded-md pl-8 pr-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground"
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsOpen(false);
                  }
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (filteredOpecs.length > 0) {
                      handleSelect(filteredOpecs[0]);
                    } else if (search.trim()) {
                      const customOpec = /^\d+$/.test(search.trim())
                        ? `OPEC ${search.trim().padStart(2, "0")}`
                        : search.trim();
                      handleSelect(customOpec);
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Lista de Aparelhos OPEC */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
            {filteredOpecs.length === 0 ? (
              <div className="py-4 px-3 text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  Nenhum OPEC pré-cadastrado encontrado para &quot;{search}&quot;.
                </p>
                {search.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      const customOpec = /^\d+$/.test(search.trim())
                        ? `OPEC ${search.trim().padStart(2, "0")}`
                        : search.trim();
                      handleSelect(customOpec);
                    }}
                    className="text-xs text-primary font-bold hover:underline bg-primary/10 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    Usar OPEC digitado: &quot;
                    {/^\d+$/.test(search.trim())
                      ? `OPEC ${search.trim().padStart(2, "0")}`
                      : search.trim()}
                    &quot;
                  </button>
                )}
              </div>
            ) : (
              <>
                {search.trim() &&
                  !filteredOpecs.some(
                    (o) => o.toLowerCase() === search.trim().toLowerCase()
                  ) && (
                    <div
                      onClick={() => {
                        const customOpec = /^\d+$/.test(search.trim())
                          ? `OPEC ${search.trim().padStart(2, "0")}`
                          : search.trim();
                        handleSelect(customOpec);
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs bg-primary/10 border border-primary/20 text-foreground cursor-pointer hover:bg-primary/20 transition-colors mb-1 font-semibold"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>
                        Usar valor digitado:{" "}
                        <strong className="text-primary font-bold">
                          {/^\d+$/.test(search.trim())
                            ? `OPEC ${search.trim().padStart(2, "0")}`
                            : search.trim()}
                        </strong>
                      </span>
                    </div>
                  )}

                <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                  {filteredOpecs.map((opecItem) => {
                    const isSelected =
                      value.trim().toUpperCase() === opecItem.toUpperCase();

                    return (
                      <div
                        key={opecItem}
                        onClick={() => handleSelect(opecItem)}
                        className={cn(
                          "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all border border-transparent",
                          isSelected
                            ? "bg-primary/20 border-primary/40 text-foreground font-bold"
                            : "hover:bg-muted/70 text-foreground bg-muted/20"
                        )}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <Smartphone
                            className={cn(
                              "w-3 h-3 shrink-0",
                              isSelected ? "text-primary" : "text-muted-foreground"
                            )}
                          />
                          <span className="font-medium truncate">{opecItem}</span>
                        </div>

                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-1" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Footer Informativo */}
          <div className="px-3 py-1.5 bg-muted/30 border-t text-[11px] text-muted-foreground flex justify-between items-center">
            <span>Celular corporativo para ordens de serviço</span>
            <span className="text-[10px] text-muted-foreground/80 font-medium">
              Eletromidia OPEC
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
