export function isValidObjectId(id: string): boolean {
  return /^[a-f0-9]{24}$/i.test(id)
}
