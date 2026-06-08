import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

@Injectable()
export class PdfService {

  // ─── Acta de Entrega (múltiples activos) ───────────────────────────

  async generateLoanPdf(prestamo: any): Promise<Buffer> {
    return this.generateLoanPdfMultiple([prestamo]);
  }

  async generateLoanPdfMultiple(prestamos: any[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const usuario = prestamos[0].usuario;
      const fechaPrestamo = new Date(prestamos[0].fecha_prestamo).toLocaleDateString();
      const fechaDevolucion = new Date(prestamos[0].fecha_devolucion).toLocaleDateString();
      const pageW = 495; // 595 - 50*2

      // ── Encabezado ──
      doc.font('Helvetica-Bold').fontSize(13)
        .text('ACTA DE ENTREGA DE ACTIVOS DE TI', 50, 50, { align: 'center', width: pageW });
      doc.font('Helvetica').fontSize(9)
        .text('Grupo Vanguard - Control de Activos', 50, doc.y + 4, { align: 'center', width: pageW });

      // Línea separadora
      const lineY = doc.y + 10;
      doc.moveTo(50, lineY).lineTo(545, lineY).lineWidth(1.5).strokeColor('#0066B3').stroke();

      // ── Datos generales ──
      let currentY = lineY + 14;
      const labelCol = 50;
      const valueCol = 200;
      const rowH = 16;

      const infoData: [string, string][] = [
        ['FECHA:', fechaPrestamo],
        ['FECHA EST. DEVOLUCIÓN:', fechaDevolucion],
        ['EMPRESA:', usuario.empresa?.nombre || '-'],
        ['SEDE DE TRABAJO:', usuario.sede?.nombre || '-'],
        ['USUARIO:', usuario.nombre || '-'],
        ['DNI:', usuario.dni || '-'],
        ['ÁREA:', usuario.area?.nombre || '-'],
        ['CARGO:', usuario.cargo?.nombre || '-'],
        ['CORREO:', usuario.correo || '-'],
      ];

      for (const [label, value] of infoData) {
        doc.font('Helvetica-Bold').fontSize(9)
          .text(label, labelCol, currentY, { continued: false });
        doc.font('Helvetica').fontSize(9)
          .text(value, valueCol, currentY, { continued: false });
        currentY += rowH;
      }

      currentY += 8;

      // ── Texto introductorio ──
      doc.font('Helvetica').fontSize(8)
        .text(
          'Por medio de la presente acta, el USUARIO hace recepción de los EQUIPOS con sus respectivos accesorios detallados líneas abajo a la EMPRESA, por intermedio de su GESTOR.',
          50, currentY, { align: 'justify', width: pageW }
        );
      currentY = doc.y + 6;

      doc.font('Helvetica-Bold').fontSize(9)
        .text('Los Equipos incluyen:', 50, currentY);
      currentY = doc.y + 8;

      // ── Tabla de Activos ──
      const colDefs = [
        { label: 'Nº', width: 30 },
        { label: 'EQUIPO(S)', width: 195 },
        { label: 'CONDICIÓN', width: 70 },
        { label: 'SERIE / IMEI', width: 110 },
        { label: 'OBSERVACIÓN', width: 90 },
      ];
      const tableX = 50;

      // Cabecera
      currentY = this.drawRow(doc, currentY, tableX, colDefs.map(c => c.label), colDefs.map(c => c.width), {
        bold: true, bgColor: '#D6E4F0', rowHeight: 20, fontSize: 7.5,
      });

      // Filas de datos
      for (let i = 0; i < prestamos.length; i++) {
        const p = prestamos[i];
        const equipo = `${p.activo.tipo}, ${p.activo.marca}, ${p.activo.modelo}`;
        currentY = this.drawRow(doc, currentY, tableX, [
          String(i + 1),
          equipo,
          p.activo.condicion || 'Usado',
          p.activo.serie || '-',
          p.activo.observaciones || '-',
        ], colDefs.map(c => c.width), {
          rowHeight: 22, fontSize: 7,
        });
      }

      currentY += 10;

      // ── Cláusula legal ──
      doc.font('Helvetica').fontSize(7)
        .text(
          'Los equipos entregados son propiedad de la empresa y están destinados exclusivamente para el desempeño de las actividades laborales. El USUARIO asignado es responsable del buen uso de los equipos y sus accesorios, de acuerdo con lo mencionado en las políticas control y gestión de activos de la empresa. En caso de daño, pérdida o robo, EL USUARIO deberá asumir el costo respectivo según la política de control y gestion de activos TI, EL USUARIO DEBE DE INFORMAR DENTRO DE LAS 24 HORAS LO SUCEDIDO A SOPORTE TI según conforme a dichas políticas. Los equipos tienen vigencia permanente mientras el USUARIO esté en la empresa y deben ser devueltos en las condiciones originales al finalizar la relación laboral, salvo el desgaste normal por uso adecuado.',
          50, currentY, { align: 'justify', width: pageW }
        );
      currentY = doc.y + 4;

      doc.font('Helvetica').fontSize(7)
        .text(
          'Por tanto, EL USUARIO se compromete a usar de manera responsable los equipos y condiciones de trabajo entregadas por la empresa en este acto, de acuerdo con lo mencionado en las políticas de gestión de activos de la empresa. De comprobarse el uso indebido, falta de diligencia o mala fe por parte del USUARIO, este AUTORIZA a LA EMPRESA a realizar los descuentos correspondientes sobre sus remuneraciones, beneficios sociales y liquidación al cese, hasta reponer el valor total de los equipos y/o condiciones de trabajo entregadas.',
          50, currentY, { align: 'justify', width: pageW }
        );
      currentY = doc.y + 20;

      // ── Firma ──
      // Verificar si hay espacio suficiente, sino nueva página
      if (currentY > 680) {
        doc.addPage();
        currentY = 50;
      }

      if (prestamos[0].firma_digital) {
        try {
          const base64Data = prestamos[0].firma_digital.replace(/^data:image\/png;base64,/, '');
          doc.image(Buffer.from(base64Data, 'base64'), 50, currentY, { width: 140, height: 60, fit: [140, 60] });
          currentY += 65;
        } catch (_) { /* firma inválida */ }
      }

      doc.font('Helvetica').fontSize(8)
        .text('________________________', 50, currentY);
      currentY = doc.y + 2;
      doc.font('Helvetica-Bold').fontSize(8)
        .text(usuario.nombre || '', 50, currentY);
      currentY = doc.y + 2;
      doc.font('Helvetica').fontSize(8)
        .text(`DNI: ${usuario.dni || '-'}`, 50, currentY);

      doc.end();
    });
  }

  // ─── Acta de Devolución (múltiples activos) ────────────────────────

  async generateReturnPdf(prestamo: any): Promise<Buffer> {
    return this.generateReturnPdfMultiple([prestamo]);
  }

  async generateReturnPdfMultiple(prestamos: any[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const usuario = prestamos[0].usuario;
      const fechaPrestamo = new Date(prestamos[0].fecha_prestamo).toLocaleDateString();
      const fechaDevolucion = new Date(prestamos[0].fecha_devolucion || new Date()).toLocaleDateString();
      const pageW = 495;

      // ── Encabezado ──
      doc.font('Helvetica-Bold').fontSize(13)
        .text('ACTA DE DEVOLUCIÓN DE ACTIVOS DE TI', 50, 50, { align: 'center', width: pageW });
      doc.font('Helvetica').fontSize(9)
        .text('Grupo Vanguard - Control de Activos', 50, doc.y + 4, { align: 'center', width: pageW });

      const lineY = doc.y + 10;
      doc.moveTo(50, lineY).lineTo(545, lineY).lineWidth(1.5).strokeColor('#0066B3').stroke();

      // ── Datos generales ──
      let currentY = lineY + 14;
      const labelCol = 50;
      const valueCol = 200;
      const rowH = 16;

      const infoData: [string, string][] = [
        ['FECHA:', new Date().toLocaleDateString()],
        ['FECHA ENTREGA ORIGINAL:', fechaPrestamo],
        ['FECHA DEVOLUCIÓN:', fechaDevolucion],
        ['EMPRESA:', usuario.empresa?.nombre || '-'],
        ['SEDE:', usuario.sede?.nombre || '-'],
        ['USUARIO:', usuario.nombre || '-'],
        ['DNI:', usuario.dni || '-'],
        ['ÁREA:', usuario.area?.nombre || '-'],
        ['CARGO:', usuario.cargo?.nombre || '-'],
      ];

      for (const [label, value] of infoData) {
        doc.font('Helvetica-Bold').fontSize(9)
          .text(label, labelCol, currentY, { continued: false });
        doc.font('Helvetica').fontSize(9)
          .text(value, valueCol, currentY, { continued: false });
        currentY += rowH;
      }

      currentY += 8;

      doc.font('Helvetica').fontSize(8)
        .text(
          'Por medio de la presente acta, el USUARIO hace devolución formal de los EQUIPOS con sus respectivos accesorios detallados líneas abajo a la EMPRESA, por intermedio de su GESTOR.',
          50, currentY, { align: 'justify', width: pageW }
        );
      currentY = doc.y + 6;

      doc.font('Helvetica-Bold').fontSize(9)
        .text('Los Equipos devueltos:', 50, currentY);
      currentY = doc.y + 8;

      // ── Tabla de Activos ──
      const colDefs = [
        { label: 'Nº', width: 30 },
        { label: 'EQUIPO(S)', width: 195 },
        { label: 'CONDICIÓN', width: 70 },
        { label: 'SERIE / IMEI', width: 110 },
        { label: 'OBSERVACIÓN', width: 90 },
      ];
      const tableX = 50;

      currentY = this.drawRow(doc, currentY, tableX, colDefs.map(c => c.label), colDefs.map(c => c.width), {
        bold: true, bgColor: '#D6E4F0', rowHeight: 20, fontSize: 7.5,
      });

      for (let i = 0; i < prestamos.length; i++) {
        const p = prestamos[i];
        const equipo = `${p.activo.tipo}, ${p.activo.marca}, ${p.activo.modelo}`;
        currentY = this.drawRow(doc, currentY, tableX, [
          String(i + 1),
          equipo,
          p.activo.condicion || 'Usado',
          p.activo.serie || '-',
          p.activo.observaciones || '-',
        ], colDefs.map(c => c.width), {
          rowHeight: 22, fontSize: 7,
        });
      }

      currentY += 10;

      // ── Cláusula legal ──
      doc.font('Helvetica').fontSize(7)
        .text(
          'Los equipos entregados son propiedad de la empresa y están destinados exclusivamente para el desempeño de las actividades laborales. El USUARIO asignado es responsable del buen uso de los equipos y sus accesorios, de acuerdo con lo mencionado en las políticas control y gestión de activos de la empresa. En caso de daño, pérdida o robo, EL USUARIO deberá asumir el costo respectivo según la política de control y gestion de activos TI, EL USUARIO DEBE DE INFORMAR DENTRO DE LAS 24 HORAS LO SUCEDIDO A SOPORTE TI según conforme a dichas políticas. Los equipos tienen vigencia permanente mientras el USUARIO esté en la empresa y deben ser devueltos en las condiciones originales al finalizar la relación laboral, salvo el desgaste normal por uso adecuado.',
          50, currentY, { align: 'justify', width: pageW }
        );
      currentY = doc.y + 4;

      doc.font('Helvetica').fontSize(7)
        .text(
          'Por tanto, EL USUARIO se compromete a usar de manera responsable los equipos y condiciones de trabajo entregadas por la empresa en este acto, de acuerdo con lo mencionado en las políticas de gestión de activos de la empresa. De comprobarse el uso indebido, falta de diligencia o mala fe por parte del USUARIO, este AUTORIZA a LA EMPRESA a realizar los descuentos correspondientes sobre sus remuneraciones, beneficios sociales y liquidación al cese, hasta reponer el valor total de los equipos y/o condiciones de trabajo entregadas.',
          50, currentY, { align: 'justify', width: pageW }
        );
      currentY = doc.y + 20;

      // ── Firma ──
      if (currentY > 680) {
        doc.addPage();
        currentY = 50;
      }

      const firmaData = prestamos[0].firma_devolucion;
      if (firmaData) {
        try {
          const base64Data = firmaData.replace(/^data:image\/png;base64,/, '');
          doc.image(Buffer.from(base64Data, 'base64'), 50, currentY, { width: 140, height: 60, fit: [140, 60] });
          currentY += 65;
        } catch (_) { /* firma inválida */ }
      }

      doc.font('Helvetica').fontSize(8)
        .text('________________________', 50, currentY);
      currentY = doc.y + 2;
      doc.font('Helvetica-Bold').fontSize(8)
        .text(usuario.nombre || '', 50, currentY);
      currentY = doc.y + 2;
      doc.font('Helvetica').fontSize(8)
        .text(`DNI: ${usuario.dni || '-'}`, 50, currentY);

      doc.end();
    });
  }

  // ─── Utilidad: dibujar una fila de tabla ───────────────────────────

  private drawRow(
    doc: PDFKit.PDFDocument,
    y: number,
    startX: number,
    cells: string[],
    widths: number[],
    opts: { bold?: boolean; bgColor?: string; rowHeight?: number; fontSize?: number },
  ): number {
    const h = opts.rowHeight || 20;
    const fs = opts.fontSize || 8;
    const totalW = widths.reduce((a, b) => a + b, 0);

    // Fondo
    if (opts.bgColor) {
      doc.save();
      doc.rect(startX, y, totalW, h).fill(opts.bgColor);
      doc.restore();
    }

    // Bordes de cada celda
    doc.save();
    doc.lineWidth(0.5).strokeColor('#333333');
    let cx = startX;
    for (const w of widths) {
      doc.rect(cx, y, w, h).stroke();
      cx += w;
    }
    doc.restore();

    // Texto de cada celda
    doc.save();
    doc.font(opts.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(fs).fillColor('#000000');
    cx = startX;
    for (let i = 0; i < cells.length; i++) {
      const cellText = cells[i] || '-';
      const textY = y + (h - fs) / 2;
      doc.text(cellText, cx + 3, textY, {
        width: widths[i] - 6,
        height: h,
        lineBreak: false,
        ellipsis: true,
      });
      cx += widths[i];
    }
    doc.restore();

    return y + h;
  }
}
