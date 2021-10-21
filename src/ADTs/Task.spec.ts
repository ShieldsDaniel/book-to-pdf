import { writeFileSync, unlink, readFile } from "fs";
import Maybe from "./Maybe";
import Result from "./Result";
import Task from "./Task";

const testVal = 3;
const testError = new Error("test");
const f = (x: number) => x * 2;
const g = (x: number) => x + 1;
const h = (x: number) => Task.of(x * 2);
const i = (x: number) => Task.of(x + 1);
const id = <T>(x: T): T => x;

const compareResultOf2Tasks = <T>(task1: Task<T>, task2: Task<T>, done?: jest.DoneCallback): void =>
  task1.fork(
    callbackThatShouldNotHappen,
    task1X => {
      task2.fork(
        callbackThatShouldNotHappen,
        task2X => {
          expect(task1X).toEqual(task2X);
          if (done) {
            done();
          }
        }
      )
    }
  );


const callbackThatShouldNotHappen = (_e: any): never => { throw new Error("This should never happen") };

describe("The Task Monad", () => {
  describe("The Functor laws", () => {

    it("Should preserve the 1st Functor law: Functors must preserve identity morphisms `fmap id = id`", done => {
      const task = Task.of(testVal);
      const mapped = task.map(id);
      compareResultOf2Tasks(task, mapped, done)
    });
    
    it("Should preserve the 2nd Functor law: Functors preserve composition of morphisms `fmap (f . g) == fmap f . fmap g`", done => {
      const composition = (x: number) => g(f(x));
      const task = Task.of(testVal);
      const mapComps = task.map(composition);
      const compMaps = task.map(f).map(g);
      compareResultOf2Tasks(mapComps, compMaps, done);
    });
  });

  describe("The Monadic laws", () => {

    it("Should preserve the 1st Monadic law: Left Identity `return a >>= h == h a`", done => {
      const chained = Task.of(testVal).chain(h);
      const hResult = h(testVal);
      compareResultOf2Tasks(chained, hResult, done);
    });

    it("Should preserve the 2nd Monadic law: Right Identity `m >>= return == m`", done => {
      const task = Task.of(testVal);
      const chained = task.chain(Task.of);
      compareResultOf2Tasks(task, chained, done);
    });

    it("Should preserve the 3rd Monadic law: Associativity `(m >>= g) >>= h == m >>= (\\x -> g x >>= h)`", done => {
      const task = Task.of(testVal);
      const assoc1 = task.chain(h).chain(i);
      const assoc2 = task.chain((x) => h(x).chain(i));
      compareResultOf2Tasks(assoc1, assoc2, done);
    });
  });

  describe("The static alt() method", () => {

    it("Should return the provided other `Task`, if the called `Task` is a Rejected `Task`", done => {
      const rejected = Task.reject(testError);
      const other = Task.resolve(testVal);
      const task = Task.alt(other)(rejected);
      compareResultOf2Tasks(task, other, done);
    });

    it("Should return the value of the `Task` if it is a resolved `Task a`", done => {
      const resolved = Task.resolve(15);
      const other = Task.resolve(testVal);
      const task = Task.alt(other)(resolved);
      compareResultOf2Tasks(task, resolved, done);
    });
  });

  describe("The static ap() method", () => {

    it("Should do err an return a Rejected `Task` if the applicative `Task` is a Rejected `Task`", done => {
      const testVal = "Hello";
      const fn = jest.fn((x: string) => x.length);
      const applicative = Task.reject(testError);
      const input = Task.resolve("wot?");
      const task = Task.ap<string, number>(input)(applicative);
      expect(fn).toHaveBeenCalledTimes(0);
      task.fork(
        e => {
          expect(e).toBeInstanceOf(Error);
          done();
        },
        callbackThatShouldNotHappen
      );
    });

    it("Should do err and return a Rejected `Task` if the input `Task` is a Rejected `Task`", done => {
      const testVal = "Hello";
      const fn = jest.fn((x: string) => x.length);
      const applicative = Task.resolve(fn);
      const input = Task.reject(testError);
      const task = Task.ap<string, number>(input)(applicative);
      expect(fn).toHaveBeenCalledTimes(0);
      task.fork(
        e => {
          expect(e).toBeInstanceOf(Error);
          done();
        },
        callbackThatShouldNotHappen
      );
    });

    it("Should return a `Task` of the result of applying the input `Task`'s value to the applicative `Task`", done => {
      const testVal = "Hello";
      const fn = jest.fn((x: string) => x.length);
      const applicative = Task.resolve(fn);
      const input = Task.resolve(testVal);
      const task = Task.ap<string, number>(input)(applicative);
      task.fork(
        callbackThatShouldNotHappen,
        x => {
          expect(fn).toHaveBeenCalledTimes(1);
          expect(x).toEqual(fn(testVal));
          done();
        }
      )
    });
  });

  describe("The static fromNullable() method", () => {

    it("Should return a Rejected `Task` if a null value is provided", done => {
      const task = Task.fromNullable(null);
      task.fork(
        e => {
          expect(e).toBeInstanceOf(Error);
          done();
        },
        callbackThatShouldNotHappen
      );
    });

    it("Should return a Rejected `Task` if an undefined is provided", done => {
      const testRecord: Record<string, number> = { a: 2 };
      const task = Task.fromNullable(testRecord.b);
      task.fork(
        e => {
          expect(e).toBeInstanceOf(Error);
          done();
        },
        callbackThatShouldNotHappen
      );
    });

    it("Should return a resolved `Task` of the type provided", done => {
      const task = Task.fromNullable(testVal);
      task.fork(
        callbackThatShouldNotHappen,
        x => {
          expect(x).toEqual(testVal);
          done();
        }
      );
    });
  });

  describe("The static tryCatch() method", () => {

    it("Should return a Rejected `Task` if the provided function throws", done => {
      const fnThatThrows = jest.fn(() => { throw testError; });
      const task = Task.tryCatch(fnThatThrows);
      task.fork(
        e => {
          expect(e).toBeInstanceOf(Error);
          expect(fnThatThrows).toHaveBeenCalledTimes(1);
          done();
        },
        callbackThatShouldNotHappen
      )
    });

    it("Should return a resolved `Task` of the type of the return value of the provided function", done => {
      const fnThatReturns = jest.fn(() => testVal);
      const task = Task.tryCatch(fnThatReturns);
      task.fork(
        callbackThatShouldNotHappen,
        x => {
          expect(x).toEqual(testVal);
          expect(fnThatReturns).toHaveBeenCalledTimes(1);
          done();
        }
      )
    });
  });

  describe("The static sequence() method", () => {

    it("Should return a Rejected `Task` if any of the values in the array is a Rejected `Task`", done => {
      const sequence: Task<number>[] = [Task.resolve(3), Task.resolve(4), Task.reject(testError), Task.resolve(6)];
      const task = Task.sequence(sequence);
      task.fork(
        e => {
          expect(e).toBeInstanceOf(Error);
          done();
        },
        callbackThatShouldNotHappen
      );
    });

    it("Should return a resolved `Task` of an array of results if they are resolved `Task`s", done => {
      const testArr = [3, 4, 5, 6];
      const sequence: Task<number>[] = testArr.map(Task.of);
      const task = Task.sequence(sequence);
      task.fork(
        callbackThatShouldNotHappen,
        x => {
          expect(x).toEqual(testArr);
          done();
        }
      )
    });
  });

  describe("The static encaseIO method", () => {

    it("Should return a task that encases an IO function", done => {
      let val: null | number = null;
      const task = Task.encaseIO(() => {
        val = testVal;
      });
      expect(val).toBe(null);
      task.fork(
        callbackThatShouldNotHappen,
        _x => {
          expect(val).toEqual(testVal);
          done();
        }
      );
    });
  });

  describe("The static fromPromise() method", () => {

    it("Should return a `Task` that rejects of the provided function that returns a `Promise` that rejects", done => {
      const task = Task.fromPromise(() => Promise.reject(testError));
      task.fork(
        e => {
          expect(e).toBeInstanceOf(Error);
          expect(e.message).toEqual(testError.message);
          done();
        },
        callbackThatShouldNotHappen
      );
    });

    it("Should return a `Task` that resolves of the provided function that returns a `Promise` that resolves", done => {
      const task = Task.fromPromise(() => Promise.resolve(testVal));
      task.fork(
        callbackThatShouldNotHappen,
        x => {
          expect(x).toEqual(testVal);
          done();
        }
      );
    });
  });

  describe("The static toPromise() method", () => {

    it("Should turn the provided `Task` that rejects into a `Promise` that rejects", done => {
      const task = new Task(
        (rej, _res) => {
          rej(testError);
        }
      );
      const promise = Task.toPromise(task);
      promise.catch(e => {
        expect(e).toBeInstanceOf(Error);
        expect(e.message).toEqual(testError.message);
        done();
      });
    });

    it("Should turn the provided `Task` that resolves into a `Promise` that resolves", done => {
      const task = new Task(
        (_rej, res) => {
          res(testVal);
        }
      );
      const promise = Task.toPromise(task);
      promise.then(x => {
        expect(x).toEqual(testVal);
        done();
      });
    });
  });

  describe("The static fromNode() method", () => {

    it("Should turn the provided node callback function into a `Task` of the function", done => {
      const testJson = { this: "is", a: "test" };
      writeFileSync("test.json", JSON.stringify(testJson));
      const task = Task.fromNode<string>(fnDone => {
        readFile("test.json", { encoding: "utf-8" }, fnDone)
      });
      task.fork(
        callbackThatShouldNotHappen,
        x => {
          expect(JSON.parse(x)).toEqual(testJson);
          unlink("test.json", (_err) => {
            done();
          })
        }
      )
    });
  });

  describe("The static fromMaybe() method", () => {

    it("Should turn a `Maybe.Nothing` into a `Task` that rejects", done => {
      const maybe = Maybe.nothing();
      const task = Task.fromMaybe(maybe);
      task.fork(
        e => {
          expect(e).toBeInstanceOf(Error);
          done();
        },
        callbackThatShouldNotHappen
      );
    });

    it("Should turn a `Maybe.Just` into a `Task` that resolves", done => {
      const maybe = Maybe.just(testVal);
      const task = Task.fromMaybe(maybe);
      task.fork(
        callbackThatShouldNotHappen,
        x => {
          expect(x).toEqual(testVal);
          done();
        }
      );
    });
  });
 
  describe("The static fromResult() method", () => {

    it("Should turn a `Result.Err` into a `Task` that rejects", done => {
      const result = Result.err(testError);
      const task = Task.fromResult(result);
      task.fork(
        e => {
          expect(e).toBeInstanceOf(Error);
          expect(e.message).toEqual(testError.message);
          done();
        },
        callbackThatShouldNotHappen
      );
    });

    it("Should turn a `Result.Ok` into a `Task` that resolves", done => {
      const result = Result.ok(testVal);
      const task = Task.fromResult(result);
      task.fork(
        callbackThatShouldNotHappen,
        x => {
          expect(x).toEqual(testVal);
          done();
        }
      );
    });
  }); 
});
