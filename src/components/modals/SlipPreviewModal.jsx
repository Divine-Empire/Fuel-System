import React from 'react';
import ModalWrapper from '../ModalWrapper';
import { downloadFuelSlip } from '../../utils/generateFuelSlip';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import divineLogo from '../../Assets/divine-logo.svg';

export default function SlipPreviewModal({ isOpen, onClose, request }) {
  if (!request) return null;

  const handleDownload = async () => {
    try {
      await downloadFuelSlip(request);
      toast.success('Fuel slip downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to download slip');
    }
  };

  const locationText = request.location === 'Others' 
    ? (request.customLocation || 'Others') 
    : request.location;

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={`Fuel Slip Preview - ${request.slipNo || request.requestNo}`} maxWidth="max-w-sm">
      <div className="flex flex-col items-center space-y-4">
        {request.slipImage ? (
          <div className="border border-slate-300 rounded-xl p-1 bg-slate-50 shadow-inner max-w-full">
            <img 
              src={request.slipImage} 
              alt={`Slip ${request.slipNo || request.requestNo}`} 
              className="max-h-[380px] w-auto object-contain rounded-lg"
            />
          </div>
        ) : (
          <div className="w-full border-2 border-blue-900 rounded-xl overflow-hidden shadow-md bg-white">
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-950 to-blue-800 p-4 text-center border-b-2 border-blue-950 flex flex-col items-center">
              <img src={divineLogo} alt="Divine Empire Logo" className="w-16 h-12 object-contain mb-1.5 filter drop-shadow" />
              <div className="text-white font-extrabold text-sm uppercase tracking-wide">
                Divine Empire Pvt. Ltd.
              </div>
              <div className="text-blue-200 font-bold text-[9px] tracking-widest uppercase mt-0.5">
                Fuel Filling Slip
              </div>
            </div>
            
            {/* Rows */}
            <div className="text-xs text-slate-700">
              <div className="flex border-b border-slate-100">
                <div className="w-2/5 p-2.5 font-bold bg-slate-50 border-r border-slate-100 text-slate-500">Slip No.</div>
                <div className="w-3/5 p-2.5 font-extrabold text-slate-900 font-mono">{request.slipNo || '—'}</div>
              </div>
              <div className="flex border-b border-slate-100">
                <div className="w-2/5 p-2.5 font-bold bg-slate-50 border-r border-slate-100 text-slate-500">Vehicle No.</div>
                <div className="w-3/5 p-2.5 font-extrabold text-slate-900 uppercase">{request.vehicleNo}</div>
              </div>
              <div className="flex border-b border-slate-100">
                <div className="w-2/5 p-2.5 font-bold bg-slate-50 border-r border-slate-100 text-slate-500">Issued To</div>
                <div className="w-3/5 p-2.5 font-bold text-slate-900">{request.issuedTo}</div>
              </div>
              <div className="flex border-b border-slate-100">
                <div className="w-2/5 p-2.5 font-bold bg-slate-50 border-r border-slate-100 text-slate-500">Location</div>
                <div className="w-3/5 p-2.5 font-bold text-slate-900">{locationText === 'Others' ? locationText : `Location ${locationText}`}</div>
              </div>
              <div className="flex border-b border-slate-100">
                <div className="w-2/5 p-2.5 font-bold bg-slate-50 border-r border-slate-100 text-slate-500">Last KM</div>
                <div className="w-3/5 p-2.5 font-bold text-slate-900">{request.lastKmReading} KM</div>
              </div>
              <div className="flex border-b border-slate-100">
                <div className="w-2/5 p-2.5 font-bold bg-slate-50 border-r border-slate-100 text-slate-500">Date Issued</div>
                <div className="w-3/5 p-2.5 font-bold text-slate-900">{request.requestDate}</div>
              </div>
            </div>

            {/* Seal & Signatory Space */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 text-center">
              <div className="font-bold text-[10px] uppercase text-slate-400 tracking-wider mb-8">
                Seal & Signatory
              </div>
              <div className="flex justify-between text-[8px] text-slate-300 font-bold tracking-tight">
                <span>DIVINE EMPIRE GROUP</span>
                <span>SYSTEM PREVIEW</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 w-full pt-3">
          <button
            onClick={handleDownload}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-xs transition shadow-sm flex items-center justify-center gap-1.5"
          >
            <Download size={14} />
            Download Slip PNG
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg text-xs font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}
