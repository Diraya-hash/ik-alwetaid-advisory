import type { en } from "./en";

/** A pluralised string: forms are keyed by Intl.PluralRules category; `other` is required. */
export type Plural = { other: string } & Partial<Record<"zero" | "one" | "two" | "few" | "many", string>>;

/** Widens the literal English dictionary into the shape every locale must satisfy. */
type Widen<T> = T extends string ? string : T extends { other: string } ? Plural : { [K in keyof T]: Widen<T[K]> };
export type Dictionary = Widen<typeof en>;
