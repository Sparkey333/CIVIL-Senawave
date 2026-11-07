/**
 * Version stamp of the rows the app ships with (Fluence, the team, the welcome note). On load, a built-in row that
 * nobody has edited is refreshed to the current version once; anything a person changed is never touched.
 * It is the time the previous release went out, so an edit made in that release is newer and always wins.
 */
export const SEED_REVISION = '2026-10-02T20:45:00.000Z';
