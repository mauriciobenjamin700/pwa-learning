export default class ApiError extends Error {
  status_code: number;
  detail: string;

  constructor(status_code: number, detail: string) {
    super(detail);
    this.status_code = status_code;
    this.detail = detail;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export class BadRequestError extends ApiError {
  constructor(detail = "Requisição inválida") {
    super(400, detail);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(detail = "Não autenticado") {
    super(401, detail);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends ApiError {
  constructor(detail = "Acesso negado") {
    super(403, detail);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class NotFoundError extends ApiError {
  constructor(detail = "Recurso não encontrado") {
    super(404, detail);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends ApiError {
  constructor(detail = "Conflito") {
    super(409, detail);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class UnprocessableEntityError extends ApiError {
  constructor(detail = "Erro de validação") {
    super(422, detail);
    Object.setPrototypeOf(this, UnprocessableEntityError.prototype);
  }
}

export class InternalServerError extends ApiError {
  constructor(detail = "Erro interno do servidor") {
    super(500, detail);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}
