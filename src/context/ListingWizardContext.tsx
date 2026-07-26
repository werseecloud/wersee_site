import React, { createContext, useContext, useState, ReactNode } from 'react';

type ListingType = 'job' | 'product' | 'service' | 'digital' | 'asset_3d' | 'community' | 'affiliate' | 'virtual' | 'announcement' | 'bundle' | 'pos_item' | 'startup' | 'business' | null;

interface ListingWizardContextType {
  isOpen: boolean;
  type: ListingType;
  draftId: string | null;
  isBuilderActive: boolean;
  openWizard: (type: ListingType, id?: string | null) => void;
  closeWizard: () => void;
  setIsBuilderActive: (active: boolean) => void;
}

const ListingWizardContext = createContext<ListingWizardContextType | undefined>(undefined);

export const ListingWizardProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<ListingType>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isBuilderActive, setIsBuilderActive] = useState(false);

  const openWizard = (newType: ListingType, id: string | null = null) => {
    setType(newType);
    setDraftId(id);
    setIsOpen(true);
  };

  const closeWizard = () => {
    setIsOpen(false);
    setIsBuilderActive(false);
    setDraftId(null);
    setTimeout(() => setType(null), 300); // Clear type after animation
  };

  return (
    <ListingWizardContext.Provider value={{ isOpen, type, draftId, isBuilderActive, openWizard, closeWizard, setIsBuilderActive }}>
      {children}
    </ListingWizardContext.Provider>
  );
};

export const useListingWizard = () => {
  const context = useContext(ListingWizardContext);
  if (context === undefined) {
    throw new Error('useListingWizard must be used within a ListingWizardProvider');
  }
  return context;
};
