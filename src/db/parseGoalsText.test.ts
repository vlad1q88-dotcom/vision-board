import { describe, expect, it } from 'vitest'
import { parseGoalsText } from './parseGoalsText'

describe('parseGoalsText', () => {
  it('parses a dash list with em-dash descriptions', () => {
    const result = parseGoalsText(`
      - Путешествие в Японию — увидеть сакуру весной
      - Выучить испанский
    `)
    expect(result).toEqual([
      { title: 'Путешествие в Японию', description: 'увидеть сакуру весной' },
      { title: 'Выучить испанский', description: '' },
    ])
  })

  it('parses numbered lists and colon-separated descriptions', () => {
    const result = parseGoalsText('1. Купить дом: с садом и бассейном\n2) Получить повышение')
    expect(result).toEqual([
      { title: 'Купить дом', description: 'с садом и бассейном' },
      { title: 'Получить повышение', description: '' },
    ])
  })

  it('strips markdown bold/underline emphasis', () => {
    const result = parseGoalsText('- **Пробежать марафон** — за 4 часа\n* __Сменить работу__')
    expect(result).toEqual([
      { title: 'Пробежать марафон', description: 'за 4 часа' },
      { title: 'Сменить работу', description: '' },
    ])
  })

  it('ignores blank lines', () => {
    const result = parseGoalsText('- Цель один\n\n\n- Цель два')
    expect(result).toHaveLength(2)
  })

  it('returns an empty array for blank input', () => {
    expect(parseGoalsText('   \n  \n')).toEqual([])
  })
})
