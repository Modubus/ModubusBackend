// dto/address.dto.ts
export class AddressDTO {
  road?: string
  city?: string
  state?: string
  country?: string

  constructor(road: string, city: string, state: string, country: string) {
    this.road = road || ''
    this.city = city || ''
    this.state = state || ''
    this.country = country || ''
  }
}
