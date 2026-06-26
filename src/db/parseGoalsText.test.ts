import { describe, expect, it } from 'vitest'
import { parseGoalsText } from './parseGoalsText'

describe('parseGoalsText', () => {
  it('parses a dash list with colon-separated descriptions', () => {
    const result = parseGoalsText(`
      - Путешествие в Японию: увидеть сакуру весной
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
    const result = parseGoalsText('- **Пробежать марафон**: за 4 часа\n* __Сменить работу__')
    expect(result).toEqual([
      { title: 'Пробежать марафон', description: 'за 4 часа' },
      { title: 'Сменить работу', description: '' },
    ])
  })

  it('does not treat a dash or em-dash as a description separator', () => {
    const result = parseGoalsText('- Путешествие в Японию — увидеть сакуру весной')
    expect(result).toEqual([
      { title: 'Путешествие в Японию — увидеть сакуру весной', description: '' },
    ])
  })

  it('ignores blank lines', () => {
    const result = parseGoalsText('- Цель один\n\n\n- Цель два')
    expect(result).toHaveLength(2)
  })

  it('returns an empty array for blank input', () => {
    expect(parseGoalsText('   \n  \n')).toEqual([])
  })

  it('extracts a trailing category in parentheses', () => {
    const result = parseGoalsText(
      '- Путешествие в Японию: увидеть сакуру весной (Путешествия)\n- Выучить испанский (Развитие)',
    )
    expect(result).toEqual([
      { title: 'Путешествие в Японию', description: 'увидеть сакуру весной', category: 'Путешествия' },
      { title: 'Выучить испанский', description: '', category: 'Развитие' },
    ])
  })

  it('extracts a category when there is no description', () => {
    const result = parseGoalsText('- Купить дом (Жильё)')
    expect(result).toEqual([{ title: 'Купить дом', description: '', category: 'Жильё' }])
  })

  it('leaves goals without a trailing category unset', () => {
    const result = parseGoalsText('- Цель без категории')
    expect(result).toEqual([{ title: 'Цель без категории', description: '' }])
  })

  it('does not treat parentheses inside the description as a category', () => {
    const result = parseGoalsText('- Цель: описание (важное) с продолжением')
    expect(result).toEqual([{ title: 'Цель', description: 'описание (важное) с продолжением' }])
  })
})
