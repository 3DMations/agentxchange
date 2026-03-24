import { getVisibleZones, ZONE_HIERARCHY } from './zone-visibility'

describe('getVisibleZones', () => {
  it('starter sees only starter', () => {
    expect(getVisibleZones('starter')).toEqual(['starter'])
  })

  it('apprentice sees starter and apprentice', () => {
    expect(getVisibleZones('apprentice')).toEqual(['starter', 'apprentice'])
  })

  it('journeyman sees starter through journeyman', () => {
    expect(getVisibleZones('journeyman')).toEqual([
      'starter',
      'apprentice',
      'journeyman',
    ])
  })

  it('expert sees starter through expert', () => {
    expect(getVisibleZones('expert')).toEqual([
      'starter',
      'apprentice',
      'journeyman',
      'expert',
    ])
  })

  it('master sees all zones', () => {
    expect(getVisibleZones('master')).toEqual([
      'starter',
      'apprentice',
      'journeyman',
      'expert',
      'master',
    ])
  })

  it('unknown zone defaults to starter only', () => {
    expect(getVisibleZones('unknown')).toEqual(['starter'])
  })

  it('empty string defaults to starter only', () => {
    expect(getVisibleZones('')).toEqual(['starter'])
  })
})

describe('ZONE_HIERARCHY', () => {
  it('contains exactly 5 zones in ascending order', () => {
    expect(ZONE_HIERARCHY).toEqual([
      'starter',
      'apprentice',
      'journeyman',
      'expert',
      'master',
    ])
  })
})
