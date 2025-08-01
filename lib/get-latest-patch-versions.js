import { groupBy } from 'lodash-es';
import semver from 'semver';

export function getLatestPatchVersions(versions) {
  let groupedVersions = groupBy(
    versions.sort((a, b) => semver.rcompare(a, b)),
    v => `${semver.major(v)}.${semver.minor(v)}`,
  );
  return Object.values(groupedVersions).map(verGroup => verGroup[0]);
}
