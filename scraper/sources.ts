export interface SchemeSource {
  scheme_id: string | string[]
  url: string
  selectors: Record<string, string>
}

export const SOURCES: SchemeSource[] = [
  {
    scheme_id: 'government-subsidy',
    url: 'https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/subsidies-for-acute-inpatient-care-at-public-healthcare-institutions/',
    selectors: { subsidy_table: 'table', subsidy_rows: 'table tr' },
  },
  {
    scheme_id: 'medishield-life',
    url: 'https://www.cpf.gov.sg/member/healthcare-financing/medishield-life/what-medishield-life-covers-you-for',
    selectors: { deductible_table: 'table', rows: 'table tr' },
  },
  {
    scheme_id: ['chas-blue', 'chas-orange', 'chas-green'],
    url: 'https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/chas',
    selectors: { income_table: 'table', rows: 'table tr' },
  },
  {
    scheme_id: ['medifund', 'medifund-silver', 'medifund-junior'],
    url: 'https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/medifund',
    selectors: { content: '.content-body', rows: 'table tr' },
  },
  {
    scheme_id: 'pioneer-generation',
    url: 'https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/pioneer-generation-package',
    selectors: { benefit_table: 'table', rows: 'table tr' },
  },
  {
    scheme_id: 'merdeka-generation',
    url: 'https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/merdeka-generation-package',
    selectors: { benefit_table: 'table', rows: 'table tr' },
  },
  {
    scheme_id: 'elderfund',
    url: 'https://www.aic.sg/financial-assistance/elderfund',
    selectors: { eligibility: '.eligibility', rows: 'table tr' },
  },
  {
    scheme_id: 'comcare',
    url: 'https://supportgowhere.life.gov.sg/schemes/',
    selectors: { scheme_list: '.scheme-item', rows: 'table tr' },
  },
  {
    scheme_id: 'flexi-medisave',
    url: 'https://www.cpf.gov.sg/member/healthcare-financing/medisave/flexi-medisave',
    selectors: { limit_table: 'table', rows: 'table tr' },
  },
  {
    scheme_id: 'ip-rider-flag',
    url: 'https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/integrated-shield-plans',
    selectors: { table: 'table', rows: 'table tr' },
  },
  {
    scheme_id: 'maf',
    url: 'https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/subsidies-for-drugs-on-the-medication-assistance-fund-(maf)-list-at-public-healthcare-institutions/',
    selectors: { content: 'main', rows: 'table tr' },
  },
]
