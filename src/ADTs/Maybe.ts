class Nothing {
  map(fn: (x: never) => never): Maybe<never> {
    return new Nothing();
  }

  chain(fn: (x: never) => Maybe<never>): Maybe<never> {
    return new Nothing();
  }

  fold<U>(f: () => U, g: (x: never) => U): U {
    return f();
  }
}

class Just<T> {
  constructor(private x: T) { }

  map<U = T>(fn: (x: T) => U): Maybe<U> {
    return new Just(fn(this.x));
  }

  chain<U = T>(fn: (x: T) => Maybe<U>): Maybe<U> {
    return fn(this.x);
  }

  fold<U = T>(f: () => U, g: (x: T) => U): U {
    return g(this.x);
  }
}

export type Maybe<T> = Just<T> | Nothing;

export const just = <T>(x: T): Maybe<T> => new Just(x);

export const nothing = (): Maybe<never> => new Nothing();

export const fromNullable = <T>(x: T | null | undefined): Maybe<T> => {
  if (x == null || typeof x === "undefined") {
    return new Nothing();
  }
  return new Just(x);
};

export const tryCatch = <T>(fn: () => T): Maybe<T> => {
  try {
    return new Just(fn());
  } catch {
    return new Nothing();
  }
}
