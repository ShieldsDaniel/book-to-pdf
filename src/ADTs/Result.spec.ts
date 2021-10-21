import Result from "./Result";
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
const testError = new Error("test");
const f = (x: number) => x * 2;
const g = (x: number) => x + 1;
const h = (x: number) => Result.of(x * 2);
const i = (x: number) => Result.of(x + 1);
const id = <T>(x: T): T => x;

describe("The Result Monad", () => {

  describe("The Functor laws", () => {

    it("Should preserve the 1st Functor law: Functors must preserve identity morphisms `fmap id = id`", () => {
      const result = Result.of(testVal);
      const mapped = result.map(id);
      expect(deepStrictEqual(result, mapped)).toBe(true);
    });
    
    it("Should preserve the 2nd Functor law: Functors preserve composition of morphisms `fmap (f . g) == fmap f . fmap g`", () => {
      const composition = (x: number) => g(f(x));
      const result = Result.of(testVal);
      const mapComps = result.map(composition);
      const compMaps = result.map(f).map(g);
      expect(deepStrictEqual(mapComps, compMaps)).toBe(true);
    });
  });

  describe("The Monadic laws", () => {

    it("Should preserve the 1st Monadic law: Left Identity `return a >>= h == h a`", () => {
      const chained = Result.of(testVal).chain(h);
      const hResult = h(testVal);
      expect(deepStrictEqual(chained, hResult)).toBe(true);
    });

    it("Should preserve the 2nd Monadic law: Right Identity `m >>= return == m`", () => {
      const result = Result.of(testVal);
      const chained = result.chain(Result.of);
      expect(deepStrictEqual(chained, result)).toBe(true);
    });

    it("Should preserve the 3rd Monadic law: Associativity `(m >>= g) >>= h == m >>= (\\x -> g x >>= h)`", () => {
      const result = Result.of(testVal);
      const assoc1 = result.chain(h).chain(i);
      const assoc2 = result.chain((x) => h(x).chain(i));
      expect(deepStrictEqual(assoc1, assoc2)).toBe(true);
    });
  });

  describe("The fold() method", () => {

    it("Should apply the provided lazy `() -> a` function if the `Result` is a `Err`", () => {
      const result = Result.err(testError);
      const lazy = jest.fn(() => testVal);
      const actualVal = result.fold(lazy, id);
      expect(lazy).toHaveBeenCalledTimes(1);
      expect(actualVal).toEqual(testVal);
    });

    it("Should apply the provided morphism `a -> b` function to the value inside of the `Result`, if it is a `Ok a`", () => {
      const result = Result.ok(1);
      const lazyMorphism = jest.fn((x) => testVal);
      const actualVal = result.fold(() => 0, lazyMorphism);
      expect(lazyMorphism).toHaveBeenCalledTimes(1);
      expect(actualVal).toEqual(testVal);
    });
  });

  describe("The identity helper methods", () => {

    it("Should return corresponding boolean values if the `Result` is a `Err`", () => {
      const result = Result.err(testError);
      expect(result.isErr()).toBe(true);
      expect(result.isOk()).toBe(false);
    });

    it("Should return corresponding boolean values if the `Result` is a `Ok a`", () => {
      const result = Result.ok(testVal);
      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
    });
  });

  describe("The static alt() method", () => {

    it("Should return the provided other `Result`, if the called `Result` is a `Err`", () => {
      const result = Result.err(testError);
      const other = Result.ok(testVal);
      expect(deepStrictEqual(Result.alt(other)(result), other)).toBe(true);
    });

    it("Should return the value of the `Result` if it is a `Ok a`", () => {
      const result = Result.ok(15);
      const other = Result.ok(testVal);
      expect(deepStrictEqual(Result.alt(other)(result), result)).toBe(true);
    });
  });

  describe("The static ap() method", () => {

    it("Should do err an return a `Err` if the applicative `Result` is a `Err`", () => {
      const testVal = "Hello";
      const fn = jest.fn((x: string) => x.length);
      const applicative = Result.err(testError);
      const input = Result.ok("wot?");
      const result = Result.ap<string, number>(input)(applicative);
      expect(fn).toHaveBeenCalledTimes(0);
      expect(deepStrictEqual(result, Result.err(testError))).toBe(true);
    });

    it("Should do err and return a `Err` if the input `Result` is a `Err`", () => {
      const testVal = "Hello";
      const fn = jest.fn((x: string) => x.length);
      const applicative = Result.ok(fn);
      const input = Result.err(testError);
      const result = Result.ap<string, number>(input)(applicative);
      expect(fn).toHaveBeenCalledTimes(0);
      expect(deepStrictEqual(result, Result.err(testError))).toBe(true);
    });

    it("Should return a `Result` of the result of applying the input `Result`'s value to the applicative `Result`", () => {
      const testVal = "Hello";
      const fn = jest.fn((x: string) => x.length);
      const applicative = Result.ok(fn);
      const input = Result.ok("wot?");
      const result = Result.ap<string, number>(input)(applicative);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(deepStrictEqual(result, Result.ok(fn(testVal)))).toBe(false);
    });
  });

  describe("The static fromNullable() method", () => {

    it("Should return a `Err` if a null value is provided", () => {
      const result = Result.fromNullable(null);
      expect(result.isErr()).toBe(true);
    });

    it("Should return a `Err` if an undefined is provided", () => {
      const testRecord: Record<string, number> = { a: 2 };
      const result = Result.fromNullable(testRecord.b);
      expect(result.isErr()).toBe(true);
    });

    it("Should return a `Ok` of the type provided", () => {
      const result = Result.fromNullable(testVal);
      expect(result.fold(() => { throw new Error("This should never happen") }, id)).toEqual(testVal);
    });
  });

  describe("The static tryCatch() method", () => {

    it("Should return a `Err` if the provided function throws", () => {
      const fnThatThrows = jest.fn(() => { throw testError; });
      const result = Result.tryCatch(fnThatThrows);
      expect(fnThatThrows).toHaveBeenCalledTimes(1);
      expect(deepStrictEqual(result, Result.err(testError))).toBe(true);
    });

    it("Should return a `Ok` of the type of the return value of the provided function", () => {
      const fnThatReturns = jest.fn(() => testVal);
      const result = Result.tryCatch(fnThatReturns);
      expect(fnThatReturns).toHaveBeenCalledTimes(1);
      expect(deepStrictEqual(result, Result.ok(testVal))).toBe(true);
    });
  });

  describe("The static sequence() method", () => {

    it("Should return a `Err` if any of the values in the array is a `Err`", () => {
      const sequence: Result<number>[] = [Result.ok(3), Result.ok(4), Result.err(testError), Result.ok(6)];
      const result = Result.sequence(sequence);
      expect(deepStrictEqual(result, Result.err(testError))).toBe(true);
    });

    it("Should return a `Ok` of an array of results if they are `Ok`s", () => {
      const testArr = [3, 4, 5, 6];
      const sequence: Result<number>[] = testArr.map(Result.of);
      const result = Result.sequence(sequence).fold(() => { throw new Error("This should never happen") }, id);
      expect(result).toEqual(testArr);
    });
  });
});

