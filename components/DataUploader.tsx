import React, { useState, useRef } from 'react';
import { updateDataFromExcel } from '../services/scheduleService';
import UploadIcon from './icons/UploadIcon';
import type { AulaEntry, Event } from '../types';

interface DataUploaderProps {
  onUploadSuccess: (data: { aulasData: AulaEntry[], eventsData: Event[] }) => void;
}

// Senha para proteger o upload. Em uma aplicação real, isso deveria ser mais seguro.
const ADMIN_PASSWORD = "afyaadmin2024";

const DataUploader: React.FC<DataUploaderProps> = ({ onUploadSuccess }) => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            // Se nenhum arquivo for selecionado, apenas resete o input
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        const password = window.prompt("Acesso Restrito: Digite a senha para processar a planilha.");
        
        if (password !== ADMIN_PASSWORD) {
            if (password !== null) { // Usuário digitou algo e clicou OK
                setStatus('error');
                setMessage('Senha incorreta. Upload cancelado.');
                setTimeout(() => {
                    setStatus('idle');
                    setMessage('');
                }, 3000);
            }
            // Se a senha for nula (cancelar) ou incorreta, resete o input e pare a execução
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        // Senha correta, continue com o processamento
        setStatus('loading');
        setMessage('Processando planilha...');

        try {
            const parsedData = await updateDataFromExcel(file);
            onUploadSuccess(parsedData); // Chama o callback com os novos dados
            setStatus('success');
            setMessage('Planilha carregada com sucesso!');
            setTimeout(() => {
                setStatus('idle');
                setMessage('');
            }, 3000);
        } catch (error: any) {
            setStatus('error');
            setMessage(error.message || 'Falha ao processar o arquivo. Verifique o formato e tente novamente.');
             setTimeout(() => {
                setStatus('idle');
                setMessage('');
            }, 5000);
        } finally {
             // Garante que o input de arquivo seja resetado para permitir o upload do mesmo arquivo novamente
            if(fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleButtonClick = () => {
        // Abre o seletor de arquivos diretamente
        fileInputRef.current?.click();
    };

    const getStatusColor = () => {
        switch(status) {
            case 'success': return 'text-green-400';
            case 'error': return 'text-red-400';
            case 'loading': return 'text-blue-400';
            default: return 'text-gray-500';
        }
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                className="hidden"
                aria-hidden="true"
            />
            <button
                onClick={handleButtonClick}
                disabled={status === 'loading'}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 border border-gray-600 disabled:opacity-50 disabled:cursor-wait"
            >
                <UploadIcon className="w-4 h-4" />
                Atualizar Dados via Planilha
            </button>
            {message && <p className={`text-xs ${getStatusColor()}`} role="status">{message}</p>}
        </div>
    );
};

export default DataUploader;