export default abstract class Result<T> {
  protected error!: Error;

  constructor(protected x: T) { }

  abstract map<U = T>(fn: (x: T) => U): Result<U>; 
  abstract chain<U = T>(fn: (x: T) => Result<U>): Result<U>;
  abstract fold<U = T>(f: (e: Error) => U, g: (x: T) => U): U;
  abstract isErr(): boolean;
  abstract isOk(): boolean;
  
  static alt<T>(other: Result<T>) {
    return (y: Result<T>): Result<T> =>
      y.fold(() => other, _x => y);
  }

  static ap<T, U = T>(x: Result<T>) {
    return (y: Result<(x: T) => U>): Result<U> =>
      x.chain(val => y.map(fn => fn(val)));
  }

  static of<T>(x: T): Result<T> {
    return new Ok(x);
  }

  static ok<T>(x: T): Result<T> {
    return new Ok(x);
  }

  static err(error: Error): Result<never> {
    return new Err(error);
  }

  static fromNullable<T>(x: T | null | undefined): Result<T> {
    if (x == null || typeof x === "undefined") {
      return Result.err(new Error("Value was null"));
    }
    return new Ok(x);
  }

  static tryCatch<T>(fn: () => T): Result<T> {
    try {
      return Result.ok(fn());
    } catch(e) {
      return Result.err(e as Error);
    }
  }

  static sequence<T>(xs: Result<T>[]): Result<T[]> {
    return xs.reduce(
      (accum, x) => accum.chain(accumData => x.map(xData => [...accumData, xData])),
      Result.ok([] as T[])
    );
  }
}

class Err extends Result<never> {
  constructor(error: Error) {
    super(null as never);
    this.error = error;
  }

  map(_fn: (error: never) => never): Result<never> {
    return Result.err(this.error);
  }

  chain(_fn: (x: never) => Result<never>): Result<never> {
    return Result.err(this.error);
  }

  fold<U>(f: (error: Error) => U, _g: (x: never) => U): U {
    return f(this.error);
  }

  alt<U>(other: Result<U>): Result<U> {
    return other;
  }

  isErr(): boolean {
    return true;
  }

  isOk(): boolean {
    return false;
  }
}

class Ok<T> extends Result<T> {
  constructor(x: T) {
    super(x);
  }

  map<U = T>(fn: (x: T) => U): Result<U> {
    return Result.ok(fn(this.x));
  }

  chain<U = T>(fn: (x: T) => Result<U>): Result<U> {
    return fn(this.x);
  }

  fold<U = T>(_f: (_error: Error) => U, g: (x: T) => U): U {
    return g(this.x);
  }

  alt(_other: Result<T>): Result<T> {
    return Result.ok(this.x);
  }

  isErr(): boolean {
    return false;
  }

  isOk(): boolean {
    return true;
  }
}
