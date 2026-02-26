import { prisma } from "../prisma/client";
import type { Prisma } from "@prisma/client";

export class WinnersRepository {
  findById(id: string) {
    return prisma.winner.findUnique({
      where: { id },
      include: {
        team: {
          include: {
            members: { include: { user: true } },
            modality: true,
            contest: true,
          },
        },
        modality: {
          include: {
            contest: true,
          },
        },
      },
    });
  }

  findByModalityId(modalityId: string) {
    return prisma.winner.findMany({
      where: { modalityId },
      orderBy: { position: "asc" },
      include: {
        team: {
          include: {
            members: { include: { user: true } },
            modality: true,
          },
        },
      },
    });
  }

  findByContestId(contestId: string) {
    return prisma.winner.findMany({
      where: {
        modality: { contestId },
      },
      orderBy: [{ modality: { name: "asc" } }, { position: "asc" }],
      include: {
        team: {
          include: {
            members: { include: { user: true } },
            modality: true,
          },
        },
        modality: true,
      },
    });
  }

  findByTeamId(teamId: string) {
    return prisma.winner.findUnique({
      where: { teamId },
      include: {
        team: {
          include: {
            members: { include: { user: true } },
            modality: true,
            contest: true,
          },
        },
        modality: true,
      },
    });
  }

  countByModalityId(modalityId: string) {
    return prisma.winner.count({
      where: { modalityId },
    });
  }

  async checkPositionExists(modalityId: string, position: "FIRST" | "SECOND" | "THIRD") {
    const existing = await prisma.winner.findUnique({
      where: {
        modalityId_position: { modalityId, position },
      },
    });
    return !!existing;
  }

  create(data: Prisma.WinnerCreateInput) {
    return prisma.winner.create({ data });
  }

  update(id: string, data: Prisma.WinnerUpdateInput) {
    return prisma.winner.update({ where: { id }, data });
  }

  delete(id: string) {
    return prisma.winner.delete({ where: { id } });
  }
}
