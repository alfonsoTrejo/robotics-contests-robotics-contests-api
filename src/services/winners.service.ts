import { WinnersRepository } from "../repositories/winners.repository";
import { TeamsRepository } from "../repositories/teams.repository";
import { ModalitiesRepository } from "../repositories/modalities.repository";

type WinnerPosition = "FIRST" | "SECOND" | "THIRD";

type CreateWinnerDTO = {
  teamId: string;
  modalityId: string;
  position: WinnerPosition;
};

type UpdateWinnerDTO = {
  position?: WinnerPosition;
};

export class WinnersService {
  constructor(
    private repo = new WinnersRepository(),
    private teamsRepo = new TeamsRepository(),
    private modalitiesRepo = new ModalitiesRepository()
  ) {}

  async get(id: string) {
    const winner = await this.repo.findById(id);
    if (!winner) {
      const err = new Error("Winner not found");
      (err as any).statusCode = 404;
      throw err;
    }
    return winner;
  }

  getByModalityId(modalityId: string) {
    return this.repo.findByModalityId(modalityId);
  }

  getByContestId(contestId: string) {
    return this.repo.findByContestId(contestId);
  }

  async create(dto: CreateWinnerDTO) {
    // 1) Validar que el team existe
    const team = await this.teamsRepo.findById(dto.teamId);
    if (!team) {
      const err = new Error("Team not found");
      (err as any).statusCode = 404;
      throw err;
    }

    // 2) Validar que la modalidad existe
    const modality = await this.modalitiesRepo.findById(dto.modalityId);
    if (!modality) {
      const err = new Error("Modality not found");
      (err as any).statusCode = 404;
      throw err;
    }

    // 3) Validar que el team pertenece a esa modalidad
    if (team.modalityId !== dto.modalityId) {
      const err = new Error("Team does not belong to the specified modality");
      (err as any).statusCode = 400;
      throw err;
    }

    // 4) Validar que la posición no esté ocupada (regla: solo un ganador por posición)
    const positionTaken = await this.repo.checkPositionExists(dto.modalityId, dto.position);
    if (positionTaken) {
      const err = new Error(`Position ${dto.position} is already taken for this modality`);
      (err as any).statusCode = 400;
      throw err;
    }

    // 5) Validar que no haya más de 3 ganadores por modalidad
    const winnersCount = await this.repo.countByModalityId(dto.modalityId);
    if (winnersCount >= 3) {
      const err = new Error("Maximum 3 winners per modality");
      (err as any).statusCode = 400;
      throw err;
    }

    // 6) Validar que el equipo no haya ganado ya en otra posición de la misma modalidad
    const existingWinner = await this.repo.findByTeamId(dto.teamId);
    if (existingWinner) {
      const err = new Error("Team already has a winner position");
      (err as any).statusCode = 400;
      throw err;
    }

    // 7) Crear el ganador
    const winner = await this.repo.create({
      team: { connect: { id: dto.teamId } },
      modality: { connect: { id: dto.modalityId } },
      position: dto.position,
    });

    // 8) Retornar con includes
    return this.repo.findById(winner.id);
  }

  async update(id: string, dto: UpdateWinnerDTO) {
    // 1) Verificar que el winner existe
    const existing = await this.repo.findById(id);
    if (!existing) {
      const err = new Error("Winner not found");
      (err as any).statusCode = 404;
      throw err;
    }

    // 2) Si se cambia la posición, validar que no esté ocupada
    if (dto.position && dto.position !== existing.position) {
      const positionTaken = await this.repo.checkPositionExists(existing.modalityId, dto.position);
      if (positionTaken) {
        const err = new Error(`Position ${dto.position} is already taken for this modality`);
        (err as any).statusCode = 400;
        throw err;
      }
    }

    // 3) Actualizar
    await this.repo.update(id, { position: dto.position });

    // 4) Retornar con includes
    return this.repo.findById(id);
  }

  async remove(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) {
      const err = new Error("Winner not found");
      (err as any).statusCode = 404;
      throw err;
    }

    return this.repo.delete(id);
  }
}
