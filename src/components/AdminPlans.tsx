import React, { useState } from 'react';
import { Plus, Settings, Trash2, Edit2, Save, X } from 'lucide-react';

export function AdminPlans() {
  const [activeTab, setActiveTab] = useState<'plans' | 'users'>('plans');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
            <p className="mt-2 text-sm text-gray-600">Manage plans, pricing, limits, and user subscriptions.</p>
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Create New Plan
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('plans')}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'plans'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Plans & Pricing
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Subscriptions
            </button>
          </nav>
        </div>

        {activeTab === 'plans' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Active Plans</h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {/* Mock Plan Row */}
              <li className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h4 className="text-lg font-bold text-gray-900">Pro Plan</h4>
                      <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Public
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">For professionals and growing teams</p>
                    
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-xs font-medium text-gray-500 uppercase">Pricing</p>
                        <p className="mt-1 text-sm text-gray-900">€29.00 / month</p>
                        <p className="text-sm text-gray-900">€290.00 / year</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-xs font-medium text-gray-500 uppercase">Billing Behavior</p>
                        <p className="mt-1 text-sm text-gray-900">Auto-renew: Yes</p>
                        <p className="text-sm text-gray-900">Trial: 14 days</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-xs font-medium text-gray-500 uppercase">Limits</p>
                        <p className="mt-1 text-sm text-gray-900">10 Projects, 500 Files</p>
                        <p className="text-sm text-gray-900">10GB Storage, 5 Team Members</p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-6 flex flex-col space-y-2">
                    <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </button>
                    <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Archive
                    </button>
                  </div>
                </div>
              </li>
              
              {/* Mock Plan Row 2 */}
              <li className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h4 className="text-lg font-bold text-gray-900">VIP Plan</h4>
                      <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Invite-Only
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Ultimate power and unlimited access</p>
                    
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-xs font-medium text-gray-500 uppercase">Pricing</p>
                        <p className="mt-1 text-sm text-gray-900">€99.00 / month</p>
                        <p className="text-sm text-gray-900">€990.00 / year</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-xs font-medium text-gray-500 uppercase">Billing Behavior</p>
                        <p className="mt-1 text-sm text-gray-900">Auto-renew: Yes</p>
                        <p className="text-sm text-gray-900">Trial: None</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-xs font-medium text-gray-500 uppercase">Limits</p>
                        <p className="mt-1 text-sm text-gray-900">Unlimited Projects/Files</p>
                        <p className="text-sm text-gray-900">100GB Storage, 25 Team Members</p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-6 flex flex-col space-y-2">
                    <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </button>
                    <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Archive
                    </button>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">User Subscriptions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Renewal Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">john.doe@example.com</div>
                          <div className="text-sm text-gray-500">ID: usr_12345</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Pro Plan (Monthly)</div>
                      <div className="text-sm text-gray-500">€29.00/mo</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Oct 24, 2026
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <a href="#" className="text-indigo-600 hover:text-indigo-900">Manage</a>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">jane.smith@example.com</div>
                          <div className="text-sm text-gray-500">ID: usr_67890</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">VIP Plan (Yearly)</div>
                      <div className="text-sm text-gray-500">€990.00/yr</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Trialing
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Oct 15, 2026 (Trial Ends)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <a href="#" className="text-indigo-600 hover:text-indigo-900">Manage</a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
