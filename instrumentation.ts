import "server-only";
/** Next invokes register before this server instance accepts requests. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initializeServer } = await import("./app/server/bootstrap");
    initializeServer();
  }
}
export async function onRequestError(error: unknown) {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { reportServerError } = await import("./app/server/bootstrap");
    reportServerError(error);
  }
}
