import React, { useState, useMemo } from 'react';
import { Search, Check } from 'lucide-react';
import { BottomSheetModal } from '../ui/BottomSheetModal';

interface Currency {
  code: string;
  name: string;
  symbol: string;
}

const POPULAR_CURRENCIES: Currency[] = [
  { code: 'eur', name: 'Euro', symbol: '€' },
  { code: 'usd', name: 'US Dollar', symbol: '$' },
  { code: 'gbp', name: 'British Pound', symbol: '£' },
  { code: 'cad', name: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'aud', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'jpy', name: 'Japanese Yen', symbol: '¥' },
];

const ALL_CURRENCIES: Currency[] = [
  { code: 'aed', name: 'United Arab Emirates Dirham', symbol: 'AED' },
  { code: 'afn', name: 'Afghan Afghani', symbol: 'AFN' },
  { code: 'all', name: 'Albanian Lek', symbol: 'L' },
  { code: 'amd', name: 'Armenian Dram', symbol: '֏' },
  { code: 'ang', name: 'Netherlands Antillean Guilder', symbol: 'ƒ' },
  { code: 'aoa', name: 'Angolan Kwanza', symbol: 'Kz' },
  { code: 'ars', name: 'Argentine Peso', symbol: '$' },
  { code: 'aud', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'awg', name: 'Aruban Florin', symbol: 'ƒ' },
  { code: 'azn', name: 'Azerbaijani Manat', symbol: '₼' },
  { code: 'bam', name: 'Bosnia-Herzegovina Convertible Mark', symbol: 'KM' },
  { code: 'bbd', name: 'Barbadian Dollar', symbol: '$' },
  { code: 'bdt', name: 'Bangladeshi Taka', symbol: '৳' },
  { code: 'bgn', name: 'Bulgarian Lev', symbol: 'лв' },
  { code: 'bhd', name: 'Bahraini Dinar', symbol: '.د.ب' },
  { code: 'bif', name: 'Burundian Franc', symbol: 'FBu' },
  { code: 'bmd', name: 'Bermudian Dollar', symbol: '$' },
  { code: 'bnd', name: 'Brunei Dollar', symbol: '$' },
  { code: 'bob', name: 'Bolivian Boliviano', symbol: 'Bs.' },
  { code: 'brl', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'bsd', name: 'Bahamian Dollar', symbol: '$' },
  { code: 'bwp', name: 'Botswana Pula', symbol: 'P' },
  { code: 'byn', name: 'Belarusian Ruble', symbol: 'Br' },
  { code: 'bzd', name: 'Belize Dollar', symbol: '$' },
  { code: 'cad', name: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'cdf', name: 'Congolese Franc', symbol: 'FC' },
  { code: 'chf', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'clp', name: 'Chilean Peso', symbol: '$' },
  { code: 'cny', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'cop', name: 'Colombian Peso', symbol: '$' },
  { code: 'crc', name: 'Costa Rican Colón', symbol: '₡' },
  { code: 'cve', name: 'Cape Verdean Escudo', symbol: '$' },
  { code: 'czk', name: 'Czech Koruna', symbol: 'Kč' },
  { code: 'djf', name: 'Djiboutian Franc', symbol: 'Fdj' },
  { code: 'dkk', name: 'Danish Krone', symbol: 'kr' },
  { code: 'dop', name: 'Dominican Peso', symbol: 'RD$' },
  { code: 'dzd', name: 'Algerian Dinar', symbol: 'د.ج' },
  { code: 'egp', name: 'Egyptian Pound', symbol: 'E£' },
  { code: 'etb', name: 'Ethiopian Birr', symbol: 'Br' },
  { code: 'eur', name: 'Euro', symbol: '€' },
  { code: 'fjd', name: 'Fijian Dollar', symbol: '$' },
  { code: 'fkp', name: 'Falkland Islands Pound', symbol: '£' },
  { code: 'gbp', name: 'British Pound', symbol: '£' },
  { code: 'gel', name: 'Georgian Lari', symbol: '₾' },
  { code: 'gip', name: 'Gibraltar Pound', symbol: '£' },
  { code: 'gmd', name: 'Gambian Dalasi', symbol: 'D' },
  { code: 'gnf', name: 'Guinean Franc', symbol: 'FG' },
  { code: 'gtq', name: 'Guatemalan Quetzal', symbol: 'Q' },
  { code: 'gyd', name: 'Guyanese Dollar', symbol: '$' },
  { code: 'hkd', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'hnl', name: 'Honduran Lempira', symbol: 'L' },
  { code: 'hrk', name: 'Croatian Kuna', symbol: 'kn' },
  { code: 'htg', name: 'Haitian Gourde', symbol: 'G' },
  { code: 'huf', name: 'Hungarian Forint', symbol: 'Ft' },
  { code: 'idr', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'ils', name: 'Israeli New Shekel', symbol: '₪' },
  { code: 'inr', name: 'Indian Rupee', symbol: '₹' },
  { code: 'isk', name: 'Icelandic Króna', symbol: 'kr' },
  { code: 'jmd', name: 'Jamaican Dollar', symbol: 'J$' },
  { code: 'jpy', name: 'Japanese Yen', symbol: '¥' },
  { code: 'kes', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'kgs', name: 'Kyrgyzstani Som', symbol: 'с' },
  { code: 'khr', name: 'Cambodian Riel', symbol: '៛' },
  { code: 'kmf', name: 'Comorian Franc', symbol: 'CF' },
  { code: 'krw', name: 'South Korean Won', symbol: '₩' },
  { code: 'kwd', name: 'Kuwaiti Dinar', symbol: 'د.ك' },
  { code: 'kyd', name: 'Cayman Islands Dollar', symbol: '$' },
  { code: 'kzt', name: 'Kazakhstani Tenge', symbol: '₸' },
  { code: 'lak', name: 'Lao Kip', symbol: '₭' },
  { code: 'lbp', name: 'Lebanese Pound', symbol: 'L£' },
  { code: 'lkr', name: 'Sri Lankan Rupee', symbol: 'Rs' },
  { code: 'lrd', name: 'Liberian Dollar', symbol: '$' },
  { code: 'lsl', name: 'Lesotho Loti', symbol: 'L' },
  { code: 'mad', name: 'Moroccan Dirham', symbol: 'د.م.' },
  { code: 'mdl', name: 'Moldovan Leu', symbol: 'L' },
  { code: 'mga', name: 'Malagasy Ariary', symbol: 'Ar' },
  { code: 'mkd', name: 'Macedonian Denar', symbol: 'ден' },
  { code: 'mmk', name: 'Myanmar Kyat', symbol: 'K' },
  { code: 'mnt', name: 'Mongolian Tögrög', symbol: '₮' },
  { code: 'mop', name: 'Macanese Pataca', symbol: 'MOP$' },
  { code: 'mro', name: 'Mauritanian Ouguiya', symbol: 'UM' },
  { code: 'mur', name: 'Mauritian Rupee', symbol: '₨' },
  { code: 'mvr', name: 'Maldivian Rufiyaa', symbol: 'Rf' },
  { code: 'mwk', name: 'Malawian Kwacha', symbol: 'MK' },
  { code: 'mxn', name: 'Mexican Peso', symbol: '$' },
  { code: 'myr', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'mzn', name: 'Mozambican Metical', symbol: 'MT' },
  { code: 'nad', name: 'Namibian Dollar', symbol: '$' },
  { code: 'ngn', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'nio', name: 'Nicaraguan Córdoba', symbol: 'C$' },
  { code: 'nok', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'npr', name: 'Nepalese Rupee', symbol: '₨' },
  { code: 'nzd', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'omr', name: 'Omani Rial', symbol: 'ر.ع.' },
  { code: 'pab', name: 'Panamanian Balboa', symbol: 'B/.' },
  { code: 'pen', name: 'Peruvian Sol', symbol: 'S/.' },
  { code: 'pgk', name: 'Papua New Guinean Kina', symbol: 'K' },
  { code: 'php', name: 'Philippine Peso', symbol: '₱' },
  { code: 'pkr', name: 'Pakistani Rupee', symbol: '₨' },
  { code: 'pln', name: 'Polish Złoty', symbol: 'zł' },
  { code: 'pyg', name: 'Paraguayan Guaraní', symbol: '₲' },
  { code: 'qar', name: 'Qatari Riyal', symbol: 'ر.ق' },
  { code: 'ron', name: 'Romanian Leu', symbol: 'lei' },
  { code: 'rsd', name: 'Serbian Dinar', symbol: 'дин.' },
  { code: 'rub', name: 'Russian Ruble', symbol: '₽' },
  { code: 'rwf', name: 'Rwandan Franc', symbol: 'FRw' },
  { code: 'sar', name: 'Saudi Riyal', symbol: 'ر.س' },
  { code: 'sbd', name: 'Solomon Islands Dollar', symbol: '$' },
  { code: 'scr', name: 'Seychellois Rupee', symbol: '₨' },
  { code: 'sek', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'sgd', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'shp', name: 'Saint Helena Pound', symbol: '£' },
  { code: 'sll', name: 'Sierra Leonean Leone', symbol: 'Le' },
  { code: 'sos', name: 'Somali Shilling', symbol: 'Sh' },
  { code: 'srd', name: 'Surinamese Dollar', symbol: '$' },
  { code: 'std', name: 'São Tomé and Príncipe Dobra', symbol: 'Db' },
  { code: 'szl', name: 'Swazi Lilangeni', symbol: 'L' },
  { code: 'thb', name: 'Thai Baht', symbol: '฿' },
  { code: 'tjs', name: 'Tajikistani Somoni', symbol: 'SM' },
  { code: 'top', name: 'Tongan Paʻanga', symbol: 'T$' },
  { code: 'try', name: 'Turkish Lira', symbol: '₺' },
  { code: 'ttd', name: 'Trinidad and Tobago Dollar', symbol: 'TT$' },
  { code: 'twd', name: 'New Taiwan Dollar', symbol: 'NT$' },
  { code: 'tzs', name: 'Tanzanian Shilling', symbol: 'TSh' },
  { code: 'uah', name: 'Ukrainian Hryvnia', symbol: '₴' },
  { code: 'ugx', name: 'Ugandan Shilling', symbol: 'USh' },
  { code: 'usd', name: 'US Dollar', symbol: '$' },
  { code: 'uyu', name: 'Uruguayan Peso', symbol: '$U' },
  { code: 'uzs', name: 'Uzbekistani Soʻm', symbol: 'лв' },
  { code: 'vnd', name: 'Vietnamese Đồng', symbol: '₫' },
  { code: 'vuv', name: 'Vanuatu Vatu', symbol: 'VT' },
  { code: 'wst', name: 'Samoan Tālā', symbol: 'WS$' },
  { code: 'xaf', name: 'Central African CFA Franc', symbol: 'FCFA' },
  { code: 'xcd', name: 'East Caribbean Dollar', symbol: '$' },
  { code: 'xof', name: 'West African CFA Franc', symbol: 'CFA' },
  { code: 'xpf', name: 'CFP Franc', symbol: '₣' },
  { code: 'yer', name: 'Yemeni Rial', symbol: '﷼' },
  { code: 'zar', name: 'South African Rand', symbol: 'R' },
  { code: 'zmw', name: 'Zambian Kwacha', symbol: 'ZK' },
];

