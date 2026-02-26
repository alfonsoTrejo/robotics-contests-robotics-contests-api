import { prisma } from "../prisma/client";

export class TeamsRepository {
  findById(id: string) {
    return prisma.team.findUnique({
      where: { id },
      include: {
        contest: true,
        modality: true,
        members: { include: { user: true } }, // TeamMember -> user
      },
    });
  }

  findMany(filters?: { contestId?: string; modalityId?: string }) {
    return prisma.team.findMany({
      where: {
        contestId: filters?.contestId,
        modalityId: filters?.modalityId,
      },
      orderBy: { createdAt: "desc" },
      include: {
        contest: true,
        modality: true,
        members: { include: { user: true } },
      },
    });
  }

  findMyTeams(userId: string) {
    return prisma.team.findMany({
      where: {
        members: { some: { userId } },
      },
      orderBy: { createdAt: "desc" },
      include: {
        contest: true,
        modality: true,
        members: { include: { user: true } },
      },
    });
  }

  delete(id: string) {
    return prisma.team.delete({ where: { id } });
  }
}