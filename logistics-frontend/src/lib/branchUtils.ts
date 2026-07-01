export function formatBranchLocation(branch: {
  district: string;
  province: string;
  department: string;
  country: string;
}): string {
  return [branch.district, branch.province, branch.department, branch.country]
    .filter(Boolean)
    .join(', ');
}

export function formatBranchOptionLabel(branch: {
  name: string;
  phone: string;
  district: string;
}): string {
  return `${branch.name} — ${branch.district} (${branch.phone})`;
}
