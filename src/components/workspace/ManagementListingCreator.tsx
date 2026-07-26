import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { DatabaseService } from '../../services/databaseService';
import { AnnouncementWizard } from '../listings/AnnouncementWizard';
import { Asset3DWizard } from '../listings/Asset3DWizard';
import { BundleWizard } from '../listings/BundleWizard';
import { CommunityWizard } from '../listings/CommunityWizard';
import { DigitalWizard } from '../listings/DigitalWizard';
import { JobWizard } from '../listings/JobWizard';
import { PosItemWizard } from '../listings/PosItemWizard';
import { PostTypeSelection } from '../listings/PostTypeSelection';
import { ProductWizard } from '../listings/ProductWizard';
import { ServiceWizard } from '../listings/ServiceWizard';
import { StorePageBuilder } from '../listings/StorePageBuilder';

type ManagementListingType =
  | 'job'
  | 'product'
  | 'service'
  | 'digital'
  | 'asset_3d'
  | 'community'
  | 'affiliate'
  | 'virtual'
  | 'announcement'
  | 'bundle'
  | 'pos_item';

interface ManagementListingCreatorProps {
  initialType?: string | null;
  onClose: () => void;
}

const normalizeListingType = (value?: string | null): ManagementListingType | null => {
  if (!value) return null;
  if (value === 'physical') return 'product';
  if (value === '3d_asset') return 'asset_3d';
  if (value === 'pos') return 'pos_item';

  const supported: ManagementListingType[] = [
    'job', 'product', 'service', 'digital', 'asset_3d', 'community',
    'affiliate', 'virtual', 'announcement', 'bundle', 'pos_item',
  ];
  return supported.includes(value as ManagementListingType)
    ? value as ManagementListingType
    : null;
};

export const ManagementListingCreator: React.FC<ManagementListingCreatorProps> = ({
  initialType,
  onClose,
}) => {
  const [type, setType] = useState<ManagementListingType | null>(() =>
    normalizeListingType(initialType),
  );
  const [createdListingId, setCreatedListingId] = useState<string | null>(null);
  const [listingData, setListingData] = useState<any>(null);
  const [loadingBuilder, setLoadingBuilder] = useState(false);

  useEffect(() => {
    setType(normalizeListingType(initialType));
  }, [initialType]);

  const handleCreated = async (id: string) => {
    setLoadingBuilder(true);
    try {
      const row = await DatabaseService.get('listings', {
        eq: { id },
        single: true,
      });
      setListingData(row);
      setCreatedListingId(id);
    } finally {
      setLoadingBuilder(false);
    }
  };

  const wizardProps = {
    onClose: () => setType(null),
    onCreated: handleCreated,
    draftId: null,
  };

  let content: React.ReactNode;
  if (loadingBuilder) {
    content = (
      <div className="flex min-h-[calc(100dvh-5rem)] items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  } else if (createdListingId && listingData) {
    content = (
      <StorePageBuilder
        listingId={createdListingId}
        initialData={listingData}
        onClose={onClose}
        onComplete={onClose}
      />
    );
  } else if (!type) {
    content = (
      <PostTypeSelection
        embedded
        onClose={onClose}
        onSelect={(nextType) => setType(nextType as ManagementListingType)}
      />
    );
  } else if (type === 'job') {
    content = <JobWizard {...wizardProps} />;
  } else if (type === 'product') {
    content = <ProductWizard {...wizardProps} />;
  } else if (type === 'digital') {
    content = <DigitalWizard {...wizardProps} />;
  } else if (type === 'asset_3d') {
    content = <Asset3DWizard {...wizardProps} />;
  } else if (type === 'service') {
    content = <ServiceWizard {...wizardProps} />;
  } else if (type === 'community') {
    content = <CommunityWizard {...wizardProps} />;
  } else if (type === 'affiliate') {
    content = <ProductWizard {...wizardProps} isAffiliate />;
  } else if (type === 'virtual') {
    content = <DigitalWizard {...wizardProps} isVirtual />;
  } else if (type === 'bundle') {
    content = <BundleWizard {...wizardProps} />;
  } else if (type === 'pos_item') {
    content = <PosItemWizard {...wizardProps} />;
  } else {
    content = <AnnouncementWizard {...wizardProps} />;
  }

  return (
    <div className="relative min-h-[calc(100dvh-5rem)] overflow-hidden bg-black [&>.fixed]:!absolute">
      {content}
    </div>
  );
};
