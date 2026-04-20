/**
 * Tipos de erro da Platform API.
 *
 * Mantidos pequenos e sem dependência de framework. Clients e route
 * handlers devem falar a mesma linguagem para que o admin separado
 * no futuro consiga interpretar erros de forma previsível.
 */

export type PlatformErrorCode =
  | "not_found"
  | "invalid_input"
  | "conflict"
  | "unsupported"
  | "unauthorized"
  | "forbidden"
  | "internal"

export interface PlatformErrorBody {
  error: {
    code: PlatformErrorCode
    message: string
    /** Detalhes livres: campo inválido, id inexistente, etc. */
    details?: Record<string, unknown>
  }
}

export class PlatformError extends Error {
  readonly code: PlatformErrorCode
  readonly status: number
  readonly details?: Record<string, unknown>

  constructor(
    code: PlatformErrorCode,
    message: string,
    status?: number,
    details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = "PlatformError"
    this.code = code
    this.status = status ?? statusForCode(code)
    this.details = details
  }

  toBody(): PlatformErrorBody {
    return {
      error: { code: this.code, message: this.message, details: this.details },
    }
  }
}

export function statusForCode(code: PlatformErrorCode): number {
  switch (code) {
    case "not_found":
      return 404
    case "invalid_input":
      return 400
    case "conflict":
      return 409
    case "unsupported":
      return 422
    case "unauthorized":
      return 401
    case "forbidden":
      return 403
    case "internal":
    default:
      return 500
  }
}
