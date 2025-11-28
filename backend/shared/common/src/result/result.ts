/**
 * Result<E, A> - Tipo funcional para manejo de errores
 * Inspirado en Rust Result<T, E> y Functional Programming
 */
export type Result<E, A> = 
  | { readonly _tag: 'ok'; readonly value: A }
  | { readonly _tag: 'error'; readonly error: E };

export const Result = {
  ok: <A, E = never>(value: A): Result<E, A> => ({ _tag: 'ok', value }),
  error: <E, A = never>(error: E): Result<E, A> => ({ _tag: 'error', error }),
  
  isOk: <E, A>(result: Result<E, A>): result is { _tag: 'ok'; value: A } => 
    result._tag === 'ok',
  
  isError: <E, A>(result: Result<E, A>): result is { _tag: 'error'; error: E } => 
    result._tag === 'error',
  
  map: <E, A, B>(result: Result<E, A>, fn: (a: A) => B): Result<E, B> => {
    if (Result.isOk(result)) {
      return Result.ok(fn(result.value));
    }
    // Si es error, retornamos con el mismo tipo de error
    return result as Result<E, B>;
  },
  
  mapError: <E, F, A>(result: Result<E, A>, fn: (e: E) => F): Result<F, A> => {
    if (Result.isError(result)) {
      return Result.error(fn(result.error));
    }
    // Si es ok, retornamos con el nuevo tipo de error
    return result as Result<F, A>;
  },
  
  flatMap: <E, A, B>(result: Result<E, A>, fn: (a: A) => Result<E, B>): Result<E, B> => {
    if (Result.isOk(result)) {
      return fn(result.value);
    }
    // Si es error, retornamos con el mismo tipo de error pero nuevo tipo de value
    return result as Result<E, B>;
  },
  
  unwrap: <E, A>(result: Result<E, A>): A => {
    if (Result.isOk(result)) {
      return result.value;
    }
    // TypeScript ahora sabe que es error
    const errorResult = result as { _tag: 'error'; error: E };
    throw new Error(`Unwrapped error: ${errorResult.error}`);
  },
  
  unwrapOr: <E, A>(result: Result<E, A>, defaultValue: A): A =>
    Result.isOk(result) ? result.value : defaultValue,
};

