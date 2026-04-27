import './index.css';

interface TruckLog {
  id: string;
  startDate: string;
  endDate: string;
  route: string;
  fuelCost: number;
  income: number;
  memo: string;
  createdAt: number;
}

const STORAGE_KEY = 'truck_logs';
let editingLogId: string | null = null;

function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR');
}

function parseNumber(str: string): number {
  return parseInt(str.replace(/,/g, ''), 10) || 0;
}

function applyCommaFormat(element: HTMLInputElement) {
  element.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    const value = target.value.replace(/[^0-9]/g, '');
    if (value) {
      target.value = formatNumber(parseInt(value, 10));
    } else {
      target.value = '';
    }
  });
}

function getLogs(): TruckLog[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to parse logs', e);
    return [];
  }
}

function saveLogs(logs: TruckLog[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

function deleteLog(id: string) {
  if (confirm('이 기록을 삭제하시겠습니까?')) {
    const logs = getLogs().filter(log => log.id !== id);
    saveLogs(logs);
    renderDashboard();
    renderLogs();
    renderSummary();
  }
}

function renderDashboard() {
  const logs = getLogs();
  
  // Create current month filter
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const currentMonthLogs = logs.filter(log => log.startDate && log.startDate.startsWith(currentMonth));
  
  const totalIncome = currentMonthLogs.reduce((sum, log) => sum + (log.income || 0), 0);
  const totalFuelCost = currentMonthLogs.reduce((sum, log) => sum + (log.fuelCost || 0), 0);
  
  const incomeEl = document.getElementById('totalIncome');
  const fuelCostEl = document.getElementById('totalFuelCost');
  
  if (incomeEl) incomeEl.textContent = `${formatNumber(totalIncome)}원`;
  if (fuelCostEl) fuelCostEl.textContent = `${formatNumber(totalFuelCost)}원`;
}

function renderLogs() {
  const tbody = document.getElementById('logTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  const logs = getLogs().sort((a, b) => {
    if (a.startDate !== b.startDate) {
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    }
    return b.createdAt - a.createdAt;
  });
  
  if (logs.length === 0) {
    tbody.innerHTML = `
      <tr id="emptyStateRow">
         <td colspan="5" class="py-16 text-center text-[14px] font-bold text-slate-400">등록된 운행 기록이 없습니다.</td>
      </tr>
    `;
    return;
  }
  
  logs.forEach(log => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-100 hover:bg-slate-50 transition-colors group';
    
    // Format date MM/DD
    const startStr = log.startDate ? (() => {
      const startObj = new Date(log.startDate);
      return `${String(startObj.getMonth() + 1).padStart(2, '0')}/${String(startObj.getDate()).padStart(2, '0')}`;
    })() : '';
    
    const endStr = log.endDate ? (() => {
      const endObj = new Date(log.endDate);
      return `${String(endObj.getMonth() + 1).padStart(2, '0')}/${String(endObj.getDate()).padStart(2, '0')}`;
    })() : '';
    
    tr.innerHTML = `
      <td class="p-2 text-[12px] whitespace-nowrap align-middle text-center font-bold tracking-tighter text-slate-500 group-hover:text-indigo-500 transition-colors">
        ${startStr}<br>
        <span class="opacity-40 font-normal">~</span><br>
        ${endStr}
      </td>
      <td class="p-2 text-[13px] font-bold align-middle break-words whitespace-normal leading-tight text-gray-800">
        ${escapeHTML(log.route)}
      </td>
      <td class="p-2 align-middle break-words whitespace-normal py-3">
        <div class="text-[13px] whitespace-pre-wrap leading-snug mb-1.5 text-gray-600">${escapeHTML(log.memo) || '<span class="opacity-40 italic">내역 없음</span>'}</div>
        <div class="text-[11px] font-bold text-pink-500 tracking-tight bg-pink-50 rounded-md px-1.5 py-0.5 mt-0.5 shadow-sm border border-pink-100 inline-block">⛽ ${formatNumber(log.fuelCost)}원</div>
      </td>
      <td class="p-2 text-[14px] text-right font-extrabold align-middle whitespace-nowrap tracking-tight text-emerald-600 drop-shadow-sm">
        ${formatNumber(log.income)}원
      </td>
      <td class="p-2 text-center align-middle">
        <div class="flex flex-col gap-2 items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
          <button class="text-indigo-400 hover:text-indigo-600 hover:scale-110 transition-all edit-btn cursor-pointer bg-transparent border-none p-1 flex items-center justify-center bg-indigo-50 rounded-full shadow-sm" data-id="${log.id}" title="수정">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </button>
          <button class="text-red-400 hover:text-red-600 hover:scale-110 transition-all delete-btn cursor-pointer bg-transparent border-none p-1 flex items-center justify-center bg-red-50 rounded-full shadow-sm" data-id="${log.id}" title="삭제">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
          </button>
        </div>
      </td>
    `;
    
    tbody.appendChild(tr);
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLButtonElement).getAttribute('data-id');
      if (id) deleteLog(id);
    });
  });

  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLButtonElement).getAttribute('data-id');
      if (id) startEditing(id);
    });
  });
}

