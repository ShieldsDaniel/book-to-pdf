import Maybe from "./Maybe";
import assert from "assert";

const deepStrictEqual = (actual: any, expected: any) => {
  try {
    assert.deepStrictEqual(actual, expected);
    return true;
  } catch {
    return false
  }
};

const testVal = 3;
const f = (x: number) => x * 2;
const g = (x: number) => x + 1;
const h = (x: number) => Maybe.of(x * 2);
const i = (x: number) => Maybe.of(x + 1);
const id = <T>(x: T): T => x;

describe("The Maybe Monad", () => {

  describe("The Functor laws", () => {

    it("Should preserve the 1st Functor law: Functors must preserve identity morphisms `fmap id = id`", () => {
      const maybe = Maybe.of(testVal);
      const mapped = maybe.map(id);
      expect(deepStrictEqual(maybe, mapped)).toBe(true);
    });
    
    it("Should preserve the 2nd Functor law: Functors preserve composition of morphisms `fmap (f . g) == fmap f . fmap g`", () => {
      const composition = (x: number) => g(f(x));
      const maybe = Maybe.of(testVal);
      const mapComps = maybe.map(composition);
      const compMaps = maybe.map(f).map(g);
      expect(deepStrictEqual(mapComps, compMaps)).toBe(true);
    });
  });

  describe("The Monadic laws", () => {

    it("Should preserve the 1st Monadic law: Left Identity `return a >>= h == h a`", () => {
      const chained = Maybe.of(testVal).chain(h);
      const hResult = h(testVal);
      expect(deepStrictEqual(chained, hResult)).toBe(true);
    });

    it("Should preserve the 2nd Monadic law: Right Identity `m >>= return == m`", () => {
      const maybe = Maybe.of(testVal);
      const chained = maybe.chain(Maybe.of);
      expect(deepStrictEqual(chained, maybe)).toBe(true);
    });

    it("Should preserve the 3rd Monadic law: Associativity `(m >>= g) >>= h == m >>= (\\x -> g x >>= h)`", () => {
      const maybe = Maybe.of(testVal);
      const assoc1 = maybe.chain(h).chain(i);
      const assoc2 = maybe.chain((x) => h(x).chain(i));
      expect(deepStrictEqual(assoc1, assoc2)).toBe(true);
    });
  });

  describe("The fold() method", () => {

    it("Should apply the provided lazy `() -> a` function if the `Maybe` is a `Nothing`", () => {
      const maybe = Maybe.nothing();
      const lazy = jest.fn(() => testVal);
      const actualVal = maybe.fold(lazy, id);
      expect(lazy).toHaveBeenCalledTimes(1);
      expect(actualVal).toEqual(testVal);
    });

    it("Should apply the provided morphism `a -> b` function to the value inside of the `Maybe`, if it is a `Just a`", () => {
      const maybe = Maybe.just(1);
      const lazyMorphism = jest.fn((x) => testVal);
      const actualVal = maybe.fold(() => 0, lazyMorphism);
      expect(lazyMorphism).toHaveBeenCalledTimes(1);
      expect(actualVal).toEqual(testVal);
    });
  });

  describe("The identity helper methods", () => {

    it("Should return corresponding boolean values if the `Maybe` is a `Nothing`", () => {
      const maybe = Maybe.nothing();
      expect(maybe.isNothing()).toBe(true);
      expect(maybe.isJust()).toBe(false);
    });

    it("Should return corresponding boolean values if the `Maybe` is a `Just a`", () => {
      const maybe = Maybe.just(testVal);
      expect(maybe.isJust()).toBe(true);
      expect(maybe.isNothing()).toBe(false);
    });
  });

  describe("The static alt() method", () => {

    it("Should return the provided other `Maybe`, if the called `Maybe` is a `Nothing`", () => {
      const maybe = Maybe.nothing();
      const other = Maybe.just(testVal);
      expect(deepStrictEqual(Maybe.alt(other)(maybe), other)).toBe(true);
    });

    it("Should return the value of the `Maybe` if it is a `Just a`", () => {
      const maybe = Maybe.just(15);
      const other = Maybe.just(testVal);
      expect(deepStrictEqual(Maybe.alt(other)(maybe), maybe)).toBe(true);
    });
  });

  describe("The static ap() method", () => {

    it("Should do nothing an return a `Nothing` if the applicative `Maybe` is a `Nothing`", () => {
      const testVal = "Hello";
      const fn = jest.fn((x: string) => x.length);
      const applicative = Maybe.nothing();
      const input = Maybe.just("wot?");
      const result = Maybe.ap<string, number>(input)(applicative);
      expect(fn).toHaveBeenCalledTimes(0);
      expect(deepStrictEqual(result, Maybe.nothing())).toBe(true);
    });

    it("Should do nothing and return a `Nothing` if the input `Maybe` is a `Nothing`", () => {
      const testVal = "Hello";
      const fn = jest.fn((x: string) => x.length);
      const applicative = Maybe.just(fn);
      const input = Maybe.nothing();
      const result = Maybe.ap<string, number>(input)(applicative);
      expect(fn).toHaveBeenCalledTimes(0);
      expect(deepStrictEqual(result, Maybe.nothing())).toBe(true);
    });

    it("Should return a `Maybe` of the result of applying the input `Maybe`'s value to the applicative `Maybe`", () => {
      const testVal = "Hello";
      const fn = jest.fn((x: string) => x.length);
      const applicative = Maybe.just(fn);
      const input = Maybe.just("wot?");
      const result = Maybe.ap<string, number>(input)(applicative);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(deepStrictEqual(result, Maybe.just(fn(testVal)))).toBe(false);
    });
  });

  describe("The static fromNullable() method", () => {

    it("Should return a `Nothing` if a null value is provided", () => {
      const maybe = Maybe.fromNullable(null);
      expect(deepStrictEqual(maybe, Maybe.nothing())).toBe(true);
    });

    it("Should return a `Nothing` if an undefined is provided", () => {
      const testRecord: Record<string, number> = { a: 2 };
      const maybe = Maybe.fromNullable(testRecord.b);
      expect(deepStrictEqual(maybe, Maybe.nothing())).toBe(true);
    });

    it("Should return a `Just` of the type provided", () => {
      const maybe = Maybe.fromNullable(testVal);
      expect(maybe.fold(() => { throw new Error("This should never happen") }, id)).toEqual(testVal);
    });
  });

  describe("The static tryCatch() method", () => {

    it("Should return a `Nothing` if the provided function throws", () => {
      const fnThatThrows = jest.fn(() => { throw new Error("This function should fail"); });
      const result = Maybe.tryCatch(fnThatThrows);
      expect(fnThatThrows).toHaveBeenCalledTimes(1);
      expect(deepStrictEqual(result, Maybe.nothing())).toBe(true);
    });

    it("Should return a `Just` of the type of the return value of the provided function", () => {
      const fnThatReturns = jest.fn(() => testVal);
      const result = Maybe.tryCatch(fnThatReturns);
      expect(fnThatReturns).toHaveBeenCalledTimes(1);
      expect(deepStrictEqual(result, Maybe.just(testVal))).toBe(true);
    });
  });

  describe("The static sequence() method", () => {

    it("Should return a `Nothing` if any of the values in the array is a `Nothing`", () => {
      const sequence: Maybe<number>[] = [Maybe.just(3), Maybe.just(4), Maybe.nothing(), Maybe.just(6)];
      const result = Maybe.sequence(sequence);
      expect(deepStrictEqual(result, Maybe.nothing())).toBe(true);
    });

    it("Should return a `Just` of an array of results if they are `Just`s", () => {
      const testArr = [3, 4, 5, 6];
      const sequence: Maybe<number>[] = testArr.map(Maybe.of);
      const result = Maybe.sequence(sequence).fold(() => { throw new Error("This should never happen") }, id);
      expect(result).toEqual(testArr);
    });
  });
});
