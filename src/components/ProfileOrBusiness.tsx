import React from 'react';
import { useParams } from 'react-router-dom';
import { Profile } from '../pages/Profile';
import { BusinessPublicView } from '../pages/BusinessPublicView';
import { NotFound } from '../pages/NotFound';
import {
  isReservedRootSegment,
  parseAccountHandle,
  parseUsername,
} from '../routing/routes';

export const ProfileOrBusiness = () => {
  const { slugOrUsername } = useParams();

  if (slugOrUsername?.startsWith('@')) {
    if (!parseAccountHandle(slugOrUsername)) return <NotFound />;
    return <Profile />;
  }

  if (isReservedRootSegment(slugOrUsername) || !parseUsername(slugOrUsername)) {
    return <NotFound />;
  }

  return <BusinessPublicView />;
};
