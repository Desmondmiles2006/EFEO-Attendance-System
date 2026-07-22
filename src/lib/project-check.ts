import { prisma } from "@/lib/prisma";

/**
 * Returns true if the leave's projectId is valid to tag: either null (untagged)
 * or a real project the given user is actually a member of.
 */
export async function isValidProjectForUser(
  userId: string,
  projectId: string | null
): Promise<boolean> {
  if (!projectId) return true;
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  return !!membership;
}
