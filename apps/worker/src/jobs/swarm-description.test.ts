import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildPrompt, generateFallbackDescription } from './swarm-description'

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  })),
}))

// Mock logger
vi.mock('../logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

const FULL_TOOL = {
  id: 'tool-1',
  name: 'CodeAnalyzer',
  category: 'code_analysis',
  api_endpoint: 'https://api.codeanalyzer.ai/v1',
  auth_method: 'api_key',
  provider: 'AnalyzerCorp',
  version: '2.1.0',
  url: 'https://codeanalyzer.ai',
  capabilities: ['static analysis', 'security scanning', 'linting'],
  input_formats: ['python', 'javascript', 'typescript'],
  output_formats: ['json', 'sarif'],
  known_limitations: ['no binary analysis', 'max 10MB files'],
  pricing_model: 'per_request',
  description_short: 'AI-powered code analysis and security scanning',
}

const MINIMAL_TOOL = {
  id: 'tool-2',
  name: 'SimpleBot',
  category: 'chatbot',
  api_endpoint: null,
  auth_method: null,
  provider: null,
  version: null,
  url: null,
  capabilities: null,
  input_formats: null,
  output_formats: null,
  known_limitations: null,
  pricing_model: null,
  description_short: null,
}

describe('buildPrompt', () => {
  it('includes all available metadata in prompt', () => {
    const prompt = buildPrompt(FULL_TOOL)

    expect(prompt).toContain('CodeAnalyzer')
    expect(prompt).toContain('code_analysis')
    expect(prompt).toContain('AnalyzerCorp')
    expect(prompt).toContain('2.1.0')
    expect(prompt).toContain('api_key')
    expect(prompt).toContain('static analysis')
    expect(prompt).toContain('python')
    expect(prompt).toContain('json')
    expect(prompt).toContain('no binary analysis')
    expect(prompt).toContain('per_request')
    expect(prompt).toContain('AI-powered code analysis')
  })

  it('handles minimal metadata gracefully', () => {
    const prompt = buildPrompt(MINIMAL_TOOL)

    expect(prompt).toContain('SimpleBot')
    expect(prompt).toContain('chatbot')
    expect(prompt).not.toContain('Provider:')
    expect(prompt).not.toContain('Version:')
    expect(prompt).not.toContain('Capabilities:')
  })
})

describe('generateFallbackDescription', () => {
  it('generates rich description from full metadata', () => {
    const desc = generateFallbackDescription(FULL_TOOL)

    expect(desc).toContain('CodeAnalyzer is a code_analysis tool')
    expect(desc).toContain('AI-powered code analysis')
    expect(desc).toContain('AnalyzerCorp')
    expect(desc).toContain('api_key authentication')
    expect(desc).toContain('static analysis')
    expect(desc).toContain('python')
    expect(desc).toContain('json')
  })

  it('generates basic description from minimal metadata', () => {
    const desc = generateFallbackDescription(MINIMAL_TOOL)

    expect(desc).toBe('SimpleBot is a chatbot tool')
    expect(desc).not.toContain('null')
    expect(desc).not.toContain('undefined')
  })
})
