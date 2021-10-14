import { Maybe } from "./Maybe";

export class Task<T> {
  constructor(
    public fork: (rej: (e: Error) => void, res: (x: T) => void) => void
  ) {}

  map<U = T>(fn: (x: T) => U): Task<U> {
    return new Task<U>((rej, res) => this.fork(rej, x => res(fn(x))));
  }

  chain<U = T>(fn: (x: T) => Task<U>): Task<U> {
    return new Task<U>((rej, res) => this.fork(rej, x => fn(x).fork(rej, res)));
  }

  fold<U = T>(f: (e: Error) => Task<never>, g: (x: T) => Task<U>): Task<U> {
    return new Task<U>((rej, res) => this.fork(e => f(e).fork(rej, res), x => g(x).fork(rej, res)));
  }
}

export const resolve = <T>(x: T): Task<T> => new Task((_rej, res) => res(x));

export const reject = (e: Error): Task<never> => new Task((rej, _res) => rej(e));

export const encaseIO = <T>(fn: () => T): Task<T> => new Task((_rej, res) => res(fn()));

export const fromNullable = <T>(x: T | null | undefined): Task<T> => {
  if (x == null || typeof x === "undefined") {
    return reject(new Error("Was null"));
  }
  return resolve(x);
};

export const fromMaybe = <T>(m: Maybe<T>): Task<T> =>
  m.fold(
    () => reject(new Error("Maybe was Nothing")),
    x => resolve(x)
  );

export const tryCatch = <T>(fn: () => T): Task<T> => {
  try {
    return resolve(fn());
  } catch (e) {
    return reject(e as Error);
  }
};

export const fromPromise = <T>(fn: () => Promise<T>): Task<T> =>
  new Task((rej, res) => fn().then(res).catch(rej));

export const toPromise = <T>(task: Task<T>): Promise<T> =>
  new Promise((res, rej) => {
    task.fork(rej, res);
  });

export const fromNode = <T = void>(fn: (done: (err: Error | null, value?: T) => void) => void): Task<T> =>
  new Task<T>((rej, res) =>
    fn((err, value) => {
      if (err) {
        return rej(err);
      } else if (value) {
        return res(value);
      }
    })
  );
