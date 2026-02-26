import { prisma } from "../prisma/client";

export class TeamMembersRepository {
  countByTeamId(teamId: string) {
    return prisma.teamMember.count({ where: { teamId } });
  }

  findByTeamId(teamId: string) {
    return prisma.teamMember.findMany({ where: { teamId } });
  }
}