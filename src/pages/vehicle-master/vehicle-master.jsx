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
  const [activeDocsVehicle, setActiveDocsVehicle] = useState(null);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const data = await vehicleService.getVehiclesFromSheet();
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
        vehicleService.deleteVehicle(id, vehicleNo);
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
          headers={['Vehicle No', 'Vehicle Name', "Driver's Name", 'Fuel Type', 'Mileage', 'Last KM Reading', 'Documents']}
          data={displayedVehicles}
          loading={loading}
          emptyMessage="No registered vehicles found"
          renderRow={(v) => (
            <tr key={v.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-5 py-4 text-sm font-bold text-slate-900 font-mono">{v.vehicleNo}</td>
              <td className="px-5 py-4 text-sm text-slate-600 font-semibold">{v.vehicleName || '—'}</td>
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
              <td className="px-5 py-4 text-sm font-medium text-slate-600">
                {v.mileage && v.mileage !== '—' && v.mileage !== 'NA' ? `${v.mileage} KM/L` : v.mileage || '—'}
              </td>
              <td className="px-5 py-4 text-sm font-semibold text-slate-800">{v.lastKmReading.toLocaleString()} KM</td>
              <td className="px-5 py-4">
                {v.documents && v.documents.length > 0 ? (
                  <button
                    onClick={() => setActiveDocsVehicle(v)}
                    className="inline-flex items-center gap-1 text-xs font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 px-3.5 py-1.5 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                  >
                    <Eye size={13} />
                    View ({v.documents.length})
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 italic">No docs attached</span>
                )}
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

      {/* Documents List Modal */}
      {activeDocsVehicle && (
        <ModalWrapper
          isOpen={!!activeDocsVehicle}
          onClose={() => setActiveDocsVehicle(null)}
          title={`Documents: ${activeDocsVehicle.vehicleNo}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Document Name</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {activeDocsVehicle.documents.map((doc, idx) => (
                    <tr key={doc.id || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5 text-sm font-semibold text-slate-700">{doc.docType}</td>
                      <td className="px-4 py-3.5 text-sm text-right">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        >
                          <Eye size={12} />
                          View Image
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={() => setActiveDocsVehicle(null)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-sm w-full"
            >
              Close List
            </button>
          </div>
        </ModalWrapper>
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
