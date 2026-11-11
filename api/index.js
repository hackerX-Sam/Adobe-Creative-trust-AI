/** Vercel serverless entry — serves the whole Hono API (including SSE) at /api/*. */
import { getRequestListener } from '@hono/node-server'
import createApp from '../server/app.js'

export const maxDuration = 60 // SSE connections are auto-resumed by the client

export default getRequestListener(createApp().fetch)