function startEditing(id: string) {
  const log = getLogs().find(l => l.id === id);
  if (!log) return;

  editingLogId = id;
  
  const startDateInput = document.getElementById('startDateInput') as HTMLInputElement;
  const endDateInput = document.getElementById('endDateInput') as HTMLInputElement;
  const originInput = document.getElementById('originInput') as HTMLInputElement;
  const destInput = document.getElementById('destInput') as HTMLInputElement;
  const fuelCostInput = document.getElementById('fuelCostInput') as HTMLInputElement;
  const incomeInput = document.getElementById('incomeInput') as HTMLInputElement;
  const memoInput = document.getElementById('memoInput') as HTMLInputElement;
  const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
  const cancelBtn = document.getElementById('cancelBtn') as HTMLButtonElement;

  if (startDateInput) startDateInput.value = log.startDate;
  if (endDateInput) endDateInput.value = log.endDate;
  
  const routeParts = log.route.split(' → ');
  if (originInput) originInput.value = routeParts[0] || '';
  if (destInput) destInput.value = routeParts[1] || '';
  
  if (fuelCostInput) fuelCostInput.value = log.fuelCost ? formatNumber(log.fuelCost) : '';
  if (incomeInput) incomeInput.value = log.income ? formatNumber(log.income) : '';
  if (memoInput) memoInput.value = log.memo;

  if (saveBtn) saveBtn.textContent = '기록 수정';
  if (cancelBtn) cancelBtn.classList.remove('hidden');

  switchTab('input');
}

function resetForm() {
  editingLogId = null;
  
  const startDateInput = document.getElementById('startDateInput') as HTMLInputElement;
  const endDateInput = document.getElementById('endDateInput') as HTMLInputElement;
  const originInput = document.getElementById('originInput') as HTMLInputElement;
  const destInput = document.getElementById('destInput') as HTMLInputElement;
  const fuelCostInput = document.getElementById('fuelCostInput') as HTMLInputElement;
  const incomeInput = document.getElementById('incomeInput') as HTMLInputElement;
  const memoInput = document.getElementById('memoInput') as HTMLInputElement;
  const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
  const cancelBtn = document.getElementById('cancelBtn') as HTMLButtonElement;

  if (originInput) originInput.value = '';
  if (destInput) destInput.value = '';
  if (fuelCostInput) fuelCostInput.value = '';
  if (incomeInput) incomeInput.value = '';
  if (memoInput) memoInput.value = '';
  if (startDateInput) startDateInput.value = getTodayString();
  if (endDateInput) endDateInput.value = getTodayString();

  if (saveBtn) saveBtn.textContent = '기록 저장';
  if (cancelBtn) cancelBtn.classList.add('hidden');
}

