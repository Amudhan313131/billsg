import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import fs from 'fs'
import path from 'path'

const DATA_PATH = path.resolve(__dirname, '../data/schemes.json')

function loadSchemes() {
  const raw = fs.readFileSync(DATA_PATH, 'utf-8')
  return JSON.parse(raw)
}

function getScheme(schemeId: string) {
  const store = loadSchemes()
  const scheme = store.schemes.find((s: { scheme_id: string }) => s.scheme_id === schemeId)
  if (!scheme) throw new Error(`Scheme not found: ${schemeId}`)
  return scheme
}

const server = new Server(
  { name: 'billsg-schemes', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_scheme_data',
      description: 'Get current eligibility data and thresholds for a specific Singapore healthcare scheme',
      inputSchema: {
        type: 'object' as const,
        properties: { scheme_id: { type: 'string', description: 'The scheme identifier' } },
        required: ['scheme_id'],
      },
    },
    {
      name: 'get_chas_tiers',
      description: 'Get current CHAS income tier thresholds for Blue, Orange, and Green',
      inputSchema: { type: 'object' as const, properties: {} },
    },
    {
      name: 'get_ip_rider_rules',
      description: 'Get current IP Rider co-payment rules including April 2026 restructuring details',
      inputSchema: { type: 'object' as const, properties: {} },
    },
    {
      name: 'get_medishield_deductibles',
      description: 'Get current MediShield Life deductibles and co-insurance rates by ward class',
      inputSchema: {
        type: 'object' as const,
        properties: { ward_class: { type: 'string', description: 'Optional ward class (A, B1, B2, C)' } },
      },
    },
    {
      name: 'get_subsidy_tiers',
      description: 'Get current government subsidy tiers based on citizenship and income',
      inputSchema: {
        type: 'object' as const,
        properties: { citizenship: { type: 'string', enum: ['SC', 'PR', 'Foreigner'], description: 'Citizenship status' } },
        required: ['citizenship'],
      },
    },
    {
      name: 'get_all_schemes',
      description: 'Get all scheme data with freshness status — use this to check when data was last updated',
      inputSchema: { type: 'object' as const, properties: {} },
    },
    {
      name: 'trigger_scraper',
      description: 'Manually trigger a live data refresh from Singapore government websites',
      inputSchema: { type: 'object' as const, properties: {} },
    },
  ],
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      case 'get_scheme_data': {
        const schemeId = (args as { scheme_id: string }).scheme_id
        const scheme = getScheme(schemeId)
        return { content: [{ type: 'text', text: JSON.stringify(scheme, null, 2) }] }
      }

      case 'get_chas_tiers': {
        const blue = getScheme('chas-blue')
        const orange = getScheme('chas-orange')
        const green = getScheme('chas-green')
        const result = {
          blue: { pchi_max: blue.data.pchi_max, av_max: blue.data.av_max },
          orange: { pchi_min: orange.data.pchi_min, pchi_max: orange.data.pchi_max, av_min: orange.data.av_min, av_max: orange.data.av_max },
          green: { note: green.data.note },
          last_scraped: blue.last_scraped,
          data_freshness: blue.data_freshness,
        }
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
      }

      case 'get_ip_rider_rules': {
        const scheme = getScheme('ip-rider-flag')
        return { content: [{ type: 'text', text: JSON.stringify(scheme.data, null, 2) }] }
      }

      case 'get_medishield_deductibles': {
        const scheme = getScheme('medishield-life')
        const wardClass = (args as { ward_class?: string }).ward_class
        if (wardClass) {
          const deductible = scheme.data.deductibles[wardClass]
          if (deductible === undefined) throw new Error(`Unknown ward class: ${wardClass}`)
          return { content: [{ type: 'text', text: JSON.stringify({ ward_class: wardClass, deductible, coinsurance_pct: scheme.data.coinsurance_pct }, null, 2) }] }
        }
        return { content: [{ type: 'text', text: JSON.stringify(scheme.data, null, 2) }] }
      }

      case 'get_subsidy_tiers': {
        const citizenship = (args as { citizenship: string }).citizenship
        const scheme = getScheme('government-subsidy')
        if (citizenship === 'Foreigner') {
          return { content: [{ type: 'text', text: JSON.stringify({ citizenship, subsidy_pct: 0, note: 'Foreigners are not eligible for government subsidies' }, null, 2) }] }
        }
        if (citizenship === 'PR') {
          return { content: [{ type: 'text', text: JSON.stringify({ citizenship, subsidy_pct: scheme.data.pr_subsidy_pct, note: 'PR flat rate subsidy' }, null, 2) }] }
        }
        return { content: [{ type: 'text', text: JSON.stringify({ citizenship, tiers: scheme.data.sc_tiers }, null, 2) }] }
      }

      case 'get_all_schemes': {
        const store = loadSchemes()
        const result = {
          last_full_scrape: store.last_full_scrape,
          schemes: store.schemes.map((s: { scheme_id: string; scheme_name: string; last_scraped: string; data_freshness: string }) => ({
            scheme_id: s.scheme_id,
            scheme_name: s.scheme_name,
            last_scraped: s.last_scraped,
            data_freshness: s.data_freshness,
          })),
        }
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
      }

      case 'trigger_scraper': {
        const { runScraper } = await import('../scraper/index')
        const scraperResult = await runScraper()
        return { content: [{ type: 'text', text: JSON.stringify({ ...scraperResult, completed_at: new Date().toISOString() }, null, 2) }] }
      }

      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return { content: [{ type: 'text', text: JSON.stringify({ error: message }) }], isError: true }
  }
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch(console.error)
