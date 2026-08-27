"use client";

import * as React from "react";
import { Search, ChevronDown, Check, Car, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Vehicle {
  _id: string;
  placa: string;
  modelo: string;
  tag?: string;
  status?: string;
  centroOperacao?: string;
}

interface VehicleComboboxProps {
  value: string;
  onChange: (value: string) => void;
  vehicles: Vehicle[] | undefined;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  filialName?: string;
}

export function VehicleCombobox({
  value,
  onChange,
  vehicles = [],
  placeholder = "Selecione ou busque a placa...",
  error = false,
  disabled = false,
  filialName,
}: VehicleComboboxProps) {
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

  const selectedVehicle = React.useMemo(() => {
    if (!value) return null;
    return vehicles.find(
      (v) => v.placa.toUpperCase() === value.trim().toUpperCase()
    );
  }, [value, vehicles]);

  const filteredVehicles = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter(
      (v) =>
        v.placa.toLowerCase().includes(q) ||
        v.modelo.toLowerCase().includes(q) ||
        (v.tag && v.tag.toLowerCase().includes(q)) ||
        (v.tag && `tag ${v.tag}`.toLowerCase().includes(q)) ||
        (v.tag && `tag #${v.tag}`.toLowerCase().includes(q))
    );
  }, [search, vehicles]);

  const handleSelect = (placa: string) => {
    onChange(placa.toUpperCase());
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
          !disabled && (error
            ? "border-destructive focus-visible:ring-destructive/20"
            : "border-input hover:border-primary/50 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"),
          isOpen && !disabled && "ring-2 ring-primary border-primary"
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
          <Car className={cn("w-4 h-4 shrink-0", disabled ? "text-muted-foreground/60" : "text-muted-foreground")} />
          {value ? (
            <div className="flex items-center gap-2 truncate min-w-0 flex-1">
              {selectedVehicle?.tag && (
                <Badge className="bg-amber-500 hover:bg-amber-500 text-black font-extrabold text-[11px] px-1.5 py-0 shrink-0">
                  TAG {selectedVehicle.tag}
                </Badge>
              )}
              <Badge variant="outline" className="font-mono font-bold bg-muted/60 px-1.5 py-0 text-xs border-primary/30 text-primary shrink-0">
                {value}
              </Badge>
              {selectedVehicle && (
                <span className="text-muted-foreground text-xs truncate">
                  {selectedVehicle.modelo}
                </span>
              )}
            </div>
          ) : (
            <span className={cn("text-sm truncate", disabled ? "text-muted-foreground/70 italic" : "text-muted-foreground")}>
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
              title="Limpar seleção"
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
                placeholder={filialName ? `Buscar por TAG, placa ou modelo (${filialName})...` : "Buscar por TAG, placa ou modelo..."}
                className="w-full bg-background border border-input rounded-md pl-8 pr-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground"
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsOpen(false);
                  }
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (filteredVehicles.length > 0) {
                      handleSelect(filteredVehicles[0].placa);
                    } else if (search.trim()) {
                      handleSelect(search.trim());
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Lista de Veículos */}
          <div className="max-h-64 overflow-y-auto p-1.5 space-y-1">
            {filteredVehicles.length === 0 ? (
              <div className="py-5 px-3 text-center">
                <p className="text-xs text-muted-foreground mb-2">
                  {vehicles.length === 0 && filialName
                    ? `Nenhum veículo cadastrado na filial ${filialName}.`
                    : `Nenhum veículo encontrado com "${search}".`}
                </p>
                {search.trim() && (
                  <button
                    type="button"
                    onClick={() => handleSelect(search.trim())}
                    className="text-xs text-primary font-bold hover:underline bg-primary/10 px-2.5 py-1 rounded-md transition-colors"
                  >
                    Usar placa digitada: &quot;{search.toUpperCase()}&quot;
                  </button>
                )}
              </div>
            ) : (
              filteredVehicles.map((vehicle) => {
                const isSelected =
                  value.trim().toUpperCase() === vehicle.placa.toUpperCase();

                return (
                  <div
                    key={vehicle._id}
                    onClick={() => handleSelect(vehicle.placa)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-all border border-transparent",
                      isSelected
                        ? "bg-primary/15 border-primary/30 text-foreground font-medium"
                        : "hover:bg-muted/70 text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {vehicle.tag && (
                        <Badge className="bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/40 font-bold text-[11px] px-1.5 py-0 shrink-0">
                          TAG {vehicle.tag}
                        </Badge>
                      )}
                      <span className="font-mono font-bold text-xs bg-background border px-2 py-0.5 rounded shadow-2xs">
                        {vehicle.placa}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {vehicle.modelo}
                      </span>
                      {vehicle.centroOperacao && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
                          {vehicle.centroOperacao}
                        </Badge>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-primary shrink-0 ml-2" />
                    )}
                  </div>
                );
              })
            )}
          </div>
          
          {/* Footer com contagem */}
          <div className="px-3 py-1.5 bg-muted/30 border-t text-[11px] text-muted-foreground flex justify-between items-center">
            <span>
              {filteredVehicles.length} veículo(s) {filialName ? `na filial ${filialName}` : "disponíveis"}
            </span>
            <span className="text-[10px] text-muted-foreground/80">Eletromidia Frota</span>
          </div>
        </div>
      )}
    </div>
  );
}
