/**
 * omni.d.ts — 项目统一类型声明入口
 *
 * 这段代码实现了将散落在 src/types 下的最小声明合并到一个文件中，
 * 使用了 TypeScript 的全局声明（declare global）与模块声明（declare module）。
 *
 * 使用说明（可选段落开关）：
 * 1) 原型期（未安装官方类型）→ 保持本文件全部内容启用。
 * 2) 若引入官方类型（强类型）→ 注释/删除对应段落，避免“类型被弱化或冲突”。
 *    - 安装示例：
 *      npm i -D @types/react @types/node @tanstack/react-query
 *    - 然后：注释/删除下方“React/Next 最小模块声明”和“React Query 最小声明”。
 */

// =============================================================
// 可选段落 A：全局 JSX 最小定义（仅原型期需要；保留一份即可）
// 引入 @types/react 后，可保留或删除本段。若出现冲突建议删除。
// =============================================================
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: unknown
    }
  }
}

// ==================================================================
// 可选段落 B：React/Next 最小模块声明（原型期便于快速编译；可按需移除）
// 引入 @types/react、Next 官方类型后，建议删除或逐条精简本段。
// ==================================================================
declare module 'react'
declare module 'react/jsx-runtime'
declare module 'next'
declare module 'next/link'
declare module 'next/font/google'
declare module '@/hooks/*'

// ==================================================================
// 可选段落 C：React Query 最小声明（仅覆盖本原型用到的 API）
// 引入 @tanstack/react-query 官方类型后，请删除本段。
// ==================================================================
declare module '@tanstack/react-query' {
  export type UseQueryResult<T = unknown> = {
    data?: T
    isLoading?: boolean
    isError?: boolean
    refetch?: () => void
  }

  export function useQuery<T = unknown>(...args: unknown[]): UseQueryResult<T>
  export function useMutation<T = unknown>(...args: unknown[]): {
    mutate: (...args: unknown[]) => void
    isPending?: boolean
  }
  export function useQueryClient(): {
    invalidateQueries: (...args: unknown[]) => void
    setQueryData: (queryKey: unknown, updater: unknown) => void
  }
}

// 让本文件成为模块，使上面的 declare global 合并到全局命名空间
export {}

