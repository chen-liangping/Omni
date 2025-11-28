// 这段代码实现了全局可复用的 mock 常量，使用了只读元组便于类型约束
export const USERS = ['lin.y@ctw.inc', 'yu.t@ctw.inc', 'wu.yuni@ctw.inc'] as const
export type UserEmail = typeof USERS[number]

export const PROJECTS = ['Publisher', 'Omni', 'Core'] as const
export type ProjectName = typeof PROJECTS[number]


