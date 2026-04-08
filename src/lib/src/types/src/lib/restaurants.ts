import { supabase } from './supabase'
import type { Restaurant } from '../types/restaurant'

// Obtenir tots els restaurants
export async function getRestaurants() {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error:', error)
    throw error
  }
  
  return data as Restaurant[]
}

// Afegir nou restaurant
export async function addRestaurant(restaurant: Restaurant) {
  const { data, error } = await supabase
    .from('restaurants')
    .insert([restaurant])
    .select()
  
  if (error) {
    console.error('Error:', error)
    throw error
  }
  
  return data[0] as Restaurant
}