import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, DollarSign, ShoppingCart, RotateCcw, Calculator, Package, Camera, Loader2, Star, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import VoiceInput from "@/components/VoiceInput";
import TalkingBot from "@/components/TalkingBot";

export default function Scanner() {
  const [items, setItems] = useState([]);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [amountGiven, setAmountGiven] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [quickItems, setQuickItems] = useState([]);
  const fileInputRef = useRef(null);

  // Load quick items from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('quickAddItems');
    if (saved) {
      setQuickItems(JSON.parse(saved));
    }
  }, []);

  // Save quick items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('quickAddItems', JSON.stringify(quickItems));
  }, [quickItems]);

  const totalAmount = items.reduce((sum, item) => sum + item.price, 0);
  const totalItems = items.length;
  const change = amountGiven ? parseFloat(amountGiven) - totalAmount : 0;

  const addItem = (name, price) => {
    setItems([...items, { id: Date.now(), name, price }]);
  };

  const addCustomItem = () => {
    if (customName && customPrice) {
      addItem(customName, parseFloat(customPrice));
      setCustomName('');
      setCustomPrice('');
    }
  };

  const saveToQuickAdd = () => {
    if (customName && customPrice) {
      const newQuickItem = {
        id: Date.now(),
        name: customName,
        price: parseFloat(customPrice)
      };
      setQuickItems([...quickItems, newQuickItem]);
      setCustomName('');
      setCustomPrice('');
    }
  };

  const removeQuickItem = (id) => {
    setQuickItems(quickItems.filter(item => item.id !== id));
  };

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const clearAll = () => {
    setItems([]);
    setAmountGiven('');
  };

  const handleCameraScan = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      // Upload the image
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Extract price and item info using AI
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this image of a price tag or product label. Extract the item name and price. 
        If it's in a different currency, convert to South African Rands (ZAR). 
        Return the data in the specified JSON format.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            item_name: { type: "string" },
            price: { type: "number" }
          },
          required: ["item_name", "price"]
        }
      });

      if (result.item_name && result.price) {
        addItem(result.item_name, result.price);
      }
    } catch (error) {
      console.error('Error scanning image:', error);
      alert('Failed to scan the price tag. Please try again or enter manually.');
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-light text-white tracking-wide mb-2">
            Price Scanner
          </h1>
          <p className="text-slate-400 text-sm">Scan items • Calculate totals • Get change</p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left Panel - Item Entry & Quick Add */}
          <div className="lg:col-span-2 space-y-6">
            {/* Custom Item Entry */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Plus className="w-5 h-5 text-teal-400" />
                  <h2 className="text-white font-medium">Add Item</h2>
                </div>
                <div className="space-y-3">
                  <Input
                    placeholder="Item name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-teal-500 focus:ring-teal-500/20"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomItem()}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-teal-500 focus:ring-teal-500/20"
                  />
                  <div className="grid grid-cols-4 gap-2">
                    <Button 
                      onClick={addCustomItem}
                      className="bg-teal-600 hover:bg-teal-500 text-white transition-all duration-300"
                      disabled={!customName || !customPrice}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                    <Button 
                      onClick={saveToQuickAdd}
                      variant="outline"
                      className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                      disabled={!customName || !customPrice}
                      title="Save to Quick Add"
                    >
                      <Star className="w-4 h-4" />
                    </Button>
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-violet-600 hover:bg-violet-500 text-white transition-all duration-300"
                      disabled={isScanning}
                    >
                      {isScanning ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </Button>
                    <VoiceInput onItemDetected={addItem} />
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleCameraScan}
                    className="hidden"
                  />
                </div>
              </Card>
            </motion.div>

            {/* Quick Add Buttons */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-amber-400" />
                  <h2 className="text-white font-medium">Quick Add</h2>
                </div>
                {quickItems.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Star className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="text-xs">No quick items yet</p>
                    <p className="text-xs mt-1">Add items above and tap ⭐ to save</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {quickItems.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="relative group"
                      >
                        <button
                          onClick={() => addItem(item.name, item.price)}
                          className="w-full p-3 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 rounded-xl text-left transition-all duration-200"
                        >
                          <p className="text-white text-sm font-medium pr-6">{item.name}</p>
                          <p className="text-teal-400 text-xs">R{item.price.toFixed(2)}</p>
                        </button>
                        <button
                          onClick={() => removeQuickItem(item.id)}
                          className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          </div>

          {/* Right Panel - Cart & Payment */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-2 gap-4"
            >
              <Card className="bg-gradient-to-br from-teal-600/20 to-teal-700/10 border-teal-500/30 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-teal-300 text-xs uppercase tracking-wider mb-1">Items</p>
                    <p className="text-4xl font-light text-white">{totalItems}</p>
                  </div>
                  <ShoppingCart className="w-10 h-10 text-teal-500/50" />
                </div>
              </Card>
              <Card className="bg-gradient-to-br from-amber-600/20 to-amber-700/10 border-amber-500/30 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-300 text-xs uppercase tracking-wider mb-1">Total</p>
                    <p className="text-4xl font-light text-white">R{totalAmount.toFixed(2)}</p>
                  </div>
                  <DollarSign className="w-10 h-10 text-amber-500/50" />
                </div>
              </Card>
            </motion.div>

            {/* Scanned Items List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-teal-400" />
                    <h2 className="text-white font-medium">Scanned Items</h2>
                  </div>
                  {items.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={clearAll}
                      className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
                
                <div className="min-h-[200px] max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  <AnimatePresence mode="popLayout">
                    {items.length === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center h-[180px] text-slate-500"
                      >
                        <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
                        <p className="text-sm">No items scanned yet</p>
                      </motion.div>
                    ) : (
                      items.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: 20, height: 0 }}
                          animate={{ opacity: 1, x: 0, height: 'auto' }}
                          exit={{ opacity: 0, x: -20, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600/30 group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500 w-6">#{index + 1}</span>
                            <span className="text-white">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-teal-400 font-medium">R{item.price.toFixed(2)}</span>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </Card>
            </motion.div>

            {/* Payment Calculator */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="w-5 h-5 text-violet-400" />
                  <h2 className="text-white font-medium">Calculate Change</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-slate-400 text-xs uppercase tracking-wider mb-2 block">
                      Amount Given
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={amountGiven}
                        onChange={(e) => setAmountGiven(e.target.value)}
                        className="pl-10 text-xl bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 h-14"
                      />
                    </div>
                  </div>

                  {/* Change Display */}
                  <div className={`p-5 rounded-xl border transition-all duration-300 ${
                    !amountGiven 
                      ? 'bg-slate-700/30 border-slate-600/30' 
                      : change >= 0 
                        ? 'bg-emerald-500/10 border-emerald-500/30' 
                        : 'bg-red-500/10 border-red-500/30'
                  }`}>
                    <p className={`text-xs uppercase tracking-wider mb-1 ${
                      !amountGiven 
                        ? 'text-slate-500' 
                        : change >= 0 
                          ? 'text-emerald-400' 
                          : 'text-red-400'
                    }`}>
                      {!amountGiven ? 'Change Due' : change >= 0 ? 'Change to Return' : 'Amount Still Owed'}
                    </p>
                    <p className={`text-4xl font-light ${
                      !amountGiven 
                        ? 'text-slate-400' 
                        : change >= 0 
                          ? 'text-emerald-400' 
                          : 'text-red-400'
                    }`}>
                      R{amountGiven ? Math.abs(change).toFixed(2) : '0.00'}
                    </p>
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    {[50, 100, 200, 500].map((amount) => (
                      <motion.button
                        key={amount}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setAmountGiven(amount.toString())}
                        className="p-2 bg-slate-700/50 hover:bg-violet-600/30 border border-slate-600/50 hover:border-violet-500/50 rounded-lg text-white text-sm transition-all duration-200"
                      >
                        R{amount}
                      </motion.button>
                    ))}
                  </div>

                  {/* Talking Bot Button */}
                  <div className="pt-2">
                    <TalkingBot 
                      items={items}
                      totalAmount={totalAmount}
                      amountGiven={amountGiven}
                      change={change}
                    />
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.5);
        }
      `}</style>
    </div>
  );
}
