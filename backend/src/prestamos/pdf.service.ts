import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

@Injectable()
export class PdfService {
  async generateLoanPdf(prestamo: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
      
      doc.fontSize(20).text('Acta de Entrega de Activo VGI', { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(12).text(`Fecha de Préstamo: ${new Date(prestamo.fecha_prestamo).toLocaleDateString()}`);
      doc.text(`Fecha Estimada de Devolución: ${new Date(prestamo.fecha_devolucion).toLocaleDateString()}`);
      doc.moveDown();
      
      doc.text(`Por el presente documento, la empresa hace entrega del siguiente activo al usuario ${prestamo.usuario.nombre} (${prestamo.usuario.correo}):`);
      doc.moveDown();
      
      doc.text(`Número de Serie: ${prestamo.activo.serie}`);
      doc.text(`Tipo de Equipo: ${prestamo.activo.tipo}`);
      doc.text(`Marca: ${prestamo.activo.marca}`);
      doc.text(`Modelo: ${prestamo.activo.modelo}`);
      doc.text(`Número de Serie: ${prestamo.activo.serie}`);
      doc.moveDown(2);
      
      doc.text('El usuario se compromete a devolver el equipo en las mismas condiciones en las que le fue entregado. La falta de devolución podría incurrir en sanciones.');
      doc.moveDown(3);
      
      if (prestamo.firma_digital) {
        doc.text('Firma de Conformidad del Usuario:');
        doc.moveDown();
        const base64Data = prestamo.firma_digital.replace(/^data:image\/png;base64,/, "");
        doc.image(Buffer.from(base64Data, 'base64'), { width: 200 });
      }
      
      doc.end();
    });
  }

  async generateReturnPdf(prestamo: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
      
      doc.fontSize(20).text('Acta de Devolución de Activo VGI', { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(12).text(`Fecha de Préstamo: ${new Date(prestamo.fecha_prestamo).toLocaleDateString()}`);
      doc.text(`Fecha de Devolución: ${new Date(prestamo.fecha_devolucion || new Date()).toLocaleDateString()}`);
      doc.moveDown();
      
      doc.text(`Por el presente documento, se hace constar la devolución del siguiente activo por parte de ${prestamo.usuario.nombre} (${prestamo.usuario.correo}):`);
      doc.moveDown();
      
      doc.text(`Tipo de Equipo: ${prestamo.activo.tipo}`);
      doc.text(`Marca: ${prestamo.activo.marca}`);
      doc.text(`Modelo: ${prestamo.activo.modelo}`);
      doc.text(`Número de Serie: ${prestamo.activo.serie}`);
      doc.moveDown(2);
      
      doc.text('La devolución del equipo ha sido confirmada y el activo se registra nuevamente en inventario como disponible.');
      doc.moveDown(3);
      
      if (prestamo.firma_devolucion) {
        doc.text('Firma de Conformidad de Devolución:');
        doc.moveDown();
        const base64Data = prestamo.firma_devolucion.replace(/^data:image\/png;base64,/, "");
        doc.image(Buffer.from(base64Data, 'base64'), { width: 200 });
      }
      
      doc.end();
    });
  }
}
