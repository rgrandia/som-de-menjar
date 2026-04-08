import type { Restaurant } from "../types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { MapPin, Phone, Globe, Pencil, Trash2, UtensilsCrossed, CheckCircle2, Map } from "lucide-react"

const PREU_COLOR: Record<string, string> = {
  "€": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  "€€": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  "€€€": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  "€€€€": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
}

function Stars({ value, max = 5 }: { value: number | null; max?: number }) {
  if (!value) return null
  return (
    <span className="text-amber-400 text-sm">
      {"★".repeat(value)}
      <span className="text-muted opacity-40">{"★".repeat(max - value)}</span>
    </span>
  )
}

interface Props {
  restaurant: Restaurant
  onEdit: (r: Restaurant) => void
onDelete: (id: string) => void
}

export default function RestaurantCard({ restaurant: r, onEdit, onDelete }: Props) {
  const scoreColor =
    r.puntuacio === null
      ? "bg-muted text-muted-foreground"
        : (r.puntuacio ?? 0) >= 8
        ? "bg-emerald-500 text-white"
        : (r.puntuacio ?? 0) >= 6
          ? "bg-amber-500 text-white"
          : "bg-red-500 text-white"

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5">
      {/* Franja de color per categoria */}
      <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-60 group-hover:opacity-100 transition-opacity" />

      <CardContent className="pl-5 pr-4 py-4">
        <div className="flex items-start justify-between gap-3">
          {/* Info principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground truncate font-display text-lg leading-tight">
                {r.nom}
              </h3>
              {r.visitat && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>Visitat</TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Afegit per */}
            {r.afegit_per && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Afegit per <span className="font-medium text-foreground">{r.afegit_per}</span>
              </p>
            )}

            {/* Ubicació */}
            {(r.barri || r.ciutat) && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {[r.barri, r.ciutat].filter(Boolean).join(", ")}
              </p>
            )}

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {r.tipus_cuina && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <UtensilsCrossed className="h-3 w-3" />
                  {r.tipus_cuina}
                </Badge>
              )}
              {r.preu && (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${PREU_COLOR[r.preu] ?? "bg-muted text-muted-foreground"}`}
                >
                  {r.preu}
                </span>
              )}
            </div>

            {/* Puntuacions detallades */}
            {(r.puntuacio_menjar || r.puntuacio_servei || r.puntuacio_ambient) ? (
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {r.puntuacio_menjar != null && r.puntuacio_menjar > 0 && (
                  <span className="flex items-center gap-1">
                    Menjar: <Stars value={r.puntuacio_menjar} />
                  </span>
                )}
                {r.puntuacio_servei != null && r.puntuacio_servei > 0 && (
                  <span className="flex items-center gap-1">
                    Servei: <Stars value={r.puntuacio_servei} />
                  </span>
                )}
                {r.puntuacio_ambient != null && r.puntuacio_ambient > 0 && (
                  <span className="flex items-center gap-1">
                    Ambient: <Stars value={r.puntuacio_ambient} />
                  </span>
                )}
              </div>
            ) : null}

            {/* Notes */}
            {r.notes && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2 italic">
                "{r.notes}"
              </p>
            )}

            {/* Contacte */}
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {r.telefon && (
                <a
                  href={`tel:${r.telefon}`}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <Phone className="h-3 w-3" />
                  {r.telefon}
                </a>
              )}
              {r.web && (
                <a
                  href={r.web}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground transition-colors truncate max-w-[160px]"
                >
                  <Globe className="h-3 w-3 shrink-0" />
                  <span className="truncate">{r.web.replace(/^https?:\/\//, "")}</span>
                </a>
              )}
              {r.maps_url && (
                <a
                  href={r.maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors font-medium"
                >
                  <Map className="h-3 w-3 shrink-0" />
                  Veure al mapa
                </a>
              )}
            </div>
          </div>

          {/* Puntuació + accions */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {r.puntuacio !== null ? (
              <div
                className={`flex items-center justify-center rounded-xl w-12 h-12 text-xl font-bold ${scoreColor}`}
              >
                {r.puntuacio ? (r.puntuacio % 1 === 0 ? r.puntuacio : r.puntuacio.toFixed(1)) : '-'}
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground text-xs text-center leading-tight">
                S/P
              </div>
            )}

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => onEdit(r)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => onDelete(r.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
