import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useListingWizard } from '../../context/ListingWizardContext';
import { JobWizard } from './JobWizard';
import { ProductWizard } from './ProductWizard';
import { DigitalWizard } from './DigitalWizard';
import { Asset3DWizard } from './Asset3DWizard';
import { ServiceWizard } from './ServiceWizard';
import { CommunityWizard } from './CommunityWizard';
import { AnnouncementWizard } from './AnnouncementWizard';
import { BundleWizard } from './BundleWizard';
import { PosItemWizard } from './PosItemWizard';
import { StorePageBuilder } from './StorePageBuilder';
import { PostTypeSelection } from './PostTypeSelection';
import { DatabaseService } from '../../services/databaseService';
import { toast } from 'sonner';

export const ListingWizard = () => {
  const { isOpen, type, draftId, openWizard, closeWizard, setIsBuilderActive } = useListingWizard();
  const location = useLocation();
  const navigate = useNavigate();
  const [createdListingId, setCreatedListingId] = useState<string | null>(null);
  const [listingData, setListingData] = useState<any>(null);

  // Sync with URL
  useEffect(() => {
    const pathParts = location.pathname.split('/');
    if (pathParts[1] === 'create') {
      const urlType = pathParts[2] as any;
      const urlId = pathParts[3] || null;
      
      const validateDraft = async () => {
        if (urlId) {
          try {
            const data = await DatabaseService.get('listings', {
              eq: { id: urlId },
              single: true
            });
            
            if (data && data.status === 'draft' && data.expires_at) {
              const expiresAt = new Date(data.expires_at);
              if (expiresAt < new Date()) {
                toast.error("This listing draft has expired (10-hour limit).");
                navigate('/workspace/overview');
                return;
              }
            }
          } catch (error) {
            console.error('Error validating draft expiration:', error);
          }
        }
        
        if (urlType && urlType !== type) {
          openWizard(urlType, urlId);
        }
      };
      
      validateDraft();
    } else if (isOpen && !location.pathname.startsWith('/create')) {
      // If we're not on a create path but the wizard is open, close it
      // This happens when navigating away
      closeWizard();
    }
  }, [location.pathname]);

  // Update URL when wizard state changes
  useEffect(() => {
    if (isOpen && type) {
      const currentPath = `/create/${type}${draftId ? `/${draftId}` : ''}`;
      if (location.pathname !== currentPath) {
        navigate(currentPath, { replace: true });
      }
    } else if (!isOpen && location.pathname.startsWith('/create')) {
      // If wizard is closed but we're on a create path, go home or back
      navigate('/workspace/overview');
    }
  }, [isOpen, type, draftId]);

  const handleCreated = async (id: string) => {
    // Fetch the full listing data to pass to the builder
    const data = await DatabaseService.get('listings', {
      eq: { id },
      single: true
    });
    setListingData(data);
    setCreatedListingId(id);
    setIsBuilderActive(true);
  };

  const handleBuilderComplete = () => {
    setCreatedListingId(null);
    setListingData(null);
    setIsBuilderActive(false);
    closeWizard();
  };

  if (!isOpen) return null;

  if (createdListingId && listingData) {
    return (
      <StorePageBuilder 
        listingId={createdListingId} 
        initialData={listingData} 
        onClose={handleBuilderComplete} 
        onComplete={handleBuilderComplete} 
      />
    );
  }

  return (
    <AnimatePresence mode="wait">
      {!type && <PostTypeSelection key="selection" onClose={closeWizard} />}
      {type === 'job' && <div key="job"><JobWizard onClose={closeWizard} onCreated={handleCreated} draftId={draftId} /></div>}
      {type === 'product' && <div key="product"><ProductWizard onClose={closeWizard} onCreated={handleCreated} draftId={draftId} /></div>}
      {type === 'digital' && <div key="digital"><DigitalWizard onClose={closeWizard} onCreated={handleCreated} draftId={draftId} /></div>}
      {type === 'asset_3d' && <div key="asset_3d"><Asset3DWizard onClose={closeWizard} onCreated={handleCreated} draftId={draftId} /></div>}
      {type === 'service' && <div key="service"><ServiceWizard onClose={closeWizard} onCreated={handleCreated} draftId={draftId} /></div>}
      {type === 'community' && <div key="community"><CommunityWizard onClose={closeWizard} onCreated={handleCreated} draftId={draftId} /></div>}
      {type === 'affiliate' && <div key="affiliate"><ProductWizard onClose={closeWizard} isAffiliate onCreated={handleCreated} draftId={draftId} /></div>}
      {type === 'virtual' && <div key="virtual"><DigitalWizard onClose={closeWizard} isVirtual onCreated={handleCreated} draftId={draftId} /></div>}
      {type === 'bundle' && <div key="bundle"><BundleWizard onClose={closeWizard} onCreated={handleCreated} draftId={draftId} /></div>}
      {type === 'pos_item' && <div key="pos_item"><PosItemWizard onClose={closeWizard} onCreated={handleCreated} draftId={draftId} /></div>}
      {type === 'announcement' && <div key="announcement"><AnnouncementWizard onClose={closeWizard} onCreated={handleCreated} draftId={draftId} /></div>}
    </AnimatePresence>
  );
};