function renderSummary() {
  const summaryContainer = document.getElementById('summaryContainer');
  if (!summaryContainer) return;

  const logs = getLogs();
  const summaryMap: Record<string, { income: number, fuelCost: number }> = {};

  logs.forEach(log => {
    if (!log.startDate) return;
    // Group by YYYY-MM
    const monthKey = log.startDate.slice(0, 7);
    if (!summaryMap[monthKey]) {
      summaryMap[monthKey] = { income: 0, fuelCost: 0 };
    }
    summaryMap[monthKey].income += (log.income || 0);
    summaryMap[monthKey].fuelCost += (log.fuelCost || 0);
  });

  const sortedMonths = Object.keys(summaryMap).sort((a, b) => b.localeCompare(a));

  summaryContainer.innerHTML = '';
  
  if (sortedMonths.length === 0) {
    summaryContainer.innerHTML = `<p class="text-center text-[14px] font-bold text-slate-400 my-8">통계 데이터가 없습니다.</p>`;
    return;
  }

  sortedMonths.forEach(month => {
    const data = summaryMap[month];
    // e.g. "2026-04" -> "2026년 4월"
    const [year, monthNum] = month.split('-');
    const monthLabel = `${year}년 ${parseInt(monthNum, 10)}월`;

    const el = document.createElement('div');
    el.className = 'bg-white shadow-none p-5 flex flex-col gap-3 border-b border-slate-100 relative overflow-hidden';

    el.innerHTML = `
      <div class="absolute -right-10 -top-10 w-32 h-32 bg-indigo-50 rounded-full blur-2xl pointer-events-none"></div>
      <h3 class="text-[18px] font-extrabold text-indigo-900 border-b border-slate-100 pb-3 mb-1 drop-shadow-sm">${monthLabel}</h3>
      <div class="flex justify-between items-center text-[14px]">
        <span class="font-bold text-slate-500">총 매출</span>
        <span class="font-extrabold text-emerald-600">${formatNumber(data.income)}원</span>
      </div>
      <div class="flex justify-between items-center text-[14px]">
        <span class="font-bold text-slate-500">유류비</span>
        <span class="font-extrabold text-pink-500">${formatNumber(data.fuelCost)}원</span>
      </div>
    `;

    summaryContainer.appendChild(el);
  });
}

function escapeHTML(str: string): string {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

function getTodayString() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

function initApp() {
  const startDateInput = document.getElementById('startDateInput') as HTMLInputElement;
  const endDateInput = document.getElementById('endDateInput') as HTMLInputElement;
  const originInput = document.getElementById('originInput') as HTMLInputElement;
  const destInput = document.getElementById('destInput') as HTMLInputElement;
  const fuelCostInput = document.getElementById('fuelCostInput') as HTMLInputElement;
  const incomeInput = document.getElementById('incomeInput') as HTMLInputElement;
  const memoInput = document.getElementById('memoInput') as HTMLInputElement;
  const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
  const cancelBtn = document.getElementById('cancelBtn') as HTMLButtonElement;
  const downloadExcelBtn = document.getElementById('downloadExcelBtn');
  
  if (downloadExcelBtn) {
    downloadExcelBtn.addEventListener('click', downloadExcel);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', resetForm);
  }

  if (startDateInput) startDateInput.value = getTodayString();
  if (endDateInput) endDateInput.value = getTodayString();
  
  if (fuelCostInput) applyCommaFormat(fuelCostInput);
  if (incomeInput) applyCommaFormat(incomeInput);
  
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      // Validate
      if (!startDateInput.value || !endDateInput.value || !originInput.value || !destInput.value || !incomeInput.value) {
        alert('필수 입력 항목을 확인해주세요 (날짜, 출발지, 도착지, 운임).');
        return;
      }
      
      const logs = getLogs();
      
      if (editingLogId) {
        const index = logs.findIndex(l => l.id === editingLogId);
        if (index !== -1) {
          logs[index] = {
            ...logs[index],
            startDate: startDateInput.value,
            endDate: endDateInput.value,
            route: `${originInput.value} → ${destInput.value}`,
            fuelCost: parseNumber(fuelCostInput.value || '0'),
            income: parseNumber(incomeInput.value),
            memo: memoInput.value || ''
          };
        }
        editingLogId = null;
        saveBtn.textContent = '기록 저장';
      } else {
        const newLog: TruckLog = {
          id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
          startDate: startDateInput.value,
          endDate: endDateInput.value,
          route: `${originInput.value} → ${destInput.value}`,
          fuelCost: parseNumber(fuelCostInput.value || '0'),
          income: parseNumber(incomeInput.value),
          memo: memoInput.value || '',
          createdAt: Date.now()
        };
        logs.push(newLog);
      }
      
      saveLogs(logs);
      
      resetForm();
      
      renderDashboard();
      renderLogs();
      renderSummary();

      // Switch to log view after saving
      switchTab('log');
    });
  }
  
  // Navigation
  const navInput = document.getElementById('nav-input');
  const navLog = document.getElementById('nav-log');
  const navSummary = document.getElementById('nav-summary');
  
  if (navInput) {
    navInput.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab('input');
    });
  }
  
  if (navLog) {
    navLog.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab('log');
    });
  }

  if (navSummary) {
    navSummary.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab('summary');
    });
  }
  
  renderDashboard();
  renderLogs();
  renderSummary();
}

