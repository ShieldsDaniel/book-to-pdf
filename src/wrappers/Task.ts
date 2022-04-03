import * as T from "fp-ts/Task";

export type Task<A> = T.Task<A>;

export const Task = {

    ...T, 

    /** `of :: a -> Task a` */
    of: <A>(a: A): Task<A> =>
        T.of(a),

    /** `chain :: (a -> Task b) -> Task a -> Task b` */
    chain:
        <A, B = A>(f: (a: A) => Task<B>) =>
        (task: Task<A>): Task<B> =>
            T.chain(f)(task),

    /** `map :: (a -> b) -> Task a -> Task b` */
    map:
        <A, B = A>(f: (a: A) => B) =>
        (task: Task<A>): Task<B> =>
            T.map(f)(task),

    /** `map2 :: (a -> b -> c) -> IO a -> IO b -> IO c` */
    map2:
        <A, B = A, C = A>(fn: (a: A) => (b: B) => C) =>
            (m1: Task<A>) =>
                (m2: Task<B>): Task<C> =>
                    Task.chain<A, C>(
                        a => Task.map<B, C>(
                            b => fn(a)(b)
                        )(m2)
                    )(m1),

    /** `map3 :: (a -> b -> c -> d) -> IO a -> IO b -> IO c -> IO d` */
    map3:
        <A, B = A, C = A, D = A>(fn: (a: A) => (b: B) => (c: C) => D) =>
            (m1: Task<A>) =>
                (m2: Task<B>) =>
                    (m3: Task<C>): Task<D> =>
                        Task.chain<A, D>(
                            a => Task.chain<B, D>(
                                b => Task.map<C, D>(
                                    c => fn(a)(b)(c)
                                )(m3)
                            )(m2)
                        )(m1),

    /**
     * `map4
     *      :: (a -> b -> c -> d -> e) 
     *      -> IO a 
     *      -> IO b 
     *      -> IO c 
     *      -> IO d 
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
            (m1: Task<A>) =>
                (m2: Task<B>) =>
                    (m3: Task<C>) =>
                        (m4: Task<D>): Task<E> =>
                            Task.chain<A, E>(
                                a => Task.chain<B, E>(
                                    b => Task.chain<C, E>(
                                        c => Task.map<D, E>(
                                            d => fn(a)(b)(c)(d)
                                        )(m4)
                                    )(m3)
                                )(m2)
                            )(m1),

    /**
     * `map5
     *      :: (a -> b -> c -> d -> e -> f) 
     *      -> IO a 
     *      -> IO b 
     *      -> IO c 
     *      -> IO d 
     *      -> IO e 
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
            (m1: Task<A>) =>
                (m2: Task<B>) =>
                    (m3: Task<C>) =>
                        (m4: Task<D>) =>
                            (m5: Task<E>): Task<F> =>
                                Task.chain<A, F>(
                                    a => Task.chain<B, F>(
                                        b => Task.chain<C, F>(
                                            c => Task.chain<D, F>(
                                                d => Task.map<E, F>(
                                                    e => fn(a)(b)(c)(d)(e)
                                                )(m5)
                                            )(m4)
                                        )(m3)
                                    )(m2)
                                )(m1),
    
    /** `sequence :: [Task a] -> Task [a]` */
    sequence:
        <A>(tasks: readonly Task<A>[]): Task<readonly A[]> =>
            T.sequenceArray(tasks),

};
