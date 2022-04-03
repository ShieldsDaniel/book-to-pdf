import PDFMerger from "pdf-merger-js";
import puppeteer from "puppeteer";
import { reduce as aReduce } from "fp-ts/lib/Array";
import { TaskResult } from "./wrappers/TaskResult";
import { IO } from "./wrappers/IO";
import { Maybe } from "./wrappers/Maybe";
import { Result } from "./wrappers/Result";
import { BookData, BookOptions, bookOptions } from "./bookOptions";
import { pipe } from "fp-ts/lib/function";

type AppState = {
  browser: puppeteer.Browser;
  page: puppeteer.Page;
  pdfMerger: PDFMerger;
  bookOptions: BookData;
  nextPageButton: Maybe<puppeteer.ElementHandle<Element>>;
};

/** `timestamp :: () -> IO String` */
const timestamp = (): IO<string> =>
  pipe(
    IO.of(new Date()),
    IO.map(x => x.toISOString()),
    IO.map(x => x.replace("T", " ")),
    IO.map(x => x.slice(10, 19)),
  );

/** `logProgress :: String -> a -> Task (Either Error a)` */
const logProgress = (logString: string) => <T>(passThrough: T): T =>
  pipe(
    timestamp(),
    IO.map(date => {console.log(`${date} - ${logString}`)}),
    _x => passThrough,
  );

/** `createAppState :: String -> Browser -> Page -> Task (Either Error AppState)` */
const createAppState =
  (bookToBuild: string) =>
  (browser: puppeteer.Browser) =>
  (page: puppeteer.Page): TaskResult<AppState> =>
    pipe(
      TaskResult.tryCatch(async () => {
          if (Object.keys(bookOptions).includes(bookToBuild)) {
            return bookToBuild as keyof BookOptions
          }
          throw new Error("Unknown book to build");
        },
      ),
      TaskResult.map(bookOptionKey => ({
        browser,
        page,
        pdfMerger: new PDFMerger(),
        bookOptions: bookOptions[bookOptionKey],
        nextPageButton: Maybe.nothing,
      }))
    );

/** `createBrowser :: Task (Either Error Browser)` */
const createBrowser: TaskResult<puppeteer.Browser> =
  TaskResult.tryCatch(() => puppeteer.launch());

/** `createPage :: Browser -> Task (Either Error Page)` */
const createPage = (browser: puppeteer.Browser): TaskResult<puppeteer.Page> =>
  TaskResult.tryCatch(() => browser.newPage());

/** `goToSite :: AppState -> Task (Either Error AppState)` */
const goToSite = (state: AppState): TaskResult<AppState> =>
  pipe(
    TaskResult.tryCatch(
      () => state.page.goto(state.bookOptions.startPage),
    ),
    TaskResult.map(_x => state)
  );

/** `createPdf :: AppState -> Task (Either Error AppState)` */
const createPdf = (state: AppState): TaskResult<AppState> =>
  pipe(
    TaskResult.tryCatch(
      () => state.page.pdf({
        format: "a4",
        path: `output/temp/temp.pdf`,
        margin: {
          left: "19mm",
          right: "19mm",
          top: "20mm",
          bottom: "20mm",
        }
      }),
    ),
    TaskResult.map(_x => state)
  );

/** `closeBrowser :: AppState -> Task (Either Error ())` */
const closeBrowser = (state: AppState): TaskResult<void> =>
  TaskResult.tryCatch(
    () => state.browser.close(),
  );

/** `mergeFile :: AppState -> Task (Either Error AppState)` */
const mergeFile = (state: AppState): TaskResult<AppState> =>
  pipe(
    TaskResult.of(state.pdfMerger.add("output/temp/temp.pdf")),
    TaskResult.map(_x => state)
  );

/** `saveMergedFile :: AppState -> Task (Either Error AppState)` */
const saveMergedFile = (state: AppState): TaskResult<AppState> =>
  pipe(
    TaskResult.tryCatch(
      () => state.pdfMerger.save(`output/books/${state.bookOptions.outputFilename}`),
    ),
    TaskResult.map(_x => state)
  );

/** `clickButton :: AppState -> Task (Either Error AppState)` */
function clickButton(state: AppState): TaskResult<AppState> {
  return pipe(
    state.nextPageButton,
    Maybe.fold(
      () => pipe(
        TaskResult.of(state),
        logProgress("No further next button found"),
      ),
      button =>
        pipe(
          TaskResult.tryCatch(
            () => Promise.all([button.click(), state.page.waitForNavigation()]),
          ),
          TaskResult.chain(_x => buildPagePdf(state))
        )
    )
  );
}