function switchTab(tab: 'input' | 'log' | 'summary') {
  const views = {
    input: document.getElementById('view-input'),
    log: document.getElementById('view-log'),
    summary: document.getElementById('view-summary')
  };
  const navs = {
    input: document.getElementById('nav-input'),
    log: document.getElementById('nav-log'),
    summary: document.getElementById('nav-summary')
  };

  for (const key in views) {
    if (key === tab) {
      views[key as keyof typeof views]?.classList.remove('hidden');
      navs[key as keyof typeof navs]?.classList.add('text-indigo-600', 'bg-indigo-50');
      navs[key as keyof typeof navs]?.classList.remove('text-slate-400', 'hover:text-indigo-500', 'hover:bg-slate-50');
      
      navs[key as keyof typeof navs]?.querySelector('span')?.classList.remove('font-bold');
      navs[key as keyof typeof navs]?.querySelector('span')?.classList.add('font-extrabold');
    } else {
      views[key as keyof typeof views]?.classList.add('hidden');
      navs[key as keyof typeof navs]?.classList.remove('text-indigo-600', 'bg-indigo-50');
      navs[key as keyof typeof navs]?.classList.add('text-slate-400', 'hover:text-indigo-500', 'hover:bg-slate-50');
      
      navs[key as keyof typeof navs]?.querySelector('span')?.classList.remove('font-extrabold');
      navs[key as keyof typeof navs]?.querySelector('span')?.classList.add('font-bold');
    }
  }
}

function downloadExcel() {
  const logs = getLogs().sort((a, b) => {
    if (a.startDate !== b.startDate) {
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    }
    return b.createdAt - a.createdAt;
  });
  
  if (logs.length === 0) {
    alert('다운로드할 데이터가 없습니다.');
    return;
  }
  
  const headers = ['출발 날짜', '도착 날짜', '출발/도착', '내역', '유류비', '운임'];
  // Create CSV content (UTF-8 with BOM for Excel)
  let csvContent = '\uFEFF' + headers.join(',') + '\n';
  
  logs.forEach(log => {
    const row = [
      log.startDate || '',
      log.endDate || '',
      `"${(log.route || '').replace(/"/g, '""')}"`,
      `"${(log.memo || '').replace(/"/g, '""')}"`,
      log.fuelCost || 0,
      log.income || 0
    ];
    csvContent += row.join(',') + '\n';
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `운행일보_${getTodayString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

document.addEventListener('DOMContentLoaded', initApp);
