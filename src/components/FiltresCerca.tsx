import type { Filtres, Opcions } from "../types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, X, SlidersHorizontal } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

const PREUS = ["€", "€€", "€€€", "€€€€"]

interface Props {
  filtres: Filtres
  onChange: (f: Filtres) => void
  opcions: Opcions
  total: number
}

export default function FiltresCerca({ filtres, onChange, opcions, total }: Props) {
  const [expanded, setExpanded] = useState(false)
  const set = (k: keyof Filtres, v: unknown) => onChange({ ...filtres, [k]: v })

  const togglePreu = (p: string) => {
    const actual = filtres.preu
    if (actual.includes(p)) {
      set("preu", actual.filter((x) => x !== p))
    } else {
      set("preu", [...actual, p])
    }
  }

  const resetAll = () =>
    onChange({
      cerca: "",
      barri: "",
      ciutat: "",
      tipus_cuina: "",
      preu: [],
      puntuacio_min: null,
      visitat: "tots",
      ordre: "data_afegit",
      ordre_dir: "DESC",
    })

  const hiHaFiltresActius =
    filtres.cerca ||
    filtres.barri ||
    filtres.ciutat ||
    filtres.tipus_cuina ||
    filtres.preu.length > 0 ||
    filtres.puntuacio_min !== null ||
    filtres.visitat !== "tots"

  return (
    <aside className="w-full lg:w-72 shrink-0 space-y-4">
      {/* Cerca principal */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9 pr-9"
          placeholder="Cerca restaurants..."
          value={filtres.cerca}
          onChange={(e) => set("cerca", e.target.value)}
        />
        {filtres.cerca && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => set("cerca", "")}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Toggle filtres avançats */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setExpanded(!expanded)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtres avançats
          {hiHaFiltresActius && (
            <span className="ml-1 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
        <span className="text-xs text-muted-foreground">
          {total} {total === 1 ? "resultat" : "resultats"}
        </span>
      </div>

      {/* Filtres expandibles */}
      {expanded && (
        <div className="space-y-4 p-4 rounded-xl border bg-card shadow-sm">
          {/* Ubicació */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Ubicació
            </Label>
            {opcions.barris.length > 0 ? (
              <Select
                value={filtres.barri || "_tots"}
                onValueChange={(v) => set("barri", v === "_tots" ? "" : v)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Tots els barris" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_tots">Tots els barris</SelectItem>
                  {opcions.barris.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder="Barri / zona"
                value={filtres.barri}
                onChange={(e) => set("barri", e.target.value)}
                className="text-sm"
              />
            )}
            {opcions.ciutats.length > 1 && (
              <Select
                value={filtres.ciutat || "_totes"}
                onValueChange={(v) => set("ciutat", v === "_totes" ? "" : v)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Totes les ciutats" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_totes">Totes les ciutats</SelectItem>
                  {opcions.ciutats.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Tipus cuina */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Tipus de cuina
            </Label>
            <Select
              value={filtres.tipus_cuina || "_tots"}
              onValueChange={(v) => set("tipus_cuina", v === "_tots" ? "" : v)}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Totes les cuines" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_tots">Totes les cuines</SelectItem>
                {(opcions.tipus_cuina.length > 0
                  ? opcions.tipus_cuina
                  : [
                      "Catalana", "Espanyola", "Italiana", "Japonesa",
                      "Mediterrània", "Francesa", "Mexicana", "Altres",
                    ]
                ).map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preu */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Preu
            </Label>
            <div className="flex gap-1.5 flex-wrap">
              {PREUS.map((p) => (
                <button
                  key={p}
                  onClick={() => togglePreu(p)}
                  className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium border transition-all",
                    filtres.preu.includes(p)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Puntuació mínima */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Puntuació mínima
            </Label>
            <div className="flex gap-1.5 flex-wrap">
              {[null, 5, 6, 7, 8, 9].map((v) => (
                <button
                  key={v ?? "tots"}
                  onClick={() => set("puntuacio_min", v)}
                  className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium border transition-all",
                    filtres.puntuacio_min === v
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary"
                  )}
                >
                  {v === null ? "Tots" : `≥${v}`}
                </button>
              ))}
            </div>
          </div>

          {/* Visitat */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Estat
            </Label>
            <div className="flex gap-1.5">
              {["tots", "si", "no"].map((v) => (
                <button
                  key={v}
                  onClick={() => set("visitat", v)}
                  className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium border transition-all capitalize",
                    filtres.visitat === v
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary"
                  )}
                >
                  {v === "tots" ? "Tots" : v === "si" ? "Visitats" : "Pendents"}
                </button>
              ))}
            </div>
          </div>

          {/* Ordre */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Ordenar per
            </Label>
            <div className="flex gap-2">
              <Select
                value={filtres.ordre}
                onValueChange={(v) => set("ordre", v)}
              >
                <SelectTrigger className="text-sm flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="data_afegit">Data afegit</SelectItem>
                  <SelectItem value="nom">Nom</SelectItem>
                  <SelectItem value="puntuacio">Puntuació</SelectItem>
                  <SelectItem value="preu">Preu</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filtres.ordre_dir}
                onValueChange={(v) => set("ordre_dir", v)}
              >
                <SelectTrigger className="text-sm w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DESC">↓</SelectItem>
                  <SelectItem value="ASC">↑</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {hiHaFiltresActius && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-2 text-muted-foreground"
              onClick={resetAll}
            >
              <X className="h-3.5 w-3.5" />
              Esborrar filtres
            </Button>
          )}
        </div>
      )}

      {/* Tags de filtres actius */}
      {hiHaFiltresActius && (
        <div className="flex flex-wrap gap-1.5">
          {filtres.cerca && (
            <Badge variant="secondary" className="gap-1 text-xs">
              "{filtres.cerca}"
              <button onClick={() => set("cerca", "")}><X className="h-3 w-3" /></button>
            </Badge>
          )}
          {filtres.barri && (
            <Badge variant="secondary" className="gap-1 text-xs">
              {filtres.barri}
              <button onClick={() => set("barri", "")}><X className="h-3 w-3" /></button>
            </Badge>
          )}
          {filtres.tipus_cuina && (
            <Badge variant="secondary" className="gap-1 text-xs">
              {filtres.tipus_cuina}
              <button onClick={() => set("tipus_cuina", "")}><X className="h-3 w-3" /></button>
            </Badge>
          )}
          {filtres.preu.map((p) => (
            <Badge key={p} variant="secondary" className="gap-1 text-xs">
              {p}
              <button onClick={() => togglePreu(p)}><X className="h-3 w-3" /></button>
            </Badge>
          ))}
          {filtres.puntuacio_min !== null && (
            <Badge variant="secondary" className="gap-1 text-xs">
              ≥{filtres.puntuacio_min}★
              <button onClick={() => set("puntuacio_min", null)}><X className="h-3 w-3" /></button>
            </Badge>
          )}
          {filtres.visitat !== "tots" && (
            <Badge variant="secondary" className="gap-1 text-xs">
              {filtres.visitat === "si" ? "Visitats" : "Pendents"}
              <button onClick={() => set("visitat", "tots")}><X className="h-3 w-3" /></button>
            </Badge>
          )}
        </div>
      )}
    </aside>
  )
}
