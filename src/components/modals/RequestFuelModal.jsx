import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ExifReader from 'exifreader';
import ModalWrapper from '../ModalWrapper';
import { fuelService } from '../../services/fuel.service';
import { vehicleService } from '../../services/vehicle.service';
import { useAuthStore } from '../../store/authStore';

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

export default function RequestFuelModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuthStore();
  const [vehicles, setVehicles] = useState([]);
  const [locations, setLocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  // Basic states
  const [vehicleNo, setVehicleNo] = useState('');
  const [issuedTo, setIssuedTo] = useState('');
  const [lastKmReading, setLastKmReading] = useState('');
  const [mileage, setMileage] = useState('');
  const [location, setLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  
  // Travel Log states (for personal vehicles)
  const [dateOfVisit, setDateOfVisit] = useState(new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState('');
  const [customVehicleName, setCustomVehicleName] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [kmReadingStart, setKmReadingStart] = useState('');
  const [proofStartFile, setProofStartFile] = useState(null);
  const [endTime, setEndTime] = useState('');
  const [kmReadingEnd, setKmReadingEnd] = useState('');
  const [proofEndFile, setProofEndFile] = useState(null);
  const [purposeOfVisit, setPurposeOfVisit] = useState('');
  const [clientName, setClientName] = useState('');
  const [siteLocation, setSiteLocation] = useState('');
  const [machineDetails, setMachineDetails] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [loadingMasterData, setLoadingMasterData] = useState(false);

  const isPersonal = vehicleNo.toUpperCase() === 'PERSONAL BIKE' || vehicleNo.toUpperCase() === 'PERSONAL CAR';

  useEffect(() => {
    if (isOpen) {
      const fetchMasterData = async () => {
        setLoadingMasterData(true);
        try {
          const [vehiclesList, locationsList, departmentsList] = await Promise.all([
            vehicleService.getVehiclesFromSheet(),
            fuelService.getLocationsFromSheet(),
            fuelService.getDepartmentsFromSheet()
          ]);
          setVehicles(vehiclesList);
          
          const uniqueLocs = locationsList.filter(l => l && l.toLowerCase() !== 'others');
          const finalLocs = [...uniqueLocs, 'Others'];
          setLocations(finalLocs);

          const finalDeps = departmentsList.filter(d => d);
          setDepartments(finalDeps);
          
          if (uniqueLocs.length > 0) {
            setLocation(uniqueLocs[0]);
          } else {
            setLocation('Others');
          }

          if (finalDeps.length > 0) {
            setDepartment(finalDeps[0]);
          }

          if (user?.role === 'USER') {
            setIssuedTo(user.name);
            setEmployeeName(user.name);
          }
        } catch (e) {
          console.error("Failed to fetch master data from sheet:", e);
          toast.error("Failed to load master details from Google Sheet");
        } finally {
          setLoadingMasterData(false);
        }
      };
      fetchMasterData();
    }
  }, [isOpen, user]);

  const handleVehicleChange = async (selectedNo) => {
    setVehicleNo(selectedNo);
    
    if (selectedNo.toUpperCase() === 'PERSONAL BIKE' || selectedNo.toUpperCase() === 'PERSONAL CAR') {
      setIssuedTo('');
      setLastKmReading('');
      setMileage('');
      return;
    }

    const vehicle = vehicles.find(v => v.vehicleNo === selectedNo);
    if (vehicle) {
      if (user?.role !== 'USER') {
        setIssuedTo(vehicle.driverName || '');
      }
      setMileage(vehicle.mileage.toString());

      try {
        const lastKm = await fuelService.getLastOdometerFromSheet(selectedNo);
        if (lastKm !== null) {
          setLastKmReading(lastKm.toString());
        } else {
          setLastKmReading(vehicle.lastKmReading.toString());
        }
      } catch (error) {
        setLastKmReading(vehicle.lastKmReading.toString());
      }
    } else {
      if (user?.role !== 'USER') {
        setIssuedTo('');
      }
      setLastKmReading('');
      setMileage('');
    }
  };

  const handlePhotoUpload = async (file, isStart) => {
    if (!file) return;

    if (isStart) {
      setProofStartFile(file);
    } else {
      setProofEndFile(file);
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
          toast.success(`No EXIF date found. Detected from file modification time: ${finalTime}`, { duration: 4000 });
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
        toast.error('Could not detect time from the image. Please upload a valid image file.');
      }
    } catch (err) {
      console.error('Error reading EXIF data:', err);
      const fileDate = new Date(file.lastModified);
      if (!isNaN(fileDate.getTime())) {
        const finalTime = `${String(fileDate.getHours()).padStart(2, '0')}:${String(fileDate.getMinutes()).padStart(2, '0')}`;
        toast.success(`Failed to read metadata. Detected from file modification time: ${finalTime}`, { duration: 4000 });
        if (isStart) {
          setStartTime(finalTime);
        } else {
          setEndTime(finalTime);
        }
      } else {
        toast.error('Failed to read image metadata. Please ensure the image is valid.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!vehicleNo) return toast.error('Please select a vehicle');

    if (isPersonal) {
      // Validate travel log details
      if (!dateOfVisit) return toast.error('Please select Date of Visit');
      if (!department) return toast.error('Please select Department');
      if (!customVehicleName.trim()) return toast.error('Please enter Vehicle Name/Model');
      if (!employeeName.trim()) return toast.error('Employee name is required');
      if (!startTime) return toast.error('Please enter Start Time');
      if (!kmReadingStart || parseFloat(kmReadingStart) < 0) return toast.error('Please enter a valid Start KM Reading');
      if (!proofStartFile) return toast.error('Please upload Start Journey odometer photo');
      if (!endTime) return toast.error('Please enter End Time');
      if (!kmReadingEnd || parseFloat(kmReadingEnd) < 0) return toast.error('Please enter a valid End KM Reading');
      if (parseFloat(kmReadingEnd) < parseFloat(kmReadingStart)) {
        return toast.error('End KM Reading cannot be less than Start KM Reading');
      }
      if (!proofEndFile) return toast.error('Please upload End Journey odometer photo');
      if (!purposeOfVisit.trim()) return toast.error('Please enter Purpose of Visit');
      
      if (department.toLowerCase() === 'service') {
        if (!clientName.trim()) return toast.error('Client name is required');
        if (!siteLocation.trim()) return toast.error('Site location is required');
        if (!machineDetails.trim()) return toast.error('Machine details are required');
      }
    } else {
      // Validate fuel request details
      if (!issuedTo.trim()) return toast.error('Recipient name is required');
      if (!lastKmReading || parseFloat(lastKmReading) < 0) {
        return toast.error('Please enter a valid Last KM Reading');
      }
      if (location === 'Others' && !customLocation.trim()) {
        return toast.error('Please enter custom location');
      }
    }

    setSubmitting(true);
    try {
      if (isPersonal) {
        toast.loading("Uploading start odometer photo...", { id: "upload-proof-start" });
        const startBase64 = await fileToBase64(proofStartFile);
        const proofStartUrl = await fuelService.uploadFileToDrive(startBase64, `START_PROOF_${employeeName.replace(/\s+/g, '_')}_${Date.now()}.png`);
        toast.success("Start odometer photo uploaded!", { id: "upload-proof-start" });

        toast.loading("Uploading end odometer photo...", { id: "upload-proof-end" });
        const endBase64 = await fileToBase64(proofEndFile);
        const proofEndUrl = await fuelService.uploadFileToDrive(endBase64, `END_PROOF_${employeeName.replace(/\s+/g, '_')}_${Date.now()}.png`);
        toast.success("End odometer photo uploaded!", { id: "upload-proof-end" });

        toast.loading("Saving travel log to Google Sheet...", { id: "save-sheet" });
        await fuelService.createFuelRequestToSheet({
          isPersonalVehicle: true,
          vehicleNo: vehicleNo.toUpperCase(), // "PERSONAL BIKE" or "PERSONAL CAR"
          vehicleName: customVehicleName.trim(),
          employeeName: employeeName.trim(),
          dateOfVisit,
          department,
          startTime,
          kmReadingStart: parseFloat(kmReadingStart),
          proofStart: proofStartUrl,
          endTime,
          kmReadingEnd: parseFloat(kmReadingEnd),
          proofEnd: proofEndUrl,
          purposeOfVisit: purposeOfVisit.trim(),
          clientName: department.toLowerCase() === 'service' ? clientName.trim() : '',
          siteLocation: department.toLowerCase() === 'service' ? siteLocation.trim() : '',
          machineDetails: department.toLowerCase() === 'service' ? machineDetails.trim() : ''
        });
        toast.success("Travel log saved successfully!", { id: "save-sheet" });

        // Reset travel states
        setCustomVehicleName('');
        setStartTime('');
        setKmReadingStart('');
        setProofStartFile(null);
        setEndTime('');
        setKmReadingEnd('');
        setProofEndFile(null);
        setPurposeOfVisit('');
        setClientName('');
        setSiteLocation('');
        setMachineDetails('');
      } else {
        // Standard company vehicle request
        let uploadedFileUrl = '';
        let predictedReqNo = '';
        let predictedSlipNo = '';

        if (location !== 'Others') {
          const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
          let existingRequests = [];
          try {
            const response = await fetch(`${APPS_SCRIPT_URL}?sheet=Fuel-Filling`);
            if (response.ok) {
              const resJson = await response.json();
              if (resJson.success && resJson.data && resJson.data.length > 1) {
                existingRequests = resJson.data;
              }
            }
          } catch (err) {
            console.error("Error predicting request/slip numbers:", err);
          }

          const header = existingRequests[0] || [];
          const reqNoIdx = header.findIndex(h => h.toString().toLowerCase().replace(/[^a-z0-9]/g, '').includes('requestno'));
          const slipNoIdx = header.findIndex(h => h.toString().toLowerCase().replace(/[^a-z0-9]/g, '').includes('slipno'));

          let maxReq = 0;
          let maxSlip = 0;

          if (existingRequests.length > 1) {
            existingRequests.slice(1).forEach(row => {
              if (reqNoIdx !== -1 && row[reqNoIdx]) {
                const m = row[reqNoIdx].toString().match(/^REQ-(\d+)$/i);
                if (m) maxReq = Math.max(maxReq, parseInt(m[1], 10));
              }
              if (slipNoIdx !== -1 && row[slipNoIdx]) {
                const m = row[slipNoIdx].toString().match(/^SLIP-(\d+)$/i);
                if (m) maxSlip = Math.max(maxSlip, parseInt(m[1], 10));
              }
            });
          }

          predictedReqNo = `REQ-${String(maxReq + 1).padStart(3, '0')}`;
          predictedSlipNo = `SLIP-${String(maxSlip + 1).padStart(3, '0')}`;

          const slipData = {
            requestNo: predictedReqNo,
            slipNo: predictedSlipNo,
            vehicleNo: vehicleNo.toUpperCase(),
            issuedTo: issuedTo.trim(),
            location,
            customLocation: customLocation.trim(),
            lastKmReading: parseFloat(lastKmReading),
            mileage: parseFloat(mileage),
            requestDate: new Date().toLocaleDateString('en-GB')
          };

          const { downloadFuelSlip } = await import('../../utils/generateFuelSlip');
          const pdfResult = await downloadFuelSlip(slipData, true, true);
          
          if (pdfResult && pdfResult.pdfBase64) {
            const fileName = `${predictedSlipNo}.pdf`;
            toast.loading("Uploading slip to Google Drive...", { id: "upload-slip" });
            try {
              uploadedFileUrl = await fuelService.uploadFileToDrive(pdfResult.pdfBase64, fileName);
              toast.success("Slip uploaded successfully!", { id: "upload-slip" });
            } catch (uploadErr) {
              console.error("Google Drive upload error:", uploadErr);
              toast.error("Failed to upload slip, submitting request anyway...", { id: "upload-slip" });
            }
          }
        }

        const selectedVehicleObj = vehicles.find(
          (v) => v.vehicleNo.toLowerCase() === vehicleNo.toLowerCase()
        );
        const matchedVehicleName = selectedVehicleObj ? selectedVehicleObj.vehicleName : '';

        await fuelService.createFuelRequestToSheet({
          vehicleNo: vehicleNo.toUpperCase(),
          vehicleName: matchedVehicleName,
          issuedTo: issuedTo.trim(),
          lastKmReading: parseFloat(lastKmReading),
          mileage: parseFloat(mileage),
          location,
          customLocation: location === 'Others' ? customLocation.trim() : '',
          slipCopy: uploadedFileUrl
        });

        const notifyNo = predictedSlipNo || predictedReqNo || 'Request';
        if (location === 'Others') {
          toast.success(`Fuel request submitted successfully!`);
        } else {
          toast.success(`Fuel request ${notifyNo} submitted & slip downloaded!`);
        }

        setVehicleNo('');
        setIssuedTo('');
        setLastKmReading('');
        setMileage('');
        if (locations.length > 0) {
          const firstLoc = locations.filter(l => l !== 'Others')[0] || 'Others';
          setLocation(firstLoc);
        } else {
          setLocation('Others');
        }
        setCustomLocation('');
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const formatLocationOption = (loc) => {
    if (loc === 'Others') return 'Others';
    if (loc.length === 1) return `Location ${loc}`;
    return loc;
  };

  const inputCls = "block w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all";
  const selectCls = "block w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer";
  const disabledInputCls = "block w-full text-sm bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-slate-500 cursor-not-allowed";
  const labelCls = "text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1";

  if (loadingMasterData && isOpen) {
    return (
      <ModalWrapper isOpen={isOpen} onClose={onClose} title="Request Fuel Filling" maxWidth="max-w-lg">
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm font-semibold text-slate-500 text-center">Loading details from Google Sheets...</span>
        </div>
      </ModalWrapper>
    );
  }

  if (submitting && isOpen) {
    return (
      <ModalWrapper isOpen={isOpen} onClose={onClose} title="Request Fuel Filling" maxWidth="max-w-lg">
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm font-semibold text-slate-600 text-center">
            {isPersonal 
              ? "Processing Travel Log & Uploading Proofs..." 
              : "Generating Fuel Slip & Uploading to Drive..."}
          </span>
          <span className="text-xs text-slate-400 text-center">Please do not close this window</span>
        </div>
      </ModalWrapper>
    );
  }

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Request Fuel Filling" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Vehicle Name</label>
          <select
            value={vehicleNo}
            onChange={(e) => handleVehicleChange(e.target.value)}
            className={selectCls}
            disabled={submitting || loadingMasterData}
            required
          >
            <option value="">{loadingMasterData ? 'Loading Vehicles...' : 'Select a Vehicle'}</option>
            {vehicles.map((v, idx) => (
              <option key={idx} value={v.vehicleNo}>
                {v.vehicleName} ({v.vehicleNo})
              </option>
            ))}
            {!loadingMasterData && (
              <>
                <option value="Personal Bike">Personal Bike</option>
                <option value="Personal Car">Personal Car</option>
              </>
            )}
          </select>
        </div>

        {/* PERSONAL VEHICLE TRAVEL LOG FIELDS */}
        {isPersonal && (
          <div className="space-y-4 border-t border-slate-100 pt-4 animate-fadeIn">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">Travel Log Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Date of Visit</label>
                <input
                  type="date"
                  value={dateOfVisit}
                  onChange={(e) => setDateOfVisit(e.target.value)}
                  className={inputCls}
                  required
                />
              </div>

              <div>
                <label className={labelCls}>Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className={selectCls}
                  required
                >
                  {departments.map((dep, idx) => (
                    <option key={idx} value={dep}>
                      {dep}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Vehicle Name/Model</label>
                <input
                  type="text"
                  value={customVehicleName}
                  onChange={(e) => setCustomVehicleName(e.target.value)}
                  placeholder="e.g. Hero Splendor"
                  className={inputCls}
                  required
                />
              </div>

              <div>
                <label className={labelCls}>Employee Name</label>
                <input
                  type="text"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  placeholder="Employee Name"
                  className={user?.role === 'USER' ? disabledInputCls : inputCls}
                  disabled={user?.role === 'USER'}
                  required
                />
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-3">
              <span className="text-xs font-bold text-slate-700 block border-b border-slate-200 pb-1 uppercase tracking-wider">Start Journey</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    className={disabledInputCls}
                    readOnly
                    required
                  />
                  <span className="text-[10px] text-indigo-500 mt-1 block font-medium">Auto-detected from photo</span>
                </div>
                <div>
                  <label className={labelCls}>KM Reading (Start)</label>
                  <input
                    type="number"
                    value={kmReadingStart}
                    onChange={(e) => setKmReadingStart(e.target.value)}
                    placeholder="e.g. 12500"
                    className={inputCls}
                    required
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Proof (Start KM Photo)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e.target.files[0], true)}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  required
                />
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-3">
              <span className="text-xs font-bold text-slate-700 block border-b border-slate-200 pb-1 uppercase tracking-wider">End Journey</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    className={disabledInputCls}
                    readOnly
                    required
                  />
                  <span className="text-[10px] text-indigo-500 mt-1 block font-medium">Auto-detected from photo</span>
                </div>
                <div>
                  <label className={labelCls}>KM Reading (End)</label>
                  <input
                    type="number"
                    value={kmReadingEnd}
                    onChange={(e) => setKmReadingEnd(e.target.value)}
                    placeholder="e.g. 12620"
                    className={inputCls}
                    required
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Proof (End KM Photo)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e.target.files[0], false)}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  required
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Purpose of Visit</label>
              <input
                type="text"
                value={purposeOfVisit}
                onChange={(e) => setPurposeOfVisit(e.target.value)}
                placeholder="e.g. Client meeting"
                className={inputCls}
                required
              />
            </div>

            {department.toLowerCase() === 'service' && (
              <div className="space-y-3 border-l-2 border-indigo-400 pl-3 py-1 animate-fadeIn">
                <span className="text-xs font-bold text-indigo-600 block uppercase tracking-wider">Service Visit Info</span>
                <div>
                  <label className={labelCls}>Client Name</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Client Name"
                    className={inputCls}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Site Location</label>
                    <input
                      type="text"
                      value={siteLocation}
                      onChange={(e) => setSiteLocation(e.target.value)}
                      placeholder="Site Location"
                      className={inputCls}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Machine Details</label>
                    <input
                      type="text"
                      value={machineDetails}
                      onChange={(e) => setMachineDetails(e.target.value)}
                      placeholder="Machine Details"
                      className={inputCls}
                      required
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* COMPANY VEHICLE FUEL LOG FIELDS */}
        {!isPersonal && (
          <>
            <div>
              <label className={labelCls}>Issued To (Driver/Staff Name)</label>
              <input
                type="text"
                value={issuedTo}
                onChange={(e) => setIssuedTo(e.target.value)}
                placeholder="e.g. Rohit Sharma"
                className={user?.role === 'USER' ? disabledInputCls : inputCls}
                disabled={submitting || user?.role === 'USER' || loadingMasterData}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Last KM Reading</label>
                <input
                  type="number"
                  value={lastKmReading}
                  readOnly
                  placeholder="Select vehicle"
                  className={disabledInputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Mileage (KM/L)</label>
                <input
                  type="number"
                  value={mileage}
                  readOnly
                  placeholder="Select vehicle"
                  className={disabledInputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Location</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={selectCls}
                disabled={submitting || loadingMasterData}
              >
                {loadingMasterData ? (
                  <option>Loading locations...</option>
                ) : (
                  locations.map((loc, idx) => (
                    <option key={idx} value={loc}>
                      {formatLocationOption(loc)}
                    </option>
                  ))
                )}
              </select>
            </div>

            {location === 'Others' && (
              <div className="animate-fadeIn">
                <label className={labelCls}>Specify Custom Location</label>
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="e.g. Site Office C"
                  className={inputCls}
                  disabled={submitting}
                  required
                />
              </div>
            )}
          </>
        )}

        <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6 sticky bottom-0 bg-white z-10">
          <button
            type="submit"
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition shadow-sm flex items-center justify-center gap-2"
            disabled={submitting || loadingMasterData}
          >
            {loadingMasterData 
              ? 'Loading Details...' 
              : (submitting 
                ? (isPersonal ? 'Submitting Travel Log...' : (location === 'Others' ? 'Submitting...' : 'Generating Slip...')) 
                : (isPersonal ? 'Submit Travel Log' : (location === 'Others' ? 'Submit Request' : 'Submit & Download Slip')))}
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
