import Maybe from "./Maybe";

export default class List<T> {
  constructor(private x: T[]) {}

  map<U = T>(fn: (x: T) => U): List<U> {
    return new List(this.x.map(fn));
  }

  chain<U = T>(fn: (x: T) => List<U>): List<U> {
    return new List(
      this.x.flatMap(
        (x: T): U[] => fn(x).extract()
      )
    );
  }

  fold<U>(fn: (accum: U) => (x: T) => U) {
    return (startVal: U): U =>
      this.x.reduce(
        (accum: U, x: T) => fn(accum)(x),
        startVal
      );
  }

  extract(): T[] {
    return this.x;
  }

  head(): Maybe<T> {
    return Maybe.fromNullable(this.x[0]);
  }

  tail(): List<T> {
    return new List(this.x.slice(1));
  }

  static of<T>(x: T) {
    return new List([x]);
  }

  static fromArray<T>(x: T[]): List<T> {
    return new List(x);
  }
}
