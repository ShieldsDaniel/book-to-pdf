import * as I from "fp-ts/IO";

export type IO<A> = I.IO<A>;

export const IO = {
    ...I
};
