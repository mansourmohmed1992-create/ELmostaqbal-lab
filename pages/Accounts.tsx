import React, { useEffect, useState } from 'react';
import { CreditCard, DollarSign, PieChart, FileText, Users } from 'lucide-react';

const Accounts = () => {
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    // Load from localStorage (simple mock data storage)
    const tx = JSON.parse(localStorage.getItem('lab_fin_transactions') || '[]');
    setTransactions(tx);
    const inc = tx.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + (t.amount || 0), 0);
    const exp = tx.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + (t.amount || 0), 0);
    setIncome(inc);
    setExpenses(exp);
    setBalance(inc - exp);
  }, []);

  const addTransaction = (type: 'income' | 'expense') => {
    const label = prompt('أدخل وصف الحركة:');
    if (!label) return;
    const amountStr = prompt('المبلغ بالمصري (EGP):');
    if (!amountStr) return;
    const amount = parseFloat(amountStr.replace(/,/g, ''));
    if (isNaN(amount)) return alert('المبلغ غير صحيح');

    const tx = { id: 'T-' + Math.random().toString(36).substr(2,9), type, label, amount, date: new Date().toISOString() };
    const all = JSON.parse(localStorage.getItem('lab_fin_transactions') || '[]');
    all.unshift(tx);
    localStorage.setItem('lab_fin_transactions', JSON.stringify(all));
    setTransactions(all);
    setIncome(all.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + (t.amount || 0), 0));
    setExpenses(all.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + (t.amount || 0), 0));
    setBalance(prev => type === 'income' ? prev + amount : prev - amount);
  };

  const markNeeds = () => {
    const note = prompt('أدخل احتياج/ملاحظة مالية (مثال: مستلزمات، أجور):');
    if (!note) return;
    const needs = JSON.parse(localStorage.getItem('lab_fin_needs') || '[]');
    needs.unshift({ id: 'N-' + Math.random().toString(36).substr(2,9), note, createdAt: new Date().toISOString() });
    localStorage.setItem('lab_fin_needs', JSON.stringify(needs));
    alert('تم تسجيل الاحتياج');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900">الحسابات والمالية</h2>
          <p className="text-gray-500 font-bold">ملخص سريع للإيرادات والمصروفات والاحتياجات</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => addTransaction('income')} className="bg-green-600 text-white px-4 py-2 rounded-2xl font-black">إضافة دخل</button>
          <button onClick={() => addTransaction('expense')} className="bg-red-600 text-white px-4 py-2 rounded-2xl font-black">إضافة مصروف</button>
          <button onClick={markNeeds} className="bg-blue-600 text-white px-4 py-2 rounded-2xl font-black">تسجيل احتياج</button>
        </div>
      </div>

      

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 font-black uppercase">إجمالي الإيرادات</p>
          <p className="text-2xl font-black text-green-700">{income.toFixed(2)} EGP</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 font-black uppercase">إجمالي المصروفات</p>
          <p className="text-2xl font-black text-red-600">{expenses.toFixed(2)} EGP</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 font-black uppercase">الرصيد</p>
          <p className="text-2xl font-black text-gray-900">{balance.toFixed(2)} EGP</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="font-black text-lg mb-4">حركات مالية حديثة</h3>
        {transactions.length === 0 ? (
          <p className="text-gray-400">لا توجد حركات مسجلة بعد.</p>
        ) : (
          <div className="space-y-3">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl border">
                <div>
                  <p className="font-black">{tx.label}</p>
                  <p className="text-xs text-gray-400">{new Date(tx.date).toLocaleString()}</p>
                </div>
                <div className={`font-black ${tx.type === 'income' ? 'text-green-700' : 'text-red-600'}`}>{tx.amount.toFixed(2)} EGP</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="font-black text-lg mb-4">الاحتياجات والطلبات</h3>
        <div className="space-y-3">
          {(JSON.parse(localStorage.getItem('lab_fin_needs') || '[]')).map((n: any) => (
            <div key={n.id} className="p-3 rounded-xl border bg-gray-50">
              <p className="font-black">{n.note}</p>
              <p className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Accounts;
