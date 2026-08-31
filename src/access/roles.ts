import type { Access, PayloadRequest } from 'payload'

export function isAdminUser(user: PayloadRequest['user'] | null | undefined): boolean {
  return Boolean(user && 'collection' in user && user.collection === 'users')
}

export const adminOnly: Access = ({ req }) => isAdminUser(req.user)

export const adminOrSelfCustomer: Access = ({ req }) => {
  if (isAdminUser(req.user)) return true
  if (req.user?.collection === 'customers') {
    return { id: { equals: req.user.id } }
  }
  return false
}
