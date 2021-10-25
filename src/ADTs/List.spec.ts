import List from "./List";
import assert from "assert";
import { stringify } from "querystring";
import Maybe from "./Maybe";

const deepStrictEqual = (actual: any, expected: any) => {
  try {
    assert.deepStrictEqual(actual, expected);
    return true;
  } catch {
    return false
  }
};

const testVal = [3, 4, 5];
const f = (x: number) => x * 2;
const g = (x: number) => x + 1;
const h = (x: number) => List.fromArray([x * 2, x * 3]);
const i = (x: number) => List.fromArray([x + 1, x + 2]);
const id = <T>(x: T): T => x;

describe("The List Monad", () => {

  describe("The Functor laws", () => {

    it("Should preserve the 1st Functor law: Functors must preserve identity morphisms `fmap id = id`", () => {
      const list = List.fromArray(testVal);
      const mapped = list.map(id);
      expect(deepStrictEqual(list, mapped)).toBe(true);
    });
    
    it("Should preserve the 2nd Functor law: Functors preserve composition of morphisms `fmap (f . g) == fmap f . fmap g`", () => {
      const composition = (x: number) => g(f(x));
      const list = List.fromArray(testVal);
      const mapComps = list.map(composition);
      const compMaps = list.map(f).map(g);
      expect(deepStrictEqual(mapComps, compMaps)).toBe(true);
    });
  });

  describe("The Monadic laws", () => {

    it("Should preserve the 1st Monadic law: Left Identity `return a >>= h == h a`", () => {
      const chained = List.of(testVal[0]).chain(h);
      const hResult = h(testVal[0]);
      expect(deepStrictEqual(chained, hResult)).toBe(true);
    });

    it("Should preserve the 2nd Monadic law: Right Identity `m >>= return == m`", () => {
      const list = List.fromArray(testVal);
      const chained = list.chain(List.of);
      expect(deepStrictEqual(chained, list)).toBe(true);
    });

    it("Should preserve the 3rd Monadic law: Associativity `(m >>= g) >>= h == m >>= (\\x -> g x >>= h)`", () => {
      const list = List.fromArray(testVal);
      const assoc1 = list.chain(h).chain(i);
      const assoc2 = list.chain((x) => h(x).chain(i));
      expect(deepStrictEqual(assoc1, assoc2)).toBe(true);
    });
  });

  describe("The fold() method", () => {

    it("Should fold a `List` of numbers into a single number (the sum)", () => {
      const list = List.fromArray(testVal);
      const sum = testVal.reduce((accum, x) => accum + x);
      const add = (a: number) => (b: number): number => a + b;
      const result = list.fold(add)(0);
      expect(result).toEqual(sum);
    });

    it("Should fold a `List` of strings into an object of keys of the original strings and values of the length", () => {
      const lens = {
        one: 3,
        three: 5,
        five: 4,
      };
      const list = List.fromArray(Object.keys(lens));
      const getLens = (lenList: Record<string, number>) => (str: string): Record<string, number> =>
        ({ ...lenList, [str]: str.length });
      const result = list.fold(getLens)({});
      expect(result).toEqual(lens);
    });
  });

  describe("The head() method", () => {

    it("Should return a `Maybe.Nothing` if the `List` is empty", () => {
      const list = List.fromArray([]);
      const head = list.head();
      expect(head).toBeInstanceOf(Maybe);
      expect(head.isNothing()).toBe(true);
    });

    it("Should return a `Maybe.Just` of the first element of the `List`", () => {
      const list = List.fromArray(testVal);
      const head = list.head();
      expect(head).toBeInstanceOf(Maybe);
      expect(head.isJust()).toBe(true);
      expect(head.fold(() => 0, id)).toEqual(testVal[0]);
    });
  });

  describe("The tail() method", () => {

    it("Should return an empty `List` if the provided `List` is empty", () => {
      const list = List.fromArray([]);
      const tail = list.tail();
      expect(tail).toBeInstanceOf(List);
      expect(tail.extract()).toHaveLength(0);
    });

    it("Should return a `List` of all but the first element of the provided `List`", () => {
      const list = List.fromArray(testVal);
      const tail = list.tail();
      expect(tail).toBeInstanceOf(List);
      expect(tail.extract()).toHaveLength(testVal.length - 1);
    });
  });
});
