import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Search, Plus, Trash2, Eye, FileText, Image as ImageIcon } from 'lucide-react';
import TableWrapper from '../../components/TableWrapper';
import ModalWrapper from '../../components/ModalWrapper';
import AddVehicleModal from '../../components/modals/AddVehicleModal';
import { vehicleService } from '../../services/vehicle.service';

export default function Master() {
  const [vehicles, setVehicles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null); // { docType, docImage }

  const loadVehicles = () => {
    setLoading(true);
    try {
      const data = vehicleService.getVehicles();
      setVehicles(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load registered vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleDelete = (id, vehicleNo) => {
    if (window.confirm(`Are you sure you want to delete vehicle ${vehicleNo}?`)) {
      try {
        vehicleService.deleteVehicle(id);
        toast.success(`Vehicle ${vehicleNo} deleted successfully`);
        loadVehicles();
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete vehicle');
      }
    }
  };

  // Filter vehicles based on search query
  const displayedVehicles = vehicles.filter((v) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      v.vehicleNo.toLowerCase().includes(query) ||
      (v.driverName && v.driverName.toLowerCase().includes(query)) ||
      v.fuelType.toLowerCase().includes(query)
    );
  });

  const inputCls = "block w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all";

  return (
    <div className="space-y-5 flex-1 flex flex-col min-h-0 overflow-y-auto pr-1 pt-2">
      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Vehicle No, Driver, or Fuel Type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={inputCls}
          />
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm whitespace-nowrap"
        >
          <Plus size={15} />
          Register Vehicle
        </button>
      </div>

      {/* Vehicles Table */}
      <div className="flex-1 min-h-0 flex flex-col">
        <TableWrapper
          headers={['Vehicle No', "Driver's Name", 'Fuel Type', 'Mileage', 'Last KM Reading', 'Documents', 'Actions']}
          data={displayedVehicles}
          loading={loading}
          emptyMessage="No registered vehicles found"
          renderRow={(v) => (
            <tr key={v.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-5 py-4 text-sm font-bold text-slate-900 font-mono">{v.vehicleNo}</td>
              <td className="px-5 py-4 text-sm text-slate-600 font-semibold">{v.driverName || '—'}</td>
              <td className="px-5 py-4 text-xs font-semibold text-slate-500">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                  v.fuelType === 'Diesel' 
                    ? 'bg-amber-50 text-amber-700 border-amber-200' 
                    : 'bg-sky-50 text-sky-700 border-sky-200'
                }`}>
                  {v.fuelType}
                </span>
              </td>
              <td className="px-5 py-4 text-sm font-medium text-slate-600">{v.mileage} KM/L</td>
              <td className="px-5 py-4 text-sm font-semibold text-slate-800">{v.lastKmReading.toLocaleString()} KM</td>
              <td className="px-5 py-4">
                {v.documents && v.documents.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                    {v.documents.map((doc, idx) => (
                      <button
                        key={doc.id || idx}
                        onClick={() => setPreviewDoc(doc)}
                        className="flex items-center gap-1 text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-colors"
                        title="View Document"
                      >
                        <ImageIcon size={10} />
                        {doc.docType}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">No docs attached</span>
                )}
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(v.id, v.vehicleNo)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Vehicle"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          )}
        />
      </div>

      {/* Add Vehicle Modal */}
      {isAddModalOpen && (
        <AddVehicleModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={loadVehicles}
        />
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <ModalWrapper
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={`Document Preview: ${previewDoc.docType}`}
          maxWidth="max-w-md"
        >
          <div className="flex flex-col items-center">
            <img 
              src={previewDoc.docImage} 
              alt={previewDoc.docType} 
              className="w-full h-auto object-contain rounded-xl border border-slate-200 max-h-[60vh] shadow-sm" 
            />
            <button
              onClick={() => setPreviewDoc(null)}
              className="mt-4 px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-sm w-full"
            >
              Close Preview
            </button>
          </div>
        </ModalWrapper>
      )}
    </div>
  );
}
