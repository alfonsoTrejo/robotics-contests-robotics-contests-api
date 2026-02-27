import { TeamsRepository } from "../repositories/teams.repository";

export class HistoryService {
  constructor(private teamsRepo = new TeamsRepository()) {}

  async myHistory(userId: string) {
    const teams = await this.teamsRepo.findMyHistory(userId);

    return teams.map((team) => {
      const winner = team.winner
        ? {
            id: team.winner.id,
            position: team.winner.position,
            modalityId: team.winner.modalityId,
            certificateUrl: `/api/certificates/winner/${team.winner.id}`,
          }
        : null;

      return {
        id: team.id,
        name: team.name,
        createdAt: team.createdAt,
        contest: team.contest,
        modality: team.modality,
        members: team.members.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
        })),
        winner,
      };
    });
  }
}
