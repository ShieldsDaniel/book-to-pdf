import puppeteer from "puppeteer";
import PdfMerger from "pdf-merger-js";

const pageFormat: puppeteer.PaperFormat = "a4";
const pagesToVisit: { filename: string, website: string }[] = [
  {
    website: "http://learnyouahaskell.com/introduction",
    filename: "learnyouahaskell1.pdf",
  },
  {
    website: "http://learnyouahaskell.com/starting-out",
    filename: "learnyouahaskell2.pdf",
  },
  {
    website: "http://learnyouahaskell.com/types-and-typeclasses",
    filename: "learnyouahaskell3.pdf",
  },
  {
    website: "http://learnyouahaskell.com/syntax-in-functions",
    filename: "learnyouahaskell4.pdf",
  },
  {
    website: "http://learnyouahaskell.com/recursion",
    filename: "learnyouahaskell5.pdf",
  },
  {
    website: "http://learnyouahaskell.com/higher-order-functions",
    filename: "learnyouahaskell6.pdf",
  },
  {
    website: "http://learnyouahaskell.com/modules",
    filename: "learnyouahaskell7.pdf",
  },
  {
    website: "http://learnyouahaskell.com/making-our-own-types-and-typeclasses",
    filename: "learnyouahaskell8.pdf",
  },
  {
    website: "http://learnyouahaskell.com/input-and-output",
    filename: "learnyouahaskell9.pdf",
  },
  {
    website: "http://learnyouahaskell.com/functionally-solving-problems",
    filename: "learnyouahaskell10.pdf",
  },
  {
    website: "http://learnyouahaskell.com/functors-applicative-functors-and-monoids",
    filename: "learnyouahaskell11.pdf",
  },
  {
    website: "http://learnyouahaskell.com/a-fistful-of-monads",
    filename: "learnyouahaskell12.pdf",
  },
  {
    website: "http://learnyouahaskell.com/for-a-few-monads-more",
    filename: "learnyouahaskell13.pdf",
  },
  {
    website: "http://learnyouahaskell.com/zippers",
    filename: "learnyouahaskell14.pdf",
  },
];

const timestamp = () => new Date().toISOString().replace("T", " ").slice(0, 16);
const logProgress = (logString: string) => console.log(`${timestamp()} - ${logString}`);

const printPdf = async (pageToVisit: string, filename: string): Promise<void> => {
  try {
    logProgress(`Opening page ${pageToVisit}...`);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(pageToVisit);
    await page.pdf({
      format: pageFormat,
      path: `output/${filename}`,
      margin: {
        left: "19mm",
        right: "19mm",
        top: "20mm",
        bottom: "20mm",
      },
    });
    await browser.close();
    logProgress(`Closing browser...`);
  } catch(e) {
    console.warn(e);
  }
};

const concatAllPdfFiles = async (files: string[]): Promise<void> => {
  try {
    logProgress(`Concatenating all PDF files into one...`);
    let merger = new PdfMerger();
    for (const file of files) {
      logProgress(`Merging ${file}...`);
      merger.add(`output/learn-you-a-haskell/${file}`);
    }
    await merger.save("output/merged.pdf");
    logProgress(`Finished concatenating!`);
  } catch(e) {
    console.warn(e);
  }
};

(async () => {
  try {
    for (const pageData of pagesToVisit) {
      await printPdf(pageData.website, pageData.filename);
    }
    // await concatAllPdfFiles(pagesToVisit.map((data) => data.filename));
  } catch(e) {
    console.warn(e);
  }
})();
