import React from 'react';
import { format } from 'date-fns';
import Modal from './Modal';
import DataTable from './DataTable';
import Badge from './Badge';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: 'credit' | 'attendance';
  data: any[];
  isLoading?: boolean;
}

const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  title,
  type,
  data,
  isLoading = false,
}) => {
  const creditColumns = [
    {
      header: 'Date',
      accessor: (item: any) => format(new Date(item.created_at), 'MMM dd, yyyy HH:mm'),
    },
    {
      header: 'Amount',
      accessor: (item: any) => (
        <span className={item.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
          {item.amount >= 0 ? '+' : ''}{item.amount}
        </span>
      ),
    },
    {
      header: 'Previous Balance',
      accessor: 'previous_balance',
    },
    {
      header: 'New Balance',
      accessor: 'new_balance',
    },
    {
      header: 'Description',
      accessor: 'description',
    },
  ];

  const attendanceColumns = [
    {
      header: 'Date',
      accessor: (item: any) => format(new Date(item.created_at), 'MMM dd, yyyy HH:mm'),
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <Badge
          variant={item.status === 'present' ? 'success' : 'danger'}
        >
          {item.status}
        </Badge>
      ),
    },
    // {
    //   header: 'New Status',
    //   accessor: (item: any) => (
    //     <Badge
    //       variant={item.new_status === 'present' ? 'success' : 'danger'}
    //     >
    //       {item.new_status}
    //     </Badge>
    //   ),
    // },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="xl"
    >
      <DataTable
        columns={type === 'credit' ? creditColumns : attendanceColumns}
        data={data}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyMessage={`No ${type} history available`}
      />
    </Modal>
  );
};

export default HistoryModal;