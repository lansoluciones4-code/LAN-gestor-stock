export type ActionResult<T = void> = (T extends void ? { success: true; data?: T; message?: string } : { success: true; data: T; message?: string }) | { success: false; error: string };
