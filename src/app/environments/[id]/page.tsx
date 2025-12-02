'use client'

import React from 'react'
import EnvironmentProjectDetail from '@/components/environments/project-detail'

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  return <EnvironmentProjectDetail id={id} />
}


