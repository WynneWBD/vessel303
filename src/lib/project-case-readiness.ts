export const MIN_PROJECT_CASE_DESCRIPTION_CHARS = 220
export const MAX_PROJECT_CASE_DESCRIPTION_CHARS = 6000

export type ProjectCaseReadinessLevel = '完整' | '可展示但待补充' | '待补素材'

export type ProjectCaseReadinessInput = {
  cover_image_url?: string | null
  images?: unknown[] | null
  description_zh?: string | null
  description_en?: string | null
  project_type_zh?: string | null
  project_type_en?: string | null
  area_display?: string | null
  units_display?: string | null
  products?: string | null
  tags_zh?: unknown[] | null
  tags_en?: unknown[] | null
  latitude?: string | number | null
  longitude?: string | number | null
  status?: string | null
}

export function hasProjectCaseText(value: string | null | undefined): boolean {
  return Boolean(value?.trim())
}

export function projectCaseTextLength(value: string | null | undefined): number {
  return value?.trim().replace(/\s+/g, ' ').length ?? 0
}

function hasItems(value: unknown[] | null | undefined): boolean {
  return Array.isArray(value) && value.length > 0
}

function hasCoordinates(project: ProjectCaseReadinessInput): boolean {
  return project.latitude != null && project.longitude != null
}

export function getProjectCaseReadinessIssues(
  project: ProjectCaseReadinessInput,
  options: { includeCoordinates?: boolean } = {},
): string[] {
  const issues: string[] = []

  if (!hasProjectCaseText(project.cover_image_url)) issues.push('缺封面')
  if (!hasItems(project.images)) issues.push('缺图库')
  if (!hasProjectCaseText(project.description_zh)) issues.push('缺中文简介')
  if (!hasProjectCaseText(project.description_en)) issues.push('缺英文简介')
  if (
    hasProjectCaseText(project.description_zh) &&
    hasProjectCaseText(project.description_en) &&
    (
      projectCaseTextLength(project.description_zh) < MIN_PROJECT_CASE_DESCRIPTION_CHARS ||
      projectCaseTextLength(project.description_en) < MIN_PROJECT_CASE_DESCRIPTION_CHARS
    )
  ) {
    issues.push('详情叙事偏短')
  }
  if (!hasProjectCaseText(project.project_type_zh) || !hasProjectCaseText(project.project_type_en)) {
    issues.push('缺项目类型')
  }
  if (!hasProjectCaseText(project.area_display)) issues.push('缺项目面积')
  if (!hasProjectCaseText(project.units_display)) issues.push('缺舱数')
  if (!hasProjectCaseText(project.products)) issues.push('缺产品型号')
  if (!hasItems(project.tags_zh) || !hasItems(project.tags_en)) issues.push('缺标签')

  if (options.includeCoordinates) {
    const coords = hasCoordinates(project)
    if (!coords) {
      issues.push('缺坐标')
    } else if (project.status && project.status !== 'published') {
      issues.push('有坐标待发布')
    }
  }

  return issues
}

export function getProjectCaseReadinessLevel(issues: string[]): ProjectCaseReadinessLevel {
  if (issues.length === 0) return '完整'
  if (issues.includes('缺封面') || issues.includes('缺图库')) return '待补素材'
  return '可展示但待补充'
}
