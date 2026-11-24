import { groupIssuesByKind, isAccountIssue, issueSubjects } from './intelligenceModel';

/** One definition of affected subjects across the overview, briefing and filters. */
export function briefingFromIssues(items) {
  const groups = groupIssuesByKind(items);
  const byKind = groups.map((group) => ({
    kind: group.kind,
    label: group.label,
    subjects: issueSubjects(group.items).size,
    vehicles: new Set(
      group.items
        .filter((issue) => !isAccountIssue(issue))
        .map((issue) => issue.registrationNumber?.replace(/\s/g, '').toUpperCase())
        .filter(Boolean),
    ).size,
  }));
  return {
    occurrences: items.reduce(
      (sum, issue) =>
        sum + (Number.isFinite(issue.occurrences) ? Math.max(0, issue.occurrences) : 1),
      0,
    ),
    vehicles: new Set(
      items
        .filter((issue) => !isAccountIssue(issue))
        .map((issue) => issue.registrationNumber?.replace(/\s/g, '').toUpperCase())
        .filter(Boolean),
    ).size,
    accounts: new Set(
      items
        .filter((issue) => isAccountIssue(issue) || !issue.registrationNumber)
        .map((issue) => issue.accountName)
        .filter(Boolean),
    ).size,
    kinds: groups.length,
    needsYou: issueSubjects(items.filter((issue) => issue.severity === 'act')).size,
    watch: issueSubjects(items.filter((issue) => issue.severity === 'watch')).size,
    highlights: byKind.slice(0, 3),
    note: 'Summarised from loaded issue records. Findings are not confirmed hardware diagnoses; a truck may appear under more than one issue.',
  };
}

export function matchesIssueSearch(issue, query) {
  const text = [
    issue.registrationNumber,
    issue.accountName,
    issue.title,
    issue.detail,
    issue.advice,
    issue.kind,
    ...(issue.evidence || []).map((entry) => entry.text),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .every((word) => text.includes(word));
}
