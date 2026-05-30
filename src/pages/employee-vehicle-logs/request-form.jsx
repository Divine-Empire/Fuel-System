import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ExifReader from 'exifreader';
import { 
  X,
  Briefcase, 
  Clock, 
  Camera, 
  FileText, 
  Building, 
  Compass,
  ChevronDown
} from 'lucide-react';
import { employeeService } from '../../services/employee.service';
import { fuelService } from '../../services/fuel.service';

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};

function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder,
  disabled,
  required
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  const filteredOptions = options.filter(opt =>
    (opt || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            const matched = options.find(o => o.toLowerCase() === e.target.value.toLowerCase());
            if (matched) {
              onChange(matched);
            }
          }}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          onBlur={() => {
            setTimeout(() => {
              setIsOpen(false);
              const matched = options.find(o => o.toLowerCase() === searchTerm.toLowerCase());
              if (matched) {
                onChange(matched);
                setSearchTerm(matched);
              } else if (searchTerm.trim() === '') {
                onChange('');
                setSearchTerm('');
              } else {
                onChange(value);
                setSearchTerm(value || '');
              }
            }, 200);
          }}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className="block w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all pr-8 disabled:opacity-60 disabled:cursor-not-allowed"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-400">
          <ChevronDown size={16} />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onMouseDown={() => {
                  onChange(opt);
                  setSearchTerm(opt);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 hover:text-indigo-600 transition-colors ${
                  opt === value ? 'bg-indigo-50 font-bold text-indigo-600' : 'text-slate-700 font-medium'
                }`}
              >
                {opt}
              </button>
            ))
          ) : (
            <div className="px-4 py-2.5 text-sm text-slate-400 italic">No matches found</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function EmployeeRequestModal({ isOpen, onClose, onRefresh, editRecord }) {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loadingMaster, setLoadingMaster] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState('');

  // Form states
  const [dateOfVisit, setDateOfVisit] = useState(new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [vehicleType, setVehicleType] = useState('Car');
  const [startTime, setStartTime] = useState('');
  const [kmReadingStart, setKmReadingStart] = useState('');
  const [proofStartFile, setProofStartFile] = useState(null);
  const [proofStartPreview, setProofStartPreview] = useState('');
  
  const [endTime, setEndTime] = useState('');
  const [kmReadingEnd, setKmReadingEnd] = useState('');
  const [proofEndFile, setProofEndFile] = useState(null);
  const [proofEndPreview, setProofEndPreview] = useState('');

  const [purposeOfVisit, setPurposeOfVisit] = useState('');
  const [clientName, setClientName] = useState('');
  const [siteLocation, setSiteLocation] = useState('');
  const [machineDetails, setMachineDetails] = useState('');
  const [journeyOutcome, setJourneyOutcome] = useState('');

  const isServiceDept = department.toLowerCase() === 'service';
  const isProcessMode = !!editRecord;

  useEffect(() => {
    const fetchMasterData = async () => {
      setLoadingMaster(true);
      try {
        // Fetch departments
        const departmentsList = await fuelService.getDepartmentsFromSheet();
        const cleanedDeps = departmentsList.filter(Boolean);
        setDepartments(cleanedDeps);
        if (cleanedDeps.length > 0) {
          setDepartment(cleanedDeps[0]);
        }

        // Fetch employees
        const employeesList = await employeeService.getEmployeesFromSheet();
        const cleanedEmps = employeesList.filter(Boolean);
        setEmployees(cleanedEmps);
        if (cleanedEmps.length > 0) {
          setEmployeeName(cleanedEmps[0]);
        }
      } catch (error) {
        console.error("Failed to load master data from sheet:", error);
        setDepartments(['Admin', 'Service', 'Sales', 'Operations']);
        setDepartment('Admin');
        setEmployees([]);
      } finally {
        setLoadingMaster(false);
      }
    };
    
    if (isOpen) {
      if (editRecord) {
        // Process/edit mode: Prefill from editRecord
        setDateOfVisit(editRecord.requestDate ? editRecord.requestDate.split('T')[0] : (editRecord.dateOfVisit || ''));
        setDepartment(editRecord.department || '');
        setEmployeeName(editRecord.issuedTo || editRecord.employeeName || '');
        setVehicleType(editRecord.vehicleType || 'Car');
        setStartTime(editRecord.startTime || '');
        setKmReadingStart(editRecord.lastKmReading || editRecord.kmReadingStart || '');
        setProofStartFile(null);
        setProofStartPreview(editRecord.proofStart || editRecord.slipCopy || '');
        
        setEndTime(editRecord.endTime || '');
        setKmReadingEnd(editRecord.currentKmReading || editRecord.kmReadingEnd || '');
        setProofEndFile(null);
        setProofEndPreview(editRecord.proofEnd || '');
        
        setPurposeOfVisit(editRecord.purposeOfVisit || '');
        setClientName(editRecord.clientName || '');
        setSiteLocation(editRecord.siteLocation || editRecord.location || '');
        setMachineDetails(editRecord.machineDetails || '');
        setJourneyOutcome(editRecord.journeyOutcome || '');
      } else {
        // New mode: reset form
        fetchMasterData();
        setDateOfVisit(new Date().toISOString().split('T')[0]);
        setVehicleType('Car');
        setStartTime('');
        setKmReadingStart('');
        setProofStartFile(null);
        setProofStartPreview('');
        setEndTime('');
        setKmReadingEnd('');
        setProofEndFile(null);
        setProofEndPreview('');
        setPurposeOfVisit('');
        setClientName('');
        setSiteLocation('');
        setMachineDetails('');
        setJourneyOutcome('');
      }
    }
  }, [isOpen, editRecord]);

  if (!isOpen) return null;

  const handlePhotoUpload = async (file, isStart) => {
    if (!file) return;

    if (isStart) {
      if (isProcessMode) return;
      setProofStartFile(file);
      setProofStartPreview(URL.createObjectURL(file));
    } else {
      setProofEndFile(file);
      setProofEndPreview(URL.createObjectURL(file));
    }

    try {
      const tags = await ExifReader.load(file);
      const dateTimeStr = tags['DateTimeOriginal']?.description;
      
      let finalTime = '';
      if (dateTimeStr) {
        const parts = dateTimeStr.trim().split(/\s+/);
        if (parts.length === 2) {
          const timePart = parts[1]; // "HH:MM:SS"
          const timeSubparts = timePart.split(':');
          if (timeSubparts.length >= 2) {
            finalTime = `${timeSubparts[0].padStart(2, '0')}:${timeSubparts[1].padStart(2, '0')}`;
          }
        }
      }

      if (!finalTime) {
        const fileDate = new Date(file.lastModified);
        if (!isNaN(fileDate.getTime())) {
          finalTime = `${String(fileDate.getHours()).padStart(2, '0')}:${String(fileDate.getMinutes()).padStart(2, '0')}`;
          toast.success(`No EXIF date found. Detected from file modification time: ${finalTime}`);
        }
      } else {
        toast.success(`Time detected from photo metadata: ${finalTime}`);
      }

      if (finalTime) {
        if (isStart) {
          setStartTime(finalTime);
        } else {
          setEndTime(finalTime);
        }
      } else {
        toast.error('Could not detect time from the image.');
      }
    } catch (err) {
      console.error('Error reading EXIF data:', err);
      const fileDate = new Date(file.lastModified);
      if (!isNaN(fileDate.getTime())) {
        const finalTime = `${String(fileDate.getHours()).padStart(2, '0')}:${String(fileDate.getMinutes()).padStart(2, '0')}`;
        toast.success(`Detected time from file: ${finalTime}`);
        if (isStart) {
          setStartTime(finalTime);
        } else {
          setEndTime(finalTime);
        }
      } else {
        toast.error('Failed to read image metadata. Please input time manually if needed.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!isProcessMode) {
      if (!dateOfVisit) return toast.error('Please select Date of Visit');
      if (!department) return toast.error('Please select Department');
      if (!employeeName) return toast.error('Please select Employee Name');
      if (!startTime) return toast.error('Please upload Start Journey photo to detect Start Time');
      if (!kmReadingStart || parseFloat(kmReadingStart) < 0) return toast.error('Please enter a valid Start KM Reading');
      if (!proofStartFile) return toast.error('Please upload Start Journey odometer photo');
      if (!purposeOfVisit.trim()) return toast.error('Please enter Purpose of Visit');

      if (isServiceDept) {
        if (!clientName.trim()) return toast.error('Client name is required for Service department');
        if (!siteLocation.trim()) return toast.error('Site location is required for Service department');
        if (!machineDetails.trim()) return toast.error('Machine details are required for Service department');
      }
    }

    // End Details Validation
    const hasEndDetails = isProcessMode || !!proofEndFile || !!kmReadingEnd || !!endTime || !!journeyOutcome.trim();

    if (hasEndDetails) {
      if (!endTime) return toast.error('Please upload End Journey photo to detect End Time');
      if (!kmReadingEnd || parseFloat(kmReadingEnd) < 0) return toast.error('Please enter a valid End KM Reading');
      if (parseFloat(kmReadingEnd) <= parseFloat(kmReadingStart)) {
        return toast.error('End KM Reading must be greater than Start KM Reading');
      }
      if (isProcessMode && !proofEndFile) {
        return toast.error('Please upload End Journey odometer photo');
      }
      if (!isProcessMode && !proofEndFile) {
        return toast.error('Please upload End Journey odometer photo');
      }
    }

    setSubmitting(true);
    try {
      let proofStartUrl = editRecord?.proofStart || '';
      let proofEndUrl = editRecord?.proofEnd || '';

      if (!isProcessMode) {
        setSubmissionStep("Uploading start journey proof...");
        const startBase64 = await fileToBase64(proofStartFile);
        proofStartUrl = await employeeService.uploadFileToDrive(
          startBase64, 
          `START_PROOF_${employeeName.replace(/\s+/g, '_')}_${Date.now()}.png`,
          proofStartFile.type
        );
      }

      if (hasEndDetails && proofEndFile) {
        setSubmissionStep("Uploading end journey proof...");
        const endBase64 = await fileToBase64(proofEndFile);
        proofEndUrl = await employeeService.uploadFileToDrive(
          endBase64, 
          `END_PROOF_${employeeName.replace(/\s+/g, '_')}_${Date.now()}.png`,
          proofEndFile.type
        );
      }

      const distanceVal = kmReadingStart && kmReadingEnd ? parseFloat(kmReadingEnd) - parseFloat(kmReadingStart) : 0;
      if (isProcessMode) {
        setSubmissionStep("Saving travel log end details...");
        await employeeService.completeEmployeeJourneyInSheet(editRecord.rowIndex, {
          endTime,
          kmReadingEnd: parseFloat(kmReadingEnd),
          proofEnd: proofEndUrl,
          journeyOutcome: journeyOutcome.trim(),
          distance: distanceVal
        });
        toast.success("Travel log completed successfully!");
      } else {
        setSubmissionStep("Saving travel log request...");
        await employeeService.createEmployeeRequestToSheet({
          dateOfVisit,
          department,
          employeeName,
          vehicleType,
          startTime,
          kmReadingStart: parseFloat(kmReadingStart),
          proofStart: proofStartUrl,
          endTime: hasEndDetails ? endTime : '',
          kmReadingEnd: hasEndDetails ? parseFloat(kmReadingEnd) : '',
          proofEnd: hasEndDetails ? proofEndUrl : '',
          purposeOfVisit: purposeOfVisit.trim(),
          clientName: isServiceDept ? clientName.trim() : '',
          siteLocation: isServiceDept ? siteLocation.trim() : '',
          machineDetails: isServiceDept ? machineDetails.trim() : '',
          journeyOutcome: hasEndDetails ? journeyOutcome.trim() : '',
          distance: hasEndDetails ? distanceVal : ''
        });
        toast.success("Travel log request submitted successfully!");
      }

      if (onRefresh) onRefresh();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit request: ' + error.message);
    } finally {
      setSubmitting(false);
      setSubmissionStep('');
    }
  };

  const inputCls = "block w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all";
  const selectCls = "block w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all";
  const labelCls = "text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5";

  const isKmEndInvalid = kmReadingEnd !== '' && parseFloat(kmReadingEnd) <= parseFloat(kmReadingStart);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {submitting && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex flex-col items-center justify-center z-50">
            <div className="flex flex-col items-center space-y-4">
              <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm font-bold text-slate-700">{submissionStep}</span>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          
          {/* Header */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Compass className="text-indigo-600 animate-pulse" size={20} />
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">
                  {isProcessMode ? 'Process Travel Request (End Journey)' : 'New Travel Request'}
                </h3>
              </div>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              disabled={submitting}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
            {loadingMaster ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm font-semibold text-slate-505">Loading spreadsheet values...</span>
              </div>
            ) : (
              <>
                {/* Core Info */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                  <h2 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5 uppercase tracking-wider">
                    <Briefcase size={14} className="text-indigo-500" />
                    General Information
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="col-span-1 md:col-span-3">
                      <label className={labelCls}>Date of Visit</label>
                      <input
                        type="date"
                        value={dateOfVisit}
                        onChange={(e) => setDateOfVisit(e.target.value)}
                        className={inputCls}
                        required
                        disabled={isProcessMode}
                      />
                    </div>

                    <div className="col-span-1 md:col-span-3">
                      <label className={labelCls}>Department</label>
                      <SearchableSelect
                        options={departments}
                        value={department}
                        onChange={setDepartment}
                        placeholder="Select Department"
                        disabled={isProcessMode}
                        required
                      />
                    </div>

                    <div className="col-span-1 md:col-span-4">
                      <label className={labelCls}>Employee Name</label>
                      <SearchableSelect
                        options={employees}
                        value={employeeName}
                        onChange={setEmployeeName}
                        placeholder="Select Employee"
                        disabled={isProcessMode}
                        required
                      />
                    </div>

                    <div className="col-span-1 md:col-span-2">
                      <label className={labelCls}>Vehicle Type</label>
                      <select
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value)}
                        className={selectCls}
                        required
                        disabled={isProcessMode}
                      >
                        <option value="Car">Car</option>
                        <option value="Bike">Bike</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Start & End Journey Logs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Start Journey */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                    <h2 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5 uppercase tracking-wider">
                      <Clock size={14} className="text-emerald-500" />
                      Start Journey Details
                    </h2>

                    <div className="space-y-4">
                      <div>
                        <label className={labelCls}>Start Time</label>
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className={`${inputCls} bg-slate-100/60 font-medium`}
                          readOnly
                          placeholder="Auto-detected from photo"
                        />
                        <p className="text-[10px] text-indigo-500 mt-1 font-medium">Auto-detected from odometer photo upload</p>
                      </div>

                      <div>
                        <label className={labelCls}>KM Reading (Start)</label>
                        <input
                          type="number"
                          value={kmReadingStart}
                          onChange={(e) => setKmReadingStart(e.target.value)}
                          placeholder="e.g. 15420"
                          className={inputCls}
                          required
                          disabled={isProcessMode}
                        />
                      </div>

                      <div>
                        <label className={labelCls}>Proof (Start KM Photo)</label>
                        <div className="flex items-center justify-center w-full">
                          <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg bg-slate-50 transition-colors relative overflow-hidden ${isProcessMode ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:bg-slate-100'}`}>
                            {proofStartPreview ? (
                              <img src={proofStartPreview} alt="Start Odometer Preview" className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Camera className="w-8 h-8 text-slate-400 mb-1.5" />
                                <p className="text-[11px] text-slate-500 font-medium">Upload start odometer photo</p>
                                <p className="text-[9px] text-slate-400 mt-0.5">PNG, JPG, JPEG</p>
                              </div>
                            )}
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => handlePhotoUpload(e.target.files[0], true)}
                              className="hidden" 
                              required={!isProcessMode}
                              disabled={isProcessMode}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* End Journey */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                    <h2 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5 uppercase tracking-wider">
                      <Clock size={14} className="text-rose-500" />
                      End Journey Details
                    </h2>

                    <div className="space-y-4">
                      <div>
                        <label className={labelCls}>End Time</label>
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className={`${inputCls} bg-slate-100/60 font-medium`}
                          readOnly
                          placeholder="Auto-detected from photo"
                        />
                        <p className="text-[10px] text-indigo-500 mt-1 font-medium">Auto-detected from odometer photo upload</p>
                      </div>

                      <div>
                        <label className={labelCls}>KM Reading (End)</label>
                        <input
                          type="number"
                          value={kmReadingEnd}
                          onChange={(e) => setKmReadingEnd(e.target.value)}
                          placeholder="e.g. 15530"
                          className={`${inputCls} ${isKmEndInvalid ? 'border-rose-300 focus:ring-rose-500' : ''}`}
                        />
                        {isKmEndInvalid && (
                          <p className="text-[11px] text-rose-500 font-semibold mt-1">End KM Reading must be greater than Start KM Reading</p>
                        )}
                      </div>

                      {kmReadingStart && kmReadingEnd && parseFloat(kmReadingEnd) > parseFloat(kmReadingStart) && (
                        <div>
                          <label className={labelCls}>Calculated Distance (KM)</label>
                          <input
                            type="text"
                            value={`${parseFloat(kmReadingEnd) - parseFloat(kmReadingStart)} KM`}
                            className={`${inputCls} bg-indigo-50/50 text-indigo-700 font-bold border-indigo-200`}
                            readOnly
                          />
                        </div>
                      )}

                      <div>
                        <label className={labelCls}>Proof (End KM Photo)</label>
                        <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors relative overflow-hidden">
                            {proofEndPreview ? (
                              <img src={proofEndPreview} alt="End Odometer Preview" className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Camera className="w-8 h-8 text-slate-400 mb-1.5" />
                                <p className="text-[11px] text-slate-500 font-medium">Upload end odometer photo</p>
                                <p className="text-[9px] text-slate-400 mt-0.5">PNG, JPG, JPEG</p>
                              </div>
                            )}
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => handlePhotoUpload(e.target.files[0], false)}
                              className="hidden" 
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Visit Details */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                  <h2 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5 uppercase tracking-wider">
                    <FileText size={14} className="text-indigo-500" />
                    Visit Details
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className={labelCls}>Purpose of Visit</label>
                      <input
                        type="text"
                        value={purposeOfVisit}
                        onChange={(e) => setPurposeOfVisit(e.target.value)}
                        placeholder="e.g. Client site inspection / meeting"
                        className={inputCls}
                        required
                        disabled={isProcessMode}
                      />
                    </div>

                    {/* Service Department Specific Fields */}
                    {isServiceDept && (
                      <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/80 space-y-4 animate-fadeIn">
                        <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Building size={14} />
                          Service Visit Details
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className={`${labelCls} text-indigo-600`}>Client Name</label>
                            <input
                              type="text"
                              value={clientName}
                              onChange={(e) => setClientName(e.target.value)}
                              placeholder="Enter client name"
                              className={inputCls}
                              required={isServiceDept}
                              disabled={isProcessMode}
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} text-indigo-600`}>Site Location</label>
                            <input
                              type="text"
                              value={siteLocation}
                              onChange={(e) => setSiteLocation(e.target.value)}
                              placeholder="Enter site location"
                              className={inputCls}
                              required={isServiceDept}
                              disabled={isProcessMode}
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} text-indigo-600`}>Machine Details</label>
                            <input
                              type="text"
                              value={machineDetails}
                              onChange={(e) => setMachineDetails(e.target.value)}
                              placeholder="Enter machine ID/details"
                              className={inputCls}
                              required={isServiceDept}
                              disabled={isProcessMode}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className={labelCls}>Journey Outcome (Remarks / Notes)</label>
                      <textarea
                        value={journeyOutcome}
                        onChange={(e) => setJourneyOutcome(e.target.value)}
                        placeholder="Summarize the travel outcome..."
                        rows={2.5}
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold transition"
              disabled={submitting}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className={`px-6 py-2 text-white font-bold rounded-lg text-xs transition shadow-sm flex items-center justify-center gap-1.5 ${
                submitting || loadingMaster || isKmEndInvalid
                  ? 'bg-indigo-400 cursor-not-allowed opacity-60'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
              disabled={submitting || loadingMaster || isKmEndInvalid}
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : isProcessMode ? 'Submit End Details' : 'Submit Request'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
