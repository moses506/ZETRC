import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchStaffRecords, fetchUsers } from '../utils/api';
import { fetchNotifications } from '../utils/features';
import type { StaffScope } from '../utils/auth';

type ApiRecord = Record<string, unknown>;

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  when: number;
  /** Section to open when the notification is clicked. */
  target: string;
  icon: string;
  tone: 'green' | 'gold' | 'teal' | 'violet' | 'blue' | 'rose' | 'slate';
};

const REFRESH_MS = 60_000;
const MAX_ITEMS = 30;

function readString(record: ApiRecord, key: string): string {
  const value = record[key];
  return typeof value === 'string' ? value : '';
}

function createdAt(record: ApiRecord): number {
  const time = Date.parse(readString(record, 'creation'));
  return Number.isNaN(time) ? 0 : time;
}

function modifiedAt(record: ApiRecord): number {
  const time = Date.parse(readString(record, 'modified'));
  return Number.isNaN(time) ? createdAt(record) : time;
}

function person(record: ApiRecord, first = 'first_name', last = 'last_name'): string {
  return `${readString(record, first)} ${readString(record, last)}`.trim() || 'Someone';
}

async function safe<T>(promise: Promise<T[]>): Promise<T[]> {
  try {
    return await promise;
  } catch {
    return [];
  }
}

async function loadAdminNotifications(): Promise<NotificationItem[]> {
  const [enrollments, submissions, leads, inquiries, proposals, certificates, students] = await Promise.all([
    safe(fetchStaffRecords('admin', 'Student_Enrollment')),
    safe(fetchStaffRecords('admin', 'Assignment_Submission')),
    safe(fetchStaffRecords('admin', 'Lead')),
    safe(fetchStaffRecords('admin', 'Inquiry')),
    safe(fetchStaffRecords('admin', 'Proposal_Request')),
    safe(fetchStaffRecords('admin', 'Certificate')),
    safe(fetchUsers('Learner')),
  ]);

  return [
    ...students.map((user) => ({
      id: `user-${user.id}`,
      title: 'New student account',
      body: `${`${user.first_name} ${user.last_name}`.trim() || user.email} signed up`,
      when: Date.parse(user.creation) || 0,
      target: 'users:Learner',
      icon: 'users:Learner',
      tone: 'teal' as const,
    })),
    ...enrollments.map((record) => ({
      id: `enr-${readString(record, 'name')}`,
      title: 'New enrollment',
      body: `${person(record)} applied for ${readString(record, 'course') || 'a course'}`,
      when: createdAt(record),
      target: 'Student_Enrollment',
      icon: 'Student_Enrollment',
      tone: 'green' as const,
    })),
    ...submissions.map((record) => ({
      id: `sub-${readString(record, 'name')}`,
      title: 'Assignment submitted',
      body: `${person(record, 'student_first_name', 'student_last_name')} → ${
        readString(record, 'assignment_name') || 'an assignment'
      }`,
      when: createdAt(record),
      target: 'Assignment_Submission',
      icon: 'Assignment_Submission',
      tone: 'blue' as const,
    })),
    ...certificates
      .filter((record) => readString(record, 'status') === 'in_review')
      .map((record) => ({
        id: `cert-${readString(record, 'name')}-${modifiedAt(record)}`,
        title: 'Certificate awaiting review',
        body: `${readString(record, 'learner_email')} · ${readString(record, 'course')}`,
        when: modifiedAt(record),
        target: 'Certificate',
        icon: 'Certificate',
        tone: 'violet' as const,
      })),
    ...leads.map((record) => ({
      id: `lead-${readString(record, 'name')}`,
      title: 'New lead',
      body: `${person(record)}${readString(record, 'company') ? ` from ${readString(record, 'company')}` : ''}`,
      when: createdAt(record),
      target: 'Lead',
      icon: 'Lead',
      tone: 'rose' as const,
    })),
    ...inquiries.map((record) => ({
      id: `inq-${readString(record, 'name')}`,
      title: 'New inquiry',
      body: `${readString(record, 'subject') || 'Message'} from ${person(record)}`,
      when: createdAt(record),
      target: 'Inquiry',
      icon: 'Inquiry',
      tone: 'blue' as const,
    })),
    ...proposals.map((record) => ({
      id: `prop-${readString(record, 'name')}`,
      title: 'Proposal request',
      body: readString(record, 'organization_name') || 'A new organisation',
      when: createdAt(record),
      target: 'Proposal_Request',
      icon: 'Proposal_Request',
      tone: 'gold' as const,
    })),
  ];
}

