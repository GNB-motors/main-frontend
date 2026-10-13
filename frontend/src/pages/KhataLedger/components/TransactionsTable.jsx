import React from 'react';
import { Trash2, Edit2, Truck, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  SOURCE_LABELS,
  SOURCE_COLORS,
  formatCurrency,
  formatDate,
  getDriverName,
  getVehicleLabel,
} from '../utils';

function TransactionsTable({ expenses, openEdit, setDeleteTarget }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Vehicle</TableHead>
          <TableHead>Driver</TableHead>
          <TableHead>Source</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.map((exp) => (
          <TableRow key={`${exp.source}-${exp._id}`}>
            <TableCell className="whitespace-nowrap text-sm">
              {formatDate(exp.expenseDate)}
            </TableCell>
            <TableCell>
              <div>
                <p className="text-sm font-medium">{exp.title}</p>
                {exp.description && (
                  <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">
                    {exp.description}
                  </p>
                )}
              </div>
            </TableCell>
            <TableCell>
              <Badge
                className={`text-xs ${CATEGORY_COLORS[exp.category] || CATEGORY_COLORS.MISCELLANEOUS}`}
              >
                {CATEGORY_LABELS[exp.category] || exp.category}
              </Badge>
            </TableCell>
            <TableCell className="font-semibold">{formatCurrency(exp.amount)}</TableCell>
            <TableCell className="text-sm">
              {exp.vehicle ? (
                <span className="flex items-center gap-1">
                  <Truck size={14} className="text-gray-400" />
                  {getVehicleLabel(exp.vehicle)}
                </span>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </TableCell>
            <TableCell className="text-sm">
              {exp.driver ? (
                <span className="flex items-center gap-1">
                  <User size={14} className="text-gray-400" />
                  {getDriverName(exp.driver)}
                </span>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={`text-xs ${SOURCE_COLORS[exp.source] || SOURCE_COLORS.MANUAL}`}
              >
                {SOURCE_LABELS[exp.source] || exp.source}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              {exp.source === 'MANUAL' ? (
                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => openEdit(exp)}
                    className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
                    title="Edit"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(exp)}
                    className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ) : (
                <span className="text-xs text-gray-400">Read-only</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default TransactionsTable;
