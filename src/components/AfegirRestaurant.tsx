import { useState } from "react"
import type { Restaurant } from "../types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const TIPUS_CUINA = [
  "Catalana", "Espanyola", "Italiana", "Japonesa", "Tailandesa", "Índia",
  "Francesa", "Mexicana", "Xinesa", "Grega", "Americana", "Mediterrània",
  "Àrab", "Peruana", "Turca", "Vegetariana/Vegana", "De fusió", "Altres",
]

const PREUS = ["€", "€€", "€€€", "€€€€"]

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<Restaurant, 'id' | 'created_at'>) => Promise<void>
  initial?: Restaurant | null
  persones: string[]
}

function StarRating({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (v: number) => void
  label: string
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={`text-xl transition-colors ${
              s <= value ? "text-amber-400" : "text-muted"
            } hover:text-amber-300`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  )
}

export default function AfegirRestaurant({ open, onClose, onSave, initial, persones }: Props) {
const [form, setForm] = useState<Omit<Restaurant, 'id' | 'created_at'>>({    nom: initial?.nom ?? "",
    adreca: initial?.adreca ?? "",
    barri: initial?.barri ?? "",
    ciutat: initial?.ciutat ?? "Barcelona",
    tipus_cuina: initial?.tipus_cuina ?? "",
    preu: initial?.preu ?? "",
    puntuacio: initial?.puntuacio ?? undefined,
    puntuacio_menjar: initial?.puntuacio_menjar ?? 0,
    puntuacio_servei: initial?.puntuacio_servei ?? 0,
    puntuacio_ambient: initial?.puntuacio_ambient ?? 0,
    telefon: initial?.telefon ?? "",
    web: initial?.web ?? "",
    maps_url: initial?.maps_url ?? "",
    afegit_per: initial?.afegit_per ?? "",
    notes: initial?.notes ?? "",
    visitat: initial?.visitat ?? false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [novaPersona, setNovaPersona] = useState(false)

const set = (k: keyof Omit<Restaurant, 'id' | 'created_at'>, v: unknown) =>    setForm((f) => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom.trim()) {
      setError("El nom és obligatori")
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave(form)
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error en desar. Torna-ho a intentar.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {initial ? "Editar restaurant" : "Afegir restaurant"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Nom */}
          <div className="space-y-1.5">
            <Label htmlFor="nom">
              Nom <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nom"
              value={form.nom}
              onChange={(e) => set("nom", e.target.value)}
              placeholder="Nom del restaurant"
            />
          </div>

          {/* Adreça + Barri + Ciutat */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="adreca">Adreça</Label>
              <Input
                id="adreca"
                value={form.adreca ?? ""}
                onChange={(e) => set("adreca", e.target.value)}
                placeholder="Carrer i número"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="barri">Barri / Zona</Label>
              <Input
                id="barri"
                value={form.barri ?? ""}
                onChange={(e) => set("barri", e.target.value)}
                placeholder="Eixample, Gràcia..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ciutat">Ciutat</Label>
              <Input
                id="ciutat"
                value={form.ciutat ?? ""}
                onChange={(e) => set("ciutat", e.target.value)}
                placeholder="Barcelona"
              />
            </div>
          </div>

          {/* Tipus cuina + Preu */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipus de cuina</Label>
              <Select
                value={form.tipus_cuina ?? ""}
                onValueChange={(v) => set("tipus_cuina", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent>
                  {TIPUS_CUINA.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Rang de preu</Label>
              <Select
                value={form.preu ?? ""}
                onValueChange={(v) => set("preu", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent>
                  {PREUS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Puntuació global */}
          <div className="space-y-1.5">
            <Label htmlFor="puntuacio">
              Puntuació global{" "}
              <span className="text-muted-foreground text-xs">(1–10)</span>
            </Label>
            <Input
              id="puntuacio"
              type="number"
              min={1}
              max={10}
              step={0.1}
              value={form.puntuacio ?? ""}
              onChange={(e) =>
                set("puntuacio", e.target.value ? parseFloat(e.target.value) : undefined)
              }
              placeholder="7.5"
              className="w-32"
            />
          </div>

          {/* Puntuacions detallades */}
          <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-muted/50">
            <StarRating
              label="Menjar"
              value={form.puntuacio_menjar ?? 0}
              onChange={(v) => set("puntuacio_menjar", v)}
            />
            <StarRating
              label="Servei"
              value={form.puntuacio_servei ?? 0}
              onChange={(v) => set("puntuacio_servei", v)}
            />
            <StarRating
              label="Ambient"
              value={form.puntuacio_ambient ?? 0}
              onChange={(v) => set("puntuacio_ambient", v)}
            />
          </div>

          {/* Contacte */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="telefon">Telèfon</Label>
              <Input
                id="telefon"
                value={form.telefon ?? ""}
                onChange={(e) => set("telefon", e.target.value)}
                placeholder="+34 93 000 00 00"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="web">Web</Label>
              <Input
                id="web"
                value={form.web ?? ""}
                onChange={(e) => set("web", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Google Maps */}
          <div className="space-y-1.5">
            <Label htmlFor="maps_url">Enllaç de Google Maps</Label>
            <Input
              id="maps_url"
              value={form.maps_url ?? ""}
              onChange={(e) => set("maps_url", e.target.value)}
              placeholder="https://maps.google.com/..."
            />
            <p className="text-xs text-muted-foreground">
              Obre Google Maps, cerca el restaurant, prem "Compartir" i copia l'enllaç.
            </p>
          </div>

          {/* Afegit per */}
          <div className="space-y-1.5">
            <Label>Afegit per</Label>
            {novaPersona ? (
              <div className="flex gap-2">
                <Input
                  autoFocus
                  placeholder="Nom de la persona"
                  value={form.afegit_per ?? ""}
                  onChange={(e) => set("afegit_per", e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setNovaPersona(false); set("afegit_per", "") }}
                >
                  Cancel·lar
                </Button>
              </div>
            ) : (
              <Select
                value={form.afegit_per ?? ""}
                onValueChange={(v) => {
                  if (v === "__nova__") { setNovaPersona(true); set("afegit_per", "") }
                  else set("afegit_per", v)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Qui afegeix aquest restaurant?" />
                </SelectTrigger>
                <SelectContent>
                  {persones.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                  <SelectItem value="__nova__" className="text-primary font-medium">
                    + Afegir persona nova...
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Especialitats, observacions, etc."
              rows={3}
            />
          </div>

          {/* Visitat */}
          <div className="flex items-center gap-3">
            <Switch
              id="visitat"
              checked={form.visitat ?? false}
              onCheckedChange={(v) => set("visitat", v)}
            />
            <Label htmlFor="visitat">Ja he visitat aquest restaurant</Label>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel·lar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Desant..." : initial ? "Desar canvis" : "Afegir restaurant"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
