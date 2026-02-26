import { prisma } from "../prisma/client";
import { TeamsRepository } from "../repositories/teams.repository";
import { ContestsRepository } from "../repositories/contests.repository";
import { ModalitiesRepository } from "../repositories/modalities.repository";

type CreateTeamDTO = {
  name: string;
  contestId: string;
  modalityId: string;
  memberUserIds: string[]; // 1 o 2 (ids de usuarios)
  requesterUserId: string;
};

export class TeamsService {
  constructor(
    private repo = new TeamsRepository(),
    private contestsRepo = new ContestsRepository(),
    private modalitiesRepo = new ModalitiesRepository()
  ) {}

  async get(id: string) {
    const team = await this.repo.findById(id);
    if (!team) {
      const err = new Error("Team not found");
      (err as any).statusCode = 404;
      throw err;
    }
    return team;
  }

  list(filters?: { contestId?: string; modalityId?: string }) {
    return this.repo.findMany(filters);
  }

  myTeams(userId: string) {
    return this.repo.findMyTeams(userId);
  }

  async create(dto: CreateTeamDTO) {
    // 1) validar members
    const uniqueMembers = Array.from(new Set(dto.memberUserIds));
    if (uniqueMembers.length < 1 || uniqueMembers.length > 2) {
      const err = new Error("Team must have 1 or 2 members");
      (err as any).statusCode = 400;
      throw err;
    }

    if (!uniqueMembers.includes(dto.requesterUserId)) {
      const err = new Error("Requester must be a team member");
      (err as any).statusCode = 403;
      throw err;
    }

    // 2) contest existe y está OPEN (regla #5)
    const contest = await this.contestsRepo.findById(dto.contestId);
    if (!contest) {
      const err = new Error("Contest not found");
      (err as any).statusCode = 400;
      throw err;
    }
    if (contest.status !== "OPEN") {
      const err = new Error("Cannot register teams when contest is not OPEN");
      (err as any).statusCode = 400;
      throw err;
    }

    // 3) modality existe y pertenece a ese contest (consistencia)
    // OJO: tu repo de modalities incluye contest? si no, lo validamos con prisma directo
    const modality = await prisma.modality.findUnique({ where: { id: dto.modalityId } });
    if (!modality) {
      const err = new Error("Modality not found");
      (err as any).statusCode = 400;
      throw err;
    }
    if (modality.contestId !== dto.contestId) {
      const err = new Error("Modality does not belong to the given contest");
      (err as any).statusCode = 400;
      throw err;
    }

    // 4) crear Team + TeamMembers en transacción
    const created = await prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          name: dto.name,
          contestId: dto.contestId,
          modalityId: dto.modalityId,
        },
      });

      await tx.teamMember.createMany({
        data: uniqueMembers.map((userId) => ({
          teamId: team.id,
          userId,
        })),
      });

      return team;
    });

    // 5) regresa team con includes
    return this.repo.findById(created.id);
  }

  remove(id: string) {
    return this.repo.delete(id);
  }
}