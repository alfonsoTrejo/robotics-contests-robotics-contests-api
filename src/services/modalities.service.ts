import { ModalitiesRepository } from "../repositories/modalities.repository";
import { ContestsRepository } from "../repositories/contests.repository";

type CreateModalityDTO = {
  name: string;
  description?: string;
  contestId: string;
};

type UpdateModalityDTO = Partial<Omit<CreateModalityDTO, "contestId">> & {
  contestId?: string;
};

export class ModalitiesService {
  constructor(
    private repo = new ModalitiesRepository(),
    private contestsRepo = new ContestsRepository()
  ) {}

  list() {
    return this.repo.findMany();
  }

  async get(id: string) {
    const modality = await this.repo.findById(id);
    if (!modality) {
      const err = new Error("Modality not found");
      (err as any).statusCode = 404;
      throw err;
    }
    return modality;
  }

  listByContest(contestId: string) {
    return this.repo.findByContestId(contestId);
  }

  async create(dto: CreateModalityDTO) {
    // valida contest existe
    const contest = await this.contestsRepo.findById(dto.contestId);
    if (!contest) {
      const err = new Error("Contest not found for contestId");
      (err as any).statusCode = 400;
      throw err;
    }

    return this.repo.create({
      name: dto.name,
      description: dto.description ?? "",
      contest: { connect: { id: dto.contestId } },
    });
  }

  async update(id: string, dto: UpdateModalityDTO) {
    const data: any = { ...dto };

    // si cambian contestId, valida que exista
    if (dto.contestId) {
      const contest = await this.contestsRepo.findById(dto.contestId);
      if (!contest) {
        const err = new Error("Contest not found for contestId");
        (err as any).statusCode = 400;
        throw err;
      }
      data.contest = { connect: { id: dto.contestId } };
      delete data.contestId;
    }

    return this.repo.update(id, data);
  }

  remove(id: string) {
    return this.repo.delete(id);
  }
}