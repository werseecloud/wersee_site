import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Shield, Zap, Star } from 'lucide-react';

// Mock data for plans based on the SQL schema
const mockPlans = [
  {
    id: '1',
    name: 'Basic',
    description: 'Perfect for getting started',
    visibility: 'public',
    features: {
      is_pro: false,
      has_access_to_x: false,
      max_projects: 3,
      max_files: 50,
      max_team_members: 1,
      storage_limit_mb: 1000,
      api_calls_limit: 500,
    },
    prices: [
      { id: 'p1', amount: 900, currency: 'EUR', interval: 'month', trial_days: 7 },
      { id: 'p2', amount: 9000, currency: 'EUR', interval: 'year', trial_days: 7 },
    ]
  },
  {
    id: '2',
    name: 'Pro',
    description: 'For professionals and growing teams',
    visibility: 'public',
    features: {
      is_pro: true,
      has_access_to_x: true,
      max_projects: 10,
      max_files: 500,
      max_team_members: 5,
      storage_limit_mb: 10000,
      api_calls_limit: 5000,
    },
    prices: [
      { id: 'p3', amount: 2900, currency: 'EUR', interval: 'month', trial_days: 14 },
      { id: 'p4', amount: 29000, currency: 'EUR', interval: 'year', trial_days: 14 },
    ]
  },
  {
    id: '3',
    name: 'VIP',
    description: 'Ultimate power and unlimited access',
    visibility: 'public',
    features: {
      is_pro: true,
      has_access_to_x: true,
      max_projects: 9999,
      max_files: 9999,
      max_team_members: 25,
      storage_limit_mb: 100000,
      api_calls_limit: 50000,
    },
    prices: [
      { id: 'p5', amount: 9900, currency: 'EUR', interval: 'month', trial_days: 0 },
      { id: 'p6', amount: 99000, currency: 'EUR', interval: 'year', trial_days: 0 },
    ]
  }
];

export function Pricing() {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

  return (
    <div className="py-24 sm:py-32 bg-gray-50 min-h-screen">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">Pricing</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Choose the right plan for you
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600">
          Unlock features, increase limits, and get access to exclusive content.
        </p>
        
        <div className="mt-16 flex justify-center">
          <div className="grid grid-cols-2 gap-x-1 rounded-full p-1 text-center text-xs font-semibold leading-5 ring-1 ring-inset ring-gray-200 bg-white">
            <button
              onClick={() => setBillingInterval('month')}
              className={`cursor-pointer rounded-full px-2.5 py-1 ${billingInterval === 'month' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('year')}
              className={`cursor-pointer rounded-full px-2.5 py-1 ${billingInterval === 'year' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Annually
            </button>
          </div>
        </div>

        <div className="isolate mx-auto mt-10 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {mockPlans.map((plan) => {
            const price = plan.prices.find(p => p.interval === billingInterval);
            if (!price) return null;
            
            const isPopular = plan.name === 'Pro';

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-8 ring-1 xl:p-10 ${
                  isPopular ? 'bg-gray-900 ring-gray-900 text-white' : 'bg-white ring-gray-200'
                }`}
              >
                <div className="flex items-center justify-between gap-x-4">
                  <h3 className={`text-lg font-semibold leading-8 ${isPopular ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h3>
                  {isPopular && (
                    <p className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold leading-5 text-indigo-400">
                      Most popular
                    </p>
                  )}
                </div>
                <p className={`mt-4 text-sm leading-6 ${isPopular ? 'text-gray-300' : 'text-gray-600'}`}>
                  {plan.description}
                </p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className={`text-4xl font-bold tracking-tight ${isPopular ? 'text-white' : 'text-gray-900'}`}>
                    €{(price.amount / 100).toFixed(2)}
                  </span>
                  <span className={`text-sm font-semibold leading-6 ${isPopular ? 'text-gray-300' : 'text-gray-600'}`}>
                    /{billingInterval}
                  </span>
                </p>
                
                {price.trial_days > 0 && (
                  <p className={`mt-2 text-sm ${isPopular ? 'text-indigo-300' : 'text-indigo-600'}`}>
                    {price.trial_days} days free trial
                  </p>
                )}

                <Link
                  to="/auth"
                  className={`mt-6 block rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    isPopular
                      ? 'bg-indigo-500 text-white hover:bg-indigo-400 focus-visible:outline-indigo-500'
                      : 'bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-indigo-600'
                  }`}
                >
                  Buy plan
                </Link>
                
                <ul className={`mt-8 space-y-3 text-sm leading-6 xl:mt-10 ${isPopular ? 'text-gray-300' : 'text-gray-600'}`}>
                  <li className="flex gap-x-3">
                    <Check className={`h-6 w-5 flex-none ${isPopular ? 'text-white' : 'text-indigo-600'}`} />
                    {plan.features.max_projects === 9999 ? 'Unlimited' : plan.features.max_projects} Projects
                  </li>
                  <li className="flex gap-x-3">
                    <Check className={`h-6 w-5 flex-none ${isPopular ? 'text-white' : 'text-indigo-600'}`} />
                    {plan.features.max_files === 9999 ? 'Unlimited' : plan.features.max_files} Files
                  </li>
                  <li className="flex gap-x-3">
                    <Check className={`h-6 w-5 flex-none ${isPopular ? 'text-white' : 'text-indigo-600'}`} />
                    {plan.features.max_team_members} Team Members
                  </li>
                  <li className="flex gap-x-3">
                    <Check className={`h-6 w-5 flex-none ${isPopular ? 'text-white' : 'text-indigo-600'}`} />
                    {plan.features.storage_limit_mb >= 1000 ? `${plan.features.storage_limit_mb / 1000}GB` : `${plan.features.storage_limit_mb}MB`} Storage
                  </li>
                  <li className="flex gap-x-3">
                    <Check className={`h-6 w-5 flex-none ${isPopular ? 'text-white' : 'text-indigo-600'}`} />
                    {plan.features.api_calls_limit} API Calls / mo
                  </li>
                  
                  {plan.features.is_pro && (
                    <li className="flex gap-x-3 font-medium">
                      <Star className={`h-6 w-5 flex-none ${isPopular ? 'text-yellow-400' : 'text-yellow-500'}`} />
                      Pro Features Unlocked
                    </li>
                  )}
                  {plan.features.has_access_to_x && (
                    <li className="flex gap-x-3 font-medium">
                      <Zap className={`h-6 w-5 flex-none ${isPopular ? 'text-yellow-400' : 'text-yellow-500'}`} />
                      Access to Feature X
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
