import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabase';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';

interface Visitor {
  id: string;
  name: string;
  phone: string;
  email?: string;
  purpose: string;
  created_at: string;
}

const Visitors: React.FC = () => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentVisitor, setCurrentVisitor] = useState<Visitor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    purpose: ''
  });

  useEffect(() => {
    loadVisitors();
  }, []);

  const loadVisitors = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('visitors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVisitors(data || []);
    } catch (error) {
      console.error('Error loading visitors:', error);
      toast.error('Failed to load visitors');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const openAddModal = () => {
    setCurrentVisitor(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      purpose: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (visitor: Visitor) => {
    setCurrentVisitor(visitor);
    setFormData({
      name: visitor.name,
      phone: visitor.phone,
      email: visitor.email || '',
      purpose: visitor.purpose
    });
    setIsModalOpen(true);
  };

  const openDeleteModal = (visitor: Visitor) => {
    setCurrentVisitor(visitor);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentVisitor) {
        // Update existing visitor
        const { error } = await supabase
          .from('visitors')
          .update({
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            purpose: formData.purpose,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentVisitor.id);

        if (error) throw error;
        toast.success('Visitor updated successfully');
      } else {
        // Create new visitor
        const { error } = await supabase
          .from('visitors')
          .insert({
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            purpose: formData.purpose
          });

        if (error) throw error;
        toast.success('Visitor added successfully');
      }

      setIsModalOpen(false);
      loadVisitors();
    } catch (error) {
      console.error('Error saving visitor:', error);
      toast.error('Failed to save visitor');
    }
  };

  const handleDelete = async () => {
    if (!currentVisitor) return;

    try {
      const { error } = await supabase
        .from('visitors')
        .delete()
        .eq('id', currentVisitor.id);

      if (error) throw error;
      toast.success('Visitor deleted successfully');
      setIsDeleteModalOpen(false);
      loadVisitors();
    } catch (error) {
      console.error('Error deleting visitor:', error);
      toast.error('Failed to delete visitor');
    }
  };

  // Format date to a user-friendly format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const filteredVisitors = visitors.filter(visitor => 
    visitor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (visitor.email && visitor.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    visitor.purpose.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Visitor Management</h1>
        <div className="flex items-center space-x-4">
          <div className="w-64 mt-4">
            <Input
              placeholder="Search visitors..."
              icon={<Search size={18} className="text-gray-400" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={openAddModal} className="flex items-center">
            <Plus size={18} className="mr-2" />
            Add Visitor
          </Button>
        </div>
      </div>

      <Card>
        <DataTable
          columns={[
            {
              header: 'Name',
              accessor: (visitor) => visitor.name,
            },
            {
              header: 'Phone',
              accessor: (visitor) => visitor.phone,
            },
            {
              header: 'Email',
              accessor: (visitor) => visitor.email || '-',
            },
            {
              header: 'Purpose',
              accessor: (visitor) => visitor.purpose,
            },
            {
              header: 'Visit Date',
              accessor: (visitor) => formatDate(visitor.created_at),
            },
            {
              header: 'Actions',
              accessor: (visitor) => (
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditModal(visitor)}
                    className="flex items-center"
                  >
                    <Edit size={16} className="mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => openDeleteModal(visitor)}
                    className="flex items-center"
                  >
                    <Trash2 size={16} className="mr-1" />
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
          data={filteredVisitors}
          keyExtractor={(visitor) => visitor.id}
          isLoading={isLoading}
          emptyMessage="No visitors found"
        />
      </Card>

      {/* Add/Edit Visitor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentVisitor ? 'Edit Visitor' : 'Add New Visitor'}
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
            />
            <Input
              label="Purpose"
              name="purpose"
              value={formData.purpose}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {currentVisitor ? 'Update Visitor' : 'Add Visitor'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
        size="sm"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete visitor {currentVisitor?.name}?</p>
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Visitors;