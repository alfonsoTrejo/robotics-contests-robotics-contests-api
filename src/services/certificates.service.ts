import PDFDocument from "pdfkit";
import type { Winner } from "@prisma/client";
import { WinnersRepository } from "../repositories/winners.repository";

export class CertificatesService {
  constructor(private winnersRepo = new WinnersRepository()) {}

  async generateWinnerCertificate(winnerId: string) {
    const winner = await this.winnersRepo.findById(winnerId);
    if (!winner) {
      const err = new Error("Winner not found");
      (err as any).statusCode = 404;
      throw err;
    }

    const buffer = await this.renderWinnerCertificate(winner);
    const filename = `certificate_${winner.id}.pdf`;

    return { buffer, filename, winner };
  }

  private renderWinnerCertificate(winner: Winner & any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const buffers: Buffer[] = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      const teamName = winner.team?.name ?? "";
      const contestTitle = winner.team?.contest?.title ?? winner.modality?.contest?.title ?? "";
      const modalityName = winner.modality?.name ?? winner.team?.modality?.name ?? "";
      const position = winner.position ?? "";
      const members = winner.team?.members?.map((m: any) => m.user?.name).filter(Boolean) ?? [];
      const date = new Date().toLocaleDateString("es-MX");

      doc.fontSize(28).text("Certificado de Ganador", { align: "center" });
      doc.moveDown(1.5);

      doc.fontSize(14).text("Se certifica que:", { align: "center" });
      doc.moveDown(0.8);

      doc.fontSize(18).text(members.join(", ") || "Integrante(s)", { align: "center" });
      doc.moveDown(0.6);

      doc.fontSize(14).text(`Equipo: ${teamName}`, { align: "center" });
      doc.moveDown(0.4);

      doc.fontSize(14).text(`Modalidad: ${modalityName}`, { align: "center" });
      doc.moveDown(0.4);

      doc.fontSize(14).text(`Posicion: ${position}`, { align: "center" });
      doc.moveDown(0.4);

      doc.fontSize(12).text(`Torneo: ${contestTitle}`, { align: "center" });
      doc.moveDown(2);

      doc.fontSize(12).text(`Fecha de emision: ${date}`, { align: "center" });
      doc.moveDown(3);

      doc.fontSize(12).text("Firma institucional", { align: "center" });

      doc.end();
    });
  }
}
