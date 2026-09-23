import React, { useState, useEffect, useCallback } from 'react';
import { CalmTopBar } from '../../components/common/CalmTopBar';
import { CalmLoadingIndicator } from '../../components/common/CalmLoadingIndicator';
import { CalmEmptyState } from '../../components/common/CalmEmptyState';
import { adminService } from '../../services/adminService';
import type { ReportStatus, ReportWithDetails } from '../../types/models';

interface AdminReportsPageProps {
  onBack: () => void;
  onReportClick: (reportId: string) => void;
}

export const AdminReportsPage: React.FC<AdminReportsPageProps> = ({
  onBack,
  onReportClick
}) => {
  const [reports, setReports] = useState<ReportWithDetails[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetched = await adminService.getReports(selectedStatus || undefined);
      setReports(fetched);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-red-500/15 text-red-500';
      case 'REVIEWING':
        return 'bg-blue-500/15 text-blue-500';
      case 'RESOLVED':
        return 'bg-emerald-500/15 text-emerald-500';
      case 'DISMISSED':
        return 'bg-[var(--calm-surface-variant)] text-[var(--calm-text-secondary)]';
    }
  };

  const statusFilters: (ReportStatus | null)[] = [
    null,
    'PENDING',
    'REVIEWING',
    'RESOLVED',
    'DISMISSED'
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[var(--calm-bg)] text-[var(--calm-text-primary)]">
      <CalmTopBar title="Reports" onBack={onBack} />

      <main className="flex-1 w-full max-w-[620px] mx-auto pb-24">
        {/* Status Filters */}
        <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-none border-b border-[var(--calm-border-subtle)]">
          {statusFilters.map((status) => {
            const isSelected = selectedStatus === status;
            const label = status ? status.charAt(0) + status.slice(1).toLowerCase() : 'All';
            return (
              <button
                key={label}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors shrink-0 ${
                  isSelected
                    ? 'bg-[var(--calm-primary)] text-[var(--calm-text-inverted)]'
                    : 'bg-[var(--calm-surface-variant)] text-[var(--calm-text-secondary)] hover:text-[var(--calm-text-primary)]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <CalmLoadingIndicator />
          </div>
        ) : reports.length === 0 ? (
          <div className="pt-16">
            <CalmEmptyState
              title="No reports found"
              subtitle={selectedStatus ? `No reports with status ${selectedStatus}.` : 'Everything is calm.'}
            />
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                onClick={() => onReportClick(report.id)}
                className="p-4 rounded-xl border border-[var(--calm-border-subtle)] bg-[var(--calm-surface)] hover:bg-[var(--calm-surface-variant)]/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[12px] font-bold text-[var(--calm-text-secondary)] uppercase tracking-wider">
                    Report #{report.id.slice(0, 8)}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${getStatusBadge(report.status)}`}>
                    {report.status}
                  </span>
                </div>

                <div className="mb-2">
                  <span className="text-[14px] font-semibold text-[var(--calm-text-primary)]">
                    Reason:{' '}
                  </span>
                  <span className="text-[14px] text-red-500 font-medium">
                    {report.reason}
                  </span>
                </div>

                <p className="text-[13px] text-[var(--calm-text-primary)]">
                  Reported Post: @{report.reportedUser?.username || 'user'}
                </p>
                <p className="text-[13px] text-[var(--calm-text-secondary)]">
                  Reported By: @{report.reporter?.username || 'reporter'}
                </p>

                {report.relativeTime && (
                  <p className="text-[11px] text-[var(--calm-text-tertiary)] mt-2">
                    {report.relativeTime}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
