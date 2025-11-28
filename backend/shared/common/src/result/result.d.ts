/**
 * Result<E, A> - Tipo funcional para manejo de errores
 * Inspirado en Rust Result<T, E> y Functional Programming
 */
export type Result<E, A> = {
    readonly _tag: 'ok';
    readonly value: A;
} | {
    readonly _tag: 'error';
    readonly error: E;
};
export declare const Result: {
    ok: <A>(value: A) => Result<never, A>;
    error: <E>(error: E) => Result<E, never>;
    isOk: <E, A>(result: Result<E, A>) => result is {
        _tag: "ok";
        value: A;
    };
    isError: <E, A>(result: Result<E, A>) => result is {
        _tag: "error";
        error: E;
    };
    map: <E, A, B>(result: Result<E, A>, fn: (a: A) => B) => Result<E, B>;
    mapError: <E, F, A>(result: Result<E, A>, fn: (e: E) => F) => Result<F, A>;
    flatMap: <E, A, B>(result: Result<E, A>, fn: (a: A) => Result<E, B>) => Result<E, B>;
    unwrap: <E, A>(result: Result<E, A>) => A;
    unwrapOr: <E, A>(result: Result<E, A>, defaultValue: A) => A;
};
//# sourceMappingURL=result.d.ts.map