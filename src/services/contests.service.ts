import { ContestsRepository } from "../repositories/contests.repository";

type CreateContestDTO = {
  title: string;
  description?: string;
  date: string;      // ISO string
  location?: string;
};

type UpdateContestDTO = Partial<CreateContestDTO> & {
  status?: "OPEN" | "CLOSED" | "FINISHED";
};

export class ContestsService {
  constructor(private repo = new ContestsRepository()) {}

  list() {
    return this.repo.findMany();
  }

  async get(id: string) {
    const contest = await this.repo.findById(id);
    if (!contest) {
      const err = new Error("Contest not found");
      (err as any).statusCode = 404;
      throw err;
    }
    return contest;
  }

  create(dto: CreateContestDTO) {
    return this.repo.create({
      title: dto.title,
      description: dto.description ?? "",
      date: new Date(dto.date),
      location: dto.location ?? "",
      status: "OPEN",
    });
  }

  update(id: string, dto: UpdateContestDTO) {
    const data: any = { ...dto };
    if (dto.date) data.date = new Date(dto.date);
    return this.repo.update(id, data);
  }

  remove(id: string) {
    return this.repo.delete(id);
  }
}