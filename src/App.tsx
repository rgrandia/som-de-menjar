import { useState, useEffect, useCallback, useRef } from "react"
import type { Restaurant, RestaurantCreate, Filtres, Opcions } from "./types"
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { Plus, UtensilsCrossed, Loader2 } from "lucide-react"
import FiltresCerca from "./components/FiltresCerca"
import RestaurantCard from "./components/RestaurantCard"
import AfegirRestaurant from "./components/AfegirRestaurant"

const FILTRES_INICIALS: Filtres = {
  cerca: "",
  barri: "",
  ciutat: "",
  tipus_cuina: "",
  preu: [],
  puntuacio_min: null,
  visitat: "tots",
  ordre: "data_afegit",
  ordre_dir: "DESC",
}

function buildQuery(f: Filtres): string {
  const params = new URLSearchParams()
  if (f.cerca) params.set("cerca", f.cerca)
  if (f.barri) params.set("barri", f.barri)
  if (f.ciutat) params.set("ciutat", f.ciutat)
  if (f.tipus_cuina) params.set("tipus_cuina", f.tipus_cuina)
  if (f.preu.length > 0) params.set("preu", f.preu.join(","))
  if (f.puntuacio_min !== null) params.set("puntuacio_min", String(f.puntuacio_min))
  if (f.visitat !== "tots") params.set("visitat", f.visitat === "si" ? "true" : "false")
  params.set("ordre", f.ordre)
  params.set("ordre_dir", f.ordre_dir)
  return params.toString()
}

export default function App() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [filtres, setFiltres] = useState<Filtres>(FILTRES_INICIALS)
  const [opcions, setOpcions] = useState<Opcions>({ barris: [], ciutats: [], tipus_cuina: [], persones: [] })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editant, setEditant] = useState<Restaurant | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchRestaurants = useCallback(async (f: Filtres) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/restaurants?${buildQuery(f)}`)
      const data = await res.json()
      setRestaurants(data)
    } catch {
      toast.error("Error en carregar els restaurants")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchOpcions = useCallback(async () => {
    try {
      const res = await fetch("/api/opcions")
      const data = await res.json()
      setOpcions(data)
    } catch {
      // silenci
    }
  }, [])

  useEffect(() => {
    fetchOpcions()
  }, [fetchOpcions])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchRestaurants(filtres), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [filtres, fetchRestaurants])

  async function handleSave(data: RestaurantCreate) {
    if (editant) {
      const res = await fetch(`/api/restaurants/${editant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      toast.success("Restaurant actualitzat!")
    } else {
      const res = await fetch("/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      toast.success("Restaurant afegit!")
    }
    setEditant(null)
    fetchRestaurants(filtres)
    fetchOpcions()
  }

  async function handleDelete(id: number) {
    if (!confirm("Vols eliminar aquest restaurant?")) return
    const res = await fetch(`/api/restaurants/${id}`, { method: "DELETE" })
    if (!res.ok) {
      toast.error("Error en eliminar")
      return
    }
    toast.success("Restaurant eliminat")
    fetchRestaurants(filtres)
    fetchOpcions()
  }

  function handleEdit(r: Restaurant) {
    setEditant(r)
    setDialogOpen(true)
  }

  function handleOpenAdd() {
    setEditant(null)
    setDialogOpen(true)
  }

  return (
    <TooltipProvider>
      <Toaster richColors position="bottom-right" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <UtensilsCrossed className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-foreground text-lg leading-none">
                SomDeMenjar
              </h1>
              <p className="text-muted-foreground text-xs">La meva col·lecció personal</p>
            </div>
          </div>

          <Button onClick={handleOpenAdd} size="sm" className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Afegir restaurant</span>
            <span className="sm:hidden">Afegir</span>
          </Button>
        </div>
      </header>

      {/* Layout principal */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filtres */}
          <FiltresCerca
            filtres={filtres}
            onChange={setFiltres}
            opcions={opcions}
            total={restaurants.length}
          />

          {/* Llista de restaurants */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Carregant...
              </div>
            ) : restaurants.length === 0 ? (
              <div className="text-center py-20 space-y-3">
                <UtensilsCrossed className="h-12 w-12 mx-auto text-muted-foreground/40" />
                <p className="text-muted-foreground text-lg font-medium">
                  Cap restaurant trobat
                </p>
                <p className="text-muted-foreground text-sm">
                  Prova de canviar els filtres o afegeix el primer restaurant.
                </p>
                <Button onClick={handleOpenAdd} variant="outline" className="mt-2 gap-2">
                  <Plus className="h-4 w-4" />
                  Afegir restaurant
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {restaurants.map((r) => (
                  <RestaurantCard
                    key={r.id}
                    restaurant={r}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Diàleg afegir/editar */}
      <AfegirRestaurant
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setEditant(null)
        }}
        onSave={handleSave}
        initial={editant}
        persones={opcions.persones}
      />
    </TooltipProvider>
  )
}
