// src/lib/geocoding.ts

export async function geocodeAddress(adreca: string, ciutat: string = 'Barcelona'): Promise<[number, number] | null> {
  try {
    const query = encodeURIComponent(`${adreca}, ${ciutat}`)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
      {
        headers: {
          'User-Agent': 'SomDeMenjar App (test@test.com)'
        }
      }
    )
    
    const data = await response.json()
    
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)]
    }
    
    return null
  } catch (error) {
    console.error('Error geocodificant:', error)
    return null
  }
}