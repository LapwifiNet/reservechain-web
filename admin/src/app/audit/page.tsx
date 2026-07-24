'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { Badge } from '@/components/Badge';
import { ApiErrorBanner } from '@/components/ApiErrorBanner';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
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
    let cancelled = false;

    async function loadEvents() {
      setLoading(true);
      setError(null);
      const result = await api.audit({ skip, take, ...filters });
      if (cancelled) return;
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
      if (cancelled) return;
      if (result.data) {
        setVerification(result.data);
      }
    }

    loadEvents();
    loadVerification();

    return () => {
      cancelled = true;
    };
  }, [skip, take, filters]);

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

  const cols: Column<AuditEvent>[] = [
    {
      key: 'sequence',
      label: 'Seq',
      align: 'right',
      render: (r) => String(r.sequence),
    },
    {
      key: 'createdAt',
      label: 'Timestamp',
      align: 'right',
      render: (r) => formatDate(r.createdAt),
    },
    {
      key: 'actorEmail',
      label: 'Actor',
      render: (r) => r.actorEmail ?? '\u2014',
    },
    { key: 'action', label: 'Action' },
    {
      key: 'resourceType',
      label: 'Resource',
      render: (r) => r.resourceType ?? '\u2014',
    },
    {
      key: 'resourceId',
      label: 'Resource ID',
      render: (r) => r.resourceId ?? '\u2014',
    },
    {
      key: 'ipAddress',
      label: 'IP Address',
      render: (r) => r.ipAddress ?? '\u2014',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        subtitle="Append-only audit trail with hash-chain integrity verification."
      />

      {error && <ApiErrorBanner error={error} />}

      {verification && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-text">Chain Integrity</h3>
              <p className="mt-1 text-xs text-text-2">
                {verification.totalEvents} events in audit trail
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge>{verification.valid ? 'active' : 'inactive'}</Badge>
              <span className="text-sm font-medium text-text">
                {verification.valid ? 'Valid' : 'Broken'}
              </span>
            </div>
          </div>
          {!verification.valid && verification.firstBrokenSequence && (
            <p className="mt-2 text-xs text-danger">
              First broken link at sequence {verification.firstBrokenSequence}
            </p>
          )}
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-text-2">
              Action
            </label>
            <input
              type="text"
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              placeholder="e.g., create.kyc"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-text-2">
              Resource Type
            </label>
            <input
              type="text"
              value={filters.resourceType}
              onChange={(e) =>
                setFilters({ ...filters, resourceType: e.target.value })
              }
              placeholder="e.g., kyc"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-surface/50 p-8 text-center text-sm text-text-2">
          Loading audit events…
        </div>
      ) : (
        <DataTable
          columns={cols}
          rows={events}
          empty="No audit events recorded yet."
        />
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-text-2">
          Showing {skip + 1}-{Math.min(skip + take, total)} of {total}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={skip === 0}
            className="rounded-md border border-border bg-surface px-4 py-2 text-sm text-text disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={skip + take >= total}
            className="rounded-md border border-border bg-surface px-4 py-2 text-sm text-text disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