interface CurrencySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (currencyCode: string) => void;
  currentCurrency: string;
}

export const CurrencySelectionModal: React.FC<CurrencySelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentCurrency,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCurrencies = useMemo(() => {
    if (!searchQuery) return ALL_CURRENCIES;
    const query = searchQuery.toLowerCase();
    return ALL_CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(query) ||
        c.name.toLowerCase().includes(query) ||
        c.symbol.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  return (
    <BottomSheetModal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Select Currency"
      maxWidth="max-w-md"
    >
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-white/10 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search currency..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#635BFF] transition-colors"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {!searchQuery && (
            <div className="mb-4">
              <h4 className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Popular</h4>
              {POPULAR_CURRENCIES.map((currency) => (
                <button
                  key={`pop-${currency.code}`}
                  onClick={() => {
                    onSelect(currency.code);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-colors ${
                    currentCurrency === currency.code
                      ? 'bg-[#635BFF]/10 text-[#635BFF]'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm font-bold">
                      {currency.symbol}
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{currency.code.toUpperCase()}</div>
                      <div className="text-xs opacity-60">{currency.name}</div>
                    </div>
                  </div>
                  {currentCurrency === currency.code && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          )}

          <div>
            <h4 className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
              {searchQuery ? 'Search Results' : 'All Currencies'}
            </h4>
            {filteredCurrencies.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                No currencies found matching "{searchQuery}"
              </div>
            ) : (
              filteredCurrencies.map((currency) => (
                <button
                  key={currency.code}
                  onClick={() => {
                    onSelect(currency.code);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-colors ${
                    currentCurrency === currency.code
                      ? 'bg-[#635BFF]/10 text-[#635BFF]'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm font-bold">
                      {currency.symbol}
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{currency.code.toUpperCase()}</div>
                      <div className="text-xs opacity-60">{currency.name}</div>
                    </div>
                  </div>
                  {currentCurrency === currency.code && <Check className="w-4 h-4" />}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </BottomSheetModal>
  );
};
