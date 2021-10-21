export default abstract class Maybe<T> {
  constructor(protected x: T) { }

  abstract map<U = T>(fn: (x: T) => U): Maybe<U>; 
  abstract chain<U = T>(fn: (x: T) => Maybe<U>): Maybe<U>;
  abstract fold<U = T>(f: () => U, g: (x: T) => U): U;
  abstract isJust(): boolean;
  abstract isNothing(): boolean;
  
  static alt<T>(other: Maybe<T>) {
    return (y: Maybe<T>): Maybe<T> =>
      y.fold(() => other, _x => y);
  }

  static ap<T, U = T>(other: Maybe<T>) {
    return (y: Maybe<(x: T) => U>): Maybe<U> =>
      other.chain(val => y.map(fn => fn(val)));
  }

  static of<T>(x: T): Maybe<T> {
    return new Just(x);
  }

  static just<T>(x: T): Maybe<T> {
    return new Just(x);
  }

  static nothing(): Maybe<never> {
    return new Nothing();
  }

  static fromNullable<T>(x: T | null | undefined): Maybe<T> {
    if (x == null || typeof x === "undefined") {
      return Maybe.nothing();
    }
    return Maybe.just(x);
  }

  static tryCatch<T>(fn: () => T): Maybe<T> {
    try {
      return Maybe.just(fn());
    } catch {
      return Maybe.nothing();
    }
  }

  static sequence<T>(xs: Maybe<T>[]): Maybe<T[]> {
    return xs.reduce(
      (accum, x) => accum.chain(accumData => x.map(xData => [...accumData, xData])),
      Maybe.just([] as T[])
    );
  }
}

class Nothing extends Maybe<never> {
  constructor() {
    super(null as never);
  }

  map(_fn: (x: never) => never): Maybe<never> {
    return Maybe.nothing();
  }

  chain(_fn: (x: never) => Maybe<never>): Maybe<never> {
    return Maybe.nothing();
  }

  fold<U>(f: () => U, _g: (x: never) => U): U {
    return f();
  }

  isNothing(): boolean {
    return true;
  }

  isJust(): boolean {
    return false;
  }
}

class Just<T> extends Maybe<T> {
  constructor(x: T) {
    super(x);
  }

  map<U = T>(fn: (x: T) => U): Maybe<U> {
    return Maybe.just(fn(this.x));
  }

  chain<U = T>(fn: (x: T) => Maybe<U>): Maybe<U> {
    return fn(this.x);
  }

  fold<U = T>(_f: () => U, g: (x: T) => U): U {
    return g(this.x);
  }

  isNothing(): boolean {
    return false;
  }

  isJust(): boolean {
    return true;
  }
}
