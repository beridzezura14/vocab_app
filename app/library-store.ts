import { database } from "./database";
import { parseLibrary, type Library } from "./library-data";

export const libraries = () => database().collection<Library & { _id: string }>("personal_libraries");

export async function readLibrary(accountId: string) {
  return parseLibrary(await libraries().findOne({ _id: accountId }));
}
