class Err {
  constructor(private error: Error) { }

  map(fn: (error: never) => never): Result<never> {
    return new Err(this.error);
  }

  chain(fn: (x: never) => Result<never>): Result<never> {
    return new Err(this.error);
  }

  fold<U>(f: (error: Error) => U, g: (x: never) => U): U {
    return f(this.error);
  }
}

class Ok<T> {
  constructor(private x: T) { }

  map<U = T>(fn: (x: T) => U): Result<U> {
    return new Ok(fn(this.x));
  }

  chain<U = T>(fn: (x: T) => Result<U>): Result<U> {
    return fn(this.x);
  }

  fold<U = T>(f: () => U, g: (x: T) => U): U {
    return g(this.x);
  }
}

export type Result<T> = Ok<T> | Err;

export const ok = <T>(x: T): Result<T> => new Ok(x);

export const err = (error: Error): Result<never> => new Err(error);

export const fromNullable = <T>(x: T | null | undefined): Result<T> => {
  if (x == null || typeof x === "undefined") {
    return new Err(new Error("Value was null"));
  }
  return new Ok(x);
};

export const tryCatch = <T>(fn: () => T): Result<T> => {
  try {
    return new Ok(fn());
  } catch(e) {
    return new Err(e as Error);
  }
}
