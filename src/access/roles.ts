import type { Access, PayloadRequest } from 'payload'

export function isAdminUser(user: PayloadRequest['user'] | null | undefined): boolean {
  if (!user) return false
  const collection = (user as { collection?: string }).collection
  if (collection === 'customers') return false
  return collection === 'users' || collection == null
}

export const adminOnly: Access = ({ req }) => isAdminUser(req.user)

export const adminOrSelfCustomer: Access = ({ req }) => {
  if (isAdminUser(req.user)) return true
  if (req.user?.collection === 'customers') {
    return { id: { equals: req.user.id } }
  }
  return false
}
