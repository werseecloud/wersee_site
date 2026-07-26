import React, { useState, useEffect, useRef } from 'react';
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
import {
  isStandaloneListingWizardPath,
  normalizeListingWizardType,
} from '../../lib/listingWizardRoute';

export const ListingWizard = () => {
  const { isOpen, type, draftId, openWizard, closeWizard, setIsBuilderActive } = useListingWizard();
  const location = useLocation();
  const navigate = useNavigate();
  const [createdListingId, setCreatedListingId] = useState<string | null>(null);
  const [listingData, setListingData] = useState<any>(null);
  const isStandaloneRoute = useRef(isStandaloneListingWizardPath(location.pathname));

  // Sync with URL
  useEffect(() => {
    const pathParts = location.pathname.split('/');
    if (pathParts[1] === 'create') {
      isStandaloneRoute.current = true;
      const rawUrlType = pathParts[2] || null;
      const urlType = normalizeListingWizardType(rawUrlType);
      const urlId = pathParts[3] || null;

      if (rawUrlType === 'startup' || rawUrlType === 'business') {
        navigate('/workspace/create-business', { replace: true });
        return;
      }

      if (rawUrlType && !urlType) {
        toast.error('This listing type is not available.');
        navigate('/workspace/management-products', { replace: true });
        return;
      }
      
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
        
        if (urlType && (urlType !== type || urlId !== draftId)) {
          openWizard(urlType, urlId);
        } else if (!urlType && type === null) {
          openWizard(null);
        }
      };
      
      validateDraft();
    } else if (isOpen && isStandaloneRoute.current) {
      // If we're not on a create path but the wizard is open, close it
      // This happens when navigating away
      closeWizard();
    }
  }, [location.pathname]);

  // Update URL when wizard state changes
  useEffect(() => {
    if (isOpen && type && isStandaloneRoute.current) {
      const currentPath = `/create/${type}${draftId ? `/${draftId}` : ''}`;
      if (location.pathname !== currentPath) {
        navigate(currentPath, { replace: true });
      }
    }
  }, [isOpen, type, draftId]);

  const handleCloseWizard = () => {
    closeWizard();
    if (location.pathname.startsWith('/create')) {
      navigate('/workspace/overview');
    }
  };

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
    handleCloseWizard();
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
      {!type && <PostTypeSelection key="selection" onClose={handleCloseWizard} />}
      {type === 'job' && <div key="job"><JobWizard onClose={handleCloseWizard} onCreated={handleCreated} draftId={draftId} /></div>}
      {type === 'product' && <div key="product"><ProductWizard onClose={handleCloseWizard} onCreated={handleCreated} draftId={draftId} /></div>}
      {type === 'digital' && <div key="digital"><DigitalWizard onClose={handleCloseWizard} onCreated={handleCreated} draftId={draftId} /></div>}
      {type === 'asset_3d' && <div key="asset_3d"><Asset3DWizard onClose={handleCloseWizard} onCreated={handleCreated} draftId={draftId} /></div>}
      {type === 'service' && <div key="service"><ServiceWizard onClose={handleCloseWizard} onCreated={handleCreated} draftId={draftId} /></div>}
      {type === 'community' && <div key="community"><CommunityWizard onClose={handleCloseWizard} onCreated={handleCreated} draftId={draftId} /></div>}
      {type === 'affiliate' && <div key="affiliate"><ProductWizard onClose={handleCloseWizard} isAffiliate onCreated={handleCreated} draftId={draftId} /></div>}
      {type === 'virtual' && <div key="virtual"><DigitalWizard onClose={handleCloseWizard} isVirtual onCreated={handleCreated} draftId={draftId} /></div>}
      {type === 'bundle' && <div key="bundle"><BundleWizard onClose={handleCloseWizard} onCreated={handleCreated} draftId={draftId} /></div>}
      {type === 'pos_item' && <div key="pos_item"><PosItemWizard onClose={handleCloseWizard} onCreated={handleCreated} draftId={draftId} /></div>}
      {type === 'announcement' && <div key="announcement"><AnnouncementWizard onClose={handleCloseWizard} onCreated={handleCreated} draftId={draftId} /></div>}
    </AnimatePresence>
  );
};
