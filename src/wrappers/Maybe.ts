import * as O from "fp-ts/Option";

interface Nothing extends O.None {}
interface Just<T> extends O.Some<T> {}

export type Maybe<T> = Nothing | Just<T>;

export const Maybe = {

    /** `nothing :: Maybe Never` */
    nothing: O.none as Maybe<never>,

    /** `just :: a -> Maybe a` */
    just: <A>(a: A): Maybe<A> => O.some(a),

    /** `of:: a -> Maybe a` */
    of: <A>(a: A): Maybe<A> => O.some(a),

    /** `chain :: (a -> Maybe b) -> Maybe a -> Maybe b` */
    chain: 
        <A, B = A>(f: (a: A) => Maybe<B>) =>
        (maybe: Maybe<A>): Maybe<B> =>
            O.chain(f)(maybe),

    /** `map :: (a -> b) -> Maybe a -> Maybe b` */
    map: 
        <A, B = A>(f: (a: A) => B) =>
        (io: Maybe<A>): Maybe<B> =>
            O.map(f)(io),

    /** `map2 :: (a -> b -> c) -> Maybe a -> Maybe b -> Maybe c` */
    map2: 
        <A, B = A, C = A>(fn: (a: A) => (b: B) => C) =>
            (m1: Maybe<A>) =>
                (m2: Maybe<B>): Maybe<C> =>
                    Maybe.chain<A, C>(
                        a => Maybe.map<B, C>(
                            b => fn(a)(b)
                        )(m2)
                    )(m1),

    /**
     * `map3
     *      :: (a -> b -> c -> d) 
     *      -> Maybe a 
     *      -> Maybe b 
     *      -> Maybe c 
     *      -> Maybe d`
     */
    map3: 
        <A, B = A, C = A, D = A>(fn: (a: A) => (b: B) => (c: C) => D) =>
            (m1: Maybe<A>) =>
                (m2: Maybe<B>) =>
                    (m3: Maybe<C>): Maybe<D> =>
                        Maybe.chain<A, D>(
                            a => Maybe.chain<B, D>(
                                b => Maybe.map<C, D>(
                                    c => fn(a)(b)(c)
                                )(m3)
                            )(m2)
                        )(m1),

    /**
     * `map4
     *      :: (a -> b -> c -> d -> e) 
     *      -> Maybe a 
     *      -> Maybe b 
     *      -> Maybe c 
     *      -> Maybe d 
     *      -> Maybe e`
     */
    map4: 
        <
            A,
            B = A,
            C = A,
            D = A,
            E = A
        >(fn: (a: A) => (b: B) => (c: C) => (d: D) => E) =>
            (m1: Maybe<A>) =>
                (m2: Maybe<B>) =>
                    (m3: Maybe<C>) =>
                        (m4: Maybe<D>): Maybe<E> =>
                            Maybe.chain<A, E>(
                                a => Maybe.chain<B, E>(
                                    b => Maybe.chain<C, E>(
                                        c => Maybe.map<D, E>(
                                            d => fn(a)(b)(c)(d)
                                        )(m4)
                                    )(m3)
                                )(m2)
                            )(m1),

    /**
     * `map5
     *      :: (a -> b -> c -> d -> e -> f) 
     *      -> Maybe a 
     *      -> Maybe b 
     *      -> Maybe c 
     *      -> Maybe d 
     *      -> Maybe e 
     *      -> Maybe f`
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
            (m1: Maybe<A>) =>
                (m2: Maybe<B>) =>
                    (m3: Maybe<C>) =>
                        (m4: Maybe<D>) =>
                            (m5: Maybe<E>): Maybe<F> =>
                                Maybe.chain<A, F>(
                                    a => Maybe.chain<B, F>(
                                        b => Maybe.chain<C, F>(
                                            c => Maybe.chain<D, F>(
                                                d => Maybe.map<E, F>(
                                                    e => fn(a)(b)(c)(d)(e)
                                                )(m5)
                                            )(m4)
                                        )(m3)
                                    )(m2)
                                )(m1),
    
    /** `getOrElse :: (() -> a) -> Maybe a -> a` */
    getOrElse: 
        <A>(onNothing: () => A) =>
        (maybe: Maybe<A>): A =>
            O.getOrElse(onNothing)(maybe),

    /** `withDefault :: a -> Maybe a -> a` */
    withDefault: 
        <A>(a: A) => (maybe: Maybe<A>): A =>
            Maybe.getOrElse(() => a)(maybe),

    /** `fold :: (() -> b) -> (a -> b) -> Maybe a -> b` */
    fold: 
        <A, B = A>(onNothing: () => B, onJust: (a: A) => B) =>
        (maybe: Maybe<A>): B =>
            O.fold(onNothing, onJust)(maybe),
                
    /** fromNullable :: a | Nil | Undefined -> Maybe a */
    fromNullable:  <A>(a: A | undefined | null): Maybe<A> =>
        (a === null || typeof a === "undefined")
            ? Maybe.nothing
            : Maybe.just(a),

    /** `tryCatch :: (() -> a) -> Maybe a` */
    tryCatch: <A>(f: () => A): Maybe<A> => {
        try {
            return Maybe.just(f());
        } catch {
            return Maybe.nothing;
        }
    },

    /** `sequence :: [Maybe a] -> Maybe [a]` */
    sequence:  <A>(maybes: readonly Maybe<A>[]): Maybe<readonly A[]> =>
        O.sequenceArray(maybes),

};
