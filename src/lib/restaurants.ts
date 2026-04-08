import { supabase } from './supabase'
import type { Restaurant } from '../types'

// Obtenir tots els restaurants
export async function getRestaurants() {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as Restaurant[]
}

// Afegir nou restaurant
export async function addRestaurant(restaurant: Omit<Restaurant, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('restaurants')
    .insert([restaurant])
    .select()
  
  if (error) throw error
  return data[0] as Restaurant
}

// Actualitzar restaurant
export async function updateRestaurant(id: string, updates: Partial<Restaurant>) {
  const { data, error } = await supabase
    .from('restaurants')
    .update(updates)
    .eq('id', id)
    .select()
  
  if (error) throw error
  return data[0] as Restaurant
}

// Eliminar restaurant
export async function deleteRestaurant(id: string) {
  const { error } = await supabase
    .from('restaurants')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}
