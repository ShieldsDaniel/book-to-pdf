export type BookOptions = {
  learnYouAHaskell: BookData;
  saiocp: BookData;
}

export type BookData = {
  startPage: string;
  outputFilename: Readonly<string>;
  nextPageSelector: Readonly<string>;
  elementsToRemove: Readonly<string[]>;
};

export const bookOptions: Record<string, BookData> = {
  learnYouAHaskell: {
    startPage: "http://learnyouahaskell.com/introduction",
    outputFilename: "LearnYouAHaskell.pdf",
    nextPageSelector: ".footdiv li:last-child a",
    elementsToRemove: [
      ".footdiv"
    ],
  },
  saiocp: {
    startPage: "https://mitpress.mit.edu/sites/default/files/sicp/full-text/book/book.html",
    outputFilename: "StructureAndInterpretationOfComputerPrograms.pdf",
    nextPageSelector: ".navigation > span:nth-child(2) a",
    elementsToRemove: [
      ".navigation"
    ],
  },
} as const;
