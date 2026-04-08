import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import type { Restaurant } from '../types'
import { geocodeAddress } from '../lib/geocoding'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

interface Props {
  restaurants: Restaurant[]
}

export default function MapaRestaurants({ restaurants }: Props) {
  const [coords, setCoords] = useState<{ [id: string]: [number, number] }>({})
  const [carregant, setCarregant] = useState(true)

  useEffect(() => {
    async function carregarCoords() {
      setCarregant(true)
      const novesCoords: { [id: string]: [number, number] } = {}
      
      for (const r of restaurants) {
        if (r.adreca && r.ciutat) {
          const coord = await geocodeAddress(r.adreca, r.ciutat)
          if (coord) {
            novesCoords[r.id] = coord
          }
        }
      }
      
      setCoords(novesCoords)
      setCarregant(false)
    }
    
    carregarCoords()
  }, [restaurants])

  const defaultPosition: [number, number] = [41.3851, 2.1734]
  const restaurantsAmbCoords = restaurants.filter(r => coords[r.id])

  if (carregant) {
    return (
      <div className="h-[500px] w-full rounded-lg border flex items-center justify-center">
        <p className="text-gray-500">Carregant mapa...</p>
      </div>
    )
  }

  return (
    <div className="h-[500px] w-full rounded-lg overflow-hidden border">
      <MapContainer 
        center={defaultPosition} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {restaurantsAmbCoords.map(r => (
          <Marker 
            key={r.id} 
            position={coords[r.id]}
            icon={icon}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold">{r.nom}</h3>
                <p className="text-sm text-gray-600">{r.tipus_cuina}</p>
                {r.puntuacio && (
                  <p className="text-sm">⭐ {r.puntuacio}/10</p>
                )}
                <p className="text-xs text-gray-500 mt-1">{r.adreca}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}