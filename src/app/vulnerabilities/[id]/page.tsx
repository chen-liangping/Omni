'use client'

import VulnerabilityDetail from '@/components/vulnerabilities/vulnerability-detail'

export default function Page({ params }: { params: { id: string } }) {
  return <VulnerabilityDetail id={params.id} />
}


