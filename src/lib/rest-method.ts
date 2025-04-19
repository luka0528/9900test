import type { RestMethod } from "@prisma/client";

export const methodColors: Record<RestMethod, string> = {
  GET: "bg-blue-500",
  POST: "bg-green-500",
  PUT: "bg-yellow-500",
  DELETE: "bg-red-500",
  PATCH: "bg-orange-500",
  OPTIONS: "bg-purple-500",
  HEAD: "bg-gray-500",
  TRACE: "bg-indigo-500",
};
