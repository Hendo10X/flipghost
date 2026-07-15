import { loader } from "fumadocs-core/source"

import { docs } from "@/.source/server"

/** The docs content tree, built from the MDX under `content/docs`. */
export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
})
