import * as E from "fp-ts/Either";
import { Maybe } from "./Maybe";

type Err = E.Left<Error>;
type Ok<T> = E.Right<T>;

export type Result<T> = Err | Ok<T>;

export const Result = {

    /** `err :: Error -> Result Error Never` */
    err: (e: Error): Result<never> =>
        E.left(e),

    /** `ok :: a -> Result Error a` */
    ok: <T>(x: T): Result<T> =>
        E.right(x),

    /** `of :: a -> Result Error a` */
    of: <T>(x: T): Result<T> =>
        E.right(x),

    /** `isErr :: Result Error a -> boolean` */
    isErr: (result: Result<unknown>): boolean =>
        E.isLeft(result),

    /** `isOk :: Result Error Error a -> boolean` */
    isOk: <T>(result: Result<T>): boolean =>
        E.isRight(result),

    /** `chain :: (a -> Result Error b) -> Result Error a -> Result Error b` */
    chain:
        <A, B = A>(f: (a: A) => Result<B>) =>
        (result: Result<A>): Result<B> =>
            E.chain(f)(result),

    /** `map :: (a -> b) -> Result Error a -> Result Error b` */
    map:
        <A, B = A>(f: (a: A) => B) =>
        (result: Result<A>): Result<B> =>
            E.map(f)(result),

    /** `map2 :: (a -> b -> c) -> Result Error a -> Result Error b -> Result Error c` */
    map2:
    <A, B = A, C = A>(fn: (a: A) => (b: B) => C) =>
        (m1: Result<A>) =>
            (m2: Result<B>): Result<C> =>
                Result.chain<A, C>(
                    a => Result.map<B, C>(
                        b => fn(a)(b)
                    )(m2)
                )(m1),

    /** `map3 :: (a -> b -> c -> d) -> Result Error a -> Result Error b -> Result Error c -> Result Error d` */
    map3:
    <A, B = A, C = A, D = A>(fn: (a: A) => (b: B) => (c: C) => D) =>
        (m1: Result<A>) =>
            (m2: Result<B>) =>
                (m3: Result<C>): Result<D> =>
                    Result.chain<A, D>(
                        a => Result.chain<B, D>(
                            b => Result.map<C, D>(
                                c => fn(a)(b)(c)
                            )(m3)
                        )(m2)
                    )(m1),

    /** `map4 :: (a -> b -> c -> d -> e) -> Result Error a -> Result Error b -> Result Error c -> Result Error d -> Result Error e` */
    map4:
    <
        A,
        B = A,
        C = A,
        D = A,
        E = A
    >(fn: (a: A) => (b: B) => (c: C) => (d: D) => E) =>
        (m1: Result<A>) =>
            (m2: Result<B>) =>
                (m3: Result<C>) =>
                    (m4: Result<D>): Result<E> =>
                        Result.chain<A, E>(
                            a => Result.chain<B, E>(
                                b => Result.chain<C, E>(
                                    c => Result.map<D, E>(
                                        d => fn(a)(b)(c)(d)
                                    )(m4)
                                )(m3)
                            )(m2)
                        )(m1),

    /** `map5 :: (a -> b -> c -> d -> e -> f) -> Result Error a -> Result Error b -> Result Error c -> Result Error d -> Result Error e -> Result Error f` */
    map5:
    <
        A,
        B = A,
        C = A,
        D = A,
        E = A,
        F = A
    >(fn: (a: A) => (b: B) => (c: C) => (d: D) => (e: E) => F) =>
        (m1: Result<A>) =>
            (m2: Result<B>) =>
                (m3: Result<C>) =>
                    (m4: Result<D>) =>
                        (m5: Result<E>): Result<F> =>
                            Result.chain<A, F>(
                                a => Result.chain<B, F>(
                                    b => Result.chain<C, F>(
                                        c => Result.chain<D, F>(
                                            d => Result.map<E, F>(
                                                e => fn(a)(b)(c)(d)(e)
                                            )(m5)
                                        )(m4)
                                    )(m3)
                                )(m2)
                            )(m1),

    /** `fold :: (Error -> b) -> (a -> b) -> Result Error a -> b` */
    fold:
        <A, B = A>(onErr: (e: Error) => B, onOk: (a: A) => B) =>
        (result: Result<A>): B =>
            E.fold(onErr, onOk)(result),

    /** `getOrElse :: (Error -> a) -> Result Error a -> a` */
    getOrElse:
        <A>(onErr: (e: Error) => A) => 
        (result: Result<A>): A =>
            E.getOrElse(onErr)(result),

    /** `withDefault :: a -> Result Error a -> a` */
    withDefault:
        <A>(a: A) => (result: Result<A>): A =>
            Result.getOrElse(() => a)(result),

    /** `sequence :: [Result Error a] -> Result Error [a]` */
    sequence:
        <A>(results: readonly Result<A>[]): Result<readonly A[]> =>
            E.sequenceArray(results),

    /** `fromNullable :: a | Undefined | Nil -> Result Error a` */
    fromNullable: <A>(x: A | undefined | null): Result<A> =>
        (x === null || typeof x === "undefined")
            ? Result.err(new Error("Value was null or undefined"))
            : Result.ok(x),

    /** `tryCatch :: (() -> a) -> Result Error a` */
    tryCatch: <A>(fn: () => A): Result<A> => {
        try {
            return Result.ok(fn());
        } catch (e) {
            if (e instanceof Error) {
                return Result.err(e);
            }
            return Result.err(new Error("Unknown error"));
        }
    },

    /** `fromMaybe :: Maybe a -> Result Error a` */
    fromMaybe: <A>(maybe: Maybe<A>): Result<A> =>
        E.fromOption(() => new Error("Value was null or undefined"))(maybe),

};
