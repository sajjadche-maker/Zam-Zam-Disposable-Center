import React, { useState, useRef } from 'react';
import { useKhata } from '../context/KhataContext';
import { ProductItem } from '../types';
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  X,
  FileCheck,
  RefreshCw,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedProductRow {
  index: number;
  code: string;
  name: string;
  nameUrdu: string;
  category: string;
  purchasePrice: number;
  salePrice: number;
  stockQuantity: number;
  unit: string;
  minStockAlert: number;
  isValid: boolean;
  errors: string[];
  isDuplicate: boolean;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose }) => {
  const { products, bulkAddProducts, shopSettings } = useKhata();

  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedProductRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ added: number; updated: number } | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'valid' | 'invalid'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Robust CSV Line & cell splitter accounting for quotes and different delimiters (, or ; or \t)
  const parseCSVText = (text: string): ParsedProductRow[] => {
    // Clean BOM if present
    const cleanText = text.replace(/^\uFEFF/, '').trim();
    if (!cleanText) return [];

    // Split lines safely
    const rawLines = cleanText.split(/\r\n|\n|\r/).filter((line) => line.trim().length > 0);
    if (rawLines.length === 0) return [];

    // Detect delimiter from first row (comma, semicolon, or tab)
    const headerLine = rawLines[0];
    const commaCount = (headerLine.match(/,/g) || []).length;
    const semiCount = (headerLine.match(/;/g) || []).length;
    const tabCount = (headerLine.match(/\t/g) || []).length;

    let delimiter = ',';
    if (semiCount > commaCount && semiCount > tabCount) delimiter = ';';
    else if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';

    // Parse a line into cells respecting double quotes
    const tokenizeLine = (line: string): string[] => {
      const cells: string[] = [];
      let currentCell = '';
      let insideQuote = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (insideQuote && line[i + 1] === '"') {
            // Escaped quote
            currentCell += '"';
            i++;
          } else {
            insideQuote = !insideQuote;
          }
        } else if (char === delimiter && !insideQuote) {
          cells.push(currentCell.trim());
          currentCell = '';
        } else {
          currentCell += char;
        }
      }
      cells.push(currentCell.trim());
      return cells;
    };

    const headers = tokenizeLine(headerLine).map((h) =>
      h.toLowerCase().replace(/[^a-z0-9_]/g, '')
    );

    // Map headers to fields
    const getColIndex = (keywords: string[]): number => {
      return headers.findIndex((h) => keywords.some((k) => h === k || h.includes(k)));
    };

    const colCode = getColIndex(['code', 'barcode', 'itemcode', 'item_code', 'id']);
    const colName = getColIndex(['name', 'itemname', 'productname', 'item', 'product', 'naam', 'cheez']);
    const colNameUrdu = getColIndex(['urdu', 'nameurdu', 'urduname', 'naamurdu']);
    const colCategory = getColIndex(['category', 'cat', 'dept', 'type', 'group', 'qisam']);
    const colCost = getColIndex(['cost', 'purchase', 'khareed', 'kharid', 'costprice', 'purchaseprice']);
    const colSale = getColIndex(['sale', 'price', 'selling', 'bikri', 'rate', 'saleprice', 'sellingprice']);
    const colStock = getColIndex(['stock', 'qty', 'quantity', 'tadaad', 'stockqty', 'inventory']);
    const colUnit = getColIndex(['unit', 'uom', 'paimana']);
    const colMinAlert = getColIndex(['alert', 'min', 'minalert', 'minstock']);

    // Check if we at least found a name column or if headers are missing
    const hasNameCol = colName !== -1;
    const startIndex = hasNameCol ? 1 : 0; // if no header recognized, assume first line is data

    const existingNamesMap = new Set(products.map((p) => p.name.trim().toLowerCase()));
    const existingCodesMap = new Set(products.map((p) => p.code.trim().toLowerCase()));

    const rows: ParsedProductRow[] = [];

    for (let i = startIndex; i < rawLines.length; i++) {
      const line = rawLines[i].trim();
      if (!line) continue;

      const cells = tokenizeLine(line);
      if (cells.length === 1 && !cells[0]) continue;

      let code = '';
      let name = '';
      let nameUrdu = '';
      let category = 'General';
      let purchasePrice = 0;
      let salePrice = 0;
      let stockQuantity = 0;
      let unit = 'piece';
      let minStockAlert = 10;

      if (hasNameCol) {
        if (colCode !== -1 && cells[colCode]) code = cells[colCode].replace(/^#/, '').trim();
        if (colName !== -1 && cells[colName]) name = cells[colName].trim();
        if (colNameUrdu !== -1 && cells[colNameUrdu]) nameUrdu = cells[colNameUrdu].trim();
        if (colCategory !== -1 && cells[colCategory]) category = cells[colCategory].trim() || 'General';
        if (colCost !== -1 && cells[colCost]) purchasePrice = Math.max(0, parseFloat(cells[colCost].replace(/[^0-9.-]/g, '')) || 0);
        if (colSale !== -1 && cells[colSale]) salePrice = Math.max(0, parseFloat(cells[colSale].replace(/[^0-9.-]/g, '')) || 0);
        if (colStock !== -1 && cells[colStock]) stockQuantity = Math.max(0, parseFloat(cells[colStock].replace(/[^0-9.-]/g, '')) || 0);
        if (colUnit !== -1 && cells[colUnit]) unit = cells[colUnit].toLowerCase().trim() || 'piece';
        if (colMinAlert !== -1 && cells[colMinAlert]) minStockAlert = Math.max(1, parseInt(cells[colMinAlert].replace(/[^0-9]/g, ''), 10) || 5);
      } else {
        // Fallback positional mapping: Code, Name, Category, Cost, Sale, Stock, Unit
        code = cells[0] || '';
        name = cells[1] || '';
        category = cells[2] || 'General';
        purchasePrice = parseFloat(cells[3]?.replace(/[^0-9.-]/g, '')) || 0;
        salePrice = parseFloat(cells[4]?.replace(/[^0-9.-]/g, '')) || 0;
        stockQuantity = parseFloat(cells[5]?.replace(/[^0-9.-]/g, '')) || 0;
        unit = cells[6] || 'piece';
      }

      // Default reasonable unit if empty
      if (!unit) unit = 'piece';

      // Validation
      const errors: string[] = [];
      if (!name) {
        errors.push('Cheez ka naam (Product Name) khali hai');
      }
      if (isNaN(salePrice) || salePrice <= 0) {
        errors.push('Bikri qeemat (Sale Price) lazmi hai aur 0 se bari honi chahiye');
      }

      const isDuplicate =
        (!!code && existingCodesMap.has(code.toLowerCase())) ||
        (!!name && existingNamesMap.has(name.toLowerCase()));

      rows.push({
        index: i,
        code,
        name,
        nameUrdu,
        category,
        purchasePrice,
        salePrice,
        stockQuantity,
        unit,
        minStockAlert,
        isValid: errors.length === 0,
        errors,
        isDuplicate,
      });
    }

    return rows;
  };

  const handleFileProcess = (selectedFile: File) => {
    if (!selectedFile) return;

    // Check extension or type
    const isCsvOrText =
      selectedFile.name.endsWith('.csv') ||
      selectedFile.name.endsWith('.txt') ||
      selectedFile.type.includes('csv') ||
      selectedFile.type.includes('text');

    if (!isCsvOrText) {
      setParseError('Baraye meherbani CSV (.csv) file upload karein.');
      return;
    }

    setFile(selectedFile);
    setParseError(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = parseCSVText(text);
        if (rows.length === 0) {
          setParseError('File khali hai ya koi data rows nahi milay.');
        } else {
          setParsedRows(rows);
        }
      } catch (err) {
        console.error('Error parsing CSV:', err);
        setParseError('CSV file parhne mein khata aai. Baraye meherbani format check karein.');
      }
    };
    reader.onerror = () => {
      setParseError('File read error. Dobara koshish karein.');
    };
    reader.readAsText(selectedFile);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  // Download Sample Template for ZamZam Disposable & Shopping bags center
  const downloadSampleTemplate = () => {
    const csvContent =
      `code,name,name_urdu,category,cost_price,sale_price,stock_qty,unit,min_alert\r\n` +
      `1001,Shopping Bag White 14x18,شاپنگ بیگ سفید بڑا,Shopping Bags,450,550,50,kg,10\r\n` +
      `1002,Shopping Bag Color 10x14,شاپنگ بیگ رنگین,Shopping Bags,480,590,35,kg,8\r\n` +
      `1003,Disposable Water Glass 250ml,ڈسپوزیبل پانی گلاس,Disposable Crockery,180,240,100,pack,20\r\n` +
      `1004,Plastic Chai Cups White 100pc,چائے کے کپ سفید,Disposable Crockery,130,170,80,pack,15\r\n` +
      `1005,Foam Plates Large 50pc,فوم پلیٹ بڑی,Disposable Crockery,260,330,45,pack,10\r\n` +
      `1006,Plastic Spoons White 100pc,پلاسٹک چمچ سفید,Disposable Crockery,110,150,60,pack,12\r\n` +
      `1007,Transparent Packing Tape 2 inch,پیکنگ ٹیپ شفاف,Packaging & Rolls,85,120,75,roll,15\r\n` +
      `1008,Food Container 1000ml with Lid,کھانے کا ڈبہ ڈھکن والا,Packaging & Rolls,380,480,30,pack,6\r\n` +
      `1009,Garbage Bags Heavy Duty XL,کوڑا کرکٹ تھیلے,General,240,320,25,pack,5\r\n` +
      `1010,Aluminium Foil Roll 25m,فوائل پیپر رول,Packaging & Rolls,310,400,20,roll,5\r\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'zamzam_stock_inventory_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleConfirmImport = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    setIsImporting(true);

    const itemsToImport: Array<Omit<ProductItem, 'id' | 'updatedAt'>> = validRows.map((r) => ({
      code: r.code,
      name: r.name,
      nameUrdu: r.nameUrdu || undefined,
      category: r.category || 'General',
      purchasePrice: r.purchasePrice,
      salePrice: r.salePrice,
      stockQuantity: r.stockQuantity,
      unit: r.unit || 'piece',
      minStockAlert: r.minStockAlert || 10,
    }));

    try {
      const result = bulkAddProducts(itemsToImport, updateExisting);
      setImportResult(result);
    } catch (err) {
      console.error('Import failed:', err);
      setParseError('Import karte waqt khata aai. Dobara koshish karein.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setParseError(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;
  const duplicateCount = parsedRows.filter((r) => r.isValid && r.isDuplicate).length;

  const displayedRows = parsedRows.filter((r) => {
    if (filterMode === 'valid') return r.isValid;
    if (filterMode === 'invalid') return !r.isValid;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>CSV File Se Stock Bulk Upload Karein</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                  Quick Setup
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-urdu">
                ایک ساتھ تمام اشیاء اور اسٹاک کا ڈیٹا CSV فائل سے شامل کریں
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* Success Result View */}
          {importResult ? (
            <div className="py-8 px-4 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Stock Kamyabi Se Shamil Ho Gaya!</h3>
                <p className="text-sm text-slate-400 mt-1 font-urdu">
                  اشیاء کا ریکارڈ کامیابی کے ساتھ محفوظ کر دیا گیا ہے
                </p>
              </div>

              <div className="flex justify-center gap-4 py-3">
                <div className="px-5 py-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
                  <span className="text-xs text-slate-400 block">Naye Items (New Added)</span>
                  <span className="text-2xl font-bold text-emerald-400 font-mono mt-0.5 block">
                    +{importResult.added}
                  </span>
                </div>
                {importResult.updated > 0 && (
                  <div className="px-5 py-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
                    <span className="text-xs text-slate-400 block">Updated Items</span>
                    <span className="text-2xl font-bold text-sky-400 font-mono mt-0.5 block">
                      {importResult.updated}
                    </span>
                  </div>
                )}
                <div className="px-5 py-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
                  <span className="text-xs text-slate-400 block">Total In Inventory</span>
                  <span className="text-2xl font-bold text-white font-mono mt-0.5 block">
                    {products.length}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Mazeed File Upload Karein</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg flex items-center gap-1.5"
                >
                  <span>Inventory / Stock Dekhein</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Instructions & Template Banner */}
              <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0 mt-0.5">
                    <Info className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <h4 className="font-bold text-white text-sm">
                      Pehle se tayyar Sample CSV Template istemal karein
                    </h4>
                    <p className="text-slate-300 mt-0.5 leading-relaxed">
                      Agar aap ke paas pehle se file nahi hai toh hamara ZamZam Disposable ka sample download karein, Excel ya Google Sheets mein open karein, apna maal bhar kar yahan drop karein.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={downloadSampleTemplate}
                  className="px-4 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shrink-0 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Sample Template Download Karein</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              {!file ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                    dragActive
                      ? 'border-emerald-400 bg-emerald-950/20'
                      : 'border-slate-700 bg-slate-950/50 hover:bg-slate-950 hover:border-slate-600'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv,text/plain"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-300 shadow-md">
                    <Upload className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      CSV File Yahan Drag & Drop Karein ya Click Karke Select Karein
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Supports: .csv, comma-separated, semicolon ya Excel CSV format
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                    <span>Columns: code, name, category, cost_price, sale_price, stock_qty, unit</span>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs sm:text-sm">{file.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs mt-1 text-slate-400">
                        <span>Total Rows: <strong className="text-white">{parsedRows.length}</strong></span>
                        <span>Theek (Valid): <strong className="text-emerald-400">{validCount}</strong></span>
                        {invalidCount > 0 && (
                          <span>Ghalti (Errors): <strong className="text-rose-400">{invalidCount}</strong></span>
                        )}
                        {duplicateCount > 0 && (
                          <span>Pehle se mojood: <strong className="text-amber-400">{duplicateCount}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleReset}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
                    >
                      File Badlein
                    </button>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {parseError && (
                <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Data Preview Table & Settings */}
              {parsedRows.length > 0 && (
                <div className="space-y-3">
                  {/* Filter & Options Toolbar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    {/* View Filters */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400 font-medium mr-1">Filter:</span>
                      <button
                        onClick={() => setFilterMode('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                          filterMode === 'all'
                            ? 'bg-slate-800 text-white border border-slate-700'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Sab ({parsedRows.length})
                      </button>
                      <button
                        onClick={() => setFilterMode('valid')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                          filterMode === 'valid'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                            : 'text-slate-400 hover:text-emerald-300'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Theek ({validCount})</span>
                      </button>
                      {invalidCount > 0 && (
                        <button
                          onClick={() => setFilterMode('invalid')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                            filterMode === 'invalid'
                              ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                              : 'text-slate-400 hover:text-rose-300'
                          }`}
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Errors ({invalidCount})</span>
                        </button>
                      )}
                    </div>

                    {/* Merge Checkbox */}
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
                      <input
                        type="checkbox"
                        checked={updateExisting}
                        onChange={(e) => setUpdateExisting(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>Pehle se maujood cheezon ki qeemat aur stock update karein</span>
                    </label>
                  </div>

                  {/* Preview Table */}
                  <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60 max-h-64 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/90 sticky top-0 border-b border-slate-800 text-slate-400 z-10">
                        <tr>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3">Code</th>
                          <th className="py-2 px-3">Cheez Ka Naam (Item)</th>
                          <th className="py-2 px-3">Category</th>
                          <th className="py-2 px-3 text-right">Khareed</th>
                          <th className="py-2 px-3 text-right">Bikri</th>
                          <th className="py-2 px-3 text-center">Stock</th>
                          <th className="py-2 px-3">Unit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {displayedRows.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-slate-500">
                              Koi row match nahi hui.
                            </td>
                          </tr>
                        ) : (
                          displayedRows.map((row) => (
                            <tr
                              key={row.index}
                              className={`transition ${
                                !row.isValid
                                  ? 'bg-rose-950/20 hover:bg-rose-950/30'
                                  : row.isDuplicate
                                  ? 'bg-amber-950/15 hover:bg-amber-950/25'
                                  : 'hover:bg-slate-900/50'
                              }`}
                            >
                              <td className="py-2 px-3">
                                {row.isValid ? (
                                  row.isDuplicate ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/30">
                                      Update
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                                      <CheckCircle2 className="w-3 h-3" />
                                      New
                                    </span>
                                  )
                                ) : (
                                  <span
                                    title={row.errors.join(', ')}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/30 cursor-help"
                                  >
                                    <AlertCircle className="w-3 h-3" />
                                    Error
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-400">
                                {row.code || <span className="text-slate-600">Auto</span>}
                              </td>
                              <td className="py-2 px-3 font-semibold text-white">
                                <div>
                                  <span>{row.name || <em className="text-rose-400">Naam Missing</em>}</span>
                                  {row.nameUrdu && (
                                    <span className="block text-[11px] text-slate-400 font-urdu">
                                      {row.nameUrdu}
                                    </span>
                                  )}
                                  {!row.isValid && (
                                    <span className="block text-[10px] text-rose-400 mt-0.5">
                                      {row.errors.join(' • ')}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 px-3 text-slate-400">{row.category}</td>
                              <td className="py-2 px-3 text-right font-mono text-slate-300">
                                {shopSettings.currency} {row.purchasePrice}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                                {shopSettings.currency} {row.salePrice}
                              </td>
                              <td className="py-2 px-3 text-center font-mono font-bold text-white">
                                {row.stockQuantity}
                              </td>
                              <td className="py-2 px-3 text-slate-400">{row.unit}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!importResult && (
          <div className="px-5 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>

            <div className="flex items-center gap-3">
              {parsedRows.length > 0 && validCount > 0 && (
                <span className="text-xs text-slate-400 hidden sm:inline">
                  <strong className="text-emerald-400">{validCount}</strong> items shamil karne ke liye tayyar hain
                </span>
              )}

              <button
                type="button"
                disabled={validCount === 0 || isImporting}
                onClick={handleConfirmImport}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl text-xs font-bold transition shadow-lg flex items-center gap-2"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Import Ho Raha Hai...</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4" />
                    <span>{validCount > 0 ? `${validCount} Items Import Karein` : 'Import Karein'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
