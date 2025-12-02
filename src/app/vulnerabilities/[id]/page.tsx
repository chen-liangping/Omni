import VulnerabilityDetail from '@/components/vulnerabilities/vulnerability-detail'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <VulnerabilityDetail id={id} />
}