async function loadLecturerNotifications(): Promise<NotificationItem[]> {
  const [enrollments, submissions, courses] = await Promise.all([
    safe(fetchStaffRecords('lecturer', 'Student_Enrollment')),
    safe(fetchStaffRecords('lecturer', 'Assignment_Submission')),
    safe(fetchStaffRecords('lecturer', 'Course')),
  ]);

  return [
    ...submissions
      .filter((record) => !['marked', 'returned'].includes(readString(record, 'status')))
      .map((record) => ({
        id: `sub-${readString(record, 'name')}`,
        title: 'New submission to mark',
        body: `${person(record, 'student_first_name', 'student_last_name')} → ${
          readString(record, 'assignment_name') || 'an assignment'
        }`,
        when: createdAt(record),
        target: 'Assignment_Submission',
        icon: 'Assignment_Submission',
        tone: 'blue' as const,
      })),
    ...enrollments.map((record) => ({
      id: `enr-${readString(record, 'name')}`,
      title: 'New student in your course',
      body: `${person(record)} joined ${readString(record, 'course') || 'your course'}`,
      when: createdAt(record),
      target: 'Student_Enrollment',
      icon: 'users:Learner',
      tone: 'teal' as const,
    })),
    ...courses.map((record) => ({
      id: `course-${readString(record, 'name')}`,
      title: 'Course assigned to you',
      body: readString(record, 'name'),
      when: modifiedAt(record),
      target: 'Course',
      icon: 'Course',
      tone: 'green' as const,
    })),
  ];
}

function storageKey(scope: StaffScope, email: string) {
  return `zetrcNotifications:${scope}:${email.toLowerCase()}`;
}

type StoredState = { seenAt: number; readIds: string[] };

function readStored(key: string): StoredState {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredState>;
      return { seenAt: Number(parsed.seenAt) || 0, readIds: Array.isArray(parsed.readIds) ? parsed.readIds : [] };
    }
  } catch {
    // ignore unreadable storage
  }
  return { seenAt: 0, readIds: [] };
}

/**
 * Activity-based notifications for the admin console / lecturer portal.
 * Items come from recent records; read state is kept per account in the browser.
 */
export function useNotifications(scope: StaffScope, email: string) {
  const key = storageKey(scope, email);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stored, setStored] = useState<StoredState>(() => readStored(key));

  const persist = useCallback(
    (next: StoredState) => {
      setStored(next);
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // storage unavailable — read state lasts for this page view only
      }
    },
    [key],
  );

  const refresh = useCallback(async () => {
    const [derived, stored] = await Promise.all([
      scope === 'admin' ? loadAdminNotifications() : loadLecturerNotifications(),
      fetchNotifications(scope)
        .then((data) => data.items)
        .catch(() => []),
    ]);
    // Stored notifications (e.g. new discussion questions) sit alongside activity.
    const loaded: NotificationItem[] = [
      ...derived,
      ...stored.map((n) => ({
        id: `stored-${n.id}`,
        title: n.title,
        body: n.body,
        when: Date.parse(n.creation) || 0,
        target: n.link === 'discussions' ? 'discussions' : n.link || 'overview',
        icon: n.kind === 'discussion' || n.kind === 'reply' ? 'discussions' : 'bell',
        tone: 'violet' as const,
      })),
    ];
    setItems(loaded.filter((item) => item.when > 0).sort((a, b) => b.when - a.when).slice(0, MAX_ITEMS));
    setIsLoading(false);
  }, [scope]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const isUnread = useCallback(
    (item: NotificationItem) => item.when > stored.seenAt && !stored.readIds.includes(item.id),
    [stored],
  );

  const unreadCount = useMemo(() => items.filter(isUnread).length, [items, isUnread]);

  const markRead = (id: string) => {
    if (!stored.readIds.includes(id)) {
      persist({ ...stored, readIds: [...stored.readIds, id].slice(-200) });
    }
  };

  const markAllRead = () => {
    const newest = items.reduce((max, item) => Math.max(max, item.when), Date.now());
    persist({ seenAt: newest, readIds: [] });
  };

  return { items, isLoading, unreadCount, isUnread, markRead, markAllRead, refresh };
}
