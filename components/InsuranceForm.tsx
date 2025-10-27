import React, { useState, useEffect } from 'react';
import { InsurancePolicy } from '../types';

interface InsuranceFormProps {
    policy: InsurancePolicy | null;
    onSave: (policyData: Omit<InsurancePolicy, 'id'>) => void;
    onClose: () => void;
}

export const InsuranceForm: React.FC<InsuranceFormProps> = ({ policy, onSave, onClose }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        if (policy) {
            setDescription(policy.description);
            setAmount(policy.amount.toString());
            setStartDate(policy.startDate.slice(0, 10));
            setEndDate(policy.endDate.slice(0, 10));
        } else {
            const today = new Date();
            const oneYearFromNow = new Date(new Date().setFullYear(today.getFullYear() + 1));
            setEndDate(oneYearFromNow.toISOString().slice(0, 10));
        }
    }, [policy]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const policyAmount = parseFloat(amount);
        if (isNaN(policyAmount) || policyAmount <= 0) {
            alert("Kwota polisy musi być poprawną, dodatnią liczbą.");
            return;
        }
        if (!startDate || !endDate || new Date(endDate) <= new Date(startDate)) {
            alert("Data zakończenia musi być późniejsza niż data rozpoczęcia.");
            return;
        }
        onSave({
            description,
            amount: policyAmount,
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-dark rounded-lg p-6 w-full max-w-md shadow-2xl border border-gray-light">
                <h2 className="text-xl font-bold mb-4 text-text-main">{policy ? 'Edytuj polisę' : 'Dodaj nową polisę'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="policyDesc" className="block text-sm font-medium text-text-secondary">Opis</label>
                        <input id="policyDesc" type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="np. OC/AC 2024" required className="mt-1 block w-full bg-gray-light rounded-md p-2 text-text-main"/>
                    </div>
                    <div>
                        <label htmlFor="policyAmount" className="block text-sm font-medium text-text-secondary">Całkowita kwota (PLN)</label>
                        <input id="policyAmount" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="np. 2500" step="0.01" required className="mt-1 block w-full bg-gray-light rounded-md p-2 text-text-main"/>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="policyStart" className="block text-sm font-medium text-text-secondary">Początek okresu</label>
                            <input id="policyStart" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="mt-1 block w-full bg-gray-light rounded-md p-2 text-text-main"/>
                        </div>
                        <div>
                            <label htmlFor="policyEnd" className="block text-sm font-medium text-text-secondary">Koniec okresu</label>
                            <input id="policyEnd" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="mt-1 block w-full bg-gray-light rounded-md p-2 text-text-main"/>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-light text-text-main font-semibold hover:bg-gray-very-light/50">Anuluj</button>
                        <button type="submit" className="px-4 py-2 rounded-md bg-brand-primary text-white font-semibold hover:bg-brand-secondary">Zapisz</button>
                    </div>
                </form>
            </div>
        </div>
    );
};