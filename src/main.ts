import PDFMerger from "pdf-merger-js";
import puppeteer from "puppeteer";
import {
  Maybe,
  fromNullable as maybeFromNullable,
  nothing,
} from "./ADTs/Maybe";
import {
  encaseIO,
  fromMaybe,
  fromPromise,
  resolve,
  Task,
  toPromise,
  tryCatch as taskTryCatch
} from "./ADTs/Task";
import { BookData, BookOptions, bookOptions } from "./bookOptions";

type AppState = {
  browser: puppeteer.Browser;
  page: puppeteer.Page;
  pdfMerger: PDFMerger;
  bookOptions: BookData;
  nextPageButton: Maybe<puppeteer.ElementHandle<Element>>;
};

const timestamp = (): Task<string> =>
  encaseIO(() => new Date())
    .map(x => x.toISOString())
    .map(x => x.replace("T", " "))
    .map(x => x.slice(10, 19));

const logProgress = (logString: string) => <T>(passThrough: T): Task<T> =>
  timestamp()
    .chain(date =>
      encaseIO(() => console.log(`${date} - ${logString}`))
        .map(_x => passThrough)
    );

const createAppState =
  (bookToBuild: string) =>
  (browser: puppeteer.Browser) =>
  (page: puppeteer.Page): Task<AppState> =>
    taskTryCatch(() => {
      if (Object.keys(bookOptions).includes(bookToBuild)) {
        return bookToBuild as keyof BookOptions
      }
      throw ("Unknown book to build");
    })
      .map(bookOptionKey => ({
        browser,
        page,
        pdfMerger: new PDFMerger(),
        bookOptions: bookOptions[bookOptionKey],
        nextPageButton: nothing(),
      }));

const createBrowser = (): Task<puppeteer.Browser> =>
  fromPromise(() => puppeteer.launch());

const createPage = (browser: puppeteer.Browser): Task<puppeteer.Page> =>
  fromPromise(() => browser.newPage());

const goToSite = (state: AppState): Task<AppState> =>
  fromPromise(() => state.page.goto(state.bookOptions.startPage))
    .map(_x => state);

const createPdf = (state: AppState): Task<AppState> =>
  fromPromise(() => state.page.pdf({
    format: "a4",
    path: `output/temp/temp.pdf`,
    margin: {
      left: "19mm",
      right: "19mm",
      top: "20mm",
      bottom: "20mm",
    }
  }))
    .map(_x => state);

const closeBrowser = (state: AppState): Task<void> =>
  fromPromise(() => state.browser.close());

const mergeFile = (state: AppState): Task<AppState> =>
  taskTryCatch(() => state.pdfMerger.add("output/temp/temp.pdf"))
    .map(_x => state);

const saveMergedFile = (state: AppState): Task<AppState> =>
  fromPromise(() => state.pdfMerger.save(`output/books/${state.bookOptions.outputFilename}`))
    .map(_x => state);

function clickButton(state: AppState): Task<AppState> {
  return state.nextPageButton
    .fold(
      () => resolve(state).chain(logProgress("No further next button found")),
      button =>
        fromPromise(() => Promise.all([button.click(), state.page.waitForNavigation()]))
          .chain(_x => buildPagePdf(state))
    );
}

const hideElements = (elements: puppeteer.ElementHandle<Element>[]): Task<void> =>
  elements.reduce<Task<void>>(
    (accum, x) =>
      accum
        .chain(_x => fromPromise(
          () => x.evaluate(el => {
            el.style.display = "none";
          })
        )),
    resolve(undefined)
  );

const showElements = (elements: puppeteer.ElementHandle<Element>[]): Task<void> =>
  elements.reduce<Task<void>>(
    (accum, x) =>
      accum
        .chain(_x => fromPromise(
          () => x.evaluate(el => {
            el.style.display = "block";
          })
        )),
    resolve(undefined)
  );

const findElements = (selector: string) => (state: AppState): Task<puppeteer.ElementHandle<Element>[]> =>
  fromPromise(() => state.page.$$(selector));
  
const findElement = (selector: string) => (state: AppState): Task<Maybe<puppeteer.ElementHandle<Element>>> =>
  fromPromise(() => state.page.$(selector))
    .map(ele => maybeFromNullable(ele));

const findNextButton = (state: AppState): Task<AppState> =>
  findElement(state.bookOptions.nextPageSelector)(state)
    .map(button => ({...state, nextPageButton: button}));

const findAndHideUnnecessaryElements = (state: AppState): Task<AppState> =>
  state.bookOptions.elementsToRemove.reduce(
    (accumState, x) =>
      accumState
        .chain(findElements(x))
        .chain(hideElements)
        .chain(_x => accumState)
        .chain(logProgress("Nav elements hidden")),
    resolve(state)
  );

const findAndShowUnnecessaryElements = (state: AppState): Task<AppState> =>
  state.bookOptions.elementsToRemove.reduce(
    (accumState, x) =>
      accumState
        .chain(findElements(x))
        .chain(showElements)
        .chain(_x => accumState)
        .chain(logProgress("Nav elements unhidden")),
    resolve(state)
  );

function buildPagePdf(state: AppState): Task<AppState> {
  return findAndHideUnnecessaryElements(state)
    .chain(createPdf)
    .chain(logProgress("PDF file created"))
    .chain(findAndShowUnnecessaryElements)
    .chain(mergeFile)
    .chain(logProgress("File merged"))
    .chain(findNextButton)
    .chain(logProgress("Next Button found"))
    .chain(clickButton)
}
  
function main(args: string[]): Task<void> {
  return createBrowser()
    .chain(logProgress("Browser created"))
    .chain(browser =>
      createPage(browser)
        .chain(logProgress("Page created"))
        .chain(createAppState(args[2] ?? "")(browser))
        .chain(logProgress("AppState initialized"))
    )
    .chain(goToSite)
    .chain(logProgress("Start page visited"))
    .chain(buildPagePdf)
    .chain(logProgress("Building of PDF finished"))
    .chain(saveMergedFile)
    .chain(logProgress("Merged PDF file saved"))
    .chain(closeBrowser)
    .chain(logProgress("Browser closed"));
}

(async () => {
  try {
    await toPromise(main(process.argv));
  } catch (e) {
    console.warn(e);
  }
})();
