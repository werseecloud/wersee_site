import React from 'react';
import { useParams } from 'react-router-dom';
import { Profile } from '../pages/Profile';
import { BusinessPublicView } from '../pages/BusinessPublicView';

export const ProfileOrBusiness = () => {
  const { slugOrUsername } = useParams();

  if (slugOrUsername?.startsWith('@')) {
    return <Profile />;
  }

  return <BusinessPublicView />;
};
