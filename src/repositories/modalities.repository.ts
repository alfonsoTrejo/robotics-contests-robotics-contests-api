import { prisma } from "../prisma/client";
import type { Prisma } from "@prisma/client";

export class ModalitiesRepository {
  findMany() {
    return prisma.modality.findMany({
      orderBy: { name: "asc" },
      include: { contest: true },
    });
  }

  findById(id: string) {
    return prisma.modality.findUnique({
      where: { id },
      include: { contest: true },
    });
  }

  findByContestId(contestId: string) {
    return prisma.modality.findMany({
      where: { contestId },
      orderBy: { name: "asc" },
    });
  }

  create(data: Prisma.ModalityCreateInput) {
    return prisma.modality.create({ data });
  }

  update(id: string, data: Prisma.ModalityUpdateInput) {
    return prisma.modality.update({ where: { id }, data });
  }

  delete(id: string) {
    return prisma.modality.delete({ where: { id } });
  }
}