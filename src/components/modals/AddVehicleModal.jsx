import React, { useState } from 'react';
import toast from 'react-hot-toast';
import ModalWrapper from '../ModalWrapper';
import { vehicleService } from '../../services/vehicle.service';
import { Upload, Plus, Trash2, Camera, ShieldAlert } from 'lucide-react';

export default function AddVehicleModal({ isOpen, onClose, onSuccess }) {
  const [vehicleNo, setVehicleNo] = useState('');
  const [mileage, setMileage] = useState('');
  const [lastKmReading, setLastKmReading] = useState('');
  const [fuelType, setFuelType] = useState('Diesel');
  const [driverName, setDriverName] = useState('');
  const [documents, setDocuments] = useState([]);

  // Temp state for document attachment in progress
  const [tempDocType, setTempDocType] = useState('');
  const [tempDocImage, setTempDocImage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        return toast.error('Image size must be less than 2MB');
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempDocImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddDocument = () => {
    if (!tempDocType.trim()) {
      return toast.error('Please enter a document name');
    }
    if (!tempDocImage) {
      return toast.error('Please upload an image for the document');
    }
    
    // Add to list
    const newDoc = {
      id: `doc_${Date.now()}`,
      docType: tempDocType.trim(),
      docImage: tempDocImage
    };
    
    setDocuments([...documents, newDoc]);
    
    // Reset temp inputs
    setTempDocImage('');
    setTempDocType('');
    toast.success('Document added to vehicle!');
  };

  const handleRemoveDocument = (id) => {
    setDocuments(documents.filter(d => d.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!vehicleNo.trim()) return toast.error('Vehicle No is required');
    if (!mileage || parseFloat(mileage) <= 0) return toast.error('Please enter a valid mileage');
    if (!lastKmReading || parseFloat(lastKmReading) < 0) {
      return toast.error('Please enter a valid Last KM Reading');
    }

    // If there is an un-added document in the upload slots, let's auto-add it if it has a name
    let finalDocs = [...documents];
    if (tempDocImage && tempDocType.trim()) {
      finalDocs.push({
        id: `doc_${Date.now()}`,
        docType: tempDocType.trim(),
        docImage: tempDocImage
      });
    }

    setSubmitting(true);
    try {
      vehicleService.createVehicle({
        vehicleNo: vehicleNo.trim().toUpperCase(),
        mileage: parseFloat(mileage),
        lastKmReading: parseFloat(lastKmReading),
        fuelType,
        driverName: driverName.trim(),
        documents: finalDocs
      });

      toast.success(`Vehicle ${vehicleNo.toUpperCase()} registered successfully!`);
      
      // Reset state
      setVehicleNo('');
      setMileage('');
      setLastKmReading('');
      setFuelType('Diesel');
      setDriverName('');
      setDocuments([]);
      setTempDocImage('');
      setTempDocType('');

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to register vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "block w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all";
  const selectCls = "block w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer";
  const labelCls = "text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1";
  const fileLabelCls = "flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-3 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-slate-500 hover:text-slate-700 relative overflow-hidden group min-h-[90px] w-full";

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Register New Vehicle" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Vehicle No</label>
            <input
              type="text"
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value)}
              placeholder="e.g. CG04AB1234"
              className={inputCls}
              required
              disabled={submitting}
            />
          </div>

          <div>
            <label className={labelCls}>Driver Name (Optional)</label>
            <input
              type="text"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder="e.g. Rohit Sharma"
              className={inputCls}
              disabled={submitting}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Mileage (KM/L)</label>
            <input
              type="number"
              step="any"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              placeholder="e.g. 14.5"
              className={inputCls}
              required
              disabled={submitting}
            />
          </div>

          <div>
            <label className={labelCls}>Last KM Reading</label>
            <input
              type="number"
              value={lastKmReading}
              onChange={(e) => setLastKmReading(e.target.value)}
              placeholder="e.g. 15420"
              className={inputCls}
              required
              disabled={submitting}
            />
          </div>

          <div>
            <label className={labelCls}>Fuel Type</label>
            <select
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
              className={selectCls}
              required
              disabled={submitting}
            >
              <option value="Diesel">Diesel</option>
              <option value="Petrol">Petrol</option>
            </select>
          </div>
        </div>

        {/* Documents Attachment Section */}
        <div className="border-t border-slate-100 pt-4 mt-2">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">Vehicle Documents</h4>
          
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <label className={labelCls}>Document Name</label>
                <input
                  type="text"
                  value={tempDocType}
                  onChange={(e) => setTempDocType(e.target.value)}
                  placeholder="e.g. RC, Insurance, etc."
                  className={inputCls}
                  disabled={submitting}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddDocument}
                  className="flex-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold py-2.5 px-3 rounded-lg text-xs hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition shadow-sm flex items-center justify-center gap-1"
                  disabled={submitting || !tempDocImage}
                >
                  <Plus size={14} />
                  Add Document
                </button>
              </div>
            </div>

            <div className="w-full">
              <label className={labelCls}>Upload Document Image</label>
              <label className={fileLabelCls}>
                {tempDocImage ? (
                  <>
                    <img src={tempDocImage} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1">
                      <Camera size={14} /> Change Image
                    </div>
                  </>
                ) : (
                  <>
                    <Upload size={18} className="mb-1 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Choose Image</span>
                    <span className="text-[8px] text-slate-400">Click to upload (under 2MB)</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={submitting}
                />
              </label>
            </div>
          </div>
        </div>

        {/* List of Added Documents */}
        {documents.length > 0 && (
          <div className="space-y-2 mt-2">
            <label className={labelCls}>Added Documents ({documents.length})</label>
            <div className="grid grid-cols-2 gap-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-lg shadow-sm">
                  <img src={doc.docImage} alt={doc.docType} className="w-8 h-8 rounded object-cover border border-slate-100 flex-shrink-0" />
                  <span className="text-xs font-semibold text-slate-700 truncate flex-1">{doc.docType}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDocument(doc.id)}
                    className="p-1 hover:bg-rose-50 text-rose-500 rounded transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
          <button
            type="submit"
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition shadow-sm"
            disabled={submitting}
          >
            {submitting ? 'Registering Vehicle...' : 'Register Vehicle'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg text-sm font-bold transition"
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}
