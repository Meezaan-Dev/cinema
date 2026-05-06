export function parsePositiveIntegerParam(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) return null

  const numeric = Number(value)
  return Number.isSafeInteger(numeric) && numeric > 0 ? numeric : null
}
