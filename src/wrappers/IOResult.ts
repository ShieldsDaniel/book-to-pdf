import { Result } from "./Result";
import { IO } from "./IO";
import * as I from "fp-ts/IOEither";

export interface IOResult<T> extends IO<Result<T>> {}

export const IOResult = {

    /** `succeed :: a -> IO (Result Error Error a)` */
    succeed:
        <A>(a: A): IOResult<A> =>
            I.right(a),

    /** `of:: a -> IO (Result a)` */
    of: 
        <A>(a: A): IOResult<A> =>
            I.right(a),

    /** `fail :: Error -> IO (Result Never)` */
    fail:
        (e: Error): IOResult<never> =>
            I.left(e),

    /** 
     * `chain
     *      :: (a -> IO (Result b))
     *      -> IO (Result a)
     *      -> IO (Result b)`
     */
    chain:
        <A, B = A>(f: (a: A) => IOResult<B>) =>
        (io: IOResult<A>): IOResult<B> =>
            I.chain(f)(io),

    /**
     * `map
     *      :: (a -> b)
     *      -> IO (Result a)
     *      -> IO (Result b)`
     */
    map:
        <A, B = A>(f: (a: A) => B) =>
        (io: IOResult<A>): IOResult<B> =>
            I.map(f)(io),

    /**
     * `map2
     *      :: (a -> b -> c)
     *      -> IO (Result a)
     *      -> IO (Result b)
     *      -> IO c`
     */
    map2:
        <A, B = A, C = A>(fn: (a: A) => (b: B) => C) =>
            (m1: IOResult<A>) =>
                (m2: IOResult<B>): IOResult<C> =>
                    IOResult.chain<A, C>(
                        a => IOResult.map<B, C>(
                            b => fn(a)(b)
                        )(m2)
                    )(m1),

    /**
     * `map3
     *      :: (a -> b -> c -> d)
     *      -> IO (Result a)
     *      -> IO (Result b)
     *      -> IO (Result c)
     *      -> IO d`
     */
    map3:
        <A, B = A, C = A, D = A>(fn: (a: A) => (b: B) => (c: C) => D) =>
            (m1: IOResult<A>) =>
                (m2: IOResult<B>) =>
                    (m3: IOResult<C>): IOResult<D> =>
                        IOResult.chain<A, D>(
                            a => IOResult.chain<B, D>(
                                b => IOResult.map<C, D>(
                                    c => fn(a)(b)(c)
                                )(m3)
                            )(m2)
                        )(m1),

    /**
     * `map4
     *      :: (a -> b -> c -> d -> e) 
     *      -> IO (Result a) 
     *      -> IO (Result b) 
     *      -> IO (Result c) 
     *      -> IO (Result d) 
     *      -> IO e`
     */
    map4:
        <
            A,
            B = A,
            C = A,
            D = A,
            E = A
        >(fn: (a: A) => (b: B) => (c: C) => (d: D) => E) =>
            (m1: IOResult<A>) =>
                (m2: IOResult<B>) =>
                    (m3: IOResult<C>) =>
                        (m4: IOResult<D>): IOResult<E> =>
                            IOResult.chain<A, E>(
                                a => IOResult.chain<B, E>(
                                    b => IOResult.chain<C, E>(
                                        c => IOResult.map<D, E>(
                                            d => fn(a)(b)(c)(d)
                                        )(m4)
                                    )(m3)
                                )(m2)
                            )(m1),

    /**
     * `map5
     *      :: (a -> b -> c -> d -> e -> f)
     *      -> IO (Result a)
     *      -> IO (Result b) 
     *      -> IO (Result c) 
     *      -> IO (Result d) 
     *      -> IO (Result e) 
     *      -> IO f`
     */
    map5:
        <
            A,
            B = A,
            C = A,
            D = A,
            E = A,
            F = A
        >(fn: (a: A) => (b: B) => (c: C) => (d: D) => (e: E) => F) =>
            (m1: IOResult<A>) =>
                (m2: IOResult<B>) =>
                    (m3: IOResult<C>) =>
                        (m4: IOResult<D>) =>
                            (m5: IOResult<E>): IOResult<F> =>
                                IOResult.chain<A, F>(
                                    a => IOResult.chain<B, F>(
                                        b => IOResult.chain<C, F>(
                                            c => IOResult.chain<D, F>(
                                                d => IOResult.map<E, F>(
                                                    e => fn(a)(b)(c)(d)(e)
                                                )(m5)
                                            )(m4)
                                        )(m3)
                                    )(m2)
                                )(m1),

    /** `fold :: (Error -> b) -> (a -> b) -> IO (Result a) -> IO b` */
    fold: 
        <A, B = A>(onErr: (e: Error) => IO<B>, onOk: (a: A) => IO<B>) =>
        (io: IOResult<A>): IO<B> =>
            I.fold(onErr, onOk)(io),
    
    /** `fromNullable :: a | Null | Undefined -> IO (Result Error a)` */
    fromNullable:
        <A>(a: A | null | undefined): IOResult<A> =>
            (a === null || typeof a === "undefined")
                ? IOResult.fail(new Error("Value was null or undefined"))
                : IOResult.succeed(a),

    /** `tryCatch :: (() -> a) -> IO (Result Error a)` */
    tryCatch: 
        <T>(f: () => T): IOResult<T> => {
            try {
                return IOResult.succeed(f());
            } catch (e) {
                if (e instanceof Error) {
                    return IOResult.fail(e);
                }
                return IOResult.fail(new Error("Unknown error"));
            }
        },

    /** `sequence :: [IO a] -> IO [a]` */
    sequence:
        <A>(ios: readonly IOResult<A>[]): IOResult<readonly A[]> =>
            I.sequenceArray(ios),
    
}
