// src/components/AdminCodesPanel.tsx
// Vista admin de códigos en formato INDEX-WXYZ

import React, { useState } from 'react';
import { useAccessCodeStore } from '@/stores/accessCodeStore';
import type { AccessCode } from '@/stores/accessCodeStore';
import { Copy, Trash2, User, Calendar, Shield } from 'lucide-react';

interface AdminCodesPanelProps {
  isAdmin?: boolean;
}

export const AdminCodesPanel: React.FC<AdminCodesPanelProps> = ({ isAdmin = true }) => {
  const { codes, generateNewCode, deactivateCode } = useAccessCodeStore();
  const [newName, setNewName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['diver']);
  const [daysValid, setDaysValid] = useState(30);

  const activeCodes = codes.filter((c) => c.isActive);
  const expiredCodes = codes.filter((c) => !c.isActive);

  const handleGenerate = () => {
    const code = generateNewCode(newName, selectedRoles, daysValid);
    setNewName('');
    alert(`Código generado: ${code.code}`);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CL');
  };

  const availableRoles = [
    'diver',
    'instructor',
    'admin',
    'Open Water',
    'Advanced OW',
    'Rescue + EFR',
    'Dive Master',
    'Nitrox',
    'Deep Diver',
    'Wreck',
    'Sidemount Rec',
    'Tec 40',
    'Tec 45',
    'Trimix',
    'Dry Suit',
    'Foto Sub',
  ];

  const CodeCard: React.FC<{ code: AccessCode }> = ({ code }) => (
    <div className='bg-white rounded-lg shadow-md p-4 mb-3 border-l-4 border-blue-500'>
      <div className='flex justify-between items-start'>
        <div className='flex-1'>
          <div className='flex items-center gap-2 mb-2'>
            <span className='text-2xl font-bold text-blue-600 tracking-wider'>
              {code.code}
            </span>
            <button
              onClick={() => handleCopy(code.code)}
              className='p-1 hover:bg-gray-100 rounded transition'
              title='Copiar código'
            >
              <Copy className='w-4 h-4 text-gray-500' />
            </button>
          </div>
          
          <div className='text-xs text-gray-400 mb-2'>
            ID: {code.id}
          </div>

          <div className='flex items-center gap-2 text-gray-700'>
            <User className='w-4 h-4' />
            <span className='font-medium'>{code.name}</span>
          </div>

          <div className='flex items-center gap-2 text-sm text-gray-500 mt-1'>
            <Calendar className='w-4 h-4' />
            <span>Expira: {formatDate(code.expiresAt)}</span>
            <span className='mx-1'>|</span>
            <span>Creado: {formatDate(code.createdAt)}</span>
          </div>

          <div className='flex flex-wrap gap-1 mt-2'>
            <Shield className='w-4 h-4 text-gray-400' />
            {code.roles.map((role) => (
              <span
                key={role}
                className='px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full'
              >
                {role}
              </span>
            ))}
          </div>
        </div>

        <div className='flex flex-col gap-2'>
          <button
            onClick={() => deactivateCode(code.id)}
            className='p-2 text-red-500 hover:bg-red-50 rounded transition'
            title='Desactivar código'
          >
            <Trash2 className='w-5 h-5' />
          </button>
        </div>
      </div>
    </div>
  );

  if (!isAdmin) {
    return (
      <div className='p-4 text-center text-gray-500'>
        No tienes permisos para ver esta sección.
      </div>
    );
  }

  return (
    <div className='max-w-4xl mx-auto p-4'>
      <h2 className='text-2xl font-bold mb-6 text-gray-800'>
        Total Códigos: {codes.length}
      </h2>
      
      <div className='grid grid-cols-3 gap-4 mb-6 text-center'>
        <div className='bg-green-50 rounded-lg p-3'>
          <div className='text-2xl font-bold text-green-600'>{activeCodes.length}</div>
          <div className='text-sm text-green-700'>Activos</div>
        </div>
        <div className='bg-red-50 rounded-lg p-3'>
          <div className='text-2xl font-bold text-red-600'>{expiredCodes.length}</div>
          <div className='text-sm text-red-700'>Expirados</div>
        </div>
        <div className='bg-blue-50 rounded-lg p-3'>
          <div className='text-2xl font-bold text-blue-600'>{codes.length}</div>
          <div className='text-sm text-blue-700'>Total</div>
        </div>
      </div>

      <div className='bg-gray-50 rounded-lg p-4 mb-6'>
        <h3 className='font-bold mb-3'>Generar nuevo código</h3>
        <div className='flex gap-2 mb-3'>
          <input
            type='text'
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder='Nombre del buceador'
            className='flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          <input
            type='number'
            value={daysValid}
            onChange={(e) => setDaysValid(Number(e.target.value))}
            placeholder='Días válido'
            className='w-24 px-3 py-2 border rounded-lg'
          />
          <button
            onClick={handleGenerate}
            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition'
          >
            +
          </button>
        </div>
        
        <div className='flex flex-wrap gap-2'>
          {availableRoles.map((role) => (
            <label key={role} className='flex items-center gap-1 cursor-pointer'>
              <input
                type='checkbox'
                checked={selectedRoles.includes(role)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedRoles([...selectedRoles, role]);
                  } else {
                    setSelectedRoles(selectedRoles.filter((r) => r !== role));
                  }
                }}
                className='rounded'
              />
              <span className='text-sm'>{role}</span>
            </label>
          ))}
        </div>
      </div>

      <h3 className='font-bold mb-3 text-gray-700'>Códigos activos</h3>
      {activeCodes.length === 0 ? (
        <p className='text-gray-500 text-center py-8'>No hay códigos activos</p>
      ) : (
        activeCodes.map((code) => <CodeCard key={code.id} code={code} />)
      )}

      {expiredCodes.length > 0 && (
        <>
          <h3 className='font-bold mb-3 text-gray-700 mt-6'>Códigos expirados</h3>
          {expiredCodes.map((code) => (
            <div key={code.id} className='opacity-50'>
              <CodeCard code={code} />
            </div>
          ))}
        </>
      )}
    </div>
  );
};
