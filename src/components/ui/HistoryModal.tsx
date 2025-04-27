import React, { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import Modal from './Modal';
import DataTable from './DataTable';
import Badge from './Badge';
import Button from './Button';
import { Calendar, ChevronDown } from 'lucide-react';

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
  const [filteredData, setFilteredData] = useState(data);
  const [startDate, setStartDate] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);

  useEffect(() => {
    filterData();
  }, [data, startDate, endDate]);

  const filterData = () => {
    if (!startDate && !endDate) {
      setFilteredData(data);
      return;
    }

    const filtered = data.filter((item) => {
      const itemDate = new Date(item.created_at);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start && end) {
        // Set end date to end of day
        end.setHours(23, 59, 59, 999);
        return itemDate >= start && itemDate <= end;
      } else if (start) {
        return itemDate >= start;
      } else if (end) {
        end.setHours(23, 59, 59, 999);
        return itemDate <= end;
      }
      return true;
    });

    setFilteredData(filtered);
  };

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
      {type === 'attendance' && (
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
            <div className="relative">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center" 
                onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
              >
                <Calendar size={16} className="mr-2" />
                Date Range
                <ChevronDown size={16} className="ml-2" />
              </Button>
              
              {isDateFilterOpen && (
                <div className="absolute z-10 mt-1 bg-white shadow-lg rounded-md border border-gray-200 p-4 w-72">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-between">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setStartDate('');
                          setEndDate('');
                        }}
                      >
                        Clear
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          filterData();
                          setIsDateFilterOpen(false);
                        }}
                      >
                        Apply Filter
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-sm text-gray-500">
              Showing {filteredData.length} of {data.length} records
            </div>
          </div>
          
          {(startDate || endDate) && (
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center">
                <span className="mr-1">Date Range:</span>
                {startDate && format(new Date(startDate), 'MMM dd, yyyy')}
                {startDate && endDate && ' - '}
                {endDate && format(new Date(endDate), 'MMM dd, yyyy')}
                <button 
                  className="ml-2 text-blue-700 hover:text-blue-900"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      <DataTable
        columns={type === 'credit' ? creditColumns : attendanceColumns}
        data={type === 'attendance' ? filteredData : data}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyMessage={`No ${type} history available${type === 'attendance' ? ' for the selected date range' : ''}`}
      />
    </Modal>
  );
};

export default HistoryModal;