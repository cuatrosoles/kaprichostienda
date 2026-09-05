import type { StoreSetting } from '@/payload-types'

export type FulfillmentOption = {
  id: string
  name: string
  cost: number
  eta: string
}

export const STORE_PICKUP_ID = 'store_pickup'
export const OWN_MESSENGER_ID = 'own_messenger'

export function isFreeFulfillment(id?: string | null) {
  return id === STORE_PICKUP_ID || id === OWN_MESSENGER_ID
}

export function localFulfillmentOptions(settings?: StoreSetting | null): FulfillmentOption[] {
  const options: FulfillmentOption[] = []
  if (settings?.storePickupEnabled !== false) {
    options.push({
      id: STORE_PICKUP_ID,
      name: String(settings?.storePickupName || 'Retirar en la tienda'),
      cost: 0,
      eta: String(settings?.storePickupEta || 'Cuando te avisemos que está listo'),
    })
  }
  if (settings?.ownMessengerEnabled !== false) {
    options.push({
      id: OWN_MESSENGER_ID,
      name: String(settings?.ownMessengerName || 'Usar mensajero de mi confianza'),
      cost: 0,
      eta: String(settings?.ownMessengerEta || 'A coordinar'),
    })
  }
  return options
}
