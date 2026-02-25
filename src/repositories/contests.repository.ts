import { prisma } from "../prisma/client";
import type { Prisma, Contest } from "@prisma/client";

export class ContestsRepository {
  findMany() {
    return prisma.contest.findMany({ orderBy: { date: "desc" } });
  }

  findById(id: string) {
    return prisma.contest.findUnique({ where: { id } });
  }

  create(data: Prisma.ContestCreateInput) {
    return prisma.contest.create({ data });
  }

  update(id: string, data: Prisma.ContestUpdateInput) {
    return prisma.contest.update({ where: { id }, data });
  }

  delete(id: string) {
    return prisma.contest.delete({ where: { id } });
  }
}