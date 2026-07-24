'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { Badge } from '@/components/Badge';
import { ApiErrorBanner } from '@/components/ApiErrorBanner';
import { api } from '@/lib/api';
import type { AuditEvent, ChainVerificationResult } from '@/lib/types';

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verification, setVerification] = useState<ChainVerificationResult | null>(null);
  const [skip, setSkip] = useState(0);
  const [take] = useState(50);
  const [filters, setFilters] = useState({
    action: '',
    resourceType: '',
  });

  useEffect(() => {
    loadEvents();
    loadVerification();
  }, [skip, filters]);

  async function loadEvents() {
    setLoading(true);
    setError(null);
    const result = await api.audit({ skip, take, ...filters });
    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setEvents(result.data.events);
      setTotal(result.data.total);
    }
    setLoading(false);
  }

  async function loadVerification() {
    const result = await api.auditVerify();
    if (result.data) {
      setVerification(result.data);
    }
  }

  function handleNext() {
    if (skip + take < total) {
      setSkip(skip + take);
    }
  }

  function handlePrevious() {
    if (skip > 0) {
      setSkip(Math.max(0, skip - take));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Log" />

      {error && <ApiErrorBanner error={error} />}

      {/* Chain Integrity Indicator */}
      {verification && (
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Chain Integrity</h3>
              <p className="text-xs text-gray-500 mt-1">
                {verification.totalEvents} events in audit trail
              </p>
            </div>
            <Badge
              variant={verification.valid ? 'success' : 'error'}
              text={verification.valid ? 'Valid' : 'Broken'}
            />
          </div>
          {!verification.valid && verification.firstBrokenSequence && (
            <p className="text-xs text-red-600 mt-2">
              First broken link at sequence {verification.firstBrokenSequence}
            </p>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4 shadow-sm">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Action
            </label>
            <input
              type="text"
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              placeholder="e.g., create.kyc"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Resource Type
            </label>
            <input
              type="text"
              value={filters.resourceType}
              onChange={(e) => setFilters({ ...filters, resourceType: e.target.value })}
              placeholder="e.g., kyc"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
        </div>
      </div>

      {/* Audit Events Table */}
      <DataTable
        columns={[
          { key: 'sequence', label: 'Seq' },
          { key: 'createdAt', label: 'Timestamp' },
          { key: 'actorEmail', label: 'Actor' },
          { key: 'action', label: 'Action' },
          { key: 'resourceType', label: 'Resource' },
          { key: 'resourceId', label: 'Resource ID' },
          { key: 'ipAddress', label: 'IP Address' },
        ]}
        data={events.map((event) => ({
          sequence: event.sequence.toString(),
          createdAt: new Date(event.createdAt).toLocaleString(),
          actorEmail: event.actorEmail || 'N/A',
          action: event.action,
          resourceType: event.resourceType || 'N/A',
          resourceId: event.resourceId || 'N/A',
          ipAddress: event.ipAddress || 'N/A',
        }))}
        loading={loading}
      />

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing {skip + 1}-{Math.min(skip + take, total)} of {total}
        </p>
        <div className="flex gap-2">
          <button
            onClick={handlePrevious}
            disabled={skip === 0}
            className="px-4 py-2 bg-white border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={skip + take >= total}
            className="px-4 py-2 bg-white border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