/** `reduceElements :: [ElementHandle Element] -> (ElementHandle Element -> (() -> Task (Either Error ()))) -> Task (Either Error ())` */
const reduceElements =
  (elements: puppeteer.ElementHandle<Element>[]) =>
  (fn: (a: puppeteer.ElementHandle<Element>) => () => TaskResult<void>): TaskResult<void> =>
    pipe(
      elements,
      aReduce(
        TaskResult.tryCatch(async () => {}),
        (accum, x) =>
          pipe(
            accum,
            TaskResult.chain(fn(x))
          ),
      )
    );

/** `hideElements :: [ElementHandle Element] -> Task (Either Error ())` */
const hideElements = (elements: puppeteer.ElementHandle<Element>[]): TaskResult<void> =>
  reduceElements(elements)(x =>
    () => TaskResult.tryCatch(async () => x.evaluate(el => {
      el.style.display = "none";
    }),
  ));

/** `showElements :: [ElementHandle Element] -> Task (Either Error ())` */
const showElements = (elements: puppeteer.ElementHandle<Element>[]): TaskResult<void> =>
  reduceElements(elements)(x =>
    () => TaskResult.tryCatch(async () => x.evaluate(el => {
      el.style.display = "block";
    }),
  ));

/** `findElements :: String -> AppState -> Task (Either Error ([ElementHandle Element)])` */
const findElements = (selector: string) => (state: AppState): TaskResult<puppeteer.ElementHandle<Element>[]> =>
  TaskResult.tryCatch(async () => state.page.$$(selector));
 
/** `findElement:: String -> AppState -> Task (Either Error (ElementHandle Element))` */ 
const findElement = (selector: string) => (state: AppState): TaskResult<Maybe<puppeteer.ElementHandle<Element>>> =>
  pipe(
    TaskResult.tryCatch(() => state.page.$(selector)),
    TaskResult.map(ele => Maybe.fromNullable(ele))
  );

/** `findNextButton :: AppState -> Task (Either Error AppState)` */
const findNextButton = (state: AppState): TaskResult<AppState> =>
  pipe(
    findElement(state.bookOptions.nextPageSelector)(state),
    TaskResult.map(button => ({...state, nextPageButton: button}))
  );

/** `findAndHideUnnecessaryElements :: AppState -> Task (Either Error AppState)` */
const findAndHideUnnecessaryElements = (state: AppState): TaskResult<AppState> =>
  pipe(
    state.bookOptions.elementsToRemove as string[],
    aReduce(
      TaskResult.of(state),
      (accumState, x) =>
        pipe(
          accumState,
          TaskResult.chain(findElements(x)),
          TaskResult.chain(hideElements),
          TaskResult.chain(_x => accumState),
          logProgress("Nav elements hidden"),
        )
    )
  );

/** `findAndShowUnnecessaryElements :: AppState -> Task (Either Error AppState)` */
const findAndShowUnnecessaryElements = (state: AppState): TaskResult<AppState> =>
  pipe(
    state.bookOptions.elementsToRemove as string[],
    aReduce(
      TaskResult.of(state),
      (accumState, x) =>
        pipe(
          accumState,
          TaskResult.chain(findElements(x)),
          TaskResult.chain(showElements),
          TaskResult.chain(_x => accumState),
          logProgress("Nav elements unhidden"),
        )
    )
  );

/** `buildPagePdf :: AppState -> Task (Either Error AppState)` */
function buildPagePdf(state: AppState): TaskResult<AppState> {
  return pipe(
    findAndHideUnnecessaryElements(state),
    TaskResult.chain(createPdf),
    logProgress("PDF file created"),
    TaskResult.chain(findAndShowUnnecessaryElements),
    TaskResult.chain(mergeFile),
    logProgress("File merged"),
    TaskResult.chain(findNextButton),
    logProgress("Next Button found"),
    TaskResult.chain(clickButton),
  );
}
 
/** `main :: [String] -> IO ()` */
const main = (args: string[]): IO<void> => {
  return pipe(
    createBrowser,
    logProgress("Browser created"),
    TaskResult.chain(browser =>
      pipe(
        createPage(browser),
        logProgress("Page created"),
        TaskResult.chain(createAppState(args[2] ?? "")(browser)),
        logProgress("AppState initialized")
      )
    ),
    TaskResult.chain(goToSite),
    logProgress("Start page visited"),
    TaskResult.chain(buildPagePdf),
    logProgress("Building of PDF finished"),
    TaskResult.chain(saveMergedFile),
    logProgress("Merged PDF file saved"),
    TaskResult.chain(closeBrowser),
    logProgress("Browser closed"),
    x => (() => {
      x().then(result => {
        pipe(result, Result.fold(
          e => {console.warn(e)},
          () => {console.log("Program successfully ended")}
        ))
      })
    })
  );
}

main(process.argv)();
