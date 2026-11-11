/** Local dev API server — same Hono app as production, plain Node. Port 8787. */
import { serve } from '@hono/node-server'
import createApp from './app.js'

const port = Number(process.env.PORT || 8787)
serve({ fetch: createApp().fetch, port }, (info) => {
  console.log(`CreativeTrust API listening on http://localhost:${info.port}`)
})
