"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Result = void 0;
exports.Result = {
    ok: (value) => ({ _tag: 'ok', value }),
    error: (error) => ({ _tag: 'error', error }),
    isOk: (result) => result._tag === 'ok',
    isError: (result) => result._tag === 'error',
    map: (result, fn) => {
        if (exports.Result.isOk(result)) {
            return exports.Result.ok(fn(result.value));
        }
        // Si es error, retornamos con el mismo tipo de error
        return result;
    },
    mapError: (result, fn) => {
        if (exports.Result.isError(result)) {
            return exports.Result.error(fn(result.error));
        }
        // Si es ok, retornamos con el nuevo tipo de error
        return result;
    },
    flatMap: (result, fn) => {
        if (exports.Result.isOk(result)) {
            return fn(result.value);
        }
        // Si es error, retornamos con el mismo tipo de error pero nuevo tipo de value
        return result;
    },
    unwrap: (result) => {
        if (exports.Result.isOk(result)) {
            return result.value;
        }
        // TypeScript ahora sabe que es error
        const errorResult = result;
        throw new Error(`Unwrapped error: ${errorResult.error}`);
    },
    unwrapOr: (result, defaultValue) => exports.Result.isOk(result) ? result.value : defaultValue,
};
//# sourceMappingURL=result.js.map