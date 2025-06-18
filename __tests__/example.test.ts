// Simple test to verify Jest is working
describe('Example Test', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true)
  })

  it('should handle basic math', () => {
    expect(2 + 2).toBe(4)
  })

  it('should work with arrays', () => {
    const items = ['apple', 'banana', 'orange']
    expect(items).toHaveLength(3)
    expect(items).toContain('banana')
  })

  it('should work with objects', () => {
    const user = { name: 'John', age: 30 }
    expect(user).toHaveProperty('name', 'John')
    expect(user.age).toBeGreaterThan(18)
  })
}) 