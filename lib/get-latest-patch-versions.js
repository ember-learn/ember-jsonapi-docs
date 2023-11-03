import { groupBy } from 'lodash'
import semverCompare from 'semver-compare'
import semverUtils from 'semver-utils'

export function getLatestPatchVersions(versions) {
  let groupedVersions = groupBy(
    versions.sort(semverCompare).map(semverUtils.parse),
    v => `${v.major}.${v.minor}`,
  )
  return Object.values(groupedVersions).map(verGroup => verGroup.pop().version)
}
