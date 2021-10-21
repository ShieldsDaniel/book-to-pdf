import Maybe from "./Maybe";
import Result from "./Result";

export default class Task<T> {
  constructor(
    public fork: (rej: (e: Error) => void, res: (x: T) => void) => void
  ) {}

  map<U = T>(fn: (x: T) => U): Task<U> {
    return new Task<U>((rej, res) => this.fork(rej, x => res(fn(x))));
  }

  chain<U = T>(fn: (x: T) => Task<U>): Task<U> {
    return new Task<U>((rej, res) => this.fork(rej, x => fn(x).fork(rej, res)));
  }

  fold<U = T>(f: (e: Error) => Task<U>, g: (x: T) => Task<U>): Task<U> {
    return new Task<U>((rej, res) => this.fork(e => f(e).fork(rej, res), x => g(x).fork(rej, res)));
  }

  static alt<T>(other: Task<T>) {
    return (y: Task<T>): Task<T> =>
      y.fold(_e => other, x => Task.resolve(x))
  }

  static ap<T, U = T>(other: Task<T>) {
    return (y: Task<(x: T) => U>): Task<U> =>
      other.chain(val => y.map(fn => fn(val)))
  }

  static of<T>(x: T): Task<T> {
    return new Task((_rej, res) => res(x));
  }

  static resolve<T>(x: T): Task<T> {
    return new Task((_rej, res) => res(x));
  }

  static reject(e: Error): Task<never> {
    return new Task((rej, _res) => rej(e));
  }

  static fromNullable<T>(x: T | null | undefined): Task<T> {
    if (x == null || typeof x === "undefined") {
      return Task.reject(new Error("Was null"));
    }
    return Task.resolve(x);
  }

  static tryCatch<T>(fn: () => T): Task<T> {
    try {
      return Task.resolve(fn());
    } catch (e) {
      return Task.reject(e as Error);
    }
  }

  static sequence<T>(xs: Task<T>[]): Task<T[]> {
    return xs.reduce(
      (accum, x) => accum.chain(accumData => x.map(xData => [...accumData, xData])),
      Task.resolve([] as T[]) 
    );
  }

  static encaseIO<T>(fn: () => T): Task<T> {
    return new Task((_rej, res) => res(fn()));
  }

  static fromPromise<T>(fn: () => Promise<T>): Task<T> {
    return new Task((rej, res) => fn().then(res).catch(rej));
  }

  static toPromise<T>(task: Task<T>): Promise<T> {
    return new Promise((res, rej) => {
      task.fork(rej, res);
    });
  }

  static fromNode<T = void>(fn: (done: (err: NodeJS.ErrnoException | null | undefined, value?: T | undefined) => void) => void): Task<T> {
    return new Task<T>((rej, res) =>
      fn((err, value) => {
        if (err) {
          return rej(err);
        } else if (value) {
          return res(value);
        }
      })
    );
  }

  static fromMaybe<T>(m: Maybe<T>): Task<T> {
    return m.fold(
      () => Task.reject(new Error("Maybe was Nothing")),
      x => Task.resolve(x)
    );
  }

  static fromResult<T>(r: Result<T>): Task<T> {
    return r.fold(
      e => Task.reject(e),
      x => Task.resolve(x)
    );
  }
}
