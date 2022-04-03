import * as T from "fp-ts/TaskEither";
import { Task } from "./Task";
import { Result } from "./Result";

export type TaskResult<T> = Task<Result<T>>;

/** `rejectionHandler :: String | Error -> Error` */
export const rejectionHandler = 
  (e: unknown) => (e instanceof Error) ? e : new Error("unknown error");

export const TaskResult = {

    /** `reject :: Error -> Task (Result Error Never)` */
    reject:
        (e: Error): TaskResult<never> =>
            T.left(e),

    /** `resolve :: a -> Task (Result Error a)` */
    resolve:
        <A>(a: A): TaskResult<A> =>
            T.right(a),
    
    /** `of :: a -> Task (Result Error a)` */
    of: 
        <A>(a: A): TaskResult<A> =>
            T.right(a),

    /** 
     * `chain 
     *      :: (a -> Task (Result Error b)) 
     *      -> Task (Result Error a) 
     *      -> Task (Result Error b)` 
     */
    chain:
        <A, B = A>(f: (a: A) => TaskResult<B>) =>
        (task: TaskResult<A>): TaskResult<B> =>
            T.chain(f)(task),

    /**
     * `map
     *      :: (a -> b) 
     *      -> Task (Result Error a) 
     *      -> Task (Result Error b)`
     */
    map:
        <A, B = A>(f: (a: A) => B) =>
        (task: TaskResult<A>): TaskResult<B> =>
            T.map(f)(task),
    
    /** 
     * `map2 
     *      :: (a -> b -> c) 
     *      -> Task (Result Error a) 
     *      -> Task (Result Error b) 
     *      -> Task (Result Error c)` 
     */
    map2:
    <A, B = A, C = A>(fn: (a: A) => (b: B) => C) =>
        (m1: TaskResult<A>) =>
            (m2: TaskResult<B>): TaskResult<C> =>
                TaskResult.chain<A, C>(
                    a => TaskResult.map<B, C>(
                        b => fn(a)(b)
                    )(m2)
                )(m1),

    /** 
     * `map3 
     *      :: (a -> b -> c -> d) 
     *      -> Task (Result Error a) 
     *      -> Task (Result Error b)    
     *      -> Task (Result Error c) 
     *      -> Task (Result Error d)` 
     */
    map3:
    <
        A,
        B = A, 
        C = A, 
        D = A
    >(fn: (a: A) => (b: B) => (c: C) => D) =>
        (m1: TaskResult<A>) =>
            (m2: TaskResult<B>) =>
                (m3: TaskResult<C>): TaskResult<D> =>
                    TaskResult.chain<A, D>(
                        a => TaskResult.chain<B, D>(
                            b => TaskResult.map<C, D>(
                                c => fn(a)(b)(c)
                            )(m3)
                        )(m2)
                    )(m1),

    /** 
     * `map4 
     *      :: (a -> b -> c -> d -> e) 
     *      -> Task (Result Error a) 
     *      -> Task (Result Error b) 
     *      -> Task (Result Error c) 
     *      -> Task (Result Error d) 
     *      -> Task (Result Error e)` 
     */
    map4:
    <
        A,
        B = A,
        C = A,
        D = A,
        E = A
    >(fn: (a: A) => (b: B) => (c: C) => (d: D) => E) =>
        (m1: TaskResult<A>) =>
            (m2: TaskResult<B>) =>
                (m3: TaskResult<C>) =>
                    (m4: TaskResult<D>): TaskResult<E> =>
                        TaskResult.chain<A, E>(
                            a => TaskResult.chain<B, E>(
                                b => TaskResult.chain<C, E>(
                                    c => TaskResult.map<D, E>(
                                        d => fn(a)(b)(c)(d)
                                    )(m4)
                                )(m3)
                            )(m2)
                        )(m1),

    /** 
     * `map5 
     *      :: (a -> b -> c -> d -> e -> f) 
     *      -> Task (Result Error a) 
     *      -> Task (Result Error b) 
     *      -> Task (Result Error c) 
     *      -> Task (Result Error d) 
     *      -> Task (Result Error e) 
     *      -> Task (Result Error f)` 
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
        (m1: TaskResult<A>) =>
            (m2: TaskResult<B>) =>
                (m3: TaskResult<C>) =>
                    (m4: TaskResult<D>) =>
                        (m5: TaskResult<E>): TaskResult<F> =>
                            TaskResult.chain<A, F>(
                                a => TaskResult.chain<B, F>(
                                    b => TaskResult.chain<C, F>(
                                        c => TaskResult.chain<D, F>(
                                            d => TaskResult.map<E, F>(
                                                e => fn(a)(b)(c)(d)(e)
                                            )(m5)
                                        )(m4)
                                    )(m3)
                                )(m2)
                            )(m1),
    
    /** `fromNullable :: a | Null | Undefined -> Task (Result Error a)` */
    fromNullable:
        <A>(a: A | null | undefined): TaskResult<A> =>
            (a === null || typeof a === "undefined")
                ? TaskResult.reject(new Error("Value was null or undefined"))
                : TaskResult.resolve(a),

    /** `tryCatch :: (() -> Promise a) -> Task (Result Error a)` */
    tryCatch: 
        <T>(fn: () => Promise<T>): TaskResult<T> =>
            T.tryCatch(fn, rejectionHandler),
    
    /** `sequence :: [Task (Result Error a)] -> Task (Result Error [a])` */
    sequence:
        <A>(tasks: readonly TaskResult<A>[]): TaskResult<readonly A[]> =>
            T.sequenceSeqArray(tasks),

}
