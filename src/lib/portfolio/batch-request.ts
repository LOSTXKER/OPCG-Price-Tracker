const BATCH_SCOPE_SEPARATOR = "\u0000"

export function createScopedPortfolioBatchKey(
  requestScopeId: string | undefined,
  payloadKey: string,
): string {
  return `${requestScopeId ?? "legacy"}${BATCH_SCOPE_SEPARATOR}${payloadKey}`
}

export function clearPortfolioBatchRequestScope(
  requestIds: Map<string, string>,
  requestScopeId: string,
): void {
  const prefix = `${requestScopeId}${BATCH_SCOPE_SEPARATOR}`
  for (const key of requestIds.keys()) {
    if (key.startsWith(prefix)) requestIds.delete(key)
  }
}
