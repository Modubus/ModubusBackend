export interface Place {
  display_name: string
  lat: number
  lon: number
  address: {
    road?: string
    city?: string
    state?: string
    country?: string
  }
}
