import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Maximize2, 
  Minimize2, 
  ShoppingBag, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Search, 
  X, 
  Trash2, 
  ChevronRight, 
  Loader2,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Smartphone,
  Calculator,
  History,
  Package,
  Users,
  Box,
  LayoutGrid,
  Star,
  Zap,
  Tag,
  Percent,
  UserPlus,
  ArrowDownToLine,
  Printer,
  RotateCcw,
  Lock,
  MoreVertical,
  Layers,
  Sparkles,
  Plus,
  Keyboard
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SEO } from '../components/SEO';
import {
  parseAccountHandle,
  routes,
  usernameFromAccountHandle,
} from '../routing/routes';

import { appToast } from '@/lib/feedback';
interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  currency: string;
  category_id?: string;
  variants?: any[];
  title?: string; // For listings table mapping
  type?: string; // digital or physical
}

interface CartItem extends Product {
  quantity: number;
  discount?: number;
}

export const PosTerminal = () => {
  const { accountHandle, systemname } = useParams();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStartup, setShowStartup] = useState(true);
  
  // View States
  const [activeView, setActiveView] = useState<'terminal' | 'transactions' | 'orders' | 'staff' | 'inventory'>('terminal');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  // Payment & Checkout States
  const [paymentMode, setPaymentMode] = useState<'select' | 'cash' | 'digital' | 'nfc_connect' | 'charge_menu' | 'onscreen'>('select');
  const [cashAmount, setCashAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [activeCheckout, setActiveCheckout] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'failed'>('pending');
  const [userId, setUserId] = useState<string | null>(null);
  const [isSandbox, setIsSandbox] = useState(false);
  const [showNumpad, setShowNumpad] = useState(false);
  
  // New Overhaul States
  const [staffMember, setStaffMember] = useState<any>(null);
  const [showStaffLogin, setShowStaffLogin] = useState(false);
  const [pincode, setPincode] = useState('');
  const [customer, setCustomer] = useState<any>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0); // 0% default
  const [showAiPowerUp, setShowAiPowerUp] = useState(false);
  const [selectedProductForDiscount, setSelectedProductForDiscount] = useState<Product | null>(null);
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<Product | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [ordersToFulfill, setOrdersToFulfill] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loginToken, setLoginToken] = useState<string | null>(null);
  const [showQuickLogin, setShowQuickLogin] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Mouse tracking for custom cursor
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Fetch products and other data
  useEffect(() => {
    const fetchData = async () => {
      // First get user by username
      const parsedAccountHandle = parseAccountHandle(accountHandle);
      if (!parsedAccountHandle) {
        setLoading(false);
        return;
      }
      const cleanUsername = usernameFromAccountHandle(parsedAccountHandle);
      const { data: userData } = await supabase
        .from('profiles')
        .select('id, stripe_account_id')
        .eq('username', cleanUsername)
        .maybeSingle();
        
      if (userData) {
        setUserId(userData.id);
        if (!userData.stripe_account_id) {
          setIsSandbox(true);
        }

        // Fetch everything else
        const [
          { data: listingsData },
          { data: categoriesData },
          { data: transactionsData },
          { data: ordersData },
          { data: inventoryData },
          { data: staffData }
        ] = await Promise.all([
          supabase.from('listings').select('*').eq('user_id', userData.id).in('status', ['active', 'published']),
          supabase.from('pos_categories').select('*').eq('user_id', userData.id),
          supabase.from('pos_transactions').select('*').eq('user_id', userData.id).order('created_at', { ascending: false }),
          supabase.from('pos_orders').select('*').eq('user_id', userData.id).eq('status', 'pending'),
          supabase.from('pos_inventory').select('*, product:products(name)').eq('user_id', userData.id),
          supabase.from('pos_staff').select('*').eq('user_id', userData.id)
        ]);

        if (listingsData) {
          const mappedProducts = listingsData.map(l => ({
            id: l.id,
            name: l.title,
            price: parseFloat(l.price) || 0,
            image_url: l.image_url || l.thumbnail || '',
            currency: 'EUR',
            category_id: l.category,
            type: l.type || 'physical'
          }));
          setProducts(mappedProducts);
        }
        if (categoriesData) setCategories(categoriesData);
        if (transactionsData) setTransactions(transactionsData);
        if (ordersData) setOrdersToFulfill(ordersData);
        if (inventoryData) setInventory(inventoryData);
        if (staffData) setStaffList(staffData);
      }
      
      setLoading(false);
      setTimeout(() => setShowStartup(false), 3000);
    };
    
    fetchData();
  }, [accountHandle]);

  // QR Login Logic
  useEffect(() => {
    const setupLoginSession = async () => {
      const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
      setLoginToken(token);
      
      const { error } = await supabase
        .from('pos_sessions')
        .insert({ token, system_name: systemname || 'default' });
        
      if (error) console.error('Error creating login session:', error);
      
      const channel = supabase
        .channel(`pos_session:${token}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'pos_sessions',
          filter: `token=eq.${token}`
        }, async (payload) => {
          if (payload.new.status === 'completed' && payload.new.user_id) {
            // Fetch user profile and set as staff or admin
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', payload.new.user_id)
              .single();
              
            if (profile) {
              setStaffMember({
                id: profile.id,
                name: profile.full_name || profile.username,
                role: 'Admin',
                pincode: '0000'
              });
            }
          }
        })
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    };
    
    setupLoginSession();
  }, [systemname]);

  const getLoginUrl = () => `${window.location.origin}/auth/${systemname}/${loginToken}`;

  // Real-time subscription for active checkout
  useEffect(() => {
    if (!activeCheckout) return;

    const channel = supabase
      .channel(`checkout:${activeCheckout.id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'pos_checkouts',
        filter: `id=eq.${activeCheckout.id}`
      }, (payload) => {
        const newStatus = payload.new.status;
        if (newStatus === 'paid') {
          setPaymentStatus('paid');
          // Clear cart after delay
          setTimeout(() => {
            setCart([]);
            setPaymentMode('select');
            setActiveCheckout(null);
            setPaymentStatus('pending');
          }, 5000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeCheckout]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const total = cart.reduce((sum, item) => {
    const itemPrice = item.price * (1 - (item.discount || 0) / 100);
    return sum + (itemPrice * item.quantity);
  }, 0);
  
  const discountedTotal = total * (1 - globalDiscount / 100);
  const taxAmount = discountedTotal * (taxRate / 100);
  const finalTotal = discountedTotal + taxAmount;
  
  const currency = products[0]?.currency || 'EUR';

  const handleNumpadInput = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    if (value === 'C') {
      setter('');
    } else if (value === 'back') {
      setter(prev => prev.slice(0, -1));
    } else {
      setter(prev => prev + value);
    }
  };

  const handleStaffLogin = () => {
    const staff = staffList.find(s => s.pincode === pincode);
    if (staff) {
      setStaffMember(staff);
      setShowStaffLogin(false);
      setPincode('');
    } else {
      appToast('Invalid Pincode');
      setPincode('');
    }
  };

  const handleCustomerLookup = async () => {
    if (!customerSearch) return;
    const { data } = await supabase
      .from('pos_customers')
      .select('*')
      .eq('email', customerSearch)
      .maybeSingle();
    
    if (data) {
      setCustomer(data);
    } else {
      setActiveView('customer_create' as any);
    }
  };

  const handleCharge = async (method: 'cash' | 'card' | 'qr') => {
    if (cart.length === 0) return;
    
    if (method === 'qr' || method === 'card') {
      startDigitalPayment();
      return;
    }
    
    try {
      // Save transaction
      const { data: transaction, error: txError } = await supabase
        .from('pos_transactions')
        .insert({
          user_id: userId,
          staff_id: staffMember?.id,
          customer_id: customer?.id,
          items: cart,
          total_amount: finalTotal,
          currency: currency,
          payment_method: method,
          status: method === 'cash' ? 'paid_cash' : 'pending'
        })
        .select()
        .single();

      if (txError) throw txError;

      // Handle digital products (create orders for fulfillment)
      const hasDigital = cart.some(item => item.type === 'digital');
      if (hasDigital) {
        await supabase.from('pos_orders').insert({
          user_id: userId,
          customer_email: customer?.email || customerSearch,
          items: cart.filter(item => item.type === 'digital'),
          total_amount: cart.filter(item => item.type === 'digital').reduce((s, i) => s + (i.price * i.quantity), 0),
          status: 'pending'
        });
      }

      setPaymentStatus('paid');
      
      // Clear cart after delay
      setTimeout(() => {
        setCart([]);
        setPaymentMode('select');
        setPaymentStatus('pending');
        setCustomer(null);
        setGlobalDiscount(0);
      }, 3000);

    } catch (err) {
      console.error('Error processing charge:', err);
    }
  };

  const startDigitalPayment = async () => {
    if (cart.length === 0) return;
    
    if (isSandbox) {
      // Simulate payment flow for sandbox
      setPaymentMode('digital');
      // In sandbox, we don't create a real checkout session or we create a dummy one
      // For now, let's just show the digital screen but with a warning
      return;
    }

    setPaymentMode('digital');
    
    try {
      // Create checkout session in DB
      const { data, error } = await supabase
        .from('pos_checkouts')
        .insert({
          user_id: userId, // Might be null if public, but RLS might block. Assuming public insert allowed or user is owner.
          system_name: systemname,
          items: cart,
          total_amount: total,
          currency: currency,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      setActiveCheckout(data);
    } catch (err) {
      console.error('Error creating checkout:', err);
    }
  };

  const getCheckoutUrl = () => {
    const parsedAccountHandle = parseAccountHandle(accountHandle);
    if (!activeCheckout || !parsedAccountHandle || !systemname) return '';
    const checkoutName = `order-${new Date().getTime()}`;
    return `${window.location.origin}${routes.accountPosCheckout({
      accountHandle: parsedAccountHandle,
      systemName: systemname,
      checkoutName,
      checkoutId: String(activeCheckout.id),
    })}`;
  };

  const getNfcConnectUrl = () => {
    const parsedAccountHandle = parseAccountHandle(accountHandle);
    if (!parsedAccountHandle || !systemname) return '';
    return `${window.location.origin}${routes.accountPosNfc({
      accountHandle: parsedAccountHandle,
      systemName: systemname,
    })}`;
  };

  const renderView = () => {
    switch (activeView) {
      case 'transactions':
        return (
          <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-black tracking-tight mb-2">History</h2>
                <p className="text-gray-500 font-medium">Review and manage all past POS sales</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/5">
                  <button className="px-4 py-2 bg-white text-black rounded-xl text-xs font-bold shadow-lg">All Time</button>
                  <button className="px-4 py-2 text-gray-500 hover:text-white rounded-xl text-xs font-bold transition-colors">Today</button>
                </div>
                <button onClick={() => setActiveView('terminal')} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-sm font-bold border border-white/5">Back to Terminal</button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {transactions.length === 0 ? (
                <div className="text-center py-32 bg-[#141414] rounded-[3.5rem] border border-white/5 shadow-2xl shadow-black/40">
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    <History className="w-10 h-10 text-gray-700" />
                  </div>
                  <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-xs">No transactions found</p>
                </div>
              ) : (
                transactions.map(tx => (
                  <motion.div 
                    key={tx.id} 
                    whileHover={{ scale: 1.01 }}
                    className="bg-[#141414] border border-white/5 rounded-[2.5rem] p-8 flex items-center justify-between group hover:border-white/20 transition-all shadow-xl"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-emerald-500/10 rounded-[1.5rem] flex items-center justify-center border border-emerald-500/20">
                        <History className="w-8 h-8 text-emerald-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-black text-2xl text-white">{tx.currency.toUpperCase()} {tx.total_amount.toFixed(2)}</p>
                          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest">Completed</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
                          <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {tx.staff_id ? 'Staff Member' : 'System'}</span>
                          <span className="w-1 h-1 bg-gray-700 rounded-full" />
                          <span>{new Date(tx.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-white transition-all border border-white/5" title="Print Receipt">
                        <Printer className="w-6 h-6" />
                      </button>
                      <button className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-red-500 transition-all border border-white/5" title="Refund">
                        <RotateCcw className="w-6 h-6" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        );
      case 'orders':
        return (
          <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-black tracking-tight mb-2">Orders</h2>
                <p className="text-gray-500 font-medium">Manage pending fulfillments and custom requests</p>
              </div>
              <button onClick={() => setActiveView('terminal')} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-sm font-bold border border-white/5">Back to Terminal</button>
            </div>

            {ordersToFulfill.length === 0 ? (
              <div className="text-center py-32 bg-[#141414] rounded-[3.5rem] border border-white/5 shadow-2xl shadow-black/40">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="w-10 h-10 text-gray-700" />
                </div>
                <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-xs">No pending orders</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {ordersToFulfill.map(order => (
                  <motion.div 
                    key={order.id} 
                    whileHover={{ y: -5 }}
                    className="bg-[#141414] border border-white/5 rounded-[3rem] p-8 space-y-6 shadow-2xl hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-4 py-1.5 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/20">Pending</span>
                      <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <h3 className="font-black text-xl text-white mb-1 truncate">{order.customer_email || 'Guest Customer'}</h3>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Order #{order.id.slice(0, 8)}</p>
                    </div>
                    <div className="space-y-3 py-6 border-y border-white/5">
                      {order.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-gray-400 font-medium">{item.quantity}x {item.name}</span>
                          <span className="font-mono text-gray-500">€{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <button className="w-full py-4 bg-white text-black rounded-[1.5rem] font-black text-sm hover:bg-gray-200 transition-all shadow-lg active:scale-95">Mark as Fulfilled</button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        );
      case 'staff':
        return (
          <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-black tracking-tight mb-2">Staff</h2>
                <p className="text-gray-500 font-medium">Manage team members and terminal access</p>
              </div>
              <button onClick={() => setActiveView('terminal')} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-sm font-bold border border-white/5">Back to Terminal</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {staffList.map(staff => (
                <motion.button 
                  key={staff.id}
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setStaffMember(staff); setActiveView('terminal'); }}
                  className={`relative overflow-hidden bg-[#141414] border rounded-[3rem] p-10 text-center transition-all shadow-2xl ${staffMember?.id === staff.id ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/5 hover:border-white/20'}`}
                >
                  {staffMember?.id === staff.id && (
                    <div className="absolute top-6 right-6 w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
                  )}
                  <div className="w-24 h-24 bg-gradient-to-tr from-white/5 to-white/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-white/5">
                    <Users className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="font-black text-2xl mb-2 text-white">{staff.name}</h3>
                  <div className="flex items-center justify-center gap-2">
                    <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{staff.role}</span>
                  </div>
                  
                  <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-center gap-6">
                    <div className="text-center">
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Sales</p>
                      <p className="font-mono font-bold text-white">12</p>
                    </div>
                    <div className="w-px h-8 bg-white/5" />
                    <div className="text-center">
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Status</p>
                      <p className="text-emerald-500 font-bold text-xs uppercase">Active</p>
                    </div>
                  </div>
                </motion.button>
              ))}
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white/5 border border-dashed border-white/10 rounded-[3rem] p-10 text-center hover:bg-white/10 transition-all flex flex-col items-center justify-center group"
              >
                <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mb-6 border border-dashed border-white/10 group-hover:scale-110 transition-transform">
                  <Plus className="w-10 h-10 text-gray-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-black text-2xl text-gray-500 group-hover:text-white transition-colors">Add Staff</h3>
                <p className="text-sm text-gray-600 mt-2">Create new terminal access</p>
              </motion.button>
            </div>
          </div>
        );
      case 'inventory':
        return (
          <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-black tracking-tight mb-2">Stock</h2>
                <p className="text-gray-500 font-medium">Inventory levels and license key management</p>
              </div>
              <div className="flex items-center gap-4">
                <button className="px-6 py-3 bg-white text-black rounded-2xl transition-all text-sm font-bold flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95">
                  <Plus className="w-4 h-4" /> Add Item
                </button>
                <button onClick={() => setActiveView('terminal')} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-sm font-bold border border-white/5">Back to Terminal</button>
              </div>
            </div>

            <div className="bg-[#141414] border border-white/5 rounded-[3.5rem] overflow-hidden shadow-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5">
                    <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Product</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Type</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Stock / Key</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {inventory.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-10 py-32 text-center">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Box className="w-10 h-10 text-gray-700" />
                        </div>
                        <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-xs">No inventory items found</p>
                      </td>
                    </tr>
                  ) : (
                    inventory.map(item => (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center font-black text-white border border-white/5">
                              {item.product?.name?.[0] || 'P'}
                            </div>
                            <span className="font-black text-lg text-white">{item.product?.name || 'Unknown Product'}</span>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${item.type === 'license_key' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                            {item.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-10 py-8">
                          <div className="flex flex-col">
                            <span className="font-mono font-black text-white text-lg">{item.type === 'license_key' ? '••••-••••' : item.quantity}</span>
                            {item.type === 'license_key' && <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">Encrypted Key</span>}
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-2.5 h-2.5 rounded-full ${item.status === 'available' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`} />
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{item.status}</span>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-500 hover:text-white transition-all border border-white/5">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'customer_create' as any:
        return (
          <div className="flex-1 flex items-center justify-center p-10">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-xl w-full bg-[#141414] border border-white/5 rounded-[4rem] p-12 shadow-2xl space-y-10"
            >
              <div className="text-center">
                <div className="w-24 h-24 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-emerald-500/20">
                  <UserPlus className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-4xl font-black mb-3">New Customer</h2>
                <p className="text-gray-500 font-medium">Create a profile for {customerSearch}</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2 px-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Email Address</label>
                  <input 
                    type="email" 
                    value={customerSearch}
                    disabled
                    className="w-full bg-white/5 border border-white/5 rounded-3xl p-6 text-white font-bold opacity-50 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2 px-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Full Name (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="John Doe"
                    className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-white font-bold focus:outline-none focus:border-emerald-500 transition-all"
                    id="new-customer-name"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setActiveView('terminal')}
                  className="flex-1 py-6 bg-white/5 hover:bg-white/10 rounded-[2rem] font-black text-lg transition-all border border-white/5"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    const name = (document.getElementById('new-customer-name') as HTMLInputElement).value;
                    const { data: newCust } = await supabase
                      .from('pos_customers')
                      .insert({ email: customerSearch, name, user_id: userId })
                      .select()
                      .single();
                    if (newCust) {
                      setCustomer(newCust);
                      setActiveView('terminal');
                    }
                  }}
                  className="flex-1 py-6 bg-white text-black rounded-[2rem] font-black text-lg hover:bg-gray-200 transition-all shadow-xl active:scale-95"
                >
                  Create Profile
                </button>
              </div>
            </motion.div>
          </div>
        );
      default:
        return (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Topbar Navigation */}
            <div className="h-24 border-b border-white/5 flex items-center px-10 gap-10 bg-[#0f0f0f]/50 backdrop-blur-2xl shrink-0">
              <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-[2rem] border border-white/5">
                {[
                  { id: 'terminal', label: 'Terminal', icon: LayoutGrid },
                  { id: 'transactions', label: 'History', icon: History },
                  { id: 'orders', label: 'Orders', icon: Package },
                  { id: 'staff', label: 'Staff', icon: Users },
                  { id: 'inventory', label: 'Stock', icon: Box }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveView(tab.id as any)}
                    className={`flex items-center gap-2.5 px-6 py-3 rounded-[1.5rem] text-sm font-bold transition-all duration-300 ${activeView === tab.id ? 'bg-white text-black shadow-[0_10px_20px_rgba(255,255,255,0.1)] scale-105' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                  >
                    <tab.icon className="w-4.5 h-4.5" />
                    {tab.label}
                  </button>
                ))}
              </div>
              
              <div className="flex-1 max-w-2xl">
                <div className="relative group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products, orders, customers..."
                    className="w-full bg-white/5 border border-white/5 rounded-[2.5rem] pl-16 pr-8 py-4 text-white focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all text-lg"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 px-5 py-2.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Stripe Live</span>
                </div>
                <button onClick={toggleFullscreen} className="p-4 bg-white/5 rounded-[1.5rem] text-gray-400 hover:text-white transition-all hover:scale-110 active:scale-90 border border-white/5">
                  {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
                </button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Left Sidebar: Categories & Filters */}
              <div className="w-72 border-r border-white/5 flex flex-col bg-[#0f0f0f]/30 shrink-0">
                <div className="p-6 border-b border-white/5">
                  <button 
                    onClick={() => setShowStaffLogin(true)}
                    className="w-full flex items-center gap-4 p-4 bg-white/5 rounded-[1.5rem] hover:bg-white/10 transition-all text-left border border-white/5"
                  >
                    <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {staffMember?.name?.[0] || 'A'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Logged in as</p>
                      <p className="font-bold truncate text-white">{staffMember?.name || 'Admin - Wersee'}</p>
                    </div>
                    <Lock className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  <section>
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 px-2">Categories</h3>
                    <div className="space-y-1">
                      <button 
                        onClick={() => setActiveCategory(null)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${!activeCategory ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                      >
                        <LayoutGrid className="w-4 h-4" /> All Products
                      </button>
                      {categories.map(cat => (
                        <button 
                          key={cat.id}
                          onClick={() => setActiveCategory(cat.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeCategory === cat.id ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                          <Layers className="w-4 h-4" /> {cat.name}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 px-2">Smart Collections</h3>
                    <div className="space-y-1">
                      <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-gray-500 hover:text-white hover:bg-white/5 transition-all">
                        <Star className="w-4 h-4 text-yellow-500" /> Most Popular
                      </button>
                      <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-gray-500 hover:text-white hover:bg-white/5 transition-all">
                        <Zap className="w-4 h-4 text-blue-500" /> Recently Added
                      </button>
                    </div>
                  </section>
                </div>

                <div className="p-6 border-t border-white/5">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Terminal</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-mono text-gray-600">v1.2.4</span>
                      <span className="text-[8px] font-bold text-gray-700 uppercase tracking-tighter">Powered by Stripe & Wersee</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Grid */}
              <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {products
                    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .filter(p => !activeCategory || p.category_id === activeCategory)
                    .map(product => (
                    <motion.button
                      key={product.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => addToCart(product)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setSelectedProductForDiscount(product);
                      }}
                      className="bg-[#141414] border border-white/5 rounded-[2.5rem] p-5 text-left group hover:border-white/20 transition-all flex flex-col h-full shadow-lg shadow-black/20 relative overflow-hidden"
                    >
                      <div className="aspect-square bg-white/5 rounded-[2rem] mb-4 overflow-hidden relative">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600">
                            <ShoppingBag className="w-10 h-10 opacity-50" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform">
                            <Plus className="w-6 h-6 text-black" />
                          </div>
                        </div>
                      </div>
                      <h3 className="font-bold text-gray-200 mb-1 truncate text-lg">{product.name}</h3>
                      <div className="flex items-center justify-between">
                        <p className="text-gray-500 font-mono text-sm">{product.currency?.toUpperCase() || 'EUR'} {product.price.toFixed(2)}</p>
                        {product.variants && (
                          <span className="text-[10px] bg-white/5 px-2 py-1 rounded-full text-gray-500 font-bold uppercase tracking-widest">Variants</span>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen bg-[#0A0A0A] text-white flex overflow-hidden font-sans relative cursor-none">
      <SEO 
        title={`POS Terminal - ${systemname}`} 
        description="Wersee Point of Sale Terminal"
        url={parseAccountHandle(accountHandle) && systemname
          ? routes.accountPosTerminal({
              accountHandle: parseAccountHandle(accountHandle)!,
              systemName: systemname,
            })
          : '/'}
        noIndex={true}
      />

      {/* Custom Cursor */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 pointer-events-none z-[9999] mix-blend-difference"
        animate={{
          x: mousePos.x - 16,
          y: mousePos.y - 16,
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 400, mass: 0.5 }}
      >
        <div className="w-full h-full border-2 border-white rounded-full flex items-center justify-center">
          <div className="w-1 h-1 bg-white rounded-full" />
        </div>
      </motion.div>
      
      {/* Sandbox Banner */}
      {isSandbox && (
        <div className="absolute top-0 left-0 w-full bg-yellow-500 text-black text-[10px] font-black text-center py-1 z-[100] tracking-[0.2em] uppercase">
          Sandbox Mode Active • Stripe Not Connected • No Real Payments
        </div>
      )}

      {/* Main View Render */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {renderView()}
      </div>

      {/* Right Sidebar: Cart & Checkout */}
      <div className="w-[520px] bg-[#0f0f0f] border-l border-white/5 flex flex-col shadow-2xl z-20 rounded-l-[4rem] my-4 mr-4 overflow-hidden relative border-y border-white/5">
        
        {/* Profile Login QR */}
        {!staffMember && loginToken && showQuickLogin && (
          <div className="p-8 pb-0">
            <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-6 flex items-center gap-6 relative group">
              <button 
                onClick={() => setShowQuickLogin(false)}
                className="absolute top-4 right-4 p-2 text-gray-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="p-2 bg-white rounded-2xl">
                <QRCodeSVG value={getLoginUrl()} size={80} />
              </div>
              <div className="flex-1">
                <h4 className="font-black text-white text-sm uppercase tracking-widest mb-1">Quick Login</h4>
                <p className="text-[10px] text-gray-500 font-medium leading-relaxed">Scan with Wersee mobile to sync your profile instantly.</p>
              </div>
            </div>
          </div>
        )}

        {/* Customer Lookup & Quick Actions */}
        <div className="p-8 pb-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomerLookup()}
                placeholder="Customer email or phone..."
                className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-12 py-4 text-sm text-white focus:outline-none focus:border-white/20 transition-all"
              />
              <button 
                onClick={handleCustomerLookup}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>
            <button 
              onClick={() => setShowNumpad(!showNumpad)}
              className={`p-4 rounded-2xl transition-all border ${showNumpad ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'}`}
            >
              <Calculator className="w-6 h-6" />
            </button>
          </div>
          
          <AnimatePresence>
            {customer && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-lg font-bold">
                    {customer.email[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-white">{customer.email}</p>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Loyal Customer • 5% Discount Applied</p>
                  </div>
                </div>
                <button onClick={() => setCustomer(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Integrated Numpad (9-digit ding) */}
        <AnimatePresence>
          {showNumpad && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-8 overflow-hidden"
            >
              <div className="bg-[#141414] rounded-[2.5rem] p-6 border border-white/5 space-y-4 mb-4">
                <div className="bg-black/40 rounded-2xl p-4 text-right border border-white/5">
                  <span className="text-3xl font-mono font-black text-white">{customAmount || '0.00'}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'C'].map((n) => (
                    <button
                      key={n}
                      onClick={() => handleNumpadInput(n.toString(), setCustomAmount)}
                      className={`h-14 rounded-xl font-bold text-xl transition-all active:scale-95 ${
                        n === 'C' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-white/5 hover:bg-white/10 text-white'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => {
                    const price = parseFloat(customAmount);
                    if (!isNaN(price) && price > 0) {
                      addToCart({
                        id: `custom-${Date.now()}`,
                        name: 'Custom Price',
                        price: price,
                        image_url: '',
                        currency: currency
                      });
                      setCustomAmount('');
                      setShowNumpad(false);
                    }
                  }}
                  className="w-full py-4 bg-white text-black rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Add Custom Price
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cart Header */}
        <div className="px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-gray-500" />
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active Cart</h3>
          </div>
          <button 
            onClick={() => setCart([])}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-500/5 hover:bg-red-500/10 rounded-xl text-red-500/50 hover:text-red-500 transition-all text-[10px] font-bold uppercase tracking-widest"
          >
            <Trash2 className="w-3 h-3" /> Clear
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-8 space-y-3 scrollbar-hide">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-700 space-y-4 border-2 border-dashed border-white/5 rounded-[3rem] m-2">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-10 h-10 opacity-20" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest opacity-50">Empty Cart</p>
            </div>
          ) : (
            cart.map(item => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={item.id} 
                className="flex items-center gap-4 p-5 bg-white/5 rounded-[2.5rem] border border-white/5 group relative hover:bg-white/10 transition-colors"
              >
                <div className="w-16 h-16 bg-black/20 rounded-2xl overflow-hidden shrink-0">
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-gray-700" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate text-white">{item.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-500 font-mono">{currency} {item.price.toFixed(2)}</p>
                    {item.discount && (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded-full font-bold">-{item.discount}%</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-black/40 rounded-2xl p-1 border border-white/5">
                  <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">-</button>
                  <span className="font-mono font-bold w-6 text-center text-sm">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">+</button>
                </div>
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="absolute -top-1 -right-1 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110 active:scale-90"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))
          )}
        </div>


        {/* Checkout Footer */}
        <div className="bg-[#0A0A0A] p-8 border-t border-white/5 space-y-6 relative">
          {/* AI Power-up Button */}
          <button 
            onClick={() => setShowAiPowerUp(!showAiPowerUp)}
            className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform group"
          >
            <Sparkles className="w-6 h-6 text-white group-hover:animate-pulse" />
          </button>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Subtotal</span>
              <span className="font-mono font-bold text-gray-300">{currency} {total.toFixed(2)}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Discount</span>
                <button onClick={() => setGlobalDiscount(globalDiscount === 0 ? 10 : 0)} className="text-[10px] text-blue-500 hover:underline">Add Coupon</button>
              </div>
              <span className="font-mono font-bold text-emerald-500">-{globalDiscount}%</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Tax (VAT {taxRate}%)</span>
              <span className="font-mono font-bold text-gray-300">{currency} {taxAmount.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between text-4xl font-black text-white pt-6 border-t border-white/10">
              <span className="tracking-tight">TOTAL</span>
              <span className="font-mono">{currency} {finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <button 
            onClick={() => setPaymentMode('charge_menu')}
            disabled={cart.length === 0}
            className="w-full py-6 bg-white text-black rounded-[2.5rem] font-black text-2xl hover:bg-gray-200 transition-all active:scale-[0.98] shadow-[0_20px_50px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            CHARGE <ChevronRight className="w-8 h-8" />
          </button>
        </div>

        {/* AI Power-up Suggestions Overlay */}
        <AnimatePresence>
          {showAiPowerUp && (
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="absolute bottom-[180px] left-8 right-8 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] p-6 shadow-2xl z-50 border border-white/20"
            >
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-white" />
                <h4 className="font-bold text-white uppercase tracking-widest text-xs">Wersee AI Insights</h4>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                  <p className="text-sm text-white font-medium">"Klant koopt een Monthly Subscription? Wijs ze erop dat een Yearly sub nu €20 goedkoper is via de POS!"</p>
                </div>
                <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                  <p className="text-sm text-white font-medium">"Voorraad van Licentie-Keys is bijna op (nog 3 over). Genereer er nu 50 bij?"</p>
                </div>
              </div>
              <button onClick={() => setShowAiPowerUp(false)} className="w-full mt-4 py-3 bg-black/20 hover:bg-black/40 rounded-xl text-white text-xs font-bold transition-colors">Dismiss</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Charge Menu Overlay */}
        <AnimatePresence>
          {paymentMode === 'charge_menu' && (
            <motion.div 
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              className="absolute inset-0 bg-[#0A0A0A] z-50 flex flex-col p-8"
            >
              <div className="flex items-center justify-between mb-12">
                <button onClick={() => setPaymentMode('select')} className="text-gray-400 hover:text-white flex items-center gap-2 font-bold uppercase tracking-widest text-xs">
                  <ArrowLeft className="w-4 h-4" /> Back to Cart
                </button>
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Amount Due</p>
                  <p className="text-4xl font-black text-white">{currency} {finalTotal.toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 flex-1">
                <button 
                  onClick={() => handleCharge('qr')}
                  className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] hover:border-blue-500/50 hover:bg-blue-500/10 transition-all flex items-center gap-6 group"
                >
                  <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <div className="text-left">
                    <p className="text-xl font-bold text-white">QR-Pay / Digital</p>
                    <p className="text-sm text-gray-500">Scan to pay with phone</p>
                  </div>
                </button>

                <button 
                  disabled
                  className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] opacity-50 cursor-not-allowed flex items-center gap-6 group"
                >
                  <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-500">
                    <CreditCard className="w-8 h-8" />
                  </div>
                  <div className="text-left">
                    <p className="text-xl font-bold text-white">Card Reader</p>
                    <p className="text-sm text-gray-500">Hardware not connected</p>
                  </div>
                </button>

                <button 
                  onClick={() => setPaymentMode('nfc_connect')}
                  className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] hover:border-amber-500/50 hover:bg-amber-500/10 transition-all flex items-center gap-6 group"
                >
                  <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                    <Smartphone className="w-8 h-8" />
                  </div>
                  <div className="text-left">
                    <p className="text-xl font-bold text-white">NFC / Mobile Connect</p>
                    <p className="text-sm text-gray-500">Connect phone for NFC payments</p>
                  </div>
                </button>

                <button 
                  onClick={() => setPaymentMode('cash')}
                  className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all flex items-center gap-6 group"
                >
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                    <Banknote className="w-8 h-8" />
                  </div>
                  <div className="text-left">
                    <p className="text-xl font-bold text-white">Cash Payment</p>
                    <p className="text-sm text-gray-500">AI Change Calculation</p>
                  </div>
                </button>

                <button 
                  onClick={() => setPaymentMode('onscreen')}
                  className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all flex items-center gap-6 group"
                >
                  <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                    <CreditCard className="w-8 h-8" />
                  </div>
                  <div className="text-left">
                    <p className="text-xl font-bold text-white">Pay On Screen</p>
                    <p className="text-sm text-gray-500">Manual card entry for keyboard users</p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Digital / QR Payment Overlay */}
        <AnimatePresence>
          {paymentMode === 'digital' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 bg-[#0A0A0A] z-[160] flex flex-col p-12"
            >
              <button onClick={() => setPaymentMode('charge_menu')} className="absolute top-8 left-8 text-gray-500 hover:text-white">
                <ArrowLeft className="w-6 h-6" />
              </button>
              
              <div className="max-w-md mx-auto w-full space-y-12 mt-12 text-center">
                <div>
                  <div className="w-24 h-24 bg-blue-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-blue-500/20">
                    <QrCode className="w-12 h-12 text-blue-500" />
                  </div>
                  <h2 className="text-4xl font-black mb-3">QR Payment</h2>
                  <p className="text-gray-500 font-medium">Scan the code below to complete payment</p>
                </div>

                <div className="bg-white p-8 rounded-[3rem] shadow-2xl shadow-blue-500/20 inline-block mx-auto border-8 border-white/5">
                  <QRCodeSVG 
                    value={activeCheckout ? getCheckoutUrl() : "https://wersee.com/sandbox-payment"} 
                    size={240} 
                    level="H"
                    includeMargin={false}
                  />
                </div>

                <div className="space-y-6">
                  <div className="p-6 bg-white/5 border border-white/5 rounded-[2rem]">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Amount Due</p>
                    <p className="text-3xl font-black text-white">{currency} {finalTotal.toFixed(2)}</p>
                  </div>

                  {paymentStatus === 'paid' ? (
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center justify-center gap-3 text-emerald-500 font-black text-xl"
                    >
                      <CheckCircle2 className="w-8 h-8" /> PAYMENT RECEIVED
                    </motion.div>
                  ) : (
                    <div className="flex items-center justify-center gap-3 text-gray-500 font-bold animate-pulse">
                      <RefreshCw className="w-5 h-5 animate-spin" /> Waiting for payment...
                    </div>
                  )}
                </div>

                {isSandbox && (
                  <button 
                    onClick={() => setPaymentStatus('paid')}
                    className="w-full py-4 bg-blue-500/10 text-blue-500 rounded-2xl font-bold text-sm border border-blue-500/20 hover:bg-blue-500/20 transition-all"
                  >
                    Simulate Successful Payment (Sandbox)
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* On-Screen Payment Overlay */}
        <AnimatePresence>
          {paymentMode === 'onscreen' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 bg-[#0A0A0A] z-[160] flex flex-col p-12"
            >
              <button onClick={() => setPaymentMode('charge_menu')} className="absolute top-8 left-8 text-gray-500 hover:text-white">
                <ArrowLeft className="w-6 h-6" />
              </button>
              
              <div className="max-w-md mx-auto w-full space-y-8 mt-12">
                <div className="text-center">
                  <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CreditCard className="w-10 h-10 text-indigo-500" />
                  </div>
                  <h2 className="text-3xl font-black mb-2">Manual Entry</h2>
                  <p className="text-gray-500">Enter credit card details securely on screen</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Card Number</label>
                    <input type="text" placeholder="0000 0000 0000 0000" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-mono" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Expiry</label>
                      <input type="text" placeholder="MM/YY" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-mono" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">CVC</label>
                      <input type="text" placeholder="000" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-mono" />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => handleCharge('card')}
                  className="w-full py-6 bg-white text-black rounded-[2rem] font-black text-xl hover:bg-gray-200 transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3"
                >
                  Confirm Payment <CheckCircle2 className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* NFC Connect Overlay */}
        <AnimatePresence>
          {paymentMode === 'nfc_connect' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 bg-[#0A0A0A] z-[160] flex flex-col p-12 items-center justify-center text-center"
            >
              <button onClick={() => setPaymentMode('charge_menu')} className="absolute top-8 left-8 text-gray-500 hover:text-white">
                <ArrowLeft className="w-6 h-6" />
              </button>
              
              <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mb-8">
                <Smartphone className="w-12 h-12 text-amber-500" />
              </div>
              
              <h2 className="text-3xl font-bold mb-4">Connect Mobile</h2>
              <p className="text-gray-400 mb-12 max-w-xs">Scan this QR code with your phone to activate NFC payments and mobile checkout.</p>
              
              <div className="p-8 bg-white rounded-[3rem] shadow-2xl shadow-amber-500/20 mb-12">
                <QRCodeSVG value={getNfcConnectUrl()} size={200} />
              </div>
              
              <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-full border border-white/10">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Waiting for connection...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Staff Login Overlay */}
        <AnimatePresence>
          {showStaffLogin && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[200] flex items-center justify-center"
            >
              <div className="w-full max-w-lg p-16 text-center space-y-12">
                <div className="w-32 h-32 bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-white/10 shadow-2xl">
                  <Lock className="w-12 h-12 text-gray-400" />
                </div>
                <div>
                  <h2 className="text-5xl font-black text-white mb-4 tracking-tight">Terminal Lock</h2>
                  <p className="text-gray-500 text-lg font-medium">Enter your 4-digit security PIN</p>
                </div>
                
                <div className="flex justify-center gap-6">
                  {[1, 2, 3, 4].map((_, i) => (
                    <motion.div 
                      key={i} 
                      animate={pincode.length > i ? { scale: [1, 1.2, 1], backgroundColor: '#fff' } : {}}
                      className={`w-5 h-5 rounded-full border-2 border-white/20 transition-colors ${pincode.length > i ? 'bg-white border-white shadow-[0_0_15px_rgba(255,255,255,0.5)]' : ''}`} 
                    />
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map((n) => (
                    <button
                      key={n}
                      onClick={() => {
                        if (n === 'C') setPincode('');
                        else if (n === 'OK') handleStaffLogin();
                        else if (pincode.length < 4) setPincode(prev => prev + n);
                      }}
                      className={`h-24 rounded-[2rem] text-3xl font-black transition-all active:scale-90 shadow-xl ${
                        n === 'OK' ? 'bg-white text-black hover:bg-gray-200' : 'bg-white/5 hover:bg-white/10 text-white border border-white/5'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                
                <button onClick={() => setShowStaffLogin(false)} className="text-gray-600 hover:text-white font-black uppercase tracking-[0.3em] text-xs transition-colors">Cancel Session</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
