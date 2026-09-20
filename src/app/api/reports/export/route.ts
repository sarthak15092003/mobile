import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { RepairStatus, Prisma } from '@prisma/client';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const format = (searchParams.get('format') || 'csv').toLowerCase();
    const dateFrom = searchParams.get('date_from')?.trim();
    const dateTo = searchParams.get('date_to')?.trim();
    const technicianId = searchParams.get('technician_id')?.trim();
    const createdById = searchParams.get('created_by_id')?.trim();
    const status = searchParams.get('status')?.trim() as RepairStatus | undefined;

    const where: Prisma.RepairWhereInput = {};

    if (status && Object.values(RepairStatus).includes(status)) {
      where.status = status;
    }
    if (technicianId) {
      where.assigned_to_id = technicianId;
    }
    if (createdById) {
      where.created_by_id = createdById;
    }
    if (dateFrom || dateTo) {
      where.repair_date = {};
      if (dateFrom) where.repair_date.gte = new Date(dateFrom);
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        where.repair_date.lte = to;
      }
    }

    const repairs = await prisma.repair.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        assigned_to: { select: { name: true, email: true } },
        completed_by: { select: { name: true, email: true } },
        created_by: { select: { name: true, email: true } },
      },
    });

    // Format rows for tabular export
    const rows = repairs.map((r) => ({
      'Repair ID': r.repair_id,
      'Serial Number': r.serial_number,
      'Mobile Device': r.mobile_name,
      'Problem Description': r.problem,
      'Status': r.status,
      'Repair Date': new Date(r.repair_date).toISOString().split('T')[0],
      'Additional ID': r.additional_id || '',
      'Assigned To': r.assigned_to ? `${r.assigned_to.name} (${r.assigned_to.email})` : 'Unassigned',
      'Completed By': r.completed_by ? `${r.completed_by.name} (${r.completed_by.email})` : '',
      'Completion Date': r.completion_date ? new Date(r.completion_date).toISOString().split('T')[0] : '',
      'Created By': r.created_by ? `${r.created_by.name} (${r.created_by.email})` : '',
      'Created At': new Date(r.created_at).toLocaleString(),
      'Notes': r.notes || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Repairs');

    const timestamp = new Date().toISOString().split('T')[0];

    if (format === 'xlsx' || format === 'excel') {
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="repair_report_${timestamp}.xlsx"`,
        },
      });
    }

    // Default: CSV with UTF-8 BOM for Microsoft Excel compatibility
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    const bom = '\uFEFF';
    return new NextResponse(bom + csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="repair_report_${timestamp}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export repair report.' }, { status: 500 });
  }
}
