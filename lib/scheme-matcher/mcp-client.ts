import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import path from 'path'
import * as fs from 'fs'

let mcpClient: Client | null = null

async function getClient(): Promise<Client> {
  if (mcpClient) return mcpClient

  const transport = new StdioClientTransport({
    command: 'npx',
    args: [
      'ts-node',
      '--project', path.join(process.cwd(), 'tsconfig.scripts.json'),
      path.join(process.cwd(), 'mcp-server/server.mts'),
    ],
  })

  const client = new Client({ name: 'billsg-matcher', version: '1.0.0' }, { capabilities: {} })
  await client.connect(transport)
  mcpClient = client
  return client
}

async function callTool(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
  try {
    const client = await getClient()
    const result = await client.callTool({ name, arguments: args })
    return JSON.parse((result.content as Array<{ type: string; text: string }>)[0].text)
  } catch {
    const raw = fs.readFileSync(path.join(process.cwd(), 'data/schemes.json'), 'utf-8')
    const schemes = JSON.parse(raw)
    return { _fallback: true, schemes }
  }
}

export async function getCHASTiers() {
  return callTool('get_chas_tiers')
}

export async function getIPRiderRules() {
  return callTool('get_ip_rider_rules')
}

export async function getMediShieldDeductibles(wardClass?: string) {
  return callTool('get_medishield_deductibles', wardClass ? { ward_class: wardClass } : {})
}

export async function getSubsidyTiers(citizenship: 'SC' | 'PR' | 'Foreigner') {
  return callTool('get_subsidy_tiers', { citizenship })
}

export async function getSchemeData(schemeId: string) {
  return callTool('get_scheme_data', { scheme_id: schemeId })
}

export async function getAllSchemes() {
  return callTool('get_all_schemes')
}

export async function triggerScraper() {
  return callTool('trigger_scraper')
}
